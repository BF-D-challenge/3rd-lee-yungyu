import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ingest: vi.fn(),
}));

vi.mock("@/lib/matpin/store", () => ({
  ingestMatpinBackfillMessage: mocks.ingest,
}));

import {
  backfillMatpinConversationHistory,
  normalizeMatpinConversationMessage,
} from "@/lib/matpin/backfill";

const accountId = "business-account";

beforeEach(() => {
  vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", accountId);
  vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "test-access-token");
  vi.stubEnv("META_GRAPH_API_VERSION", "v25.0");
  mocks.ingest.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Matpin conversation history backfill", () => {
  it("normalizes shared media and exact Instagram links", () => {
    const sharedMedia = normalizeMatpinConversationMessage({
      id: "message-media",
      created_time: "2026-08-09T08:10:00+0000",
      from: { id: "sender-1" },
      attachments: {
        data: [{
          type: "media",
          payload: { url: "https://lookaside.instagram.com/media?asset_id=123456789" },
        }],
      },
    }, accountId);
    const sharedLink = normalizeMatpinConversationMessage({
      id: "message-link",
      created_time: "2026-08-09T08:11:00+0000",
      from: { id: "sender-2" },
      message: "https://www.instagram.com/p/Post_123/",
    }, accountId);

    expect(sharedMedia).toMatchObject({
      senderScopedId: "sender-1",
      reelId: "123456789",
      attachmentType: "share",
    });
    expect(sharedLink).toMatchObject({
      senderScopedId: "sender-2",
      reelId: "Post_123",
      reelUrl: "https://www.instagram.com/p/Post_123/",
    });
  });

  it("ignores direct text, direct files, and outbound business messages", () => {
    const base = {
      created_time: "2026-08-09T08:10:00+0000",
      from: { id: "sender-1" },
    };

    expect(normalizeMatpinConversationMessage({
      ...base,
      id: "plain-text",
      message: "강남 맛집 저장해줘",
    }, accountId)).toBeNull();
    expect(normalizeMatpinConversationMessage({
      ...base,
      id: "direct-video",
      attachments: { data: [{ type: "video", video_data: { url: "https://cdn.example.com/a.mp4" } }] },
    }, accountId)).toBeNull();
    expect(normalizeMatpinConversationMessage({
      ...base,
      id: "direct-image",
      attachments: { data: [{ type: "image", image_data: { url: "https://cdn.example.com/a.jpg" } }] },
    }, accountId)).toBeNull();
    expect(normalizeMatpinConversationMessage({
      ...base,
      id: "outbound",
      from: { id: accountId },
      message: "https://www.instagram.com/reel/Reel_123/",
    }, accountId)).toBeNull();
  });

  it("stores every recoverable inbound share and reports duplicates", async () => {
    const responses = [
      { data: [{ id: "conversation-1" }] },
      {
        data: [
          {
            id: "message-1",
            created_time: "2026-08-09T08:10:00+0000",
            from: { id: "sender-1" },
            message: "https://www.instagram.com/reel/Reel_123/",
          },
          {
            id: "message-2",
            created_time: "2026-08-09T08:11:00+0000",
            from: { id: "sender-1" },
            attachments: {
              data: [{ type: "share", payload: { url: "https://cdn.example.com/a.mp4?asset_id=987654321" } }],
            },
          },
          {
            id: "ignored-text",
            created_time: "2026-08-09T08:12:00+0000",
            from: { id: "sender-1" },
            message: "안녕하세요",
          },
        ],
      },
    ];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify(responses.shift()),
      { status: 200, headers: { "content-type": "application/json" } },
    ))));
    mocks.ingest
      .mockResolvedValueOnce({ accepted: true, duplicate: false })
      .mockResolvedValueOnce({ accepted: false, duplicate: true });

    await expect(backfillMatpinConversationHistory()).resolves.toEqual({
      conversations: 1,
      scanned: 3,
      eligible: 2,
      accepted: 1,
      duplicates: 1,
    });
    expect(mocks.ingest).toHaveBeenCalledTimes(2);
  });
});
