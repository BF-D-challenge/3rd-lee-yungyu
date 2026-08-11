import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { z } from "zod";
import { MatpinAnalysisError } from "@/lib/matpin/analysis-error";
import {
  MatpinDeadline,
  MatpinDeadlineExceededError,
  matpinDeadlineSignal,
} from "@/lib/matpin/deadline";
import {
  matpinAnalysisSchema,
  matpinGeminiJsonSchema,
  type MatpinAnalysis,
} from "@/lib/matpin/contract";
import {
  loadInstagramReelSource,
  type MatpinReelSource,
} from "@/lib/matpin/reel-source";

export { MatpinAnalysisError } from "@/lib/matpin/analysis-error";

const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
// Base64와 JSON 오버헤드를 포함해 Interactions 요청이 약 20MB 아래에 머물게 한다.
const MAX_INLINE_BYTES = 14 * 1024 * 1024;
const MEDIA_TIMEOUT_MS = 15_000;
const GEMINI_TIMEOUT_MS = 35_000;
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/mpeg",
  "video/mpg",
  "video/mov",
  "video/avi",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-flv",
  "video/webm",
  "video/wmv",
  "video/x-ms-wmv",
  "video/3gpp",
]);

const geminiInteractionSchema = z.object({
  model: z.string().optional(),
  usage: z.object({
    total_input_tokens: z.number().int().nonnegative().optional(),
    total_output_tokens: z.number().int().nonnegative().optional(),
    total_thought_tokens: z.number().int().nonnegative().optional(),
    total_tool_use_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional(),
  }).optional(),
  steps: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    })).optional(),
  })),
});

const extractionPrompt = `당신은 Instagram 게시물에서 지도 검색에 필요한 방문 장소 단서만 찾는 추출기입니다.

게시물 캡션, 작성자의 댓글, 이미지 글자, 영상의 음성, 화면 글자, 간판처럼 직접 확인되는 정보만 사용하세요.
장소 단서는 캡션, 작성자 댓글, 영상 순서로 확인하세요.
작성자 댓글이 고정 댓글인지 API에서 확인할 수 없는 경우에는 creator_comment로만 기록하세요.
식당, 카페, 관광지, 숙소 등 실제 방문 장소의 이름을 추측하거나 비슷한 유명 장소로 보완하지 마세요.
방문 장소 이름을 직접 확인하지 못하면 status를 insufficient로 하고 places는 빈 배열로 반환하세요.
주소, 좌표, 지점은 게시물에서 직접 확인되지 않으면 만들지 마세요.
메뉴와 지역도 직접 확인한 것만 넣고, 모르는 값은 빈 배열 또는 null로 두세요.
한 게시물에 여러 장소가 명확히 나오면 최대 3곳까지만 반환하세요.
각 장소의 유형은 restaurant, cafe, attraction, lodging 중 하나로 직접 확인한 범위에서만 기록하세요. 유형을 알 수 없으면 restaurant로 추정하지 말고 placeType을 생략하세요.
evidence.text에는 판단 근거가 된 짧은 음성 또는 화면 글자를 적고, 확인 가능하면 시점을 적으세요.
summary는 사용자에게 보여줄 짧고 정직한 한국어 문장으로 작성하세요.`;

export interface MatpinReelAnalyzer {
  readonly mode: "mock" | "gemini";
  analyze(input: {
    mediaUrl: string;
    reelId: string;
    deadline?: MatpinDeadline;
  }): Promise<MatpinAnalysisResult>;
}

export type MatpinAnalysisResult = {
  analysis: MatpinAnalysis;
  metrics: {
    model: string;
    durationMs: number;
    requestCount: number;
    mediaBytes: number;
    inputTokens: number | null;
    outputTokens: number | null;
    thoughtTokens: number | null;
    toolUseTokens: number | null;
    totalTokens: number | null;
  };
};

function configuredAllowedHosts(): string[] {
  const configured = process.env.MATPIN_MEDIA_ALLOWED_HOSTS
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return configured?.length
    ? configured
    : ["cdninstagram.com", "fbcdn.net", "instagram.com", "facebook.com"];
}

function hostMatches(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function isPrivateIp(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10
      || a === 127
      || a === 0
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 100 && b >= 64 && b <= 127)
      || a >= 224;
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized === "::1"
      || normalized === "::"
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || normalized.startsWith("fe8")
      || normalized.startsWith("fe9")
      || normalized.startsWith("fea")
      || normalized.startsWith("feb");
  }
  return true;
}

export function isAllowedMatpinMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username
      && !url.password
      && !isIP(url.hostname)
      && configuredAllowedHosts().some((suffix) => hostMatches(url.hostname.toLowerCase(), suffix));
  } catch {
    return false;
  }
}

async function validatePublicDns(hostname: string): Promise<void> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((item) => isPrivateIp(item.address))) {
    throw new MatpinAnalysisError("media_host_private", false);
  }
}

