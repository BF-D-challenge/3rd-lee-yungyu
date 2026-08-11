import { z } from "zod";
import {
  matpinPlaceCandidateSchema,
  type MatpinPlaceType,
  type MatpinAnalysis,
  type MatpinPlaceCandidate,
} from "@/lib/matpin/contract";
import { MatpinAnalysisError } from "@/lib/matpin/analysis-error";
import {
  MatpinDeadlineExceededError,
  matpinDeadlineSignal,
  type MatpinDeadline,
} from "@/lib/matpin/deadline";

const KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_TIMEOUT_MS = 8_000;
const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_TIMEOUT_MS = 10_000;
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MAPS_TIMEOUT_MS = 30_000;
const FOREIGN_REGION_PATTERN = new RegExp([
  "일본", "도쿄", "오사카", "교토", "후쿠오카", "삿포로", "나고야", "오키나와",
  "미국", "뉴욕", "로스앤젤레스", "하와이", "중국", "상하이", "베이징",
  "대만", "타이베이", "홍콩", "마카오", "태국", "방콕", "베트남", "다낭",
  "싱가포르", "말레이시아", "인도네시아", "발리", "필리핀", "프랑스", "파리",
  "영국", "런던", "이탈리아", "로마", "스페인", "바르셀로나", "독일",
  "호주", "시드니", "캐나다", "밴쿠버", "두바이",
].join("|"), "i");

const KAKAO_PLACE_TYPE_CODES: Record<string, MatpinPlaceType> = {
  FD6: "restaurant",
  CE7: "cafe",
  AT4: "attraction",
  AD5: "lodging",
};

const GOOGLE_PLACE_TYPES: Partial<Record<MatpinPlaceType, string>> = {
  cafe: "cafe",
  attraction: "tourist_attraction",
  lodging: "lodging",
};

const COUNTRY_PATTERNS: Array<[string, RegExp]> = [
  ["JP", /일본|도쿄|오사카|교토|후쿠오카|삿포로|나고야|오키나와|東京|大阪|京都|福岡|札幌|名古屋|沖縄|japan|tokyo|osaka|kyoto/i],
  ["US", /미국|뉴욕|로스앤젤레스|하와이|united states|new york|los angeles|hawaii/i],
  ["CN", /중국|상하이|베이징|china|shanghai|beijing/i],
  ["TW", /대만|타이베이|taiwan|taipei/i],
  ["HK", /홍콩|hong kong/i],
  ["SG", /싱가포르|singapore/i],
  ["TH", /태국|방콕|thailand|bangkok/i],
  ["VN", /베트남|다낭|vietnam|danang/i],
  ["KR", /대한민국|한국|서울|부산|제주|인천|대구|광주|대전|울산|세종|korea|seoul|busan|jeju/i],
];

const kakaoResponseSchema = z.object({
  documents: z.array(z.object({
    id: z.string(),
    place_name: z.string(),
    category_name: z.string(),
    category_group_code: z.string(),
    address_name: z.string(),
    road_address_name: z.string(),
    x: z.string(),
    y: z.string(),
    place_url: z.string().url(),
  })),
});

const googlePlacesTextSearchSchema = z.object({
  places: z.array(z.object({
    id: z.string().trim().min(1),
    displayName: z.object({ text: z.string().trim().min(1) }),
    formattedAddress: z.string().trim().min(1),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    googleMapsUri: z.string().url(),
    primaryTypeDisplayName: z.object({ text: z.string().trim().min(1) }).optional(),
  })).default([]),
});

const geminiMapsOutputSchema = z.object({
  places: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    category: z.string().trim().max(120),
    address: z.string().trim().min(1).max(240),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })).max(3),
});

const geminiMapsInteractionSchema = z.object({
  model: z.string().optional(),
  usage: z.object({
    total_input_tokens: z.number().int().nonnegative().optional(),
    total_output_tokens: z.number().int().nonnegative().optional(),
    total_thought_tokens: z.number().int().nonnegative().optional(),
    total_tool_use_tokens: z.number().int().nonnegative().optional(),
    total_tokens: z.number().int().nonnegative().optional(),
    grounding_tool_count: z.array(z.object({
      type: z.string().optional(),
      count: z.number().int().nonnegative().optional(),
    })).optional(),
  }).optional(),
  steps: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
    }).passthrough()).optional(),
    result: z.array(z.object({
      places: z.array(z.object({
        name: z.string().optional(),
        place_id: z.string().optional(),
        url: z.string().url().optional(),
      }).passthrough()).optional(),
    }).passthrough()).optional(),
  }).passthrough()),
});

