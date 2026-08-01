import { z } from "zod";

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

export const matpickDmCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  area: z.string().min(1),
  category: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  mapUrl: z.string().url(),
  confidence: z.number().min(0).max(1),
  matchReason: z.string().min(1),
});

export const matpickDmResponseSchema = z.object({
  mode: z.literal("mock"),
  source: z.literal("instagram_dm"),
  sender: z.object({
    scopedId: z.literal("device-demo-user"),
    label: z.literal("이 기기의 데모 사용자"),
  }),
  messageId: z.string().min(1),
  reel: z.object({
    id: z.string().min(1),
    url: z.string().url(),
    creator: z.string().min(1),
    title: z.string().min(1),
    thumbnailUrl: z.string().min(1).nullable(),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  }),
  status: z.literal("needs_confirmation"),
  candidates: z.array(matpickDmCandidateSchema).min(1).max(3),
  receivedAt: z.string().datetime(),
  notice: z.string().min(1),
});

export const matpickDmRequestSchema = z.object({
  reelUrl: z.string().trim().min(1),
});

export type MatpickDmCandidate = z.infer<typeof matpickDmCandidateSchema>;
export type MatpickDmResponse = z.infer<typeof matpickDmResponseSchema>;

export function normalizeInstagramReelUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !INSTAGRAM_HOSTS.has(url.hostname)) return null;

    const match = url.pathname.match(/^\/reel\/([A-Za-z0-9_-]+)\/?$/);
    if (!match) return null;

    return `https://www.instagram.com/reel/${match[1]}/`;
  } catch {
    return null;
  }
}

export function instagramReelId(value: string): string | null {
  return normalizeInstagramReelUrl(value)?.match(/\/reel\/([A-Za-z0-9_-]+)\//)?.[1] ?? null;
}
