import { instagramMediaId, normalizeInstagramMediaUrl } from "@/lib/matpick-dm-contract";
import {
  matpinInboundMessageSchema,
  type MatpinAttachmentType,
  type MatpinInboundMessage,
} from "@/lib/matpin/contract";
import { MatpinConfigurationError } from "@/lib/matpin/security";
import { ingestMatpinBackfillMessage } from "@/lib/matpin/store";

const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES_PER_CONVERSATION = 20;
const SUPPORTED_ATTACHMENT_TYPES = new Set(["share", "media", "ig_reel", "reel"]);

type UnknownRecord = Record<string, unknown>;

export type MatpinBackfillResult = {
  conversations: number;
  scanned: number;
  eligible: number;
  accepted: number;
  duplicates: number;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function nestedString(record: UnknownRecord, path: string[]): string | null {
  let current: unknown = record;
  for (const key of path) {
    const object = asRecord(current);
    if (!object) return null;
    current = object[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function attachmentRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.map(asRecord).filter((item): item is UnknownRecord => Boolean(item));
  const record = asRecord(value);
  const data = record?.data;
  return Array.isArray(data) ? data.map(asRecord).filter((item): item is UnknownRecord => Boolean(item)) : [];
}

function attachmentUrl(attachment: UnknownRecord): string | null {
  const paths = [
    ["payload", "url"],
    ["image_data", "url"],
    ["image_data", "preview_url"],
    ["video_data", "url"],
    ["video_data", "preview_url"],
    ["share", "url"],
    ["url"],
    ["file_url"],
  ];
  for (const path of paths) {
    const value = nestedString(attachment, path);
    if (value) return value;
  }
  return null;
}

function storedAttachmentType(value: string | null): MatpinAttachmentType {
  if (value === "ig_reel" || value === "reel") return value;
  return "share";
}

function instagramAssetId(value: string): string | null {
  try {
    const assetId = new URL(value).searchParams.get("asset_id")?.trim();
    return assetId && /^\d{5,50}$/.test(assetId) ? assetId : null;
  } catch {
    return null;
  }
}

function isoTimestamp(value: string): string | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeMatpinConversationMessage(
  value: unknown,
  accountId: string,
): MatpinInboundMessage | null {
  const message = asRecord(value);
  const messageId = message && typeof message.id === "string" ? message.id.trim() : "";
  const senderId = message ? nestedString(message, ["from", "id"]) : null;
  const receivedAt = message && typeof message.created_time === "string"
    ? isoTimestamp(message.created_time.trim())
    : null;
  if (!message || !messageId || !senderId || senderId === accountId || !receivedAt) return null;

  const text = typeof message.message === "string" ? message.message.trim() : "";
  const textMediaUrl = text ? normalizeInstagramMediaUrl(text) : null;
  let mediaUrl = textMediaUrl;
  let attachmentType: MatpinAttachmentType = "share";

  if (!mediaUrl) {
    for (const attachment of attachmentRecords(message.attachments)) {
      const rawType = typeof attachment.type === "string"
        ? attachment.type.trim().toLowerCase()
        : typeof attachment.attachment_type === "string"
          ? attachment.attachment_type.trim().toLowerCase()
          : null;
      const url = attachmentUrl(attachment);
      if (!url) continue;

      const sharedInstagramUrl = normalizeInstagramMediaUrl(url);
      if (!sharedInstagramUrl && (!rawType || !SUPPORTED_ATTACHMENT_TYPES.has(rawType))) continue;

      mediaUrl = url;
      attachmentType = storedAttachmentType(rawType);
      break;
    }
  }

  if (!mediaUrl) return null;
  const reelUrl = normalizeInstagramMediaUrl(mediaUrl);
  const reelId = reelUrl
    ? instagramMediaId(reelUrl)
    : instagramAssetId(mediaUrl);

  const parsed = matpinInboundMessageSchema.safeParse({
    metaMessageId: messageId,
    senderScopedId: senderId,
    recipientAccountId: accountId,
    reelId: reelId ?? `message-${messageId}`,
    reelUrl,
    mediaUrl,
    attachmentType,
    receivedAt,
  });
  return parsed.success ? parsed.data : null;
}

async function graphGet(path: string, params: Record<string, string>): Promise<UnknownRecord> {
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim();
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim();
  if (!accessToken || !graphVersion || !SAFE_GRAPH_VERSION.test(graphVersion)) {
    throw new MatpinConfigurationError("meta_backfill_not_configured");
  }

  const url = new URL(`https://graph.instagram.com/${graphVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`meta_backfill_fetch_failed:${response.status}`);
  const body = asRecord(await response.json());
  if (!body) throw new Error("meta_backfill_invalid_response");
  return body;
}

function dataRecords(body: UnknownRecord): UnknownRecord[] {
  return Array.isArray(body.data)
    ? body.data.map(asRecord).filter((item): item is UnknownRecord => Boolean(item))
    : [];
}

export async function backfillMatpinConversationHistory(): Promise<MatpinBackfillResult> {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  if (!accountId) throw new MatpinConfigurationError("meta_account_not_configured");

  const conversationsBody = await graphGet(`${accountId}/conversations`, {
    platform: "instagram",
    fields: "id",
    limit: String(MAX_CONVERSATIONS),
  });
  const conversations = dataRecords(conversationsBody).slice(0, MAX_CONVERSATIONS);
  const result: MatpinBackfillResult = {
    conversations: conversations.length,
    scanned: 0,
    eligible: 0,
    accepted: 0,
    duplicates: 0,
  };

  for (const conversation of conversations) {
    const conversationId = typeof conversation.id === "string" ? conversation.id.trim() : "";
    if (!conversationId) continue;
    const messagesBody = await graphGet(`${conversationId}/messages`, {
      fields: "id,created_time,from,to,message,attachments",
      limit: String(MAX_MESSAGES_PER_CONVERSATION),
    });
    const messages = dataRecords(messagesBody).slice(0, MAX_MESSAGES_PER_CONVERSATION);
    result.scanned += messages.length;

    for (const message of messages) {
      const normalized = normalizeMatpinConversationMessage(message, accountId);
      if (!normalized) continue;
      result.eligible += 1;
      const ingested = await ingestMatpinBackfillMessage(normalized);
      if (ingested.accepted) result.accepted += 1;
      if (ingested.duplicate) result.duplicates += 1;
    }
  }

  return result;
}
