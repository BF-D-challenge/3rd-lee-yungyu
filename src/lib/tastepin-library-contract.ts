import { z } from "zod";

export const tastepinYoutubeMentionSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  kind: z.enum(["shorts", "video"]).default("video"),
  title: z.string().min(1),
  channel: z.string().min(1),
  duration: z.string().min(1),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  viewCount: z.number().int().nonnegative().nullable().default(null),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

export const tastepinInstagramMentionSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/),
  kind: z.enum(["post", "reel"]),
  title: z.string().min(1),
  creator: z.string().min(1),
  url: z.string().url(),
  embedUrl: z.string().url(),
  thumbnailUrl: z.string().min(1).nullable().default(null),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

export const tastepinStationCollectionSchema = z.object({
  id: z.string().min(1),
  station: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  placeIds: z.array(z.string().min(1)).min(1),
});

export const tastepinLibraryPlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  area: z.string().min(1),
  category: z.string().min(1),
  occasion: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distanceMeters: z.number().int().nonnegative(),
  mapUrl: z.string().url(),
  source: z.object({
    platform: z.enum(["instagram_post", "instagram_reel", "youtube_shorts"]),
    creator: z.string().min(1),
    url: z.string().url().nullable(),
  }),
  instagramMentions: z.array(tastepinInstagramMentionSchema).max(3).default([]),
  youtubeMentions: z.array(tastepinYoutubeMentionSchema).max(4).default([]),
  savedAt: z.string().datetime(),
});

export const tastepinLibraryResponseSchema = z.object({
  mode: z.literal("demo"),
  collection: z.object({
    title: z.string().min(1),
    visibility: z.literal("private"),
    updatedAt: z.string().datetime(),
  }),
  origin: z.object({
    mode: z.enum(["demo_station", "device"]),
    label: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  ranking: z.object({
    metric: z.literal("youtube_total_views"),
    label: z.string().min(1),
    checkedAt: z.string().datetime(),
    caveat: z.string().min(1),
  }),
  stationCollections: z.array(tastepinStationCollectionSchema).min(1),
  places: z.array(tastepinLibraryPlaceSchema),
});

export type TastepinInstagramMention = z.infer<typeof tastepinInstagramMentionSchema>;
export type TastepinStationCollection = z.infer<typeof tastepinStationCollectionSchema>;
export type TastepinYoutubeMention = z.infer<typeof tastepinYoutubeMentionSchema>;
export type TastepinLibraryPlace = z.infer<typeof tastepinLibraryPlaceSchema>;
export type TastepinLibraryResponse = z.infer<typeof tastepinLibraryResponseSchema>;
