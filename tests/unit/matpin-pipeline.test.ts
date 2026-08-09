import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as verifyWebhook, POST as receiveWebhook } from "@/app/api/matpin/webhook/route";
import { GET as runWorker } from "@/app/api/matpin/jobs/process/route";
import { DELETE as deleteAccount } from "@/app/api/matpin/account/route";
import { POST as reprocessMessage } from "@/app/api/matpin/messages/[id]/reprocess/route";
import { matpinSavedPlaceSchema, normalizeMetaWebhookMessages } from "@/lib/matpin/contract";
import {
  createGeminiReelAnalyzer,
  createMockReelAnalyzer,
  isAllowedMatpinMediaUrl,
  MatpinAnalysisError,
} from "@/lib/matpin/reel-analyzer";
import { parseInstagramEmbedSource } from "@/lib/matpin/reel-source";
import {
  resolveMatpinPlaces,
  resolveMatpinPlacesWithMetrics,
} from "@/lib/matpin/place-resolver";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  decryptMatpinValue,
  encryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinShortLinkCode,
  hashMatpinSender,
  verifyMatpinAdminRequest,
  verifyMetaWebhookSignature,
} from "@/lib/matpin/security";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function webhookBody(overrides: Record<string, unknown> = {}) {
  return {
    object: "instagram",
    entry: [{
      id: "professional-account",
      time: 1_754_000_000_000,
      messaging: [{
        sender: { id: "sender-1" },
        recipient: { id: "professional-account" },
        timestamp: 1_754_000_000_000,
        message: {
          mid: "mid-1",
          attachments: [{
            type: "ig_reel",
            payload: { url: "https://www.instagram.com/reel/DbTBhcZNY1b/" },
          }],
          ...overrides,
        },
      }],
    }],
  };
}

describe("Meta Instagram webhook contract", () => {
  it("accepts the timezone offset returned by Supabase for saved places", () => {
    const parsed = matpinSavedPlaceSchema.safeParse({
      id: 1,
      messageId: "11111111-1111-4111-8111-111111111111",
      reelId: "DbTBhcZNY1b",
      reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
      place: {
        id: "place-1",
        name: "테스트 식당",
        area: "서울",
        category: "한식",
        address: "서울 중구 세종대로 1",
        latitude: 37.5665,
        longitude: 126.978,
        mapUrl: "https://maps.google.com/?cid=1",
        confidence: 0.92,
        matchReason: "작성자 캡션과 지도 결과가 일치해요.",
      },
      confirmationSource: "automatic_high_confidence",
      savedAt: "2026-08-01T17:10:06.011998+00:00",
    });

    expect(parsed.success).toBe(true);
  });

  it("normalizes a reel attachment and keeps sender accounts separate", () => {
    const payload = webhookBody();
    const second = structuredClone(payload);
    second.entry[0].messaging[0].sender.id = "sender-2";
    second.entry[0].messaging[0].message.mid = "mid-2";
    payload.entry[0].messaging.push(second.entry[0].messaging[0]);

    const messages = normalizeMetaWebhookMessages(payload, "professional-account");

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      metaMessageId: "mid-1",
      senderScopedId: "sender-1",
      reelId: "DbTBhcZNY1b",
      attachmentType: "ig_reel",
    });
    expect(messages[1].senderScopedId).toBe("sender-2");
  });

  it("normalizes a shared feed post with a stable Instagram media key", () => {
    const messages = normalizeMetaWebhookMessages(webhookBody({
      attachments: [{
        type: "share",
        payload: { url: "https://www.instagram.com/p/Post_123/?utm_source=ig_web_copy_link" },
      }],
    }), "professional-account");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      reelId: "Post_123",
      reelUrl: "https://www.instagram.com/p/Post_123/",
      attachmentType: "share",
    });
  });

  it("uses the Meta asset id as the stable key for a shared carousel preview", () => {
    const messages = normalizeMetaWebhookMessages(webhookBody({
      attachments: [{
        type: "share",
        payload: {
          url: `https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=17869495296426197&signature=${"x".repeat(5_000)}`,
        },
      }],
    }), "professional-account");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      reelId: "17869495296426197",
      reelUrl: null,
      attachmentType: "share",
    });
  });

  it("maps Meta media attachments from shared carousel cards to share", () => {
    const messages = normalizeMetaWebhookMessages(webhookBody({
      attachments: [{
        type: "media",
        payload: { url: "https://www.instagram.com/p/Carousel_123/?igsh=example" },
      }],
    }), "professional-account");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      reelId: "Carousel_123",
      reelUrl: "https://www.instagram.com/p/Carousel_123/",
      attachmentType: "share",
    });
  });

  it.each(["image", "video"])("ignores directly attached %s media", (type) => {
    expect(normalizeMetaWebhookMessages(webhookBody({
      attachments: [{
        type,
        payload: { url: "https://scontent-icn1-1.xx.fbcdn.net/direct-media" },
      }],
    }), "professional-account")).toEqual([]);
  });

  it("ignores text-only direct messages", () => {
    expect(normalizeMetaWebhookMessages(webhookBody({
      text: "이 가게 저장해줘",
      attachments: undefined,
    }), "professional-account")).toEqual([]);
  });

  it.each([
    ["post", "https://www.instagram.com/p/Post_123/?igsh=example", "Post_123"],
    ["reel", "https://instagram.com/reel/Reel_123/?igsh=example", "Reel_123"],
    ["legacy video", "https://www.instagram.com/tv/Tv_123/", "Tv_123"],
  ])("normalizes a pasted Instagram %s URL", (_label, text, mediaId) => {
    const messages = normalizeMetaWebhookMessages(webhookBody({
      text,
      attachments: undefined,
    }), "professional-account");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      reelId: mediaId,
      attachmentType: "share",
    });
  });

  it.each([
    "https://example.com/p/Post_123/",
    "이 게시물 저장해줘 https://www.instagram.com/p/Post_123/",
    "https://www.instagram.com/example-profile/",
  ])("ignores unsupported pasted text or URL: %s", (text) => {
    expect(normalizeMetaWebhookMessages(webhookBody({
      text,
      attachments: undefined,
    }), "professional-account")).toEqual([]);
  });

  it.each([
    { is_echo: true },
    { is_self: true },
    { is_deleted: true },
    { is_unsupported: true },
  ])("ignores non-user media events: %o", (flag) => {
    expect(normalizeMetaWebhookMessages(webhookBody(flag), "professional-account")).toEqual([]);
  });

  it("ignores events for a different professional account", () => {
    expect(normalizeMetaWebhookMessages(webhookBody(), "another-account")).toEqual([]);
  });
});

