import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyze: vi.fn(),
  claimCache: vi.fn(),
  claimMessage: vi.fn(),
  completeAnalysis: vi.fn(),
  completeCache: vi.fn(),
  readContext: vi.fn(),
  recordUsage: vi.fn(),
  releaseCache: vi.fn(),
  resolvePlaces: vi.fn(),
  retryMessage: vi.fn(),
  savePlaces: vi.fn(),
}));

vi.mock("@/lib/matpin/place-resolver", () => ({
  resolveMatpinPlacesWithMetrics: mocks.resolvePlaces,
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
  completeMatpinAnalysisV2: mocks.completeAnalysis,
  completeMatpinMediaAnalysis: mocks.completeCache,
  readMatpinConversationContext: mocks.readContext,
  recordMatpinUsageEvent: mocks.recordUsage,
  releaseMatpinMediaAnalysis: mocks.releaseCache,
  retryMatpinMessage: mocks.retryMessage,
  stageMatpinPlaces: mocks.savePlaces,
}));

import { decryptMatpinValue } from "@/lib/matpin/security";
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

const baseJob = {
  queueMessageId: 11,
  messageId: "11111111-1111-4111-8111-111111111111",
  senderHash: "a".repeat(64),
  senderScopedId: "sender-1",
  accessToken: "private-token",
  shortLinkCode: "AbCdEfGhIjKlMnOp",
  reelId: "Post_123",
  reelUrl: "https://www.instagram.com/p/Post_123/",
  attachmentType: "share" as const,
  mediaUrl: "https://www.instagram.com/p/Post_123/",
  replyRequired: true,
  attemptCount: 1,
  outboundGeneration: 0,
  analysisClaimToken: "44444444-4444-4444-8444-444444444444",
  poisoned: false,
  terminalFailureRequired: false,
};
const cacheClaimToken = "66666666-6666-4666-8666-666666666666";

beforeEach(() => {
  vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.example");
  vi.stubEnv("MATPIN_DATA_SECRET", "data-secret-that-is-at-least-32-characters-long");
  mocks.claimMessage.mockReset().mockResolvedValue(baseJob);
  mocks.claimCache.mockReset();
  mocks.completeAnalysis.mockReset().mockResolvedValue({
    completed: true,
    outboundId: "22222222-2222-4222-8222-222222222222",
    deliveryState: "pending",
  });
  mocks.completeCache.mockReset().mockResolvedValue(undefined);
  mocks.readContext.mockReset()
    .mockResolvedValueOnce({
      knownUser: true,
      inboundMessageCount: 1,
      savedPlaceCount: 0,
      hasSavedMedia: false,
    })
    .mockResolvedValue({
      knownUser: true,
      inboundMessageCount: 1,
      savedPlaceCount: 1,
      hasSavedMedia: false,
    });
  mocks.recordUsage.mockReset().mockResolvedValue(undefined);
  mocks.releaseCache.mockReset().mockResolvedValue(undefined);
  mocks.retryMessage.mockReset().mockResolvedValue("retry");
  mocks.savePlaces.mockReset().mockResolvedValue(1);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin permanent media analysis cache", () => {
  it("reuses a cached result and atomically queues the final reply", async () => {
    mocks.claimCache.mockResolvedValue({
      state: "hit",
      outcome: "resolved",
      candidates: [candidate],
    });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: baseJob.messageId,
    }]);

    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.resolvePlaces).not.toHaveBeenCalled();
    expect(mocks.completeCache).not.toHaveBeenCalled();
    const completion = mocks.completeAnalysis.mock.calls[0][0];
    expect(completion.metrics).toMatchObject({ model: "cache", totalTokens: 0 });
    expect(decryptMatpinValue(completion.finalOutbound.bodyCiphertext)).toContain(
      "첫 장소를 저장했습니다",
    );
  });

  it("stores the first resolved analysis before the atomic business completion", async () => {
    mocks.claimMessage.mockResolvedValue({
      ...baseJob,
      queueMessageId: 12,
      messageId: "33333333-3333-4333-8333-333333333333",
      senderHash: "b".repeat(64),
      senderScopedId: "sender-2",
      reelId: "Post_456",
      reelUrl: "https://www.instagram.com/p/Post_456/",
      mediaUrl: "https://www.instagram.com/p/Post_456/",
      outboundGeneration: 1,
      analysisClaimToken: "55555555-5555-4555-8555-555555555555",
    });
    mocks.claimCache.mockResolvedValue({
      state: "owner",
      claimToken: cacheClaimToken,
    });
    mocks.analyze.mockResolvedValue({
      analysis: { status: "resolved", summary: "확인했어요.", places: [] },
      metrics: {
        model: "gemini-test",
        durationMs: 10,
        requestCount: 1,
        mediaBytes: 5,
        inputTokens: 10,
        outputTokens: 5,
        thoughtTokens: 2,
        toolUseTokens: 0,
        totalTokens: 15,
      },
    });
    mocks.resolvePlaces.mockResolvedValue({
      candidates: [candidate],
      metrics: {
        provider: "google_places",
        model: null,
        durationMs: 5,
        requestCount: 1,
        inputTokens: null,
        outputTokens: null,
        thoughtTokens: null,
        toolUseTokens: null,
        totalTokens: null,
        groundingQueryCount: null,
      },
    });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: "33333333-3333-4333-8333-333333333333",
    }]);

    expect(mocks.completeCache).toHaveBeenCalledWith(expect.objectContaining({
      mediaKey: "Post_456",
      claimToken: cacheClaimToken,
      outcome: "resolved",
      candidates: [candidate],
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.completeCache.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.completeAnalysis.mock.invocationCallOrder[0]);
  });
});
