import type { MatpinPlaceCandidate } from "@/lib/matpin/contract";
import {
  buildMatpinNoPlaceReply,
  buildMatpinSavedReply,
  buildMatpinUnsupportedMediaReply,
  getMatpinMediaKind,
} from "@/lib/matpin/conversation-copy";
import {
  createMatpinWorkerDeadline,
  MatpinDeadlineExceededError,
  type MatpinDeadline,
} from "@/lib/matpin/deadline";
import { resolveMatpinPlacesWithMetrics } from "@/lib/matpin/place-resolver";
import {
  createGeminiReelAnalyzer,
  MatpinAnalysisError,
  type MatpinAnalysisResult,
} from "@/lib/matpin/reel-analyzer";
import {
  encryptMatpinValue,
  hashMatpinOutboundDedup,
  hashMatpinOutboundSender,
} from "@/lib/matpin/security";
import {
  claimMatpinMediaAnalysis,
  claimNextMatpinMessage,
  completeMatpinAnalysisV2,
  completeMatpinMediaAnalysis,
  readMatpinConversationContext,
  recordMatpinUsageEvent,
  releaseMatpinMediaAnalysis,
  retryMatpinMessage,
  stageMatpinPlaces,
  type MatpinClaimedJob,
  type MatpinMediaAnalysisCacheClaim,
} from "@/lib/matpin/store";

const CACHE_WAIT_INTERVAL_MS = 750;
const CACHE_WAIT_ATTEMPTS = 45;
const MIN_DATABASE_STAGE_MS = 1_000;
const DATABASE_STAGE_TIMEOUT_MS = 10_000;
const CLEANUP_DATABASE_TIMEOUT_MS = 5_000;

const cacheMetrics = {
  model: "cache",
  durationMs: 0,
  requestCount: 0,
  mediaBytes: 0,
  inputTokens: 0,
  outputTokens: 0,
  thoughtTokens: 0,
  toolUseTokens: 0,
  totalTokens: 0,
};

function databaseSignal(deadline: MatpinDeadline): AbortSignal {
  deadline.throwIfInsufficient(MIN_DATABASE_STAGE_MS);
  return deadline.signalFor(DATABASE_STAGE_TIMEOUT_MS);
}

function cleanupSignal(deadline: MatpinDeadline): AbortSignal | null {
  if (deadline.signal.aborted || deadline.remainingMs() < 1) return null;
  try {
    return deadline.signalFor(CLEANUP_DATABASE_TIMEOUT_MS, 0);
  } catch {
    return null;
  }
}

async function recordUsageSafely(
  input: Parameters<typeof recordMatpinUsageEvent>[0],
  deadline: MatpinDeadline,
) {
  if (!deadline.canStart(MIN_DATABASE_STAGE_MS)) return;
  try {
    await recordMatpinUsageEvent(input, { signal: databaseSignal(deadline) });
  } catch {
    console.warn("[matpin:usage] record_failed");
  }
}

function publicUrl(path: string): string {
  const origin = process.env.MATPIN_PUBLIC_APP_URL?.trim();
  if (!origin) throw new Error("matpin_public_url_not_configured");
  return new URL(path, origin).toString();
}

function finalOutbound(job: MatpinClaimedJob, text: string) {
  if (!job.replyRequired) return null;
  return {
    dedupHash: hashMatpinOutboundDedup(
      "final",
      `${job.messageId}:${job.outboundGeneration}`,
    ),
    senderHash: hashMatpinOutboundSender(job.senderScopedId),
    recipientCiphertext: encryptMatpinValue(job.senderScopedId),
    bodyCiphertext: encryptMatpinValue(text),
  };
}

function buildMatpinAnalysisFailedReply(): string {
  return [
    "게시물 저장을 완료하지 못했습니다.",
    "잠시 후 같은 게시물을 다시 보내주세요.",
  ].join("\n");
}

async function completeBusinessState(input: {
  job: MatpinClaimedJob;
  status: "saved" | "failed";
  candidates: MatpinPlaceCandidate[];
  metrics: MatpinAnalysisResult["metrics"] | null;
  replyText: string;
  deadline: MatpinDeadline;
}) {
  return completeMatpinAnalysisV2({
    messageId: input.job.messageId,
    queueMessageId: input.job.queueMessageId,
    analysisClaimToken: input.job.analysisClaimToken,
    status: input.status,
    candidates: input.candidates,
    metrics: input.metrics,
    finalOutbound: finalOutbound(input.job, input.replyText),
    signal: databaseSignal(input.deadline),
  });
}

