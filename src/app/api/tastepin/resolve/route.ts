import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeYouTubeShortsUrl,
  TASTEPIN_GEMINI_MODEL,
  tastepinExtractionSchema,
  tastepinGeminiJsonSchema,
  tastepinMapCandidateSchema,
  type TastepinExtraction,
  type TastepinMapCandidate,
  type TastepinResolveResponse,
} from "@/lib/tastepin-contract";

export const runtime = "nodejs";

const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const GEMINI_TIMEOUT_MS = 35_000;
const KAKAO_TIMEOUT_MS = 8_000;

const requestSchema = z.object({
  url: z.string().trim().min(1).max(500),
});

const geminiInteractionSchema = z.object({
  steps: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    })).optional(),
  })),
});

const kakaoResponseSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    place_name: z.string(),
    category_name: z.string(),
    category_group_code: z.string(),
    phone: z.string(),
    address_name: z.string(),
    road_address_name: z.string(),
    x: z.string(),
    y: z.string(),
    place_url: z.string().url(),
  })),
});

const extractionPrompt = `당신은 한국 맛집 영상에서 지도 검색에 필요한 장소 단서를 찾는 추출기입니다.

영상의 음성, 자동 자막, 화면 글자, 간판처럼 영상에서 직접 확인되는 정보만 사용하세요.
식당 이름을 추측하거나 비슷한 유명 식당으로 보완하지 마세요.
식당 이름을 직접 확인하지 못하면 status를 insufficient로 하고 places는 빈 배열로 반환하세요.
메뉴와 지역도 직접 확인한 것만 넣고, 확인하지 못한 값은 빈 배열 또는 null로 두세요.
한 영상에 여러 식당이 명확히 나오면 최대 3곳까지만 반환하세요.
evidence.text에는 판단의 근거가 된 짧은 음성 또는 화면 글자를 적고, 확인 가능하면 초 단위 시점을 적으세요.
summary는 사용자에게 보여줄 짧고 정직한 한국어 문장으로 작성하세요.`;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function resolveWithGemini(
  url: string,
  apiKey: string,
): Promise<TastepinExtraction> {
  const response = await fetch(GEMINI_INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: TASTEPIN_GEMINI_MODEL,
      input: [
        { type: "video", uri: url },
        { type: "text", text: extractionPrompt },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: tastepinGeminiJsonSchema,
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

  const extraction = tastepinExtractionSchema.safeParse(parsed);
  if (!extraction.success) throw new Error("gemini_invalid_extraction");
  return extraction.data;
}

function kakaoQuery(extraction: TastepinExtraction): string | null {
  const place = extraction.places[0];
  if (!place) return null;
  return [place.name, place.branch, place.regionHints[0]]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

async function searchKakao(
  extraction: TastepinExtraction,
  restApiKey: string,
): Promise<TastepinMapCandidate[]> {
  const query = kakaoQuery(extraction);
  if (!query) return [];

  const params = new URLSearchParams({
    query,
    size: "5",
  });
  const response = await fetch(`${KAKAO_LOCAL_URL}?${params.toString()}`, {
    headers: { authorization: `KakaoAK ${restApiKey}` },
    signal: AbortSignal.timeout(KAKAO_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error("kakao_upstream");

  const parsed = kakaoResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("kakao_invalid_response");

  return parsed.data.documents
    .filter((document) =>
      document.category_group_code === "FD6"
      || document.category_group_code === "CE7",
    )
    .slice(0, 3)
    .map((document) => tastepinMapCandidateSchema.parse({
      id: document.id,
      name: document.place_name,
      category: document.category_name,
      address: document.address_name,
      roadAddress: document.road_address_name,
      phone: document.phone,
      longitude: document.x,
      latitude: document.y,
      mapUrl: document.place_url,
    }));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }

  const parsedRequest = requestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  const normalizedUrl = normalizeYouTubeShortsUrl(parsedRequest.data.url);
  if (!normalizedUrl) {
    return noStoreJson({ error: "unsupported_url" }, 400);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim()
    || process.env.ALLSALE_GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    return noStoreJson({ error: "gemini_not_configured" }, 503);
  }

  let extraction: TastepinExtraction;
  try {
    extraction = await resolveWithGemini(normalizedUrl, geminiApiKey);
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return noStoreJson({ error: timeout ? "gemini_timeout" : "gemini_failed" }, timeout ? 504 : 502);
  }

  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  let mapStatus: TastepinResolveResponse["mapStatus"] = "not_configured";
  let mapCandidates: TastepinMapCandidate[] = [];

  if (kakaoRestApiKey && extraction.status === "resolved") {
    try {
      mapCandidates = await searchKakao(extraction, kakaoRestApiKey);
      mapStatus = mapCandidates.length > 0 ? "candidates" : "no_match";
    } catch {
      mapStatus = "error";
    }
  }

  const response: TastepinResolveResponse = {
    mode: "live",
    platform: "youtube_shorts",
    extraction,
    mapStatus,
    mapCandidates,
  };

  return noStoreJson(response);
}