describe("Matpin secrets and signature", () => {
  it("verifies Meta HMAC without accepting a modified body", () => {
    vi.stubEnv("META_APP_SECRET", "meta-test-secret");
    const raw = JSON.stringify(webhookBody({ is_echo: true }));
    const signature = `sha256=${createHmac("sha256", "meta-test-secret").update(raw).digest("hex")}`;
    expect(verifyMetaWebhookSignature(raw, signature)).toBe(true);
    expect(verifyMetaWebhookSignature(`${raw} `, signature)).toBe(false);
  });

  it("encrypts sender IDs and creates stable, non-raw hashes", () => {
    vi.stubEnv("MATPIN_DATA_SECRET", "data-secret-that-is-longer-than-32-characters");
    vi.stubEnv("MATPIN_LINK_SECRET", "link-secret-that-is-longer-than-32-characters");
    const encrypted = encryptMatpinValue("instagram-scoped-user-1");
    const token = createMatpinAccessToken("instagram-scoped-user-1");

    expect(encrypted).not.toContain("instagram-scoped-user-1");
    expect(decryptMatpinValue(encrypted)).toBe("instagram-scoped-user-1");
    expect(hashMatpinSender("instagram-scoped-user-1")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashMatpinAccessToken(token)).toMatch(/^[0-9a-f]{64}$/);
    const shortCode = createMatpinShortLinkCode("instagram-scoped-user-1");
    expect(shortCode).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(hashMatpinShortLinkCode(shortCode)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("allows a one-time admin token without exposing the personal map token", () => {
    vi.stubEnv("MATPIN_ADMIN_ACTION_TOKEN", "one-time-admin-token");
    vi.stubEnv("CRON_SECRET", "cron-token");
    expect(verifyMatpinAdminRequest(new Request("https://matpin.kr", {
      headers: { authorization: "Bearer one-time-admin-token" },
    }))).toBe(true);
    expect(verifyMatpinAdminRequest(new Request("https://matpin.kr", {
      headers: { authorization: "Bearer wrong-token" },
    }))).toBe(false);
  });
});

describe("Webhook and worker route guards", () => {
  it("answers Meta challenge only with the configured verify token", async () => {
    vi.stubEnv("META_WEBHOOK_VERIFY_TOKEN", "verify-token");
    const accepted = await verifyWebhook(new Request(
      "https://matpin.kr/api/matpin/webhook?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=12345",
    ));
    const rejected = await verifyWebhook(new Request(
      "https://matpin.kr/api/matpin/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345",
    ));
    expect(accepted.status).toBe(200);
    expect(await accepted.text()).toBe("12345");
    expect(rejected.status).toBe(403);
  });

  it("rejects an unsigned payload before touching storage", async () => {
    vi.stubEnv("META_APP_SECRET", "meta-test-secret");
    const response = await receiveWebhook(new Request("https://matpin.kr/api/matpin/webhook", {
      method: "POST",
      body: JSON.stringify(webhookBody()),
    }));
    expect(response.status).toBe(401);
  });

  it("accepts a valid echo event as an ignored no-op without storage configuration", async () => {
    vi.stubEnv("META_APP_SECRET", "meta-test-secret");
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "professional-account");
    vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
    const raw = JSON.stringify(webhookBody({ is_echo: true }));
    const signature = `sha256=${createHmac("sha256", "meta-test-secret").update(raw).digest("hex")}`;
    const response = await receiveWebhook(new Request("https://matpin.kr/api/matpin/webhook", {
      method: "POST",
      headers: { "x-hub-signature-256": signature },
      body: raw,
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accepted: 0, ignored: true });
  });

  it("acknowledges signed events without ingesting while the pipeline flag is mock", async () => {
    vi.stubEnv("META_APP_SECRET", "meta-test-secret");
    const raw = JSON.stringify(webhookBody());
    const signature = `sha256=${createHmac("sha256", "meta-test-secret").update(raw).digest("hex")}`;
    const response = await receiveWebhook(new Request("https://matpin.kr/api/matpin/webhook", {
      method: "POST",
      headers: { "x-hub-signature-256": signature },
      body: raw,
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accepted: 0, pipelineMode: "mock" });
  });

  it("rejects cron execution without the server secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    const response = await runWorker(new Request("https://matpin.kr/api/matpin/jobs/process"));
    expect(response.status).toBe(401);
  });

  it("rejects account deletion without the private map token", async () => {
    const response = await deleteAccount(new Request("https://matpin.kr/api/matpin/account", {
      method: "DELETE",
    }));
    expect(response.status).toBe(401);
  });

  it("rejects failed-message reprocessing without the worker secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    const response = await reprocessMessage(
      new Request("https://matpin.kr/api/matpin/messages/11111111-1111-4111-8111-111111111111/reprocess", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) },
    );
    expect(response.status).toBe(401);
  });
});