function workerErrorCode(error: unknown): string {
  if (error instanceof MatpinAnalysisError || error instanceof MatpinDeadlineExceededError) {
    return error.code;
  }
  if (!(error instanceof Error)) return "unknown_worker_error";
  const code = error.message.split(":", 1)[0]?.trim();
  return code && /^[a-z0-9_]{1,120}$/i.test(code) ? code : "unknown_worker_error";
}

async function retryOrLeaveForLeaseRecovery(
  job: MatpinClaimedJob,
  error: unknown,
  deadline: MatpinDeadline,
) {
  const code = workerErrorCode(error);
  if (job.terminalFailureRequired) {
    return { state: "lease_recovery" as const, messageId: job.messageId, code };
  }
  const signal = cleanupSignal(deadline);
  if (!signal) {
    return { state: "lease_recovery" as const, messageId: job.messageId, code };
  }
  try {
    const state = await retryMatpinMessage({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      analysisClaimToken: job.analysisClaimToken,
      error: code,
      signal,
    });
    if (state === "retry") return { state, messageId: job.messageId, code };
    if (!deadline.canStart(MIN_DATABASE_STAGE_MS)) {
      return { state: "lease_recovery" as const, messageId: job.messageId, code };
    }
    try {
      await completeBusinessState({
        job,
        status: "failed",
        candidates: [],
        metrics: null,
        replyText: buildMatpinAnalysisFailedReply(),
        deadline,
      });
      return { state: "failed" as const, messageId: job.messageId, code };
    } catch (completionError) {
      return {
        state: "lease_recovery" as const,
        messageId: job.messageId,
        code: workerErrorCode(completionError),
      };
    }
  } catch {
    return { state: "lease_recovery" as const, messageId: job.messageId, code };
  }
}

