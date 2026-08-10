import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  analyze: vi.fn(),
  backfill: vi.fn(),
  claim: vi.fn(),
  claimCache: vi.fn(),
  completeCache: vi.fn(),
  completeV2: vi.fn(),
  processCycle: vi.fn(),
  readContext: vi.fn(),
  recordUsage: vi.fn(),
  releaseCache: vi.fn(),
  resolve: vi.fn(),
  retry: vi.fn(),
  send: vi.fn(),
  stage: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: mocks.after };
});

vi.mock("@/lib/matpin/store", () => ({
  claimMatpinMediaAnalysis: mocks.claimCache,
  claimNextMatpinMessage: mocks.claim,
  completeMatpinAnalysisV2: mocks.completeV2,
  completeMatpinMediaAnalysis: mocks.completeCache,
  readMatpinConversationContext: mocks.readContext,
  recordMatpinUsageEvent: mocks.recordUsage,
  releaseMatpinMediaAnalysis: mocks.releaseCache,
  retryMatpinMessage: mocks.retry,
  stageMatpinPlaces: mocks.stage,
}));

vi.mock("@/lib/matpin/reel-analyzer", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/matpin/reel-analyzer")>();
  return {
    ...original,
    createGeminiReelAnalyzer: () => ({ mode: "gemini", analyze: mocks.analyze }),
  };
});

vi.mock("@/lib/matpin/place-resolver", () => ({
  resolveMatpinPlacesWithMetrics: mocks.resolve,
}));
vi.mock("@/lib/matpin/instagram-send", () => ({
  sendMatpinInstagramMessage: mocks.send,
}));
vi.mock("@/lib/matpin/backfill", () => ({
  backfillMatpinConversationHistory: mocks.backfill,
}));
vi.mock("@/lib/matpin/work-cycle", () => ({
  MATPIN_WORK_LIVENESS: {
    vercelCron: "daily_fallback",
    releaseGate: "supabase_poller_required",
    pollIntervalSeconds: { min: 30, max: 60 },
  },
  processMatpinWorkCycle: mocks.processCycle,
}));

import { GET, POST } from "@/app/api/matpin/jobs/process/route";
import { createMatpinWorkerDeadline } from "@/lib/matpin/deadline";
import { MatpinAnalysisError } from "@/lib/matpin/reel-analyzer";
import { decryptMatpinValue } from "@/lib/matpin/security";
import { processMatpinQueue } from "@/lib/matpin/worker";

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
  outboundGeneration: 2,
  analysisClaimToken: "33333333-3333-4333-8333-333333333333",
  poisoned: false,
  terminalFailureRequired: false,
};
const cacheClaimToken = "55555555-5555-4555-8555-555555555555";

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