describe("Gemini input gate", () => {
  it("allows only expected HTTPS media hosts", () => {
    expect(isAllowedMatpinMediaUrl("https://video.cdninstagram.com/reel.mp4")).toBe(true);
    expect(isAllowedMatpinMediaUrl("https://scontent-icn1-1.xx.fbcdn.net/reel.mp4")).toBe(true);
    expect(isAllowedMatpinMediaUrl("http://video.cdninstagram.com/reel.mp4")).toBe(false);
    expect(isAllowedMatpinMediaUrl("https://127.0.0.1/reel.mp4")).toBe(false);
    expect(isAllowedMatpinMediaUrl("https://evil.example/reel.mp4")).toBe(false);
  });

  it("does not keep high confidence when Kakao returns a different name or region", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      documents: [{
        id: "place-1",
        place_name: "다른식당",
        category_name: "음식점 > 한식",
        category_group_code: "FD6",
        address_name: "서울 강남구 역삼동 1",
        road_address_name: "서울 강남구 테헤란로 1",
        x: "127.01",
        y: "37.50",
        place_url: "https://place.map.kakao.com/1",
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const resolved = await resolveMatpinPlacesWithMetrics({
      status: "resolved",
      summary: "산장장작구이를 확인했어요.",
      places: [{
        name: "산장장작구이",
        branch: null,
        menus: ["삼겹살"],
        regionHints: ["종로"],
        confidence: 0.98,
        evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 1 }],
      }],
    });

    expect(resolved.candidates[0].confidence).toBeLessThan(0.9);
    expect(resolved.metrics).toMatchObject({ provider: "kakao_local", requestCount: 1 });
  });

  it("uses Google Places Text Search before Kakao or Gemini grounding", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "google-places-test-key");
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-should-not-be-used");
    vi.stubEnv("GEMINI_API_KEY", "");
    const placesFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      places: [{
        id: "google-place-1",
        displayName: { text: "산장 장작구이" },
        formattedAddress: "대한민국 서울특별시 강남구 봉은사로30길 70",
        location: { latitude: 37.5052, longitude: 127.0378 },
        googleMapsUri: "https://maps.google.com/?cid=123",
        primaryTypeDisplayName: { text: "바비큐 식당" },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const resolved = await resolveMatpinPlacesWithMetrics({
      status: "resolved",
      summary: "산장장작구이를 확인했어요.",
      places: [{
        name: "산장장작구이",
        branch: null,
        menus: ["삼겹살"],
        regionHints: ["서울 강남구"],
        confidence: 0.98,
        evidence: [{ kind: "caption", text: "산장장작구이", timestampSeconds: null }],
      }],
    });

    expect(resolved.candidates).toEqual([expect.objectContaining({
      id: "google-place-1",
      name: "산장 장작구이",
      category: "Google Maps · 바비큐 식당",
      address: "대한민국 서울특별시 강남구 봉은사로30길 70",
      mapUrl: "https://maps.google.com/?cid=123",
    })]);
    expect(resolved.metrics).toMatchObject({
      provider: "google_places",
      model: null,
      requestCount: 1,
      groundingQueryCount: null,
    });
    expect(placesFetch).toHaveBeenCalledTimes(1);
    expect(placesFetch.mock.calls[0][0]).toBe("https://places.googleapis.com/v1/places:searchText");
    const request = placesFetch.mock.calls[0][1] as RequestInit;
    expect(request.method).toBe("POST");
    expect(request.headers).toMatchObject({
      "x-goog-api-key": "google-places-test-key",
    });
    expect((request.headers as Record<string, string>)["x-goog-fieldmask"]).not.toContain("*");
    expect(JSON.parse(request.body as string)).toEqual({
      textQuery: "산장장작구이 서울 강남구",
      languageCode: "ko",
      pageSize: 3,
    });
  });

  it.each([
    {
      label: "국내 맛집",
      clue: { name: "우래옥", regionHints: ["서울 중구"] },
      result: {
        id: "places/wooraeok",
        name: "우래옥",
        address: "대한민국 서울특별시 중구 창경궁로 62-29",
        category: "냉면 전문점",
        latitude: 37.5682,
        longitude: 126.9987,
      },
      expectedQuery: "우래옥 서울 중구",
    },
    {
      label: "일본 맛집",
      clue: { name: "스시 다이", regionHints: ["일본 도쿄 도요스"] },
      result: {
        id: "places/sushi-dai",
        name: "스시 다이",
        address: "일본 도쿄도 고토구 도요스 6초메",
        category: "스시 전문점",
        latitude: 35.6444,
        longitude: 139.7818,
      },
      expectedQuery: "스시 다이 일본 도쿄 도요스",
    },
    {
      label: "카페와 여행지",
      clue: { name: "오설록 티 뮤지엄", regionHints: ["제주 서귀포"] },
      result: {
        id: "places/osulloc",
        name: "오설록 티 뮤지엄",
        address: "대한민국 제주특별자치도 서귀포시 안덕면 신화역사로 15",
        category: "관광 명소",
        latitude: 33.3059,
        longitude: 126.2895,
      },
      expectedQuery: "오설록 티 뮤지엄 제주 서귀포",
    },
  ])("resolves supported expansion input: $label", async ({ clue, result, expectedQuery }) => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "google-places-test-key");
    const placesFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      places: [{
        id: result.id,
        displayName: { text: result.name },
        formattedAddress: result.address,
        location: { latitude: result.latitude, longitude: result.longitude },
        googleMapsUri: `https://maps.google.com/?cid=${encodeURIComponent(result.id)}`,
        primaryTypeDisplayName: { text: result.category },
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const resolved = await resolveMatpinPlacesWithMetrics({
      status: "resolved",
      summary: `${clue.name}을 확인했어요.`,
      places: [{
        name: clue.name,
        branch: null,
        menus: [],
        regionHints: clue.regionHints,
        confidence: 0.96,
        evidence: [{ kind: "caption", text: clue.name, timestampSeconds: null }],
      }],
    });

    expect(resolved.candidates[0]).toMatchObject({
      id: result.id,
      name: result.name,
      address: result.address,
    });
    expect(resolved.metrics).toMatchObject({ provider: "google_places", requestCount: 1 });
    expect(JSON.parse(placesFetch.mock.calls[0][1]?.body as string)).toMatchObject({
      textQuery: expectedQuery,
      languageCode: "ko",
    });
  });

  it("uses a Google Maps-grounded Gemini result when a Kakao key is not configured", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("MATPIN_MAPS_MODEL", "");
    vi.stubEnv("MATPIN_GEMINI_MODEL", "");
    const mapsFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      model: "gemini-3.6-flash",
      usage: {
        total_input_tokens: 120,
        total_output_tokens: 30,
        total_thought_tokens: 10,
        total_tool_use_tokens: 15,
        total_tokens: 175,
        grounding_tool_count: [{ type: "google_maps", count: 2 }],
      },
      steps: [{
        type: "google_maps_result",
        result: [{
          places: [{
            name: "산장장작구이",
            place_id: "places/test-place",
            url: "https://maps.google.com/?cid=123",
          }],
        }],
      }, {
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            places: [{
              name: "산장장작구이",
              category: "한식당",
              address: "서울 강남구 테헤란로 1",
              latitude: 37.5,
              longitude: 127.01,
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const resolved = await resolveMatpinPlacesWithMetrics({
      status: "resolved",
      summary: "산장장작구이를 확인했어요.",
      places: [{
        name: "산장장작구이",
        branch: null,
        menus: ["삼겹살"],
        regionHints: ["강남구"],
        confidence: 0.96,
        evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 1 }],
      }],
    });

    expect(resolved.candidates).toHaveLength(1);
    expect(resolved.candidates[0]).toMatchObject({
      id: "places/test-place",
      name: "산장장작구이",
      category: "Google Maps · 한식당",
      mapUrl: "https://maps.google.com/?cid=123",
    });
    expect(resolved.metrics).toMatchObject({
      provider: "gemini_maps",
      model: "gemini-3.6-flash",
      requestCount: 1,
      inputTokens: 120,
      outputTokens: 30,
      thoughtTokens: 10,
      toolUseTokens: 15,
      totalTokens: 175,
      groundingQueryCount: 2,
    });
    expect(JSON.parse(mapsFetch.mock.calls[0][1]?.body as string).model).toBe("gemini-3.6-flash");
  });

  it("accepts a bilingual model name when the grounded Google Maps name is romanized", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      steps: [{
        type: "google_maps_result",
        result: [{
          places: [{
            name: "Tunini - Google Maps",
            place_id: "places/tunini",
            url: "https://maps.google.com/maps?cid=123",
          }, {
            name: "Review of Tunini - Google Maps",
            place_id: "places/tunini",
            url: "https://www.google.com/maps/reviews/data=test",
          }],
        }],
      }, {
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            places: [{
              name: "튜니니 (Tunini)",
              category: "브런치 식당",
              address: "서울 강남구 선릉로111길 23",
              latitude: 37.51,
              longitude: 127.04,
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const candidates = await resolveMatpinPlaces({
      status: "resolved",
      summary: "캡션에서 튜니니를 확인했어요.",
      places: [{
        name: "튜니니",
        branch: null,
        menus: ["파니니"],
        regionHints: ["강남"],
        confidence: 0.95,
        evidence: [{ kind: "caption", text: "튜니니", timestampSeconds: null }],
      }],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      id: "places/tunini",
      name: "튜니니 (Tunini)",
      mapUrl: "https://maps.google.com/maps?cid=123",
    });
  });

  it("keeps the mock analyzer explicit and returns no invented place for unknown reels", async () => {
    const analyzer = createMockReelAnalyzer();
    expect(analyzer.mode).toBe("mock");
    await expect(analyzer.analyze({ mediaUrl: "https://example.com", reelId: "unknown" }))
      .resolves.toMatchObject({ analysis: { status: "insufficient", places: [] }, metrics: { model: "mock" } });
  });

  it("returns an explicit configuration error before downloading media when the Gemini key is absent", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ALLSALE_GEMINI_API_KEY", "");
    const download = vi.fn();
    const analyzer = createGeminiReelAnalyzer({ download });
    await expect(analyzer.analyze({ mediaUrl: "https://video.cdninstagram.com/reel.mp4", reelId: "reel-1" }))
      .rejects.toMatchObject({ code: "gemini_not_configured", retryable: false });
    expect(download).not.toHaveBeenCalled();
  });

  it("uses Flash-Lite as the default extraction model", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    vi.stubEnv("MATPIN_EXTRACTION_MODEL", "");
    vi.stubEnv("MATPIN_GEMINI_MODEL", "");
    const geminiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      usage: { total_input_tokens: 80, total_output_tokens: 20, total_tokens: 100 },
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "resolved",
            summary: "캡션에서 장소를 확인했어요.",
            places: [{
              name: "산장장작구이",
              branch: null,
              menus: [],
              regionHints: ["강남"],
              confidence: 0.96,
              evidence: [{ kind: "caption", text: "산장장작구이", timestampSeconds: null }],
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const analyzer = createGeminiReelAnalyzer({
      fetch: geminiFetch,
      source: vi.fn().mockResolvedValue({
        caption: "산장장작구이",
        creatorComments: [],
        videoUrl: null,
        thumbnailUrl: null,
        mediaUrls: [],
      }),
    });

    await expect(analyzer.analyze({
      mediaUrl: "https://www.instagram.com/reel/test/",
      reelId: "test",
    })).resolves.toMatchObject({ metrics: { model: "gemini-3.1-flash-lite" } });
    expect(JSON.parse(geminiFetch.mock.calls[0][1].body as string).model)
      .toBe("gemini-3.1-flash-lite");
  });

  it("validates structured Gemini output and records token and media metrics", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const analyzer = createGeminiReelAnalyzer({
      download: vi.fn().mockResolvedValue({ bytes: Buffer.from("video"), mimeType: "video/mp4" }),
      fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({
        model: "gemini-test-model",
        usage: {
          total_input_tokens: 100,
          total_output_tokens: 20,
          total_thought_tokens: 8,
          total_tool_use_tokens: 2,
          total_tokens: 130,
        },
        steps: [{
          type: "model_output",
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "resolved",
              summary: "산장장작구이를 확인했어요.",
              places: [{
                name: "산장장작구이",
                branch: null,
                menus: ["삼겹살"],
                regionHints: ["역삼"],
                confidence: 0.96,
                evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 2 }],
              }],
            }),
          }],
        }],
      }), { status: 200, headers: { "content-type": "application/json" } })),
    });

    await expect(analyzer.analyze({ mediaUrl: "https://video.cdninstagram.com/reel.mp4", reelId: "reel-1" }))
      .resolves.toMatchObject({
        analysis: { status: "resolved", places: [{ name: "산장장작구이" }] },
        metrics: {
          model: "gemini-test-model",
          requestCount: 1,
          mediaBytes: 5,
          inputTokens: 100,
          outputTokens: 20,
          thoughtTokens: 8,
          toolUseTokens: 2,
          totalTokens: 130,
        },
      });
  });

  it("adds both Gemini calls when text clues require a media fallback", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const geminiFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        usage: {
          total_input_tokens: 10,
          total_output_tokens: 5,
          total_thought_tokens: 2,
          total_tool_use_tokens: 1,
          total_tokens: 18,
        },
        steps: [{
          type: "model_output",
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "insufficient",
              summary: "텍스트만으로 장소를 확인하지 못했어요.",
              places: [],
            }),
          }],
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        usage: {
          total_input_tokens: 100,
          total_output_tokens: 20,
          total_thought_tokens: 8,
          total_tool_use_tokens: 2,
          total_tokens: 130,
        },
        steps: [{
          type: "model_output",
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "resolved",
              summary: "영상에서 장소를 확인했어요.",
              places: [{
                name: "산장장작구이",
                branch: null,
                menus: [],
                regionHints: ["강남"],
                confidence: 0.95,
                evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 2 }],
              }],
            }),
          }],
        }],
      }), { status: 200 }));
    const analyzer = createGeminiReelAnalyzer({
      download: vi.fn().mockResolvedValue({ bytes: Buffer.from("video"), mimeType: "video/mp4" }),
      fetch: geminiFetch,
      source: vi.fn().mockResolvedValue({
        caption: "강남 맛집",
        creatorComments: [],
        videoUrl: "https://video.cdninstagram.com/reel.mp4",
        thumbnailUrl: null,
        mediaUrls: ["https://video.cdninstagram.com/reel.mp4"],
      }),
    });

    await expect(analyzer.analyze({
      mediaUrl: "https://www.instagram.com/reel/test/",
      reelId: "test",
    })).resolves.toMatchObject({
      metrics: {
        requestCount: 2,
        mediaBytes: 5,
        inputTokens: 110,
        outputTokens: 25,
        thoughtTokens: 10,
        toolUseTokens: 3,
        totalTokens: 148,
      },
    });
    expect(geminiFetch).toHaveBeenCalledTimes(2);
  });

  it("analyzes the image preview of a shared feed post", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const geminiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gemini-test-model",
      usage: { total_input_tokens: 60, total_output_tokens: 20, total_tokens: 80 },
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "resolved",
            summary: "이미지에서 땀땀 강남본점을 확인했어요.",
            places: [{
              name: "땀땀",
              branch: "강남본점",
              menus: ["쌀국수"],
              regionHints: ["강남역"],
              confidence: 0.96,
              evidence: [{ kind: "on_screen_text", text: "땀땀 강남본점", timestampSeconds: null }],
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const download = vi.fn().mockResolvedValue({ bytes: Buffer.from("image"), mimeType: "image/jpeg" });
    const analyzer = createGeminiReelAnalyzer({
      download,
      fetch: geminiFetch,
      source: vi.fn().mockResolvedValue({
        caption: null,
        creatorComments: [],
        videoUrl: null,
        thumbnailUrl: "https://scontent-icn1-1.xx.fbcdn.net/post.jpg",
        mediaUrls: ["https://scontent-icn1-1.xx.fbcdn.net/post.jpg"],
      }),
    });

    await expect(analyzer.analyze({
      mediaUrl: "https://www.instagram.com/p/Post_123/",
      reelId: "Post_123",
    })).resolves.toMatchObject({
      analysis: { places: [{ name: "땀땀" }] },
      metrics: { mediaBytes: 5, totalTokens: 80 },
    });
    expect(download).toHaveBeenCalledWith("https://scontent-icn1-1.xx.fbcdn.net/post.jpg");
    const requestBody = JSON.parse(geminiFetch.mock.calls[0][1].body as string);
    expect(requestBody.input[0]).toMatchObject({ type: "image", mime_type: "image/jpeg" });
  });

  it("analyzes up to three public carousel items in one Gemini request", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const geminiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "resolved",
            summary: "캐러셀에서 식당을 확인했어요.",
            places: [{
              name: "땀땀",
              branch: "강남본점",
              menus: [],
              regionHints: ["강남역"],
              confidence: 0.95,
              evidence: [{ kind: "on_screen_text", text: "땀땀 강남본점", timestampSeconds: null }],
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const download = vi.fn().mockResolvedValue({ bytes: Buffer.from("image"), mimeType: "image/jpeg" });
    const mediaUrls = [1, 2, 3, 4].map((index) => `https://scontent-icn1-1.xx.fbcdn.net/carousel-${index}.jpg`);
    const analyzer = createGeminiReelAnalyzer({
      download,
      fetch: geminiFetch,
      source: vi.fn().mockResolvedValue({
        caption: null,
        creatorComments: [],
        videoUrl: null,
        thumbnailUrl: mediaUrls[0],
        mediaUrls,
      }),
    });

    await analyzer.analyze({
      mediaUrl: "https://www.instagram.com/p/Carousel_123/",
      reelId: "Carousel_123",
    });

    expect(download).toHaveBeenCalledTimes(3);
    const requestBody = JSON.parse(geminiFetch.mock.calls[0][1].body as string);
    expect(requestBody.input.map((item: { type: string }) => item.type))
      .toEqual(["image", "image", "image", "text"]);
  });

  it("parses the public Instagram embed source without trusting arbitrary page scripts", () => {
    const embedded = JSON.stringify({
      gql_data: {
        shortcode_media: {
          id: "3673687429669947587",
          shortcode: "DL7j0DVS4jD",
          video_url: "https://video.cdninstagram.com/reel.mp4",
          owner: { username: "creator" },
          edge_media_to_caption: {
            edges: [{ node: { text: "강남 반차 코스, 튜니니와 구테로이테" } }],
          },
        },
      },
    });
    const serverJs = JSON.stringify({ define: [["EmbedData", [], { payload: embedded }, 1]] });

    expect(parseInstagramEmbedSource(`<script>s.handle(${serverJs});</script>`)).toEqual({
      mediaId: "3673687429669947587",
      ownerUsername: "creator",
      source: {
        caption: "강남 반차 코스, 튜니니와 구테로이테",
        creatorComments: [],
        thumbnailUrl: null,
        videoUrl: "https://video.cdninstagram.com/reel.mp4",
        mediaUrls: ["https://video.cdninstagram.com/reel.mp4"],
      },
    });
  });

  it("checks the Reel caption and creator comments before downloading video", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const download = vi.fn();
    const geminiFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      model: "gemini-test-model",
      usage: { total_input_tokens: 80, total_output_tokens: 20, total_tokens: 100 },
      steps: [{
        type: "model_output",
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "resolved",
            summary: "캡션에서 튜니니를 확인했어요.",
            places: [{
              name: "튜니니",
              branch: null,
              menus: ["파니니"],
              regionHints: ["강남"],
              confidence: 0.97,
              evidence: [{ kind: "caption", text: "🏷 튜니니", timestampSeconds: null }],
            }],
          }),
        }],
      }],
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const analyzer = createGeminiReelAnalyzer({
      download,
      fetch: geminiFetch,
      source: vi.fn().mockResolvedValue({
        caption: "강남 반차 코스 🏷 튜니니",
        creatorComments: ["첫 장소는 튜니니입니다."],
        videoUrl: "https://video.cdninstagram.com/reel.mp4",
        thumbnailUrl: null,
        mediaUrls: ["https://video.cdninstagram.com/reel.mp4"],
      }),
    });

    await expect(analyzer.analyze({
      mediaUrl: "https://www.instagram.com/reel/DL7j0DVS4jD/",
      reelId: "DL7j0DVS4jD",
    })).resolves.toMatchObject({
      analysis: { places: [{ name: "튜니니", evidence: [{ kind: "caption" }] }] },
      metrics: { mediaBytes: 0, totalTokens: 100 },
    });
    expect(download).not.toHaveBeenCalled();
    expect(geminiFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(geminiFetch.mock.calls[0][1].body as string).input[0].text)
      .toContain("첫 장소는 튜니니입니다.");
  });

  it.each([
    [429, true],
    [400, false],
  ])("classifies Gemini upstream %i for limited retry", async (status, retryable) => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const analyzer = createGeminiReelAnalyzer({
      download: vi.fn().mockResolvedValue({ bytes: Buffer.from("video"), mimeType: "video/mp4" }),
      fetch: vi.fn().mockResolvedValue(new Response("{}", { status })),
    });
    try {
      await analyzer.analyze({ mediaUrl: "https://video.cdninstagram.com/reel.mp4", reelId: "reel-1" });
      throw new Error("expected analyzer to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(MatpinAnalysisError);
      expect(error).toMatchObject({ code: "gemini_upstream", retryable });
    }
  });

  it("marks a Gemini timeout as retryable", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const analyzer = createGeminiReelAnalyzer({
      download: vi.fn().mockResolvedValue({ bytes: Buffer.from("video"), mimeType: "video/mp4" }),
      fetch: vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")),
    });
    await expect(analyzer.analyze({ mediaUrl: "https://video.cdninstagram.com/reel.mp4", reelId: "reel-1" }))
      .rejects.toMatchObject({ code: "gemini_timeout", retryable: true });
  });

  it("rejects a schema-invalid Gemini answer instead of saving it", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
    const analyzer = createGeminiReelAnalyzer({
      download: vi.fn().mockResolvedValue({ bytes: Buffer.from("video"), mimeType: "video/mp4" }),
      fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({
        steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify({ status: "resolved", places: [] }) }] }],
      }), { status: 200 })),
    });
    await expect(analyzer.analyze({ mediaUrl: "https://video.cdninstagram.com/reel.mp4", reelId: "reel-1" }))
      .rejects.toMatchObject({ code: "gemini_invalid_extraction", retryable: true });
  });
});