async function processOneMatpinMessage(deadline: MatpinDeadline) {
  const job = await claimNextMatpinMessage({ signal: databaseSignal(deadline) });
  if (!job) return { state: "empty" as const };

  if (job.terminalFailureRequired) {
    try {
      await completeBusinessState({
        job,
        status: "failed",
        candidates: [],
        metrics: null,
        replyText: buildMatpinAnalysisFailedReply(),
        deadline,
      });
      return {
        state: "failed" as const,
        messageId: job.messageId,
        code: "analysis_attempts_exhausted",
      };
    } catch (error) {
      return {
        state: "lease_recovery" as const,
        messageId: job.messageId,
        code: workerErrorCode(error),
      };
    }
  }

  let cacheClaimToken: string | null = null;

  try {
    const mediaKind = getMatpinMediaKind(job);
    const initialContext = job.replyRequired
      ? await readMatpinConversationContext({
          senderScopedId: job.senderScopedId,
          reelId: job.reelId,
        }, { signal: databaseSignal(deadline) })
      : null;
    let cacheClaim: MatpinMediaAnalysisCacheClaim = await claimMatpinMediaAnalysis(
      job.reelId,
      { signal: databaseSignal(deadline) },
    );
    for (
      let attempt = 0;
      cacheClaim.state === "pending" && attempt < CACHE_WAIT_ATTEMPTS;
      attempt += 1
    ) {
      await deadline.sleep(CACHE_WAIT_INTERVAL_MS);
      cacheClaim = await claimMatpinMediaAnalysis(
        job.reelId,
        { signal: databaseSignal(deadline) },
      );
    }

    if (cacheClaim.state === "pending") {
      throw new MatpinAnalysisError("analysis_cache_busy", true);
    }

    cacheClaimToken = cacheClaim.state === "owner" ? cacheClaim.claimToken : null;
    let candidates: MatpinPlaceCandidate[];
    let metrics: MatpinAnalysisResult["metrics"];
    if (cacheClaim.state === "hit") {
      candidates = cacheClaim.candidates;
      metrics = cacheMetrics;
    } else {
      deadline.throwIfInsufficient(MIN_DATABASE_STAGE_MS);
      const analyzed = await createGeminiReelAnalyzer().analyze({
        mediaUrl: job.mediaUrl,
        reelId: job.reelId,
        deadline,
      });
      await recordUsageSafely({
        messageId: job.messageId,
        stage: "extraction",
        provider: "gemini",
        model: analyzed.metrics.model,
        outcome: "success",
        requestCount: analyzed.metrics.requestCount,
        inputTokens: analyzed.metrics.inputTokens,
        outputTokens: analyzed.metrics.outputTokens,
        thoughtTokens: analyzed.metrics.thoughtTokens,
        toolUseTokens: analyzed.metrics.toolUseTokens,
        totalTokens: analyzed.metrics.totalTokens,
        groundingQueryCount: null,
        durationMs: analyzed.metrics.durationMs,
      }, deadline);
      deadline.throwIfInsufficient(MIN_DATABASE_STAGE_MS);
      const resolved = await resolveMatpinPlacesWithMetrics(analyzed.analysis, { deadline });
      candidates = resolved.candidates;
      await recordUsageSafely({
        messageId: job.messageId,
        stage: "place_resolution",
        provider: resolved.metrics.provider,
        model: resolved.metrics.model,
        outcome: "success",
        requestCount: resolved.metrics.requestCount,
        inputTokens: resolved.metrics.inputTokens,
        outputTokens: resolved.metrics.outputTokens,
        thoughtTokens: resolved.metrics.thoughtTokens,
        toolUseTokens: resolved.metrics.toolUseTokens,
        totalTokens: resolved.metrics.totalTokens,
        groundingQueryCount: resolved.metrics.groundingQueryCount,
        durationMs: resolved.metrics.durationMs,
      }, deadline);
      metrics = analyzed.metrics;
      await completeMatpinMediaAnalysis({
        mediaKey: job.reelId,
        claimToken: cacheClaim.claimToken,
        outcome: candidates.length > 0 ? "resolved" : "insufficient",
        candidates,
        metrics,
        signal: databaseSignal(deadline),
      });
      cacheClaimToken = null;
    }

    if (candidates.length > 0) {
      await stageMatpinPlaces({
        messageId: job.messageId,
        senderHash: job.senderHash,
        analysisClaimToken: job.analysisClaimToken,
        candidates,
        confirmationSource: "automatic_high_confidence",
        signal: databaseSignal(deadline),
      });

      let replyText = "";
      if (job.replyRequired) {
        const finalContext = await readMatpinConversationContext({
          senderScopedId: job.senderScopedId,
          reelId: job.reelId,
        }, { signal: databaseSignal(deadline) });
        replyText = buildMatpinSavedReply({
          candidates,
          totalSavedPlaceCount: finalContext.savedPlaceCount,
          isFirstSavedPlace: (initialContext?.savedPlaceCount ?? 0) === 0,
          alreadySavedMedia: initialContext?.hasSavedMedia ?? false,
          mapUrl: publicUrl(`/s/${job.shortLinkCode}`),
        });
      }
      await completeBusinessState({
        job,
        status: "saved",
        candidates,
        metrics,
        replyText,
        deadline,
      });
      return { state: "saved" as const, messageId: job.messageId };
    }

    await completeBusinessState({
      job,
      status: "failed",
      candidates: [],
      metrics,
      replyText: buildMatpinNoPlaceReply(mediaKind),
      deadline,
    });
    return { state: "failed" as const, messageId: job.messageId };
  } catch (error) {
    if (cacheClaimToken) {
      const signal = cleanupSignal(deadline);
      if (signal) {
        try {
          await releaseMatpinMediaAnalysis(job.reelId, cacheClaimToken, { signal });
        } catch {
          // 만료된 분석 임대가 다음 요청에서 회수되도록 둔다.
        }
      }
    }

    const retryable = !(error instanceof MatpinAnalysisError) || error.retryable;
    const exhausted = job.attemptCount >= 2;
    if ((exhausted || !retryable) && deadline.canStart(MIN_DATABASE_STAGE_MS)) {
      try {
        await completeBusinessState({
          job,
          status: "failed",
          candidates: [],
          metrics: null,
          replyText: exhausted
            ? buildMatpinAnalysisFailedReply()
            : buildMatpinUnsupportedMediaReply(getMatpinMediaKind(job)),
          deadline,
        });
        return {
          state: "failed" as const,
          messageId: job.messageId,
          code: workerErrorCode(error),
        };
      } catch (completionError) {
        if (exhausted) {
          return {
            state: "lease_recovery" as const,
            messageId: job.messageId,
            code: workerErrorCode(completionError),
          };
        }
        return retryOrLeaveForLeaseRecovery(job, completionError, deadline);
      }
    }
    return retryOrLeaveForLeaseRecovery(job, error, deadline);
  }
}

export async function processMatpinQueue(
  limit = 1,
  options: { deadline?: MatpinDeadline } = {},
) {
  const processed = [];
  const deadline = options.deadline ?? createMatpinWorkerDeadline();
  const requested = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  for (let index = 0; index < requested; index += 1) {
    if (!deadline.canStart(MIN_DATABASE_STAGE_MS)) break;
    const result = await processOneMatpinMessage(deadline);
    processed.push(result);
  }
  return processed;
}
