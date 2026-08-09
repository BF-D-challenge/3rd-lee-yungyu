import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ingest: vi.fn(),
  process: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/matpin/store", () => ({ ingestMatpinMessage: mocks.ingest }));
vi.mock("@/lib/matpin/worker", () => ({ processMatpinQueue: mocks.process }));
vi.mock("@/lib/matpin/instagram-send", () => ({ sendMatpinInstagramMessage: mocks.send }));

import { POST } from "@/app/api/matpin/webhook/route";
import {
  normalizeMetaWebhookGuidanceRecipients,
  normalizeMetaWebhookMessages,
} from "@/lib/matpin/contract";
import { MATPIN_USAGE_GUIDANCE } from "@/lib/matpin/guidance";

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

beforeEach(() => {
  vi.stubEnv("META_APP_SECRET", "meta-test-secret");
  vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "professional-account");
  vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
  mocks.ingest.mockReset();
  mocks.process.mockReset();
  mocks.send.mockReset().mockResolvedValue("reply-1");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin usage guidance", () => {
  it("uses a clear result with one light expression and explains the recovery action", () => {
    expect(MATPIN_USAGE_GUIDANCE).not.toContain("메뉴판");
    expect(MATPIN_USAGE_GUIDANCE).toContain("보내주신 메시지는 저장하지 않았습니다");
    expect(MATPIN_USAGE_GUIDANCE).toContain("맛집 게시물만 콕 집어 저장해요");
    expect(MATPIN_USAGE_GUIDANCE).toContain("저장하지 않았습니다");
    expect(MATPIN_USAGE_GUIDANCE).toContain("맛핀에 이렇게 보내주세요");
    expect(MATPIN_USAGE_GUIDANCE).toContain("1. 맛집 릴스");
    expect(MATPIN_USAGE_GUIDANCE).toContain("2. 맛집 게시물");
    expect(MATPIN_USAGE_GUIDANCE).toContain("3. 맛집 캐러셀");
    expect(MATPIN_USAGE_GUIDANCE).toContain("4. Instagram 링크");
    expect(MATPIN_USAGE_GUIDANCE).toContain("게시물의 공유 버튼으로 보내면 바로 확인해요");
    expect(MATPIN_USAGE_GUIDANCE).toContain("글, 사진, 동영상은 저장하지 않습니다");
  });

  it.each([
    ["plain text", { text: "안녕하세요" }],
    ["direct image", { attachments: [{ type: "image", payload: { url: "https://cdn.example.com/a.jpg" } }] }],
    ["direct video", { attachments: [{ type: "video", payload: { url: "https://cdn.example.com/a.mp4" } }] }],
  ])("replies with usage guidance for %s without storing it", async (_label, message) => {
    const payload = webhookBody(message);
    expect(normalizeMetaWebhookMessages(payload, "professional-account")).toEqual([]);
    expect(normalizeMetaWebhookGuidanceRecipients(payload, "professional-account")).toEqual([{
      metaMessageId: "mid-1",
      senderScopedId: "sender-1",
    }]);

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accepted: 0, guidanceSent: 1 });
    expect(mocks.send).toHaveBeenCalledWith("sender-1", MATPIN_USAGE_GUIDANCE);
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("does not send guidance for a supported Instagram post", async () => {
    const payload = webhookBody({
      text: "https://www.instagram.com/p/Post_123/",
    });

    expect(normalizeMetaWebhookGuidanceRecipients(payload, "professional-account")).toEqual([]);
  });

  it("does not reply to echo events", async () => {
    const payload = webhookBody({ text: "안녕하세요", is_echo: true });

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accepted: 0, ignored: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not reply to unsupported Meta events", async () => {
    const payload = webhookBody({ text: "안녕하세요", is_unsupported: true });

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, accepted: 0, ignored: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
