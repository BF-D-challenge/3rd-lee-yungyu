import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  complete: vi.fn(),
  saveMany: vi.fn(),
  retry: vi.fn(),
  analyze: vi.fn(),
  resolve: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/matpin/store", () => ({
  claimNextMatpinMessage: mocks.claim,
  completeMatpinAnalysis: mocks.complete,
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

vi.mock("@/lib/matpin/place-resolver", () => ({ resolveMatpinPlaces: mocks.resolve }));
vi.mock("@/lib/matpin/instagram-send", () => ({ sendMatpinInstagramMessage: mocks.send }));

import { GET } from "@/app/api/matpin/jobs/process/route";

const job = {
  queueMessageId: 31,
  messageId: "11111111-1111-4111-8111-111111111111",
  senderHash: "a".repeat(64),
  senderScopedId: "sender-1",
  accessToken: "access-token",
  reelId: "DbTBhcZNY1b",
  reelUrl: "https://www.instagram.com/reel/DbTBhcZNY1b/",
  attachmentType: "ig_reel" as const,
  mediaUrl: "https://video.cdninstagram.com/reel.mp4",
  attemptCount: 1,
};

const metrics = {
  model: "gemini-test",
  durationMs: 900,
  mediaBytes: 1_024,
  inputTokens: 100,
  outputTokens: 20,
  totalTokens: 120,
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
  mocks.complete.mockReset().mockResolvedValue(undefined);
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
  mocks.resolve.mockReset().mockResolvedValue([candidate]);
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
      expect.stringContaining("https://matpin.kr/matpin/saved#token=access-token"),
    );
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "saved",
      candidates: [candidate],
      metrics,
      replied: true,
    }));
  });

  it("stores all places from a multi-place reel without asking the user to choose", async () => {
    const second = { ...candidate, id: "place-2", name: "두번째식당", confidence: 0.82 };
    mocks.resolve.mockResolvedValue([candidate, second]);
    mocks.saveMany.mockResolvedValue(2);

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).toHaveBeenCalledWith(expect.objectContaining({
      candidates: [candidate, second],
    }));
    expect(mocks.send).toHaveBeenCalledWith(
      "sender-1",
      expect.stringContaining("찾은 2곳을 가까운 역별 보관함에 저장했어요"),
    );
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "saved",
      replied: true,
    }));
  });

  it("does not invent a save when no real place candidate is found", async () => {
    mocks.resolve.mockResolvedValue([]);

    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.saveMany).not.toHaveBeenCalled();
    expect(mocks.complete).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      candidates: [],
      replied: true,
    }));
  });
});
