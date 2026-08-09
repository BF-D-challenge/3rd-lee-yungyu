import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import type { MatpinPlaceCandidate } from "@/lib/matpin/contract";
import { resolveMatpinPlaces } from "@/lib/matpin/place-resolver";
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
  retryMatpinMessage,
  saveMatpinPlaces,
  type MatpinMediaAnalysisCacheClaim,
} from "@/lib/matpin/store";

const CACHE_WAIT_INTERVAL_MS = 750;
const CACHE_WAIT_ATTEMPTS = 45;

const cacheMetrics = {
  model: "cache",
  durationMs: 0,
  mediaBytes: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
};

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
      candidates = await resolveMatpinPlaces(analyzed.analysis);
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
      await sendMatpinInstagramMessage(
        job.senderScopedId,
        candidates.length === 1
          ? `게시물에서 찾은 장소를 가까운 역 보관함에 저장했어요.\n${candidates[0].name}\n${mapUrl}`
          : `게시물에서 찾은 ${candidates.length}곳을 가까운 역별 보관함에 저장했어요.\n${mapUrl}`,
      );
      await completeMatpinAnalysis({
        messageId: job.messageId,
        queueMessageId: job.queueMessageId,
        status: "saved",
        candidates,
        metrics,
        replied: true,
      });
      return { state: "saved" as const, messageId: job.messageId };
    }

    await sendMatpinInstagramMessage(
      job.senderScopedId,
      "게시물에서 식당 이름을 확인하지 못했어요. 식당 이름이나 지역이 보이는 다른 공개 게시물을 보내주세요.",
    );
    await completeMatpinAnalysis({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      status: "failed",
      candidates: [],
      metrics,
      replied: true,
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
        await sendMatpinInstagramMessage(
          job.senderScopedId,
          "이 게시물은 아직 자동으로 분석할 수 없어요. 다른 공개 맛집 게시물을 보내주세요.",
        );
        await completeMatpinAnalysis({
          messageId: job.messageId,
          queueMessageId: job.queueMessageId,
          status: "failed",
          candidates: [],
          metrics: null,
          replied: true,
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