function defaultCycle() {
  return {
    liveness: {
      vercelCron: "daily_fallback",
      releaseGate: "supabase_poller_required",
      pollIntervalSeconds: { min: 30, max: 60 },
    },
    outboundBefore: { results: [] },
    analysis: { results: [{ state: "empty" }] },
    outboundAfter: { results: [], skipped: true },
  };
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.stubEnv("MATPIN_PUBLIC_APP_URL", "https://matpin.kr");
  vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "live");
  vi.stubEnv("MATPIN_DATA_SECRET", "data-secret-that-is-at-least-32-characters-long");
  mocks.after.mockReset();
  mocks.claim.mockReset().mockResolvedValue(job);
  mocks.claimCache.mockReset().mockResolvedValue({
    state: "owner",
    claimToken: cacheClaimToken,
  });
  mocks.completeCache.mockReset().mockResolvedValue(undefined);
  mocks.completeV2.mockReset().mockResolvedValue({
    completed: true,
    outboundId: "22222222-2222-4222-8222-222222222222",
    deliveryState: "pending",
  });
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
  mocks.retry.mockReset().mockResolvedValue("retry");
  mocks.stage.mockReset().mockResolvedValue(1);
  mocks.send.mockReset();
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
  mocks.resolve.mockReset().mockResolvedValue({
    candidates: [candidate],
    metrics: resolutionMetrics,
  });
  mocks.processCycle.mockReset().mockResolvedValue(defaultCycle());
  mocks.backfill.mockReset().mockResolvedValue({
    conversations: 2,
    scanned: 10,
    eligible: 7,
    accepted: 6,
    duplicates: 1,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function workerRequest(path = "") {
  return new Request(`https://matpin.kr/api/matpin/jobs/process${path}`, {
    headers: { authorization: "Bearer cron-secret" },
  });
}

describe("Matpin analysis worker", () => {
  it("atomically saves the business result and queues an encrypted final outbox", async () => {
    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: job.messageId,
    }]);

    expect(mocks.stage).toHaveBeenCalledWith(expect.objectContaining({
      messageId: job.messageId,
      candidates: [candidate],
      signal: expect.any(AbortSignal),
    }));
    const completed = mocks.completeV2.mock.calls[0][0];
    expect(completed).toMatchObject({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      analysisClaimToken: job.analysisClaimToken,
      status: "saved",
      candidates: [candidate],
      finalOutbound: {
        dedupHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        senderHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        recipientCiphertext: expect.not.stringContaining(job.senderScopedId),
        bodyCiphertext: expect.not.stringContaining("첫 장소"),
      },
      signal: expect.any(AbortSignal),
    });
    expect(decryptMatpinValue(completed.finalOutbound.recipientCiphertext)).toBe(job.senderScopedId);
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain("첫 장소를 저장했습니다");
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain(
      "https://matpin.kr/s/AbCdEfGhIjKlMnOp",
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("queues a failed final reply when no grounded place exists", async () => {
    mocks.resolve.mockResolvedValue({ candidates: [], metrics: resolutionMetrics });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId: job.messageId,
    }]);

    const completed = mocks.completeV2.mock.calls[0][0];
    expect(completed).toMatchObject({ status: "failed", candidates: [] });
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain("장소를 찾지 못했습니다");
    expect(mocks.retry).not.toHaveBeenCalled();
  });

  it("queues an unsupported final reply without retrying the analysis", async () => {
    mocks.analyze.mockRejectedValue(new MatpinAnalysisError("unsupported_media", false));

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId: job.messageId,
      code: "unsupported_media",
    }]);

    const completed = mocks.completeV2.mock.calls[0][0];
    expect(completed).toMatchObject({ status: "failed", metrics: null });
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain(
      "아직 자동으로 확인하기 어렵습니다",
    );
    expect(mocks.retry).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not create an outbound delivery for historical no-reply backfill", async () => {
    mocks.claim.mockResolvedValue({ ...job, replyRequired: false });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "saved",
      messageId: job.messageId,
    }]);

    expect(mocks.completeV2).toHaveBeenCalledWith(expect.objectContaining({
      finalOutbound: null,
    }));
    expect(mocks.readContext).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("retries only when the atomic completion and outbox insert fails", async () => {
    mocks.completeV2.mockRejectedValueOnce(new Error("matpin_complete_v2_failed:database_unavailable"));

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "retry",
      messageId: job.messageId,
      code: "matpin_complete_v2_failed",
    }]);

    expect(mocks.retry).toHaveBeenCalledWith(expect.objectContaining({
      messageId: job.messageId,
      analysisClaimToken: job.analysisClaimToken,
      error: "matpin_complete_v2_failed",
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("atomically queues a generic final failure before analysis after attempt two", async () => {
    mocks.claim.mockResolvedValue({
      ...job,
      attemptCount: 2,
      terminalFailureRequired: true,
      accessToken: "",
      shortLinkCode: "",
      mediaUrl: "",
    });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId: job.messageId,
      code: "analysis_attempts_exhausted",
    }]);

    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.claimCache).not.toHaveBeenCalled();
    expect(mocks.retry).not.toHaveBeenCalled();
    const completed = mocks.completeV2.mock.calls[0][0];
    expect(completed).toMatchObject({
      analysisClaimToken: job.analysisClaimToken,
      status: "failed",
      candidates: [],
      metrics: null,
    });
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain(
      "같은 게시물을 다시 보내주세요",
    );
  });

  it("turns retry-v2 complete-required into the same atomic final failure", async () => {
    mocks.analyze.mockRejectedValue(new MatpinAnalysisError("gemini_upstream", true));
    mocks.retry.mockResolvedValue("complete_failed_required");

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId: job.messageId,
      code: "gemini_upstream",
    }]);

    expect(mocks.retry).toHaveBeenCalledWith(expect.objectContaining({
      analysisClaimToken: job.analysisClaimToken,
    }));
    expect(mocks.completeV2).toHaveBeenCalledWith(expect.objectContaining({
      analysisClaimToken: job.analysisClaimToken,
      status: "failed",
    }));
  });

  it("completes a poisoned claim without running analysis or retry RPC", async () => {
    mocks.claim.mockResolvedValue({
      ...job,
      attemptCount: 10,
      poisoned: true,
      terminalFailureRequired: true,
      accessToken: "",
      shortLinkCode: "",
      mediaUrl: "",
    });

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "failed",
      messageId: job.messageId,
      code: "analysis_attempts_exhausted",
    }]);

    expect(mocks.analyze).not.toHaveBeenCalled();
    expect(mocks.claimCache).not.toHaveBeenCalled();
    expect(mocks.retry).not.toHaveBeenCalled();
    const completed = mocks.completeV2.mock.calls[0][0];
    expect(completed).toMatchObject({
      analysisClaimToken: job.analysisClaimToken,
      status: "failed",
      candidates: [],
    });
    expect(decryptMatpinValue(completed.finalOutbound.bodyCiphertext)).toContain(
      "같은 게시물을 다시 보내주세요",
    );
  });

  it("leaves an exhausted claim for lease recovery when terminal completion fails", async () => {
    mocks.claim.mockResolvedValue({
      ...job,
      attemptCount: 2,
      terminalFailureRequired: true,
      accessToken: "",
      shortLinkCode: "",
      mediaUrl: "",
    });
    mocks.completeV2.mockRejectedValue(new Error("matpin_complete_v2_failed:database_unavailable"));

    await expect(processMatpinQueue(1)).resolves.toEqual([{
      state: "lease_recovery",
      messageId: job.messageId,
      code: "matpin_complete_v2_failed",
    }]);
    expect(mocks.retry).not.toHaveBeenCalled();
  });

  it("passes one shared deadline budget through every worker-facing store call", async () => {
    await processMatpinQueue(1);

    expect(mocks.claim).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(mocks.claimCache).toHaveBeenCalledWith(job.reelId, {
      signal: expect.any(AbortSignal),
    });
    expect(mocks.readContext).toHaveBeenCalledWith(expect.any(Object), {
      signal: expect.any(AbortSignal),
    });
    expect(mocks.recordUsage).toHaveBeenCalledWith(expect.any(Object), {
      signal: expect.any(AbortSignal),
    });
    expect(mocks.completeCache).toHaveBeenCalledWith(expect.objectContaining({
      claimToken: cacheClaimToken,
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.stage).toHaveBeenCalledWith(expect.objectContaining({
      analysisClaimToken: job.analysisClaimToken,
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.completeV2).toHaveBeenCalledWith(expect.objectContaining({
      analysisClaimToken: job.analysisClaimToken,
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.analyze.mock.calls[0][0].deadline)
      .toBe(mocks.resolve.mock.calls[0][1].deadline);
  });

  it("uses the 15 second reserve for bounded release and retry after 240 seconds", async () => {
    let now = 0;
    const deadline = createMatpinWorkerDeadline({ now: () => now });
    mocks.analyze.mockImplementationOnce(async () => {
      now = 241_000;
      return {
        analysis: { status: "resolved", summary: "확인", places: [] },
        metrics,
      };
    });

    await expect(processMatpinQueue(1, { deadline })).resolves.toEqual([{
      state: "retry",
      messageId: job.messageId,
      code: "worker_deadline_exceeded",
    }]);

    expect(mocks.resolve).not.toHaveBeenCalled();
    expect(mocks.releaseCache).toHaveBeenCalledWith(job.reelId, cacheClaimToken, {
      signal: expect.any(AbortSignal),
    });
    expect(mocks.retry).toHaveBeenCalledWith(expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it("leaves recovery to the queue lease when the full 255 seconds are gone", async () => {
    let now = 0;
    const deadline = createMatpinWorkerDeadline({ now: () => now });
    mocks.analyze.mockImplementationOnce(async () => {
      now = 255_001;
      throw new Error("late_failure");
    });

    await expect(processMatpinQueue(1, { deadline })).resolves.toEqual([{
      state: "lease_recovery",
      messageId: job.messageId,
      code: "late_failure",
    }]);
    expect(mocks.releaseCache).not.toHaveBeenCalled();
    expect(mocks.retry).not.toHaveBeenCalled();
  });
});

describe("Matpin jobs route", () => {
  it("runs one shared work cycle and exposes the external poller release gate", async () => {
    const response = await GET(workerRequest());

    expect(response.status).toBe(200);
    expect(mocks.processCycle).toHaveBeenCalledTimes(1);
    expect(mocks.processCycle).toHaveBeenCalledWith({ deadline: expect.any(Object) });
    expect(mocks.backfill).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({
      cycle: {
        liveness: {
          vercelCron: "daily_fallback",
          releaseGate: "supabase_poller_required",
          pollIntervalSeconds: { min: 30, max: 60 },
        },
        analysis: { results: [{ state: "empty" }] },
      },
      processed: [{ state: "empty" }],
      backfill: { skipped: true },
    });
  });

  it("runs the ordinary cycle before bounded backfill with a shared signal", async () => {
    const response = await GET(workerRequest("?backfill=1"));

    expect(response.status).toBe(200);
    expect(mocks.processCycle.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.backfill.mock.invocationCallOrder[0]);
    expect(mocks.backfill).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(await response.json()).toMatchObject({
      backfill: { conversations: 2, scanned: 10, accepted: 6, duplicates: 1 },
    });
  });

  it("rejects an unauthorized poller kick before registering background work", async () => {
    const response = await POST(new Request(
      "https://matpin.kr/api/matpin/jobs/process",
      { method: "POST" },
    ));

    expect(response.status).toBe(401);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.processCycle).not.toHaveBeenCalled();
  });

  it("rejects poller kicks while the pipeline is not live", async () => {
    vi.stubEnv("MATPIN_INSTAGRAM_PIPELINE_MODE", "maintenance");
    const response = await POST(new Request(
      "https://matpin.kr/api/matpin/jobs/process",
      {
        method: "POST",
        headers: { authorization: "Bearer cron-secret" },
      },
    ));

    expect(response.status).toBe(409);
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("accepts a poller kick immediately and runs the promised cycle without request signal", async () => {
    const response = await POST(new Request(
      "https://matpin.kr/api/matpin/jobs/process?backfill=1",
      {
        method: "POST",
        headers: { authorization: "Bearer cron-secret" },
      },
    ));

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      ok: true,
      accepted: true,
      completed: false,
      mode: "asynchronous_poller_kick",
      liveness: {
        vercelCron: "daily_fallback",
        releaseGate: "supabase_poller_required",
        pollIntervalSeconds: { min: 30, max: 60 },
      },
    });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.processCycle).not.toHaveBeenCalled();
    expect(mocks.backfill).not.toHaveBeenCalled();

    const promisedWork = mocks.after.mock.calls[0][0] as () => Promise<void>;
    await promisedWork();
    expect(mocks.processCycle).toHaveBeenCalledWith();
    expect(mocks.backfill).not.toHaveBeenCalled();
  });
});