async function readLimitedBody(response: Response): Promise<Buffer> {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_INLINE_BYTES) {
    throw new MatpinAnalysisError("media_too_large", false);
  }
  if (!response.body) throw new MatpinAnalysisError("media_body_missing", true);

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_INLINE_BYTES) {
      await reader.cancel();
      throw new MatpinAnalysisError("media_too_large", false);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, size);
}

async function downloadMedia(
  mediaUrl: string,
  deadline: MatpinDeadline,
): Promise<{ bytes: Buffer; mimeType: string }> {
  let current = mediaUrl;
  try {
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      deadline.throwIfInsufficient(1, 0);
      if (!isAllowedMatpinMediaUrl(current)) throw new MatpinAnalysisError("media_url_not_allowed", false);
      const url = new URL(current);
      await deadline.run(() => validatePublicDns(url.hostname), MEDIA_TIMEOUT_MS, 0);
      const response = await fetch(url, {
        redirect: "manual",
        signal: deadline.signalFor(MEDIA_TIMEOUT_MS, 0),
        headers: { accept: "image/*,video/*" },
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new MatpinAnalysisError("media_redirect_invalid", false);
        current = new URL(location, current).toString();
        continue;
      }
      if (!response.ok) throw new MatpinAnalysisError("media_download_failed", response.status >= 500);

      const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
      if (!SUPPORTED_MIME_TYPES.has(mimeType)) throw new MatpinAnalysisError("media_type_unsupported", false);
      return { bytes: await readLimitedBody(response), mimeType };
    }
  } catch (error) {
    if (error instanceof MatpinAnalysisError || error instanceof MatpinDeadlineExceededError) throw error;
    const timeout = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new MatpinAnalysisError(timeout ? "media_download_timeout" : "media_download_failed", true);
  }
  throw new MatpinAnalysisError("media_redirect_limit", false);
}

function parseGeminiOutput(value: unknown): {
  analysis: MatpinAnalysis;
  usage: z.infer<typeof geminiInteractionSchema>["usage"];
  model?: string;
} {
  const interaction = geminiInteractionSchema.safeParse(value);
  if (!interaction.success) throw new MatpinAnalysisError("gemini_invalid_response", true);
  const output = interaction.data.steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .find((content) => content.type === "text" && content.text);
  if (!output?.text) throw new MatpinAnalysisError("gemini_missing_output", true);
  try {
    return {
      analysis: matpinAnalysisSchema.parse(JSON.parse(output.text)),
      usage: interaction.data.usage,
      model: interaction.data.model,
    };
  } catch {
    throw new MatpinAnalysisError("gemini_invalid_extraction", true);
  }
}

