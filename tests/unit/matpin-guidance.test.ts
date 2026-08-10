import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  enqueueBatch: vi.fn(),
  preflight: vi.fn(),
  processCycle: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: mocks.after };
});
vi.mock("@/lib/matpin/store", () => ({
  enqueueMatpinWebhookBatch: mocks.enqueueBatch,
}));
vi.mock("@/lib/matpin/work-cycle", () => ({
  processMatpinWorkCycle: mocks.processCycle,
}));
vi.mock("@/lib/matpin/instagram-send", () => ({
  preflightMatpinInstagramMessage: mocks.preflight,
}));

import { POST } from "@/app/api/matpin/webhook/route";
import {
  normalizeMetaWebhookGuidanceRecipients,
  normalizeMetaWebhookMessages,
} from "@/lib/matpin/contract";
import { buildMatpinGuidanceReply } from "@/lib/matpin/conversation-copy";
import { decryptMatpinValue } from "@/lib/matpin/security";

function webhookBody(message: Record<string, unknown>) {
  return {
    object: "instagram",
    entry: [{
      id: "professional-account",
      messaging: [{
        sender: { id: "sender-1" },
        recipient: { id: "professional-account" },
        timestamp: 1_754_000_000_000,
        message: { mid: "mid-1", ...message },
      }],
    }],
  };
}

function signedRequest(payload: unknown) {
  const raw = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", "meta-test-secret").update(raw).digest("hex")}`;
  return new Request("https://matpin.kr/api/matpin/webhook", {
    method: "POST",
    headers: { "x-hub-signature-256": signature },
    body: raw,
  });
}

