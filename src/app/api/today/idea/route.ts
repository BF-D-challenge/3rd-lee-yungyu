import { NextResponse } from "next/server";
import { z } from "zod";
import {
  todayIdeaRequestSchema,
  todayIdeaResultSchema,
  type TodayIdeaRequest,
  type TodayIdeaResponse,
} from "@/lib/today-contract";
import { buildCatalogTodayIdea } from "@/lib/today-idea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 40;

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_REVISION = "2026-05-20";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}

const geminiResponseSchema = z.object({
  steps: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  })),
});

async function improveWithGemini(
  input: TodayIdeaRequest,
  fallback: ReturnType<typeof buildCatalogTodayIdea>,
  apiKey: string,
) {
  const prompt = `당신은 초기 사업 아이디어를 fake-door 수요 테스트로 좁히는 제품 전략가입니다.
사용자 입력과 저장된 실제 매출 원본 구조를 결합하되, 원본의 입력→처리→결과 메커니즘을 보존하세요.
성공이나 현재 매출을 보장하지 마세요. 추상적인 AI 표현을 피하고 고객, 문제 순간, 즉시 결과를 한국어로 구체화하세요.
사용자 입력: ${JSON.stringify(input)}
검증 후 fallback 초안: ${JSON.stringify(fallback)}
JSON 스키마를 정확히 지키고 evidence와 productionScope를 절대 제거하지 마세요.`;
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "api-revision": GEMINI_REVISION,
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.TODAY_GEMINI_MODEL?.trim() || "gemini-3.6-flash",
      store: false,
      input: [{ type: "text", text: prompt }],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: z.toJSONSchema(todayIdeaResultSchema),
      },
    }),
    signal: AbortSignal.timeout(18_000),
  });
  if (!response.ok) throw new Error("gemini_upstream");
  const interaction = geminiResponseSchema.parse(await response.json());
  const text = interaction.steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .find((content) => content.type === "text" && content.text)?.text;
  if (!text) throw new Error("gemini_missing");
  return todayIdeaResultSchema.parse(JSON.parse(text));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }
  const parsed = todayIdeaRequestSchema.safeParse(body);
  if (!parsed.success) return noStoreJson({ error: "invalid_request" }, 400);

  const fallback = buildCatalogTodayIdea(parsed.data);
  const apiKey = process.env.NEXT_PUBLIC_E2E === "1"
    ? ""
    : process.env.GEMINI_API_KEY?.trim() || process.env.ALLSALE_GEMINI_API_KEY?.trim();
  if (apiKey) {
    try {
      const result = await improveWithGemini(parsed.data, fallback, apiKey);
      const response: TodayIdeaResponse = {
        mode: "gemini_research",
        result,
        notice: "Gemini가 저장된 원본 근거와 사용자 입력을 함께 사용해 초안을 개선했습니다.",
      };
      return noStoreJson(response);
    } catch {
      // A grounded catalog result remains useful when the live model is unavailable.
    }
  }
  const response: TodayIdeaResponse = {
    mode: "catalog_snapshot",
    result: fallback,
    notice: "현재는 저장된 매출 원본 구조로 만든 초안입니다. Gemini 연결 시 같은 계약으로 문장을 더 다듬습니다.",
  };
  return noStoreJson(response);
}
