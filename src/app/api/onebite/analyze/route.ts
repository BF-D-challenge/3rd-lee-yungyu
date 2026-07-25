import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import {
  ONEBITE_MAX_IMAGE_BYTES,
  ONEBITE_SUPPORTED_IMAGE_TYPES,
  onebiteAnalysisSchema,
  onebiteGeminiJsonSchema,
  type OnebiteActionCode,
  type OnebiteAnalysis,
} from "./contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_API_REVISION = "2026-05-20";
const GEMINI_TIMEOUT_MS = 35_000;
const MAX_MULTIPART_BYTES = ONEBITE_MAX_IMAGE_BYTES + 256 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_OUTPUT_EDGE = 1600;

const acceptedMimeTypes = new Set<string>(ONEBITE_SUPPORTED_IMAGE_TYPES);
const expectedSharpFormat: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

const actionLines: Record<OnebiteActionCode, string> = {
  add_vegetable: "다음 끼니에는 채소 반찬 한 가지를 먼저 담아보세요.",
  add_protein:
    "다음 끼니에는 달걀·두부·생선·살코기 중 단백질 반찬 한 가지를 더해보세요.",
  choose_water: "다음 끼니의 음료는 물로 골라보세요.",
  keep_regular_meal: "다음 끼니도 거르지 말고 비슷한 시간에 드세요.",
  retake_photo: "음식 전체가 밝게 보이도록 위에서 다시 찍어주세요.",
};
const medicalBoundaryLine =
  "이 사진으로 코칭을 계속하지 않아요. 식단은 담당 의료진이나 임상영양사와 확인해주세요.";

const geminiInteractionSchema = z.object({
  steps: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    })).optional(),
  })),
});

const analysisPrompt = `당신은 음식 사진에서 안전한 일반 행동 하나를 고르는 분류기입니다.

사진에서 직접 보이는 것만 사용하세요. 음식 이름, 재료, 조리법, 중량, 양, 칼로리, 영양소 수치, 건강 효과를 추측하지 마세요.
사람의 몸, 체중, 외모, 의지, 인격을 평가하지 마세요. 진단이나 감량·보상 운동·굶기 조언을 하지 마세요.
사진 또는 사용자 맥락에 질환, 임신, 알레르기, 섭식장애, 극단적 식이 제한처럼 의료·섭식장애 판단이 필요한 단서가 있으면 riskFlag를 medical_or_ed로 두세요.
한 끼 음식 사진이 아니면 isMealPhoto=false, riskFlag=not_food, actionCode=retake_photo로 반환하세요.
사진이 어둡거나 잘렸거나 음식 그룹을 구분하기 어려우면 confidence=low, riskFlag=uncertain, actionCode=retake_photo로 반환하세요.
확신할 수 있는 음식 사진이면 riskFlag=none으로 두고 보이는 그룹만 visibleGroups에 넣으세요.
행동은 사진에서 채소가 보이지 않으면 add_vegetable, 단백질 식품군이 보이지 않으면 add_protein, 음료 선택을 바꾸는 것이 가장 작은 행동이면 choose_water, 이미 여러 그룹이 보이면 keep_regular_meal 중 하나만 고르세요.
사용자에게 보여줄 문장을 만들지 마세요. 반드시 지정된 JSON 필드와 enum 값만 반환하세요.`;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      pragma: "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

function rejectCrossSite(request: Request): boolean {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

async function preprocessImage(photo: File): Promise<Buffer> {
  const input = Buffer.from(await photo.arrayBuffer());
  const image = sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_INPUT_PIXELS,
  });
  const metadata = await image.metadata();

  if (
    !metadata.width
    || !metadata.height
    || metadata.format !== expectedSharpFormat[photo.type]
  ) {
    throw new Error("image_decode_failed");
  }

  return image
    .rotate()
    .resize({
      width: MAX_OUTPUT_EDGE,
      height: MAX_OUTPUT_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function analyzeWithGemini(
  image: Buffer,
  apiKey: string,
): Promise<OnebiteAnalysis> {
  const model =
    process.env.ONEBITE_GEMINI_MODEL?.trim() || "gemini-3.6-flash";
  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "api-revision": GEMINI_API_REVISION,
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        { type: "text", text: analysisPrompt },
        {
          type: "image",
          data: image.toString("base64"),
          mime_type: "image/webp",
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: onebiteGeminiJsonSchema,
      },
    }),
    signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error("gemini_upstream");

  const interaction = geminiInteractionSchema.safeParse(await response.json());
  if (!interaction.success) throw new Error("gemini_invalid_response");

  const output = interaction.data.steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .find((content) => content.type === "text" && content.text);
  if (!output?.text) throw new Error("gemini_missing_output");

  let parsed: unknown;
  try {
    parsed = JSON.parse(output.text);
  } catch {
    throw new Error("gemini_invalid_json");
  }

  const analysis = onebiteAnalysisSchema.safeParse(parsed);
  if (!analysis.success) throw new Error("gemini_invalid_analysis");
  return analysis.data;
}

function rejectionCode(
  analysis: OnebiteAnalysis,
): "not_food" | "uncertain" | "medical_or_ed" | null {
  if (!analysis.isMealPhoto || analysis.riskFlag === "not_food") {
    return "not_food";
  }
  if (analysis.riskFlag === "medical_or_ed") return "medical_or_ed";
  if (
    analysis.riskFlag === "uncertain"
    || analysis.confidence === "low"
    || analysis.actionCode === "retake_photo"
  ) {
    return "uncertain";
  }
  return null;
}

export async function POST(request: Request) {
  if (rejectCrossSite(request)) {
    return noStoreJson({ error: "cross_site_request" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return noStoreJson({ error: "image_too_large" }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return noStoreJson({ error: "invalid_form_data" }, 400);
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return noStoreJson({ error: "image_required" }, 400);
  }
  if (!acceptedMimeTypes.has(photo.type)) {
    return noStoreJson({ error: "unsupported_image_type" }, 415);
  }
  if (photo.size > ONEBITE_MAX_IMAGE_BYTES) {
    return noStoreJson({ error: "image_too_large" }, 413);
  }

  let preparedImage: Buffer;
  try {
    preparedImage = await preprocessImage(photo);
  } catch {
    return noStoreJson({ error: "image_decode_failed" }, 422);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
    || process.env.ALLSALE_GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    return noStoreJson({ error: "gemini_not_configured" }, 503);
  }

  let analysis: OnebiteAnalysis;
  try {
    analysis = await analyzeWithGemini(preparedImage, geminiApiKey);
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return noStoreJson(
      { error: timeout ? "gemini_timeout" : "gemini_failed" },
      timeout ? 504 : 502,
    );
  }

  const rejected = rejectionCode(analysis);
  const actionLine = rejected === "medical_or_ed"
    ? medicalBoundaryLine
    : actionLines[analysis.actionCode];
  if (rejected) {
    return noStoreJson({ error: rejected, analysis, actionLine }, 422);
  }

  return noStoreJson({ mode: "live", analysis, actionLine });
}