describe("Matpin database boundary", () => {
  it("keeps Instagram tables server-only with RLS and explicit service-role grants", () => {
    const sql = readFileSync(
      "supabase/migrations/20260801083034_create_matpin_instagram_pipeline.sql",
      "utf8",
    );
    expect(sql).toContain("alter table public.matpin_instagram_users enable row level security");
    expect(sql).toContain("revoke all on table public.matpin_instagram_messages from anon, authenticated");
    expect(sql).toContain("grant select, insert, update, delete on table public.matpin_saved_places to service_role");
    expect(sql).toContain("unique (sender_hash, reel_id)");
    expect(sql).toContain("media_url_ciphertext = null");
  });

  it("keeps permanent media analysis results server-only", () => {
    const sql = readFileSync(
      "supabase/migrations/20260809025141_add_matpin_media_cache_and_post_support.sql",
      "utf8",
    );
    expect(sql).toContain("create table public.matpin_media_analysis_cache");
    expect(sql).toContain("alter table public.matpin_media_analysis_cache enable row level security");
    expect(sql).toContain("revoke all on table public.matpin_media_analysis_cache from anon, authenticated");
    expect(sql).toContain("grant select, insert, update, delete on table public.matpin_media_analysis_cache to service_role");
    expect(sql).not.toMatch(/\n\s*expires_at\s+timestamptz/u);
    expect(sql).toContain("hit_count = hit_count + 1");
  });

  it("keeps short-link codes hashed and server-only", () => {
    const sql = readFileSync(
      "supabase/migrations/20260809070601_add_matpin_short_links.sql",
      "utf8",
    );
    expect(sql).toContain("add column short_link_hash text");
    expect(sql).toContain("create unique index matpin_instagram_users_short_link_hash_idx");
    expect(sql).toContain("revoke all on function public.matpin_ingest_message");
    expect(sql).toContain("grant execute on function public.matpin_ingest_message");
    expect(sql).not.toContain("short_link_code");
  });

  it("keeps API usage events server-only and queryable by message", () => {
    const sql = readFileSync(
      "supabase/migrations/20260809105826_add_matpin_usage_events.sql",
      "utf8",
    );
    expect(sql).toContain("create table public.matpin_api_usage_events");
    expect(sql).toContain("references public.matpin_instagram_messages(id) on delete cascade");
    expect(sql).toContain("alter table public.matpin_api_usage_events enable row level security");
    expect(sql).toContain("revoke all on table public.matpin_api_usage_events from public, anon, authenticated");
    expect(sql).toContain("grant select, insert on table public.matpin_api_usage_events to service_role");
  });
});
