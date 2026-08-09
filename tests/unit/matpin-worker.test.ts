import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  claimCache: vi.fn(),
  complete: vi.fn(),
  completeCache: vi.fn(),
  releaseCache: vi.fn(),
  recordUsage: vi.fn(),
  readContext: vi.fn(),
  saveMany: vi.fn(),
  retry: vi.fn(),
  analyze: vi.fn(),
  backfill: vi.fn(),
  resolve: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/matpin/store", () => ({
  claimMatpinMediaAnalysis: mocks.claimCache,
  claimNextMatpinMessage: mocks.claim,
  completeMatpinAnalysis: mocks.complete,
  completeMatpinMediaAnalysis: mocks.completeCache,
  releaseMatpinMediaAnalysis: mocks.releaseCache,
  recordMatpinUsageEvent: mocks.recordUsage,
  readMatpinConversationContext: mocks.readContext,
  saveMatpinPlaces: mocks.saveMany,
  retryMatpinMessage: mocks.retry,
}));

vi.mock("@/lib/matpin/reel-analyzer", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/matpin/reel-analyzer")>();
  return {
    ...original,
    createGeminiReelAnalyzer: () => ({ mode: "gemini", analyze: mocks.analyze }),
  };
});

vi.mock("@/lib/matpin/place-resolver", () => ({ resolveMatpinPlacesWithMetrics: mocks.resolve }));
vi.mock("@/lib/matpin/instagram-send", () => ({ sendMatpinInstagramMessage: mocks.send }));
vi.mock("@/lib/matpin/backfill", () => ({ backfillMatpinConversationHistory: mocks.backfill }));

import { GET } from "@/app/api/matpin/jobs/process/route";

const job = {
  queueMessageId: 31,
  messageId: "11111111-1111-4111-8111-111111111111",
  senderHash: "a".repeat(64),
  senderScopedId: "sender-1",
  accessToken: "access-token",
  shortLinkCode: "AbCdEfGhIjKlMnOp",
  reelId: "DbTBhcZNY1b",
  reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
  attachmentType: "ig_reel" as const,
  mediaUrl: "https://video.cdninstagram.com/reel.mp4",
  replyRequired: true,
  attemptCount: 1,
};

const metrics = {
  model: "gemini-test",
  durationMs: 900,
  requestCount: 1,
  mediaBytes: 1_024,
  inputTokens: 100,
  outputTokens: 20,
  thoughtTokens: 10,
  toolUseTokens: 0,
  totalTokens: 120,
};

const resolutionMetrics = {
  provider: "google_places" as const,
  model: null,
  durationMs: 120,
  requestCount: 1,
  inputTokens: null,
  outputTokens: null,
  thoughtTokens: null,
  toolUseTokens: null,
  totalTokens: null,
  groundingQueryCount: null,
};

const candidate = {
  id: "place-1",
  name: "산장장작구이",
  area: "서울 강남구",
  category: "음식점 > 한식",
  address: "서울 강남구 테헤란로 1",
  latitude: 37.5,
  longitude: 127.01,
  mapUrl: "https://place.map.kakao.com/1",
  confidence: 0.96,
  matchReason: "영상 근거: 산장장작구이",
};

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.kr");
  vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
  mocks.claim.mockReset().mockResolvedValueOnce(job).mockResolvedValueOnce(null);
  mocks.claimCache.mockReset().mockResolvedValue({ state: "owner" });
  mocks.complete.mockReset().mockResolvedValue(undefined);
  mocks.completeCache.mockReset().mockResolvedValue(undefined);
  mocks.releaseCache.mockReset().mockResolvedValue(undefined);
  mocks.recordUsage.mockReset().mockResolvedValue(undefined);
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
  mocks.saveMany.mockReset().mockResolvedValue(1);
  mocks.retry.mockReset().mockResolvedValue("retry");
  mocks.analyze.mockReset().mockResolvedValue({
    analysis: {
      status: "resolved",
      summary: "장소를 확인했어요.",
      places: [{
        name: "산장장작구이",
        branch: null,
        menus: ["삼겹살"],
        regionHints: ["강남구"],
        confidence: 0.96,
        evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 1 }],
      }],
    },
    metrics,
  });
  mocks.backfill.mockReset().mockResolvedValue({
    conversationsScanned: 2,
    messagesScanned: 10,
    accepted: 7,
    duplicates: 3,
  });
  mocks.resolve.mockReset().mockResolvedValue({ candidates: [candidate], metrics: resolutionMetrics });
  mocks.send.mockReset().mockResolvedValue("reply-1");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function workerRequest() {
  return new Request("https://matpin.kr/api/matpin/jobs/process", {
    headers: { authorization: "Bearer cron-secret" },
  });
}