export function createGeminiReelAnalyzer(dependencies: {
  download?: (
    url: string,
    options?: { signal: AbortSignal; deadline: MatpinDeadline },
  ) => Promise<{ bytes: Buffer; mimeType: string }>;
  fetch?: typeof fetch;
  source?: (
    url: string,
    options?: { deadline?: MatpinDeadline },
  ) => Promise<MatpinReelSource | null>;
} = {}): MatpinReelAnalyzer {
  return {
    mode: "gemini",
    async analyze({ mediaUrl, deadline }) {
      const startedAt = Date.now();
      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.ALLSALE_GEMINI_API_KEY?.trim();
      if (!apiKey) throw new MatpinAnalysisError("gemini_not_configured", false);
      const model = process.env.MATPIN_EXTRACTION_MODEL?.trim()
        || process.env.MATPIN_GEMINI_MODEL?.trim()
        || "gemini-3.1-flash-lite";
      const fetchImpl = dependencies.fetch ?? fetch;
      const source = await (dependencies.source
        ? dependencies.source(mediaUrl, deadline ? { deadline } : undefined)
        : loadInstagramReelSource(mediaUrl, fetchImpl, { deadline }));

      const sourceSections = [
        source?.caption ? `게시물 캡션:\n${source.caption}` : "",
        source?.creatorComments.length
          ? `게시물 작성자 댓글:\n${source.creatorComments.map((comment, index) => `${index + 1}. ${comment}`).join("\n")}`
          : "",
      ].filter(Boolean);
      const sourcePrompt = sourceSections.length > 0
        ? `${extractionPrompt}\n\n아래 텍스트에서 먼저 장소 단서를 찾으세요.\n\n${sourceSections.join("\n\n")}`
        : extractionPrompt;

      const runGemini = async (
        input: Array<Record<string, string>>,
        mediaBytes: number,
      ): Promise<MatpinAnalysisResult> => {
        let response: Response;
        try {
          response = await fetchImpl(GEMINI_INTERACTIONS_URL, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
            body: JSON.stringify({
              model,
              input,
              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: matpinGeminiJsonSchema,
              },
            }),
            signal: matpinDeadlineSignal(deadline, GEMINI_TIMEOUT_MS),
            cache: "no-store",
          });
        } catch (error) {
          if (error instanceof MatpinDeadlineExceededError) throw error;
          const timeout = error instanceof Error && error.name === "TimeoutError";
          throw new MatpinAnalysisError(timeout ? "gemini_timeout" : "gemini_unavailable", true);
        }
        if (!response.ok) {
          throw new MatpinAnalysisError("gemini_upstream", response.status === 429 || response.status >= 500);
        }
        const parsed = parseGeminiOutput(await response.json());
        return {
          analysis: parsed.analysis,
          metrics: {
            model: parsed.model || model,
            durationMs: Date.now() - startedAt,
            requestCount: 1,
            mediaBytes,
            inputTokens: parsed.usage?.total_input_tokens ?? null,
            outputTokens: parsed.usage?.total_output_tokens ?? null,
            thoughtTokens: parsed.usage?.total_thought_tokens ?? null,
            toolUseTokens: parsed.usage?.total_tool_use_tokens ?? null,
            totalTokens: parsed.usage?.total_tokens ?? null,
          },
        };
      };

      let textResult: MatpinAnalysisResult | null = null;
      if (sourceSections.length > 0) {
        textResult = await runGemini([{ type: "text", text: sourcePrompt }], 0);
        if (textResult.analysis.status === "resolved" || source?.mediaUrls.length === 0) return textResult;
      }

      const downloadableUrls = source?.mediaUrls.length
        ? source.mediaUrls
        : [source?.videoUrl ?? source?.thumbnailUrl ?? mediaUrl];
      const mediaInputs: Array<Record<string, string>> = [];
      let totalMediaBytes = 0;
      const mediaDeadline = deadline
        ? deadline.fork(MEDIA_TIMEOUT_MS, 0)
        : new MatpinDeadline({ durationMs: MEDIA_TIMEOUT_MS, reserveMs: 0 });
      for (const downloadableUrl of downloadableUrls.slice(0, 3)) {
        const { bytes, mimeType } = dependencies.download
          ? await (deadline
              ? mediaDeadline.run(
                  (signal) => dependencies.download!(downloadableUrl, { signal, deadline: mediaDeadline }),
                  MEDIA_TIMEOUT_MS,
                  0,
                )
              : dependencies.download(downloadableUrl))
          : await downloadMedia(downloadableUrl, mediaDeadline);
        totalMediaBytes += bytes.byteLength;
        if (totalMediaBytes > MAX_INLINE_BYTES) {
          throw new MatpinAnalysisError("media_too_large", false);
        }
        mediaInputs.push({
          type: mimeType.startsWith("image/") ? "image" : "video",
          data: bytes.toString("base64"),
          mime_type: mimeType,
        });
      }
      const mediaResult = await runGemini(
        [...mediaInputs, { type: "text", text: sourcePrompt }],
        totalMediaBytes,
      );
      if (!textResult) return mediaResult;
      const sumUsage = (left: number | null, right: number | null) =>
        left === null && right === null ? null : (left ?? 0) + (right ?? 0);
      return {
        analysis: mediaResult.analysis,
        metrics: {
          ...mediaResult.metrics,
          requestCount: textResult.metrics.requestCount + mediaResult.metrics.requestCount,
          inputTokens: sumUsage(textResult.metrics.inputTokens, mediaResult.metrics.inputTokens),
          outputTokens: sumUsage(textResult.metrics.outputTokens, mediaResult.metrics.outputTokens),
          thoughtTokens: sumUsage(textResult.metrics.thoughtTokens, mediaResult.metrics.thoughtTokens),
          toolUseTokens: sumUsage(textResult.metrics.toolUseTokens, mediaResult.metrics.toolUseTokens),
          totalTokens: sumUsage(textResult.metrics.totalTokens, mediaResult.metrics.totalTokens),
        },
      };
    },
  };
}

const mockPlaces: Record<string, MatpinAnalysis> = {
  DbTBhcZNY1b: {
    status: "resolved",
    summary: "영상의 간판과 메뉴에서 산장장작구이를 확인했어요.",
    places: [{
      name: "산장장작구이",
      branch: null,
      menus: ["흑돼지", "껍데기", "삼겹살"],
      regionHints: ["역삼"],
      confidence: 0.96,
      evidence: [{ kind: "on_screen_text", text: "산장장작구이", timestampSeconds: 2 }],
    }],
  },
};

export function createMockReelAnalyzer(): MatpinReelAnalyzer {
  return {
    mode: "mock",
    async analyze({ reelId }) {
      return {
        analysis: matpinAnalysisSchema.parse(mockPlaces[reelId] ?? {
          status: "insufficient",
          summary: "고정 데모에 없는 릴스라 장소를 확인하지 못했어요.",
          places: [],
        }),
        metrics: {
          model: "mock",
          durationMs: 0,
          requestCount: 0,
          mediaBytes: 0,
          inputTokens: null,
          outputTokens: null,
          thoughtTokens: null,
          toolUseTokens: null,
          totalTokens: null,
        },
      };
    },
  };
}