export type MatpinPlaceResolutionMetrics = {
  provider: "none" | "google_places" | "kakao_local" | "gemini_maps";
  model: string | null;
  durationMs: number;
  requestCount: number;
  inputTokens: number | null;
  outputTokens: number | null;
  thoughtTokens: number | null;
  toolUseTokens: number | null;
  totalTokens: number | null;
  groundingQueryCount: number | null;
};

export type MatpinPlaceResolutionResult = {
  candidates: MatpinPlaceCandidate[];
  metrics: MatpinPlaceResolutionMetrics;
};

export type MatpinPlaceResolutionOptions = {
  deadline?: MatpinDeadline;
};

const geminiMapsJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    places: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          address: { type: "string" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
        },
        required: ["name", "category", "address", "latitude", "longitude"],
      },
    },
  },
  required: ["places"],
} as const;

function areaFromAddress(address: string): string {
  const parts = address.trim().split(/\s+/);
  return parts.slice(0, 2).join(" ") || "지역 확인 필요";
}

function countryCodeForPlace(clue: MatpinAnalysis["places"][number], address: string): string | undefined {
  const text = [clue.regionHints.join(" "), address].join(" ");
  return COUNTRY_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0];
}

function regionNameFromAddress(address: string, countryCode: string | undefined): string | undefined {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return undefined;
  const withoutCountry = parts.filter((part) => !/^(대한민국|한국|일본|japan|korea)$/iu.test(part));
  const regionParts = countryCode === "JP" ? withoutCountry : parts;
  return regionParts.slice(0, 2).join(" ") || undefined;
}

function placeTypeFromText(value: string): MatpinPlaceType | undefined {
  if (/(카페|커피|cafe|coffee|喫茶|カフェ)/iu.test(value)) return "cafe";
  if (/(숙소|호텔|모텔|리조트|게스트하우스|hotel|hostel|resort|lodging|旅館|ホテル)/iu.test(value)) return "lodging";
  if (/(관광|명소|뮤지엄|박물관|미술관|전시|공원|전망대|attraction|museum|gallery|park|観光|美術館|博物館)/iu.test(value)) return "attraction";
  if (/(식당|음식점|맛집|restaurant|dining|食堂|レストラン)/iu.test(value)) return "restaurant";
  return undefined;
}

function placeTypeFor(
  clue: MatpinAnalysis["places"][number],
  category: string,
  kakaoCategoryCode?: string,
): MatpinPlaceType {
  return clue.placeType
    ?? (kakaoCategoryCode ? KAKAO_PLACE_TYPE_CODES[kakaoCategoryCode] : undefined)
    ?? placeTypeFromText(category)
    ?? "restaurant";
}

function googleLanguageCode(countryCode: string | undefined): string {
  return countryCode === "JP" ? "ja" : "ko";
}

function queryTypeHint(placeType: MatpinPlaceType | undefined): string {
  return placeType && placeType !== "restaurant" ? placeType : "";
}

function normalizedName(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function candidateConfidence(input: {
  clueName: string;
  clueRegion?: string;
  clueConfidence: number;
  candidateName: string;
  candidateAddress: string;
}): number {
  const clueName = normalizedName(input.clueName);
  const candidateName = normalizedName(input.candidateName);
  const sameName = candidateName.includes(clueName) || clueName.includes(candidateName);
  const regionMatches = !input.clueRegion || input.candidateAddress.includes(input.clueRegion);
  const score = input.clueConfidence * (sameName ? 1 : 0.72) * (regionMatches ? 1 : 0.82);
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

function matchReason(analysis: MatpinAnalysis, clue = analysis.places[0]): string {
  if (!clue) return "영상에서 장소 근거를 확인하지 못했어요.";
  const evidence = clue.evidence.slice(0, 2).map((item) => item.text).join(", ");
  return evidence ? `영상 근거: ${evidence}` : analysis.summary;
}

function canonicalGroundedPlaceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === "maps.google.com" && url.searchParams.has("cid");
  } catch {
    return false;
  }
}

function groundedName(value: string): string {
  return normalizedName(value
    .replace(/^review of\s+/i, "")
    .replace(/\s+-\s+google maps$/i, ""));
}

function namesOverlap(left: string, right: string): boolean {
  const normalizedLeft = normalizedName(left);
  const normalizedRight = normalizedName(right);
  return Boolean(normalizedLeft)
    && Boolean(normalizedRight)
    && (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft));
}

