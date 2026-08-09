import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  claimCache: vi.fn(),
  claimMessage: vi.fn(),
  completeAnalysis: vi.fn(),
  completeCache: vi.fn(),
  releaseCache: vi.fn(),
  resolvePlaces: vi.fn(),
  retryMessage: vi.fn(),
  savePlaces: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/lib/matpin/instagram-send", () => ({
  sendMatpinInstagramMessage: mocks.sendMessage,
}));

vi.mock("@/lib/matpin/place-resolver", () => ({
  resolveMatpinPlaces: mocks.resolvePlaces,
}));

vi.mock("@/lib/matpin/reel-analyzer", () => ({
  createGeminiReelAnalyzer: () => ({ analyze: mocks.analyze, mode: "gemini" }),
  MatpinAnalysisError: class MatpinAnalysisError extends Error {
    constructor(public code: string, public retryable: boolean) {
      super(code);
    }
  },
}));

vi.mock("@/lib/matpin/store", () => ({
  claimMatpinMediaAnalysis: mocks.claimCache,
  claimNextMatpinMessage: mocks.claimMessage,
  completeMatpinAnalysis: mocks.completeAnalysis,
  completeMatpinMediaAnalysis: mocks.completeCache,
  releaseMatpinMediaAnalysis: mocks.releaseCache,
  retryMatpinMessage: mocks.retryMessage,
  saveMatpinPlaces: mocks.savePlaces,
}));

import { processMatpinQueue } from "@/lib/matpin/worker";

const candidate = {
  id: "place-1",
  name: "땀땀 강남본점",
  area: "강남역",
  category: "베트남 음식",
  address: "서울 강남구 강남대로98길 12-5",
  latitude: 37.5,
  longitude: 127.02,
  mapUrl: "https://maps.google.com/?cid=1",
  confidence: 0.96,
  matchReason: "게시물에서 상호와 주소를 확인했어요.",
};

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin permanent media analysis cache", () => {
  it("reuses a cached result without invoking Gemini or place resolution", async () => {
    vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.example");
    mocks.claimMessage.mockResolvedValue({
      queueMessageId: 11,
      messageId: "11111111-1111-4111-8111-111111111111",
      senderHash: "a".repeat(64),
      senderScopedId: "sender-1",
      accessToken: "private-token",
      shortLinkCode: "AbCdEfGhIjKlMnOp",
      reelId: "Post_123",
      reelUrl: "https://www.instagram.com/p/Post_123/",
      attachmentType: "share",
      mediaUrl: "https://www.instagram.com/p/Post_123/",
      attemptCount: 1,
    });
    mocks.claimCache.mockResolvedValue({
      state: "hit",
      outcome: "resolved",
      candidates: [candidate],
    });
    mocks.savePlaces.mockResolvedValue(1);
    mocks.sendMessage.mockResolvedValue(undefined);
    mocks.completeAnalysis.mockResolvedValue(undefined);

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: "11111111-1111-4111-8111-111111111111",
    }]);

    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.resolvePlaces).not.toHaveBeenCalled();
    expect(mocks.completeCache).not.toHaveBeenCalled();
    expect(mocks.completeAnalysis).toHaveBeenCalledWith(expect.objectContaining({
      metrics: expect.objectContaining({ model: "cache", totalTokens: 0 }),
    }));
    expect(mocks.sendMessage).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("게시물에서 찾은 장소"),
    );
  });

  it("stores the first resolved analysis before replying", async () => {
    vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.example");
    mocks.claimMessage.mockResolvedValue({
      queueMessageId: 12,
      messageId: "22222222-2222-4222-8222-222222222222",
      senderHash: "b".repeat(64),
      senderScopedId: "sender-2",
      accessToken: "private-token-2",
      shortLinkCode: "QrStUvWxYz012345",
      reelId: "Post_456",
      reelUrl: "https://www.instagram.com/p/Post_456/",
      attachmentType: "share",
      mediaUrl: "https://www.instagram.com/p/Post_456/",
      attemptCount: 1,
    });
    mocks.claimCache.mockResolvedValue({ state: "owner" });
    mocks.analyze.mockResolvedValue({
      analysis: { status: "resolved", summary: "확인했어요.", places: [] },
      metrics: {
        model: "gemini-test",
        durationMs: 10,
        mediaBytes: 5,
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
    });
    mocks.resolvePlaces.mockResolvedValue([candidate]);
    mocks.completeCache.mockResolvedValue(undefined);
    mocks.savePlaces.mockResolvedValue(1);
    mocks.sendMessage.mockResolvedValue(undefined);
    mocks.completeAnalysis.mockResolvedValue(undefined);

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: "22222222-2222-4222-8222-222222222222",
    }]);

    expect(mocks.analyze).toHaveBeenCalledTimes(1);
    expect(mocks.completeCache).toHaveBeenCalledWith(expect.objectContaining({
      mediaKey: "Post_456",
      outcome: "resolved",
      candidates: [candidate],
    }));
    expect(mocks.completeCache.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.sendMessage.mock.invocationCallOrder[0]);
  });
});
