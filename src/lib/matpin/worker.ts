import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import { resolveMatpinPlaces } from "@/lib/matpin/place-resolver";
import { createGeminiReelAnalyzer, MatpinAnalysisError } from "@/lib/matpin/reel-analyzer";
import {
  claimNextMatpinMessage,
  completeMatpinAnalysis,
  retryMatpinMessage,
  saveMatpinPlaces,
} from "@/lib/matpin/store";

function publicUrl(path: string, params: Record<string, string>): string {
  const origin = process.env.MATPIN_PUBLIC_APP_URL?.trim();
  if (!origin) throw new Error("matpin_public_url_not_configured");
  const url = new URL(path, origin);
  for (const [key, value] of Object.entries(params)) {
    if (key === "token") url.hash = `token=${encodeURIComponent(value)}`;
    else url.searchParams.set(key, value);
  }
  return url.toString();
}

async function processOneMatpinMessage() {
  const job = await claimNextMatpinMessage();
  if (!job) return { state: "empty" as const };

  try {
    const analyzed = await createGeminiReelAnalyzer().analyze({
      mediaUrl: job.mediaUrl,
      reelId: job.reelId,
    });
    const candidates = await resolveMatpinPlaces(analyzed.analysis);

    if (candidates.length > 0) {
      await saveMatpinPlaces({
        messageId: job.messageId,
        senderHash: job.senderHash,
        candidates,
        confirmationSource: "automatic_high_confidence",
      });
      const mapUrl = publicUrl("/matpin/saved", { token: job.accessToken });
      await sendMatpinInstagramMessage(
        job.senderScopedId,
        candidates.length === 1
          ? `릴스에서 찾은 장소를 가까운 역 보관함에 저장했어요.\n${candidates[0].name}\n${mapUrl}`
          : `릴스에서 찾은 ${candidates.length}곳을 가까운 역별 보관함에 저장했어요.\n${mapUrl}`,
      );
      await completeMatpinAnalysis({
        messageId: job.messageId,
        queueMessageId: job.queueMessageId,
        status: "saved",
        candidates,
        metrics: analyzed.metrics,
        replied: true,
      });
      return { state: "saved" as const, messageId: job.messageId };
    }

    await sendMatpinInstagramMessage(
      job.senderScopedId,
      "영상에서 식당 이름을 확인하지 못했어요. 식당 이름이나 지역이 보이는 다른 릴스를 보내주세요.",
    );
    await completeMatpinAnalysis({
      messageId: job.messageId,
      queueMessageId: job.queueMessageId,
      status: "failed",
      candidates: [],
      metrics: analyzed.metrics,
      replied: true,
    });
    return { state: "failed" as const, messageId: job.messageId };
  } catch (error) {
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
          "이 릴스는 아직 자동으로 분석할 수 없어요. 다른 공개 릴스를 보내주세요.",
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
