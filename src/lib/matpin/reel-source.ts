import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import { normalizeInstagramMediaUrl } from "@/lib/matpick-dm-contract";
import { MatpinAnalysisError } from "@/lib/matpin/analysis-error";

const EMBED_TIMEOUT_MS = 12_000;
const COMMENTS_TIMEOUT_MS = 8_000;
const MAX_EMBED_BYTES = 2 * 1024 * 1024;
const MAX_CAPTION_CHARS = 6_000;
const MAX_COMMENT_CHARS = 1_000;

const embeddedMediaSchema = z.object({
  id: z.string().min(1),
  shortcode: z.string().min(1),
  video_url: z.string().url().optional(),
  display_url: z.string().url().optional(),
  thumbnail_src: z.string().url().optional(),
  owner: z.object({
    username: z.string().optional(),
  }).passthrough().optional(),
  edge_media_to_caption: z.object({
    edges: z.array(z.object({
      node: z.object({ text: z.string() }),
    })).max(4),
  }).optional(),
  edge_sidecar_to_children: z.object({
    edges: z.array(z.object({
      node: z.object({
        video_url: z.string().url().optional(),
        display_url: z.string().url().optional(),
      }).passthrough(),
    })).max(20),
  }).optional(),
}).passthrough();

const commentsResponseSchema = z.object({
  data: z.array(z.object({
    text: z.string().trim().min(1).max(10_000),
    like_count: z.number().int().nonnegative().optional(),
    from: z.object({
      username: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough()).max(100),
});

export type MatpinReelSource = {
  caption: string | null;
  creatorComments: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  mediaUrls: string[];
};

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

async function validatePublicInstagramHost(hostname: string): Promise<void> {
  if (hostname !== "www.instagram.com" && hostname !== "instagram.com") {
    throw new MatpinAnalysisError("reel_source_not_allowed", false);
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((item) => isPrivateIp(item.address))) {
    throw new MatpinAnalysisError("reel_source_private", false);
  }
}

async function readLimitedText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_EMBED_BYTES) {
    throw new MatpinAnalysisError("reel_source_too_large", false);
  }
  if (!response.body) throw new MatpinAnalysisError("reel_source_body_missing", true);

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  const reader = response.body.getReader();
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_EMBED_BYTES) {
      await reader.cancel();
      throw new MatpinAnalysisError("reel_source_too_large", false);
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}

function extractBalancedObject(source: string, start: number): string | null {
  let index = source.indexOf("{", start);
  if (index < 0) return null;
  const beginning = index;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(beginning, index + 1);
    }
  }
  return null;
}

function findEmbeddedMedia(value: unknown, depth = 0): z.infer<typeof embeddedMediaSchema> | null {
  if (depth > 12) return null;
  if (typeof value === "string") {
    if (!value.includes('"shortcode_media"') || !value.includes('"gql_data"')) return null;
    try {
      const parsed = JSON.parse(value) as { gql_data?: { shortcode_media?: unknown } };
      const media = embeddedMediaSchema.safeParse(parsed.gql_data?.shortcode_media);
      return media.success ? media.data : null;
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const media = findEmbeddedMedia(item, depth + 1);
      if (media) return media;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const media = findEmbeddedMedia(item, depth + 1);
      if (media) return media;
    }
  }
  return null;
}

