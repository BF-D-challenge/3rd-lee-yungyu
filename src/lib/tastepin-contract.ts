import { z } from "zod";

export const TASTEPIN_GEMINI_MODEL =
  process.env.TASTEPIN_GEMINI_MODEL?.trim() || "gemini-3.6-flash";

const YOUTUBE_SHORTS_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function normalizeYouTubeShortsUrl(value: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || !YOUTUBE_SHORTS_HOSTS.has(parsed.hostname)) {
    return null;
  }

  const match = parsed.pathname.match(/^\/shorts\/([^/]+)\/?$/);
  if (!match || !YOUTUBE_VIDEO_ID.test(match[1])) return null;

  return `https://www.youtube.com/shorts/${match[1]}`;
}

export const tastepinEvidenceSchema = z.object({
  kind: z.enum(["speech", "on_screen_text", "visual_sign", "video_metadata"]),
  text: z.string().trim().min(1).max(180),
  timestampSeconds: z.number().int().min(0).max(3600).nullable(),
});

export const tastepinPlaceClueSchema = z.object({
  name: z.string().trim().min(1).max(120),
  branch: z.string().trim().min(1).max(80).nullable(),
  menus: z.array(z.string().trim().min(1).max(80)).max(8),
  regionHints: z.array(z.string().trim().min(1).max(80)).max(6),
  confidence: z.number().min(0).max(1),
  evidence: z.array(tastepinEvidenceSchema).min(1).max(8),
});

export const tastepinExtractionSchema = z.object({
  status: z.enum(["resolved", "insufficient"]),
  summary: z.string().trim().min(1).max(240),
  places: z.array(tastepinPlaceClueSchema).max(3),
}).superRefine((value, context) => {
  if (value.status === "resolved" && value.places.length === 0) {
    context.addIssue({
      code: "custom",
      message: "resolved 결과에는 장소 단서가 하나 이상 필요합니다.",
      path: ["places"],
    });
  }
  if (value.status === "insufficient" && value.places.length > 0) {
    context.addIssue({
      code: "custom",
      message: "insufficient 결과에는 장소 단서를 포함하지 않습니다.",
      path: ["places"],
    });
  }
});

export type TastepinExtraction = z.infer<typeof tastepinExtractionSchema>;

export const tastepinMapCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string(),
  address: z.string(),
  roadAddress: z.string(),
  phone: z.string(),
  longitude: z.string(),
  latitude: z.string(),
  mapUrl: z.string().url(),
});

export type TastepinMapCandidate = z.infer<typeof tastepinMapCandidateSchema>;

export const tastepinResolveResponseSchema = z.object({
  mode: z.literal("live"),
  platform: z.literal("youtube_shorts"),
  extraction: tastepinExtractionSchema,
  mapStatus: z.enum(["not_configured", "candidates", "no_match", "error"]),
  mapCandidates: z.array(tastepinMapCandidateSchema).max(3),
});

export type TastepinResolveResponse = z.infer<typeof tastepinResolveResponseSchema>;

export const tastepinGeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["resolved", "insufficient"],
      description: "식당 이름을 직접 확인한 경우에만 resolved",
    },
    summary: {
      type: "string",
      description: "확인 결과를 과장 없이 설명하는 짧은 한국어 문장",
    },
    places: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "영상에서 직접 확인한 식당 이름" },
          branch: {
            type: ["string", "null"],
            description: "영상에서 직접 확인한 지점명. 없으면 null",
          },
          menus: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
          regionHints: {
            type: "array",
            maxItems: 6,
            items: { type: "string" },
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "제공된 영상 근거만을 기준으로 한 확신도",
          },
          evidence: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                kind: {
                  type: "string",
                  enum: ["speech", "on_screen_text", "visual_sign", "video_metadata"],
                },
                text: {
                  type: "string",
                  description: "영상에서 직접 확인한 짧은 근거",
                },
                timestampSeconds: {
                  type: ["integer", "null"],
                  minimum: 0,
                  maximum: 3600,
                },
              },
              required: ["kind", "text", "timestampSeconds"],
            },
          },
        },
        required: [
          "name",
          "branch",
          "menus",
          "regionHints",
          "confidence",
          "evidence",
        ],
      },
    },
  },
  required: ["status", "summary", "places"],
} as const;