function hasExplicitForeignRegion(analysis: MatpinAnalysis): boolean {
  return analysis.places.some((clue) =>
    clue.regionHints.some((region) => FOREIGN_REGION_PATTERN.test(region))
  );
}

function bestClueForCandidate(analysis: MatpinAnalysis, candidateName: string) {
  const candidate = normalizedName(candidateName);
  return analysis.places.find((clue) => {
    const clueName = normalizedName(clue.name);
    return candidate.includes(clueName) || clueName.includes(candidate);
  }) ?? analysis.places[0];
}

async function resolveWithGeminiMaps(
  analysis: MatpinAnalysis,
  options: MatpinPlaceResolutionOptions,
): Promise<MatpinPlaceResolutionResult> {
  const startedAt = Date.now();
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.ALLSALE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MatpinAnalysisError("place_search_not_configured", false);
  const model = process.env.MATPIN_MAPS_MODEL?.trim()
    || process.env.MATPIN_GEMINI_MODEL?.trim()
    || "gemini-3.6-flash";

  const clues = analysis.places.slice(0, 3);
  const query = clues.map((clue, index) =>
    `${index + 1}. ${[clue.name, clue.branch, clue.placeType, clue.regionHints.join(" ")].filter(Boolean).join(" ")}`,
  ).join("\n");
  let response: Response;
  try {
    response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model,
        input: `Find each exact restaurant, cafe, tourist attraction, or lodging matching the numbered clues below:\n${query}\nRespect any country or region and place type named in each clue. If no country is given and the clue is Korean, prefer South Korea. Use only verified Google Maps place results. Return at most one best result per clue and at most three results total. Return the local place name and address when available. Skip a clue when no verified place matches.`,
        tools: [{ type: "google_maps" }],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: geminiMapsJsonSchema,
        },
        store: false,
      }),
      signal: matpinDeadlineSignal(options.deadline, GEMINI_MAPS_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof MatpinDeadlineExceededError) throw error;
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new MatpinAnalysisError(timeout ? "place_search_timeout" : "place_search_unavailable", true);
  }
  if (!response.ok) {
    throw new MatpinAnalysisError("place_search_upstream", response.status === 429 || response.status >= 500);
  }

  const interaction = geminiMapsInteractionSchema.safeParse(await response.json());
  if (!interaction.success) throw new MatpinAnalysisError("place_search_invalid_response", true);
  const output = interaction.data.steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .find((content) => content.type === "text" && content.text);
  if (!output?.text) throw new MatpinAnalysisError("place_search_invalid_response", true);

  let parsed: z.infer<typeof geminiMapsOutputSchema>;
  try {
    parsed = geminiMapsOutputSchema.parse(JSON.parse(output.text));
  } catch {
    throw new MatpinAnalysisError("place_search_invalid_response", true);
  }

  const groundedPlaces = interaction.data.steps
    .filter((step) => step.type === "google_maps_result")
    .flatMap((step) => step.result ?? [])
    .flatMap((result) => result.places ?? [])
    .filter((place) => place.url && canonicalGroundedPlaceUrl(place.url))
    .filter((place, index, all) =>
      all.findIndex((other) => (other.place_id && other.place_id === place.place_id) || other.url === place.url) === index,
    );

  const candidates = parsed.places.flatMap((candidate, index) => {
    const candidateName = normalizedName(candidate.name);
    const grounded = groundedPlaces.find((place) => {
      if (!place.name) return false;
      const name = groundedName(place.name);
      return Boolean(name) && (candidateName.includes(name) || name.includes(candidateName));
    }) ?? (parsed.places.length === groundedPlaces.length ? groundedPlaces[index] : undefined)
      ?? (parsed.places.length === 1 && groundedPlaces.length === 1 ? groundedPlaces[0] : undefined);
    if (!grounded?.url) return [];
    const clue = bestClueForCandidate(analysis, candidate.name);
    const placeType = placeTypeFor(clue, candidate.category);
    const countryCode = countryCodeForPlace(clue, candidate.address);
    const confidence = candidateConfidence({
      clueName: clue.name,
      clueRegion: clue.regionHints[0],
      clueConfidence: clue.confidence,
      candidateName: candidate.name,
      candidateAddress: candidate.address,
    });
    return [matpinPlaceCandidateSchema.parse({
      id: grounded.place_id || `google-maps-${normalizedName(candidate.name)}`,
      name: candidate.name,
      placeType,
      countryCode,
      regionName: regionNameFromAddress(candidate.address, countryCode),
      area: areaFromAddress(candidate.address),
      category: `Google Maps · ${candidate.category || "장소"}`,
      address: candidate.address,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      mapUrl: grounded.url,
      confidence,
      matchReason: matchReason(analysis, clue),
    })];
  }).slice(0, 3);
  const usage = interaction.data.usage;
  return {
    candidates,
    metrics: {
      provider: "gemini_maps",
      model: interaction.data.model || model,
      durationMs: Date.now() - startedAt,
      requestCount: 1,
      inputTokens: usage?.total_input_tokens ?? null,
      outputTokens: usage?.total_output_tokens ?? null,
      thoughtTokens: usage?.total_thought_tokens ?? null,
      toolUseTokens: usage?.total_tool_use_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      groundingQueryCount: usage?.grounding_tool_count
        ?.filter((item) => item.type === "google_maps")
        .reduce((sum, item) => sum + (item.count ?? 0), 0) ?? null,
    },
  };
}

