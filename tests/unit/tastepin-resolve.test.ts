import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/tastepin/resolve/route";
import { normalizeYouTubeShortsUrl } from "@/lib/tastepin-contract";

const shortsUrl = "https://www.youtube.com/shorts/9hE5-98ZeCg?si=tracking";

const geminiResponse = (status: "resolved" | "insufficient" = "resolved") => ({
  status: "completed",
  steps: [
    { type: "thought" },
    {
      type: "model_output",
      content: [{
        type: "text",
        text: JSON.stringify(status === "resolved" ? {
          status: "resolved",
          summary: "영상에서 식당 이름과 메뉴 단서를 찾았어요.",
          places: [{
            name: "테스트식당",
            branch: null,
            menus: ["테스트 메뉴"],
            regionHints: ["서울"],
            confidence: 0.86,
            evidence: [{
              kind: "on_screen_text",
              text: "테스트식당",
              timestampSeconds: 4,
            }],
          }],
        } : {
          status: "insufficient",
          summary: "영상에서 식당 이름을 확인하지 못했어요.",
          places: [],
        }),
      }],
    },
  ],
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("normalizeYouTubeShortsUrl", () => {
  it("공개 YouTube Shorts URL만 정규화한다", () => {
    expect(normalizeYouTubeShortsUrl(shortsUrl))
      .toBe("https://www.youtube.com/shorts/9hE5-98ZeCg");
    expect(normalizeYouTubeShortsUrl("https://youtu.be/9hE5-98ZeCg")).toBeNull();
    expect(normalizeYouTubeShortsUrl("https://www.youtube.com/watch?v=9hE5-98ZeCg")).toBeNull();
    expect(normalizeYouTubeShortsUrl("http://www.youtube.com/shorts/9hE5-98ZeCg")).toBeNull();
    expect(normalizeYouTubeShortsUrl("https://evil.example/shorts/9hE5-98ZeCg")).toBeNull();
  });
});

describe("POST /api/tastepin/resolve", () => {
  it("지원하지 않는 URL은 외부 호출 전에 차단한다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await POST(new Request("https://example.com/api/tastepin/resolve", {
      method: "POST",
      body: JSON.stringify({ url: "https://www.instagram.com/reel/example" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "unsupported_url" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("서버 Gemini 키가 없으면 정직한 설정 오류를 반환한다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ALLSALE_GEMINI_API_KEY", "");
    const response = await POST(new Request("https://example.com/api/tastepin/resolve", {
      method: "POST",
      body: JSON.stringify({ url: shortsUrl }),
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "gemini_not_configured" });
  });

  it("Gemini 구조화 결과를 검증하고 원문 URL 없이 반환한다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("ALLSALE_GEMINI_API_KEY", "");
    vi.stubEnv("KAKAO_REST_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(geminiResponse()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await POST(new Request("https://example.com/api/tastepin/resolve", {
      method: "POST",
      body: JSON.stringify({ url: shortsUrl }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mode).toBe("live");
    expect(body.platform).toBe("youtube_shorts");
    expect(body.extraction.places[0].name).toBe("테스트식당");
    expect(body.mapStatus).toBe("not_configured");
    expect(JSON.stringify(body)).not.toContain("youtube.com");

    const geminiCall = fetchSpy.mock.calls[0];
    expect(geminiCall[0]).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    const requestBody = JSON.parse(String((geminiCall[1] as RequestInit).body));
    expect(requestBody.input[0]).toEqual({
      type: "video",
      uri: "https://www.youtube.com/shorts/9hE5-98ZeCg",
    });
    expect((geminiCall[1] as RequestInit).headers).toEqual(expect.objectContaining({
      "x-goog-api-key": "server-only-test-key",
    }));
  });

  it("Kakao 키가 있으면 실제 장소 후보 계약으로 변환한다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.stubEnv("KAKAO_REST_API_KEY", "server-only-kakao-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(geminiResponse()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        documents: [{
          id: "123",
          place_name: "테스트식당",
          category_name: "음식점 > 한식",
          category_group_code: "FD6",
          phone: "02-000-0000",
          address_name: "서울 테스트구",
          road_address_name: "서울 테스트로 1",
          x: "127.0",
          y: "37.0",
          place_url: "https://place.map.kakao.com/123",
        }],
      }), { status: 200 }));

    const response = await POST(new Request("https://example.com/api/tastepin/resolve", {
      method: "POST",
      body: JSON.stringify({ url: shortsUrl }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mapStatus).toBe("candidates");
    expect(body.mapCandidates).toEqual([expect.objectContaining({
      id: "123",
      name: "테스트식당",
      mapUrl: "https://place.map.kakao.com/123",
    })]);
    expect((fetchSpy.mock.calls[1][1] as RequestInit).headers).toEqual({
      authorization: "KakaoAK server-only-kakao-key",
    });
  });

  it("모델 스키마가 깨지면 가짜 결과 대신 실패한다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "server-only-test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        steps: [{
          type: "model_output",
          content: [{ type: "text", text: "{\"status\":\"resolved\",\"places\":[]}" }],
        }],
      }), { status: 200 }),
    );

    const response = await POST(new Request("https://example.com/api/tastepin/resolve", {
      method: "POST",
      body: JSON.stringify({ url: shortsUrl }),
    }));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "gemini_failed" });
  });
});