export function parseInstagramEmbedSource(html: string): {
  mediaId: string;
  ownerUsername: string | null;
  source: MatpinReelSource;
} | null {
  let cursor = 0;
  while (cursor < html.length) {
    const handleStart = html.indexOf("s.handle(", cursor);
    if (handleStart < 0) break;
    const objectText = extractBalancedObject(html, handleStart + "s.handle(".length);
    cursor = handleStart + "s.handle(".length;
    if (!objectText) continue;
    try {
      const media = findEmbeddedMedia(JSON.parse(objectText));
      if (!media) continue;
      const caption = media.edge_media_to_caption?.edges[0]?.node.text.trim() || null;
      const mediaUrls = media.edge_sidecar_to_children?.edges
        .map(({ node }) => node.video_url ?? node.display_url)
        .filter((value): value is string => Boolean(value))
        .slice(0, 3)
        ?? [];
      if (mediaUrls.length === 0) {
        const primaryMediaUrl = media.video_url ?? media.display_url ?? media.thumbnail_src;
        if (primaryMediaUrl) mediaUrls.push(primaryMediaUrl);
      }
      return {
        mediaId: media.id,
        ownerUsername: media.owner?.username?.trim() || null,
        source: {
          caption: caption?.slice(0, MAX_CAPTION_CHARS) ?? null,
          creatorComments: [],
          videoUrl: media.video_url ?? null,
          thumbnailUrl: media.display_url ?? media.thumbnail_src ?? null,
          mediaUrls,
        },
      };
    } catch {
      // 다른 ServerJS 블록을 계속 확인한다.
    }
  }
  return null;
}

async function readCreatorComments(
  mediaId: string,
  ownerUsername: string | null,
  fetchImpl: typeof fetch,
): Promise<string[]> {
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!accessToken) return [];
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v25.0";
  const fields = "text,from,like_count";
  const url = new URL(`https://graph.instagram.com/${version}/${mediaId}/comments`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "50");
  url.searchParams.set("access_token", accessToken);
  try {
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(COMMENTS_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return [];
    const parsed = commentsResponseSchema.safeParse(await response.json());
    if (!parsed.success) return [];
    return parsed.data.data
      .filter((comment) => !ownerUsername || comment.from?.username === ownerUsername)
      .sort((left, right) => (right.like_count ?? 0) - (left.like_count ?? 0))
      .slice(0, 8)
      .map((comment) => comment.text.slice(0, MAX_COMMENT_CHARS));
  } catch {
    return [];
  }
}

async function loadInstagramEmbed(
  reelUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ReturnType<typeof parseInstagramEmbedSource>> {
  const normalized = normalizeInstagramMediaUrl(reelUrl);
  if (!normalized) return null;
  const url = new URL(normalized);
  await validatePublicInstagramHost(url.hostname);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/embed/captioned/`;
  url.search = "";
  url.hash = "";

  let response: Response;
  try {
    response = await fetchImpl(url, {
      redirect: "manual",
      headers: {
        accept: "text/html",
        "user-agent": "Mozilla/5.0 (compatible; Matpin/1.0)",
      },
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    throw new MatpinAnalysisError(timeout ? "reel_source_timeout" : "reel_source_unavailable", true);
  }
  if (!response.ok) {
    throw new MatpinAnalysisError("reel_source_unavailable", response.status >= 500);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("text/html")) {
    throw new MatpinAnalysisError("reel_source_invalid_type", false);
  }

  return parseInstagramEmbedSource(await readLimitedText(response));
}

export async function loadInstagramReelPreview(
  reelUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const parsed = await loadInstagramEmbed(reelUrl, fetchImpl);
  if (!parsed) return null;
  return parsed.source.thumbnailUrl;
}

export async function loadInstagramReelPresentation(
  reelUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{
  thumbnailUrl: string | null;
  videoUrl: string | null;
  ownerUsername: string | null;
} | null> {
  const parsed = await loadInstagramEmbed(reelUrl, fetchImpl);
  if (!parsed) return null;
  return {
    thumbnailUrl: parsed.source.thumbnailUrl,
    videoUrl: parsed.source.videoUrl,
    ownerUsername: parsed.ownerUsername,
  };
}

export async function loadInstagramReelSource(
  reelUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<MatpinReelSource | null> {
  const parsed = await loadInstagramEmbed(reelUrl, fetchImpl);
  if (!parsed) return null;
  const creatorComments = await readCreatorComments(
    parsed.mediaId,
    parsed.ownerUsername,
    fetchImpl,
  );
  return { ...parsed.source, creatorComments };
}