async function resolveWithGooglePlaces(
  analysis: MatpinAnalysis,
  apiKey: string,
  options: MatpinPlaceResolutionOptions,
): Promise<MatpinPlaceResolutionResult> {
  const startedAt = Date.now();
  const clues = analysis.places.slice(0, 3);
  const resolved = await Promise.all(clues.map(async (clue) => {
    const placeTypeHint = queryTypeHint(clue.placeType);
    const textQuery = [clue.name, clue.branch, ...clue.regionHints.slice(0, 2)]
      .concat(placeTypeHint ? [placeTypeHint] : [])
      .filter(Boolean)
      .join(" ");
    const countryCode = countryCodeForPlace(clue, clue.regionHints.join(" "));
    const includedType = clue.placeType ? GOOGLE_PLACE_TYPES[clue.placeType] : undefined;
    let response: Response;
    try {
      response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
          "x-goog-fieldmask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.googleMapsUri",
            "places.primaryTypeDisplayName",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery,
          languageCode: googleLanguageCode(countryCode),
          pageSize: 3,
          ...(includedType ? { includedType, strictTypeFiltering: true } : {}),
        }),
        signal: matpinDeadlineSignal(options.deadline, GOOGLE_PLACES_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof MatpinDeadlineExceededError) throw error;
      const timeout = error instanceof Error && error.name === "TimeoutError";
      throw new MatpinAnalysisError(timeout ? "place_search_timeout" : "place_search_unavailable", true);
    }
    if (!response.ok) {
      throw new MatpinAnalysisError("place_search_upstream", response.status === 429 || response.status >= 500);
    }

    const parsed = googlePlacesTextSearchSchema.safeParse(await response.json());
    if (!parsed.success) throw new MatpinAnalysisError("place_search_invalid_response", true);
    const place = parsed.data.places.find((candidate) => namesOverlap(clue.name, candidate.displayName.text))
      ?? parsed.data.places[0];
    if (!place) return null;

    return matpinPlaceCandidateSchema.parse({
      id: place.id,
      name: place.displayName.text,
      placeType: placeTypeFor(clue, place.primaryTypeDisplayName?.text ?? ""),
      countryCode: countryCodeForPlace(clue, place.formattedAddress),
      regionName: regionNameFromAddress(
        place.formattedAddress,
        countryCodeForPlace(clue, place.formattedAddress),
      ),
      area: areaFromAddress(place.formattedAddress),
      category: `Google Maps · ${place.primaryTypeDisplayName?.text || "장소"}`,
      address: place.formattedAddress,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      mapUrl: place.googleMapsUri,
      confidence: candidateConfidence({
        clueName: clue.name,
        clueRegion: clue.regionHints[0],
        clueConfidence: clue.confidence,
        candidateName: place.displayName.text,
        candidateAddress: place.formattedAddress,
      }),
      matchReason: matchReason(analysis, clue),
    });
  }));

  const candidates = resolved
    .filter((candidate): candidate is MatpinPlaceCandidate => candidate !== null)
    .filter((candidate, index, all) => all.findIndex((other) => other.id === candidate.id) === index)
    .slice(0, 3);
  return {
    candidates,
    metrics: {
      provider: "google_places",
      model: null,
      durationMs: Date.now() - startedAt,
      requestCount: clues.length,
      inputTokens: null,
      outputTokens: null,
      thoughtTokens: null,
      toolUseTokens: null,
      totalTokens: null,
      groundingQueryCount: null,
    },
  };
}