describe("Matpin worker", () => {
  it("skips conversation backfill during ordinary cron processing", async () => {
    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.backfill).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ backfill: { skipped: true } });
  });

  it("runs conversation backfill only when explicitly requested", async () => {
    const response = await GET(new Request(
      "https://matpin.kr/api/matpin/jobs/process?backfill=1",
      { headers: { authorization: "Bearer cron-secret" } },
    ));

    expect(response.status).toBe(200);
    expect(mocks.backfill).toHaveBeenCalledTimes(1);
    expect(await response.json()).toMatchObject({
      backfill: { conversationsScanned: 2, messagesScanned: 10, accepted: 7, duplicates: 3 },
    });
  });

  it("automatically saves every grounded candidate and sends the private station library link", async () => {
    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).toHaveBeenCalledWith(expect.objectContaining({
      messageId: job.messageId,
      candidates: [candidate],
      confirmationSource: "automatic_high_confidence",
    }));
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("첫 장소를 저장했습니다"),
    );
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("https://matpin.kr/s/AbCdEfGhIjKlMnOp"),
    );
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "saved",
      candidates: [candidate],
      metrics,
      replied: true,
    }));
    expect(mocks.completeCache).toHaveBeenCalledWith(expect.objectContaining({
      mediaKey: job.reelId,
      candidates: [candidate],
    }));
    expect(mocks.recordUsage).toHaveBeenNthCalledWith(1, expect.objectContaining({
      stage: "extraction",
      provider: "gemini",
      requestCount: 1,
      thoughtTokens: 10,
    }));
    expect(mocks.recordUsage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      stage: "place_resolution",
      provider: "google_places",
      requestCount: 1,
    }));
  });

  it("stores all places from a multi-place reel without asking the user to choose", async () => {
    const second = { ...candidate, id: "place-2", name: "두번째식당", confidence: 0.82 };
    mocks.resolve.mockResolvedValue({ candidates: [candidate, second], metrics: resolutionMetrics });
    mocks.saveMany.mockResolvedValue(2);
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
        savedPlaceCount: 2,
        hasSavedMedia: false,
      });

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).toHaveBeenCalledWith(expect.objectContaining({
      candidates: [candidate, second],
    }));
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("첫 장소 2곳을 저장했습니다"),
    );
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "saved",
      replied: true,
    }));
  });

  it("does not invent a save when no real place candidate is found", async () => {
    mocks.resolve.mockResolvedValue({ candidates: [], metrics: resolutionMetrics });

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      candidates: [],
      replied: true,
    }));
  });

  it("stores a historical share without sending a delayed reply", async () => {
    mocks.claim.mockReset()
      .mockResolvedValueOnce({ ...job, replyRequired: false })
      .mockResolvedValueOnce(null);

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).toHaveBeenCalledWith(expect.objectContaining({
      messageId: job.messageId,
      candidates: [candidate],
    }));
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "saved",
      replied: false,
    }));
    expect(mocks.readContext).not.toHaveBeenCalled();
  });

  it("reuses cached analysis and gives a repeat-share response", async () => {
    mocks.claimCache.mockResolvedValue({
      state: "hit",
      outcome: "resolved",
      candidates: [candidate],
    });
    mocks.readContext.mockReset()
      .mockResolvedValueOnce({
        knownUser: true,
        inboundMessageCount: 3,
        savedPlaceCount: 1,
        hasSavedMedia: true,
      })
      .mockResolvedValueOnce({
        knownUser: true,
        inboundMessageCount: 3,
        savedPlaceCount: 1,
        hasSavedMedia: true,
      });

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("이미 저장한 게시물입니다"),
    );
  });
});
