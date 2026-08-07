import { z } from "zod";
import {
  matpinPlaceCandidateSchema,
  type MatpinAnalysis,
  type MatpinPlaceCandidate,
} from "@/lib/matpin/contract";
import { MatpinAnalysisError } from "@/lib/matpin/analysis-error";

const KAKAO_LOCAL_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_TIMEOUT_MS = 8_000;
const GEMINI_INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const GEMINI_MAPS_TIMEOUT_MS = 30_000;

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

function normalizedName(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[^0-9a-z가-힣]/g, "");
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

function bestClueForCandidate(analysis: MatpinAnalysis, candidateName: string) {
  const candidate = normalizedName(candidateName);
  return analysis.places.find((clue) => {
    const clueName = normalizedName(clue.name);
    return candidate.includes(clueName) || clueName.includes(candidate);
  }) ?? analysis.places[0];
}

async function resolveWithGeminiMaps(analysis: MatpinAnalysis): Promise<MatpinPlaceCandidate[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.ALLSALE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new MatpinAnalysisError("place_search_not_configured", false);

  const clues = analysis.places.slice(0, 3);
  const query = clues.map((clue, index) =>
    `${index + 1}. ${[clue.name, clue.branch, clue.regionHints.join(" ")].filter(Boolean).join(" ")}`,
  ).join("\n");
  let response: Response;
  try {
    response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: process.env.MATPIN_GEMINI_MODEL?.trim() || "gemini-3.6-flash",
        input: `Find each exact restaurant, cafe, shop, or visitable place in South Korea matching the numbered clues below:\n${query}\nUse only verified Google Maps place results. Return at most one best result per clue and at most three results total. Return the Korean place name and address when available. Skip a clue when no verified place matches.`,
        tools: [{ type: "google_maps" }],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: geminiMapsJsonSchema,
        },
        store: false,
      }),
      signal: AbortSignal.timeout(GEMINI_MAPS_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
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

  return parsed.places.flatMap((candidate, index) => {
    const candidateName = normalizedName(candidate.name);
    const grounded = groundedPlaces.find((place) => {
      if (!place.name) return false;
      const name = groundedName(place.name);
      return Boolean(name) && (candidateName.includes(name) || name.includes(candidateName));
    }) ?? (parsed.places.length === groundedPlaces.length ? groundedPlaces[index] : undefined)
      ?? (parsed.places.length === 1 && groundedPlaces.length === 1 ? groundedPlaces[0] : undefined);
    if (!grounded?.url) return [];
    const clue = bestClueForCandidate(analysis, candidate.name);
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
}

export async function resolveMatpinPlaces(analysis: MatpinAnalysis): Promise<MatpinPlaceCandidate[]> {
  if (analysis.status === "insufficient" || analysis.places.length === 0) return [];
  const key = process.env.KAKAO_REST_API_KEY?.trim();
  if (!key) return resolveWithGeminiMaps(analysis);

  const clue = analysis.places[0];
  const query = [clue.name, clue.branch, clue.regionHints[0]].filter(Boolean).join(" ");
  const params = new URLSearchParams({ query, size: "5" });
  let response: Response;
  try {
    response = await fetch(`${KAKAO_LOCAL_URL}?${params.toString()}`, {
      headers: { authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(KAKAO_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new MatpinAnalysisError("place_search_unavailable", true);
  }
  if (!response.ok) {
    throw new MatpinAnalysisError("place_search_upstream", response.status === 429 || response.status >= 500);
  }
  const parsed = kakaoResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new MatpinAnalysisError("place_search_invalid_response", true);

  return parsed.data.documents
    .filter((document) => document.category_group_code === "FD6" || document.category_group_code === "CE7")
    .slice(0, 3)
    .map((document) => {
      const address = document.road_address_name || document.address_name;
      return matpinPlaceCandidateSchema.parse({
        id: document.id,
        name: document.place_name,
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
        matchReason: matchReason(analysis),
      });
    });
}
