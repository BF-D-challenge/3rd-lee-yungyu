import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import {
  ONEBITE_MAX_IMAGE_BYTES,
  ONEBITE_SUPPORTED_IMAGE_TYPES,
  onebiteAnalysisSchema,
  onebiteGeminiJsonSchema,
  onebiteRoastLineSchema,
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
const fallbackRoastLines: Record<OnebiteActionCode, string> = {
  add_vegetable: "채소가 이 접시 단톡방에서 혼자 강퇴당했네요.",
  add_protein: "단백질이 오늘 접시 회의에 초대장도 못 받았네요.",
  choose_water: "음료가 목마름 잡으러 왔다가 디저트로 취업했네요.",
  keep_regular_meal: "이 접시, 균형 잡다가 곡예단에 스카우트되겠네요.",
  retake_photo: "음식보다 픽셀이 선명하면 코치도 현미경부터 삽니다.",
};
const unsafeRoastPattern = /(뚱뚱|돼지|비만|살쪘|몸무게|체중|외모|못생|의지박약|한심|게으르|쓰레기|인간도|굶|단식|토해|구토|벌로\s*운동)/i;
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

const analysisPrompt = `당신은 음식 사진에서 안전한 일반 행동 하나와 짧은 팩폭을 만드는 한입코치입니다.

사진에서 직접 보이는 것만 사용하세요. 분명히 보이는 음식 이름은 visibleFoods에 짧은 한국어로 적되, 재료, 조리법, 중량, 양, 칼로리, 영양소 수치, 건강 효과는 추측하지 마세요.
사람의 몸, 체중, 외모, 의지, 인격을 평가하지 마세요. 진단이나 감량·보상 운동·굶기 조언을 하지 마세요.
사진 또는 사용자 맥락에 질환, 임신, 알레르기, 섭식장애, 극단적 식이 제한처럼 의료·섭식장애 판단이 필요한 단서가 있으면 riskFlag를 medical_or_ed로 두세요.
한 끼 음식 사진이 아니면 isMealPhoto=false, riskFlag=not_food, actionCode=retake_photo로 반환하세요.
사진이 어둡거나 잘렸거나 음식 그룹을 구분하기 어려우면 confidence=low, riskFlag=uncertain, actionCode=retake_photo로 반환하세요.
확신할 수 있는 음식 사진이면 riskFlag=none으로 두고 보이는 그룹만 visibleGroups에 넣으세요.
행동은 사진에서 채소가 보이지 않으면 add_vegetable, 단백질 식품군이 보이지 않으면 add_protein, 음료 선택을 바꾸는 것이 가장 작은 행동이면 choose_water, 이미 여러 그룹이 보이면 keep_regular_meal 중 하나만 고르세요.
roastLine은 이 제품의 핵심 결과입니다. 매 사진마다 새로 만든, 말도 안 되게 웃긴 한국어 팩폭 한 문장을 자유롭게 창작하세요. 사진에서 분명히 보이는 음식 이름을 최소 하나 넣고, 그 음식들의 조합이나 빠진 그룹만 놀리세요.
- 황당한 의인화, 과장된 사건, 진지한 속보체, 엉뚱한 비유, 예상 밖 반전 중 가장 웃긴 장치를 자유롭게 고르세요. 여러 장치를 억지로 섞지는 마세요.
- 읽자마자 장면이 그려지고 한 번 피식할 만큼 구체적으로 쓰세요. 점잖은 영양 상담 말투나 교훈적인 잔소리는 금지합니다.
- 결석, 투명인간, 어디 갔나요처럼 흔하고 예상 가능한 표현을 반복하지 마세요.
- 15~80자, 한 문장, 따옴표와 이모지 없이 작성하세요.
- 몸, 체중, 외모, 인격, 의지, 직업, 질환을 공격하거나 사용자를 모욕하지 마세요.
- 굶기, 단식, 구토, 보상 운동을 권하지 마세요.
- 사진에서 알 수 없는 야근, 감정, 시간, 생활 습관을 지어내지 마세요.
- 행동 지시는 roastLine에 넣지 마세요. 다음 행동은 actionCode로만 정합니다.
반드시 지정된 JSON 필드만 반환하세요.`;

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
): Promise<{ analysis: OnebiteAnalysis; roastLine: string }> {
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

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("gemini_invalid_analysis");
  }
  const { roastLine: roastCandidate, ...analysisCandidate } = parsed as Record<string, unknown>;
  const analysis = onebiteAnalysisSchema.safeParse(analysisCandidate);
  if (!analysis.success) throw new Error("gemini_invalid_analysis");
  const roastLine = onebiteRoastLineSchema.safeParse(roastCandidate);
  if (!roastLine.success) throw new Error("gemini_invalid_roast");
  return { analysis: analysis.data, roastLine: roastLine.data };
}

function safeRoastLine(generated: string, actionCode: OnebiteActionCode): string {
  if (unsafeRoastPattern.test(generated)) return fallbackRoastLines[actionCode];
  return generated;
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

  let generated: { analysis: OnebiteAnalysis; roastLine: string };
  try {
    generated = await analyzeWithGemini(preparedImage, geminiApiKey);
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return noStoreJson(
      { error: timeout ? "gemini_timeout" : "gemini_failed" },
      timeout ? 504 : 502,
    );
  }

  const { analysis } = generated;

  const rejected = rejectionCode(analysis);
  const actionLine = rejected === "medical_or_ed"
    ? medicalBoundaryLine
    : actionLines[analysis.actionCode];
  if (rejected) {
    return noStoreJson({ error: rejected, analysis, actionLine }, 422);
  }

  const roastLine = safeRoastLine(generated.roastLine, analysis.actionCode);
  return noStoreJson({ mode: "live", analysis, roastLine, actionLine });
}
