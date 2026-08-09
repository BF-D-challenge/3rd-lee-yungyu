import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  ingest: vi.fn(),
  markAcknowledged: vi.fn(),
  process: vi.fn(),
  send: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: vi.fn() };
});
vi.mock("@/lib/matpin/store", () => ({
  ingestMatpinMessage: mocks.ingest,
  markMatpinMessageAcknowledged: mocks.markAcknowledged,
  readMatpinConversationContext: mocks.context,
}));
vi.mock("@/lib/matpin/worker", () => ({ processMatpinQueue: mocks.process }));
vi.mock("@/lib/matpin/instagram-send", () => ({ sendMatpinInstagramMessage: mocks.send }));

import { POST } from "@/app/api/matpin/webhook/route";
import {
  normalizeMetaWebhookGuidanceRecipients,
  normalizeMetaWebhookMessages,
} from "@/lib/matpin/contract";
import {
  buildMatpinGuidanceReply,
  buildMatpinReceiptReply,
} from "@/lib/matpin/conversation-copy";

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
  mocks.context.mockReset().mockResolvedValue({
    knownUser: true,
    inboundMessageCount: 1,
    savedPlaceCount: 0,
    hasSavedMedia: false,
  });
  mocks.ingest.mockReset();
  mocks.markAcknowledged.mockReset().mockResolvedValue(true);
  mocks.process.mockReset();
  mocks.send.mockReset().mockResolvedValue("reply-1");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin usage guidance", () => {
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
  ] as const)("replies for %s without storing the inbound content", async (
    _label,
    message,
    reason,
    expectedCopy,
  ) => {
    const payload = webhookBody(message);
    expect(normalizeMetaWebhookMessages(payload, "professional-account")).toEqual([]);
    expect(normalizeMetaWebhookGuidanceRecipients(payload, "professional-account")).toEqual([{
      metaMessageId: "mid-1",
      senderScopedId: "sender-1",
      reason,
    }]);

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ accepted: 0, guidanceSent: 1 });
    expect(mocks.send).toHaveBeenCalledWith("sender-1", expect.stringContaining(expectedCopy));
    expect(mocks.ingest).not.toHaveBeenCalled();
  });

  it("does not send guidance for a supported Instagram post", async () => {
    const payload = webhookBody({
      text: "https://www.instagram.com/p/Post_123/",
    });

    expect(normalizeMetaWebhookGuidanceRecipients(payload, "professional-account")).toEqual([]);
  });

  it("acknowledges an accepted Reel before background processing", async () => {
    mocks.ingest.mockResolvedValue({
      accepted: true,
      duplicate: false,
      messageId: "11111111-1111-4111-8111-111111111111",
      queueMessageId: 31,
      acknowledged: false,
    });
    const payload = webhookBody({ text: "https://www.instagram.com/reel/Reel_123/" });

    const response = await POST(signedRequest(payload));

    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      buildMatpinReceiptReply({
        mediaKind: "릴스",
        isReturningUser: false,
        alreadySavedMedia: false,
      }),
    );
    expect(mocks.markAcknowledged).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
    expect(await response.json()).toMatchObject({ accepted: 1, receiptsSent: 1 });
  });

  it("uses saved history when the same post is shared again", async () => {
    mocks.context.mockResolvedValue({
      knownUser: true,
      inboundMessageCount: 3,
      savedPlaceCount: 4,
      hasSavedMedia: true,
    });
    mocks.ingest.mockResolvedValue({
      accepted: true,
      duplicate: false,
      messageId: "22222222-2222-4222-8222-222222222222",
      queueMessageId: 32,
      acknowledged: false,
    });

    const response = await POST(signedRequest(webhookBody({
      text: "https://www.instagram.com/p/Post_123/",
    })));

    expect(response.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("다시 분석하지 않고 저장 내역을 확인하고 있어요"),
    );
  });

  it("does not send a delayed receipt for a historical backfill duplicate", async () => {
    mocks.ingest.mockResolvedValue({
      accepted: false,
      duplicate: true,
      messageId: "33333333-3333-4333-8333-333333333333",
      acknowledged: false,
      replyRequired: false,
    });

    const response = await POST(signedRequest(webhookBody({
      text: "https://www.instagram.com/p/Post_456/",
    })));

    expect(response.status).toBe(200);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.markAcknowledged).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ receiptsSent: 0 });
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