async function resolveWithKakaoLocal(
  analysis: MatpinAnalysis,
  apiKey: string,
  options: MatpinPlaceResolutionOptions,
): Promise<MatpinPlaceResolutionResult> {
  const startedAt = Date.now();
  const clues = analysis.places.slice(0, 3);
  const resolved = await Promise.all(clues.map(async (clue) => {
    const query = [clue.name, clue.branch, ...clue.regionHints.slice(0, 2)]
      .filter(Boolean)
      .join(" ");
    const params = new URLSearchParams({ query, size: "5" });
    const categoryGroupCode = clue.placeType
      ? Object.entries(KAKAO_PLACE_TYPE_CODES)
        .find(([, placeType]) => placeType === clue.placeType)?.[0]
      : undefined;
    if (categoryGroupCode) params.set("category_group_code", categoryGroupCode);
    let response: Response;
    try {
      response = await fetch(`${KAKAO_LOCAL_URL}?${params.toString()}`, {
        headers: { authorization: `KakaoAK ${apiKey}` },
        signal: matpinDeadlineSignal(options.deadline, KAKAO_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof MatpinDeadlineExceededError) throw error;
      throw new MatpinAnalysisError("place_search_unavailable", true);
    }
    if (!response.ok) {
      throw new MatpinAnalysisError("place_search_upstream", response.status === 429 || response.status >= 500);
    }
    const parsed = kakaoResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new MatpinAnalysisError("place_search_invalid_response", true);
    const document = parsed.data.documents.find((candidate) =>
      namesOverlap(clue.name, candidate.place_name)
    ) ?? parsed.data.documents[0];
    if (!document) return null;

    const address = document.road_address_name || document.address_name;
    const placeType = placeTypeFor(clue, document.category_name, document.category_group_code);
    const countryCode = countryCodeForPlace(clue, address);
    return matpinPlaceCandidateSchema.parse({
      id: document.id,
      name: document.place_name,
      placeType,
      countryCode,
      regionName: regionNameFromAddress(address, countryCode),
      area: areaFromAddress(address),
      category: document.category_name,
      address,
      latitude: Number(document.y),
      longitude: Number(document.x),
      mapUrl: document.place_url,
      confidence: candidateConfidence({
        clueName: clue.name,
        clueRegion: clue.regionHints[0],
        clueConfidence: clue.confidence,
        candidateName: document.place_name,
        candidateAddress: address,
      }),
      matchReason: matchReason(analysis, clue),
    });
  }));

  return {
    candidates: resolved
      .filter((candidate): candidate is MatpinPlaceCandidate => candidate !== null)
      .filter((candidate, index, all) => all.findIndex((other) => other.id === candidate.id) === index)
      .slice(0, 3),
    metrics: {
      provider: "kakao_local",
      model: null,
      durationMs: Date.now() - startedAt,
      requestCount: clues.length,
      inputTokens: null,
      outputTokens: null,
      thoughtTokens: null,
      toolUseTokens: null,
      totalTokens: null,
      groundingQueryCount: null,
    },
  };
}

export async function resolveMatpinPlacesWithMetrics(
  analysis: MatpinAnalysis,
  options: MatpinPlaceResolutionOptions = {},
): Promise<MatpinPlaceResolutionResult> {
  if (analysis.status === "insufficient" || analysis.places.length === 0) {
    return {
      candidates: [],
      metrics: {
        provider: "none",
        model: null,
        durationMs: 0,
        requestCount: 0,
        inputTokens: null,
        outputTokens: null,
        thoughtTokens: null,
        toolUseTokens: null,
        totalTokens: null,
        groundingQueryCount: null,
      },
    };
  }
  const googlePlacesKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const kakaoKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!hasExplicitForeignRegion(analysis) && kakaoKey) {
    const kakaoResult = await resolveWithKakaoLocal(analysis, kakaoKey, options);
    if (kakaoResult.candidates.length > 0) return kakaoResult;
  }
  if (googlePlacesKey) return resolveWithGooglePlaces(analysis, googlePlacesKey, options);
  return resolveWithGeminiMaps(analysis, options);
}

export async function resolveMatpinPlaces(
  analysis: MatpinAnalysis,
  options: MatpinPlaceResolutionOptions = {},
): Promise<MatpinPlaceCandidate[]> {
  return (await resolveMatpinPlacesWithMetrics(analysis, options)).candidates;
}
