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
    expect(mocks.ingest).toHaveBeenCalledWith(expect.any(Object), {
      signal: expect.any(AbortSignal),
    });
  });

  it("bounds graph reads at five and ingests at ten under one signal", async () => {
    const conversations = Array.from({ length: 12 }, (_, index) => ({
      id: `conversation-${index + 1}`,
    }));
    let graphActive = 0;
    let graphMaximum = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      if (url.includes("/conversations?")) {
        return new Response(JSON.stringify({ data: conversations }), { status: 200 });
      }

      graphActive += 1;
      graphMaximum = Math.max(graphMaximum, graphActive);
      await Promise.resolve();
      graphActive -= 1;
      const conversationId = /conversation-(\d+)/.exec(url)?.[1] ?? "0";
      return new Response(JSON.stringify({
        data: [{
          id: `message-${conversationId}`,
          created_time: "2026-08-09T08:10:00+0000",
          from: { id: `sender-${conversationId}` },
          message: `https://www.instagram.com/reel/Reel_${conversationId}/`,
        }],
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    let ingestActive = 0;
    let ingestMaximum = 0;
    mocks.ingest.mockImplementation(async () => {
      ingestActive += 1;
      ingestMaximum = Math.max(ingestMaximum, ingestActive);
      await Promise.resolve();
      ingestActive -= 1;
      return { accepted: true, duplicate: false };
    });

    const signal = AbortSignal.timeout(5_000);
    await expect(backfillMatpinConversationHistory({ signal })).resolves.toMatchObject({
      conversations: 12,
      scanned: 12,
      eligible: 12,
      accepted: 12,
    });
    expect(graphMaximum).toBe(5);
    expect(ingestMaximum).toBe(10);
    expect(mocks.ingest).toHaveBeenCalledWith(expect.any(Object), {
      signal: expect.any(AbortSignal),
    });
  });

  it("aborts sibling ingest lanes and stops claiming new work after the first failure", async () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      id: `message-${index + 1}`,
      created_time: "2026-08-09T08:10:00+0000",
      from: { id: `sender-${index + 1}` },
      message: `https://www.instagram.com/reel/Reel_${index + 1}/`,
    }));
    const responses = [
      { data: [{ id: "conversation-1" }] },
      { data: messages },
    ];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(
      JSON.stringify(responses.shift()),
      { status: 200, headers: { "content-type": "application/json" } },
    ))));

    let ingestCalls = 0;
    const siblingSignals: AbortSignal[] = [];
    mocks.ingest.mockImplementation((_message, options: { signal: AbortSignal }) => {
      const call = ingestCalls;
      ingestCalls += 1;
      if (call === 0) return Promise.reject(new Error("backfill_ingest_failed"));
      siblingSignals.push(options.signal);
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      });
    });

    await expect(backfillMatpinConversationHistory({
      signal: AbortSignal.timeout(5_000),
    })).rejects.toThrow("backfill_ingest_failed");
    expect(ingestCalls).toBe(10);
    expect(siblingSignals).toHaveLength(9);
    expect(siblingSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("does not start graph work after the shared deadline aborts", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(backfillMatpinConversationHistory({ signal: controller.signal }))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