function batchResult(overrides: Record<string, unknown> = {}) {
  return {
    accepted: 0,
    duplicates: 0,
    receiptsQueued: 0,
    guidanceQueued: 0,
    guidanceCooldown: 0,
    results: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubEnv("META_APP_SECRET", "meta-test-secret");
  vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "professional-account");
  vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("MATPIN_DATA_SECRET", "matpin-data-secret-at-least-32-chars");
  vi.stubEnv("MATPIN_LINK_SECRET", "matpin-link-secret-at-least-32-chars");
  mocks.after.mockReset();
  mocks.enqueueBatch.mockReset().mockResolvedValue(batchResult());
  mocks.preflight.mockReset().mockReturnValue(undefined);
  mocks.processCycle.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin durable webhook intake", () => {
  it("keeps help copy numbered, factual, and recoverable", () => {
    const reply = buildMatpinGuidanceReply("help");

    expect(reply).not.toContain("메뉴판");
    expect(reply).toContain("1. Instagram에서 맛집, 카페 또는 여행지 게시물을 엽니다");
    expect(reply).toContain("2. 공유 버튼을 누릅니다");
    expect(reply).toContain("3. 받는 사람으로 matpin.kr을 선택해요");
    expect(reply).toContain("4. 저장이 끝나면 보관함 링크를 보내드립니다");
  });

  it.each([
    ["greeting", { text: "안녕하세요" }, "greeting", "안녕하세요. 맛핀입니다"],
    ["appreciation", { text: "와 신기" }, "appreciation", "유용하게 봐주셔서 감사합니다"],
    ["help", { text: "어떻게 사용하나요?" }, "help", "1. Instagram에서"],
    ["direct image", { attachments: [{ type: "image", payload: { url: "https://cdn.example.com/a.jpg" } }] }, "direct_image", "사진은 받았지만 저장하지 않았습니다"],
    ["direct video", { attachments: [{ type: "video", payload: { url: "https://cdn.example.com/a.mp4" } }] }, "direct_video", "동영상은 받았지만 저장하지 않았습니다"],
    ["external link", { text: "https://example.com/place" }, "external_link", "이 링크는 저장하지 않았습니다"],
    ["Instagram profile", { text: "https://www.instagram.com/matpin.kr/" }, "instagram_profile", "프로필은 저장하지 않았습니다"],
    ["plain text", { text: "강남 맛집 알려줘" }, "plain_text", "보내주신 글은 저장하지 않았습니다"],
  ] as const)("queues encrypted guidance for %s without storing inbound content", async (
    _label,
    message,
    reason,
    expectedCopy,
  ) => {
    mocks.enqueueBatch.mockResolvedValue(batchResult({ guidanceQueued: 1 }));
    const payload = webhookBody(message);
    expect(normalizeMetaWebhookMessages(payload, "professional-account")).toEqual([]);
    expect(normalizeMetaWebhookGuidanceRecipients(payload, "professional-account")).toEqual([{
      metaMessageId: "mid-1",
      senderScopedId: "sender-1",
      reason,
    }]);

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accepted: 0, guidanceQueued: 1, outboundQueued: 1 });
    expect(mocks.enqueueBatch).toHaveBeenCalledTimes(1);
    const events = mocks.enqueueBatch.mock.calls[0]?.[0] as Array<Record<string, string>>;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "guidance",
      dedupHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      outboundSenderHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(decryptMatpinValue(events[0]?.recipientCiphertext ?? "")).toBe("sender-1");
    expect(decryptMatpinValue(events[0]?.bodyCiphertext ?? "")).toContain(expectedCopy);
    expect(JSON.stringify(events)).not.toContain("강남 맛집 알려줘");
    expect(mocks.preflight).toHaveBeenCalled();
  });

  it("queues a supported message and three encrypted receipt variants in one RPC", async () => {
    mocks.enqueueBatch.mockResolvedValue(batchResult({ accepted: 1, receiptsQueued: 1 }));
    const payload = webhookBody({ text: "https://www.instagram.com/reel/Reel_123/" });

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accepted: 1, receiptsQueued: 1, outboundQueued: 1 });
    expect(mocks.enqueueBatch).toHaveBeenCalledTimes(1);
    const events = mocks.enqueueBatch.mock.calls[0]?.[0] as Array<Record<string, string>>;
    expect(events[0]).toMatchObject({
      type: "supported",
      metaMessageId: "mid-1",
      senderHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      outboundSenderHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      receiptDedupHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(decryptMatpinValue(events[0]?.bodyCiphertext ?? "")).toContain("릴스 받았습니다");
    expect(decryptMatpinValue(events[0]?.returningBodyCiphertext ?? "")).toContain("이번 장소도");
    expect(decryptMatpinValue(events[0]?.alreadySavedBodyCiphertext ?? "")).toContain("전에 보내주신 릴스");
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.processCycle).not.toHaveBeenCalled();
  });

  it("does not wait for outbound delivery before returning 200", async () => {
    mocks.enqueueBatch.mockResolvedValue(batchResult({ guidanceQueued: 1 }));
    mocks.processCycle.mockReturnValue(new Promise(() => undefined));

    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(200);
    expect(mocks.processCycle).not.toHaveBeenCalled();
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });

  it("passes a four-second abort signal to the single batch RPC", async () => {
    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(200);
    expect(mocks.enqueueBatch).toHaveBeenCalledTimes(1);
    const options = mocks.enqueueBatch.mock.calls[0]?.[1] as { signal: AbortSignal };
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  it("returns 503 when the atomic batch enqueue fails", async () => {
    mocks.enqueueBatch.mockRejectedValue(new Error("matpin_webhook_batch_failed:timeout"));

    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "ingest_failed" });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("returns 503 for a signed event during maintenance", async () => {
    vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "maintenance");

    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "maintenance" });
    expect(mocks.enqueueBatch).not.toHaveBeenCalled();
    expect(mocks.preflight).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.processCycle).not.toHaveBeenCalled();
  });

  it.each([
    ["", "production"],
    ["unexpected", "production"],
    ["live", "preview"],
    ["live", ""],
    ["mock", "production"],
    ["maintenance", "preview"],
  ])(
    "rejects %j in %j before preparing or persisting a webhook event",
    async (mode, vercelEnvironment) => {
      vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", mode);
      vi.stubEnv("VERCEL_ENV", vercelEnvironment);

      const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "pipeline_not_configured" });
      expect(mocks.enqueueBatch).not.toHaveBeenCalled();
      expect(mocks.preflight).not.toHaveBeenCalled();
      expect(mocks.after).not.toHaveBeenCalled();
      expect(mocks.processCycle).not.toHaveBeenCalled();
    },
  );

  it("accepts explicit Preview mock as a no-op without preparing or persisting an event", async () => {
    vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "mock");
    vi.stubEnv("VERCEL_ENV", "preview");

    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accepted: 0, pipelineMode: "mock" });
    expect(mocks.enqueueBatch).not.toHaveBeenCalled();
    expect(mocks.preflight).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.processCycle).not.toHaveBeenCalled();
  });

  it("reports queued and cooldown results without claiming a send", async () => {
    mocks.enqueueBatch.mockResolvedValue(batchResult({ guidanceCooldown: 1 }));

    const response = await POST(signedRequest(webhookBody({ text: "도움말" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ guidanceQueued: 0, guidanceCooldown: 1, outboundQueued: 0 });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("rejects more than 100 normalized events before the batch RPC", async () => {
    const supported = Array.from({ length: 100 }, (_, index) => ({
      sender: { id: `supported-${index}` },
      recipient: { id: "professional-account" },
      timestamp: 1_754_000_000_000 + index,
      message: { mid: `mid-supported-${index}`, text: `https://www.instagram.com/reel/Reel_${index}/` },
    }));
    const guidance = [{
      sender: { id: "guidance-1" },
      recipient: { id: "professional-account" },
      timestamp: 1_754_000_000_101,
      message: { mid: "mid-guidance-1", text: "도움말" },
    }];
    const payload = {
      object: "instagram",
      entry: [
        { id: "professional-account", messaging: supported },
        { id: "professional-account", messaging: guidance },
      ],
    };

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "too_many_events" });
    expect(mocks.enqueueBatch).not.toHaveBeenCalled();
  });
});
