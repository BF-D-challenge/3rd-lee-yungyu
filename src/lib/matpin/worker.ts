import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import type { MatpinPlaceCandidate } from "@/lib/matpin/contract";
import {
  buildMatpinNoPlaceReply,
  buildMatpinSavedReply,
  buildMatpinUnsupportedMediaReply,
  getMatpinMediaKind,
} from "@/lib/matpin/conversation-copy";
import { resolveMatpinPlacesWithMetrics } from "@/lib/matpin/place-resolver";
import {
  createGeminiReelAnalyzer,
  MatpinAnalysisError,
  type MatpinAnalysisResult,
} from "@/lib/matpin/reel-analyzer";
import {
  claimMatpinMediaAnalysis,
  claimNextMatpinMessage,
  completeMatpinAnalysis,
  completeMatpinMediaAnalysis,
  releaseMatpinMediaAnalysis,
  recordMatpinUsageEvent,
  readMatpinConversationContext,
  retryMatpinMessage,
  saveMatpinPlaces,
  type MatpinMediaAnalysisCacheClaim,
} from "@/lib/matpin/store";

const CACHE_WAIT_INTERVAL_MS = 750;
const CACHE_WAIT_ATTEMPTS = 45;

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

async function recordUsageSafely(input: Parameters<typeof recordMatpinUsageEvent>[0]) {
  try {
    await recordMatpinUsageEvent(input);
  } catch {
    console.warn("[matpin:usage] record_failed");
  }
}

function publicUrl(path: string): string {
  const origin = process.env.MATPIN_PUBLIC_APP_URL?.trim();
  if (!origin) throw new Error("matpin_public_url_not_configured");
  return new URL(path, origin).toString();
}

async function processOneMatpinMessage() {
  const job = await claimNextMatpinMessage();
  if (!job) return { state: "empty" as const };

  let ownsCache = false;

  try {
    const mediaKind = getMatpinMediaKind(job);
    const initialContext = job.replyRequired
      ? await readMatpinConversationContext({
          senderScopedId: job.senderScopedId,
          reelId: job.reelId,
        })
      : null;
    let cacheClaim: MatpinMediaAnalysisCacheClaim = await claimMatpinMediaAnalysis(job.reelId);
    for (let attempt = 0; cacheClaim.state === "pending" && attempt < CACHE_WAIT_ATTEMPTS; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, CACHE_WAIT_INTERVAL_MS));
      cacheClaim = await claimMatpinMediaAnalysis(job.reelId);
    }

    if (cacheClaim.state === "pending") {
      throw new MatpinAnalysisError("analysis_cache_busy", true);
    }

    ownsCache = cacheClaim.state === "owner";
    let candidates: MatpinPlaceCandidate[];
    let metrics: MatpinAnalysisResult["metrics"];
    if (cacheClaim.state === "hit") {
      candidates = cacheClaim.candidates;
      metrics = cacheMetrics;
    } else {
      const analyzed = await createGeminiReelAnalyzer().analyze({
        mediaUrl: job.mediaUrl,
        reelId: job.reelId,
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
      });
      const resolved = await resolveMatpinPlacesWithMetrics(analyzed.analysis);
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
      });
      metrics = analyzed.metrics;
      await completeMatpinMediaAnalysis({
        mediaKey: job.reelId,
        outcome: candidates.length > 0 ? "resolved" : "insufficient",
        candidates,
        metrics,
      });
      ownsCache = false;
    }

    if (candidates.length > 0) {
      await saveMatpinPlaces({
        messageId: job.messageId,
        senderHash: job.senderHash,
        candidates,
        confirmationSource: "automatic_high_confidence",
      });
      const mapUrl = publicUrl(`/s/${job.shortLinkCode}`);
      if (job.replyRequired) {
        const finalContext = await readMatpinConversationContext({
          senderScopedId: job.senderScopedId,
          reelId: job.reelId,
        });
        await sendMatpinInstagramMessage(
          job.senderScopedId,
          buildMatpinSavedReply({
            candidates,
            totalSavedPlaceCount: finalContext.savedPlaceCount,
            isFirstSavedPlace: (initialContext?.savedPlaceCount ?? 0) === 0,
            alreadySavedMedia: initialContext?.hasSavedMedia ?? false,
            mapUrl,
          }),
        );
      }
      await completeMatpinAnalysis({
        messageId: job.messageId,
        queueMessageId: job.queueMessageId,
        status: "saved",
        candidates,
        metrics,
        replied: job.replyRequired,
      });
      return { state: "saved" as const, messageId: job.messageId };
    }

    if (job.replyRequired) {
      await sendMatpinInstagramMessage(
        job.senderScopedId,
        buildMatpinNoPlaceReply(mediaKind),
      );
    }
    await completeMatpinAnalysis({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      status: "failed",
      candidates: [],
      metrics,
      replied: job.replyRequired,
    });
    return { state: "failed" as const, messageId: job.messageId };
  } catch (error) {
    if (ownsCache) {
      try {
        await releaseMatpinMediaAnalysis(job.reelId);
      } catch {
        // 만료된 분석 임대가 다음 요청에서 회수되도록 둔다.
      }
    }
    const code = error instanceof MatpinAnalysisError
      ? error.code
      : error instanceof Error
        ? error.message
        : "unknown_worker_error";
    const retryable = !(error instanceof MatpinAnalysisError) || error.retryable;
    if (!retryable) {
      try {
        if (job.replyRequired) {
          await sendMatpinInstagramMessage(
            job.senderScopedId,
            buildMatpinUnsupportedMediaReply(getMatpinMediaKind(job)),
          );
        }
        await completeMatpinAnalysis({
          messageId: job.messageId,
          queueMessageId: job.queueMessageId,
          status: "failed",
          candidates: [],
          metrics: null,
          replied: job.replyRequired,
        });
        return { state: "failed" as const, messageId: job.messageId, code };
      } catch {
        // 답장 실패는 아래의 제한된 재시도 경로로 넘긴다.
      }
    }
    const state = await retryMatpinMessage({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      error: code,
    });
    throw new Error(`matpin_worker_${state}:${code}`);
  }
}

export async function processMatpinQueue(limit = 3) {
  const processed = [];
  for (let index = 0; index < limit; index += 1) {
    const result = await processOneMatpinMessage();
    processed.push(result);
    if (result.state === "empty") break;
  }
  return processed;
}
