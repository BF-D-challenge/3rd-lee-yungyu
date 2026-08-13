import { z } from "zod";
import {
  matpinAdminReplyWindow,
  type MatpinAdminMessagePreview,
  type MatpinAdminProfile,
} from "@/lib/matpin/admin-contract";
import { MatpinConfigurationError } from "@/lib/matpin/security";

const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;
const CONVERSATION_LIMIT = 20;
const MESSAGE_LIMIT = 20;
const CONVERSATION_MESSAGE_FIELDS = "messages{id,created_time,from,to,message,attachments,is_unsupported}";
const REPLY_GUARD_MESSAGE_FIELDS = "messages{id,created_time,from,to}";

type UnknownRecord = Record<string, unknown>;

export type MatpinInstagramConversation = {
  id: string;
  updatedAt: string;
  recipientId: string;
  profile: MatpinAdminProfile;
  messages: MatpinAdminMessagePreview[];
  canReply: boolean;
  replyWindowEndsAt: string | null;
};

export type MatpinInstagramConversationPage = {
  conversations: MatpinInstagramConversation[];
  nextCursor: string | null;
  partial: boolean;
};

export type MatpinInstagramReplyGuard = {
  recipientId: string;
  canReply: boolean;
  replyWindowEndsAt: string | null;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function dataRecords(value: unknown): UnknownRecord[] {
  const record = asRecord(value);
  return Array.isArray(record?.data)
    ? record.data.map(asRecord).filter((item): item is UnknownRecord => Boolean(item))
    : [];
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

function isoTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function graphConfiguration() {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim();
  const version = process.env.META_GRAPH_API_VERSION?.trim();
  if (!accountId || !accessToken || !version || !SAFE_GRAPH_VERSION.test(version)) {
    throw new MatpinConfigurationError("meta_admin_not_configured");
  }
  return { accountId, accessToken, version };
}

async function graphGet(path: string, params: Record<string, string>): Promise<UnknownRecord> {
  const { accessToken, version } = graphConfiguration();
  const url = new URL(`https://graph.instagram.com/${version}/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`meta_admin_fetch_failed:${response.status}`);
  const body = asRecord(await response.json());
  if (!body) throw new Error("meta_admin_invalid_response");
  return body;
}

function attachmentKind(value: unknown): MatpinAdminMessagePreview["attachmentKind"] {
  const first = dataRecords(value)[0] ?? (Array.isArray(value) ? asRecord(value[0]) : null);
  const type = first && typeof first.type === "string"
    ? first.type.toLowerCase()
    : first && typeof first.attachment_type === "string"
      ? first.attachment_type.toLowerCase()
      : null;
  if (!type) return null;
  if (type.includes("image")) return "image";
  if (type.includes("video") || type.includes("reel")) return "video";
  if (type.includes("share") || type.includes("media")) return "share";
  return "other";
}

export function normalizeMatpinAdminConversationMessages(
  value: unknown,
  accountId: string,
): { recipientId: string | null; messages: MatpinAdminMessagePreview[] } {
  const records = dataRecords(value);
  let recipientId: string | null = null;
  const messages: MatpinAdminMessagePreview[] = [];
  const seenMessageIds = new Set<string>();

  for (const message of records) {
    const id = typeof message.id === "string" ? message.id.trim() : "";
    const createdAt = isoTimestamp(message.created_time);
    const fromId = nestedString(message, ["from", "id"]);
    const toIds = [...new Set(dataRecords(message.to)
      .map((item) => nestedString(item, ["id"]))
      .filter((item): item is string => Boolean(item)))];
    if (!id || !createdAt || !fromId || seenMessageIds.has(id)) continue;

    const isOutbound = fromId === accountId;
    const nonAccountParticipants = [...new Set(
      [fromId, ...toIds].filter((participantId) => participantId !== accountId),
    )];
    // A one-to-one conversation must include the configured account and one
    // counterpart.  Do not infer direction from malformed or group traffic.
    if (nonAccountParticipants.length !== 1) continue;
    if (!isOutbound && !toIds.includes(accountId)) continue;
    if (isOutbound && !toIds.some((participantId) => participantId !== accountId)) continue;

    const counterpartId = nonAccountParticipants[0];
    if (recipientId && recipientId !== counterpartId) {
      return { recipientId: null, messages: [] };
    }
    recipientId = counterpartId;
    seenMessageIds.add(id);
    if (messages.length >= MESSAGE_LIMIT) continue;
    messages.push({
      id,
      direction: isOutbound ? "outbound" : "inbound",
      text: typeof message.message === "string" && message.message.trim()
        ? message.message.trim().slice(0, 2_000)
        : null,
      attachmentKind: attachmentKind(message.attachments),
      createdAt,
    });
  }

  return {
    recipientId,
    messages: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  };
}

async function readProfile(recipientId: string): Promise<MatpinAdminProfile> {
  try {
    const body = await graphGet(recipientId, { fields: "name,username" });
    return {
      name: typeof body.name === "string" ? body.name.trim().slice(0, 120) || null : null,
      username: typeof body.username === "string" ? body.username.trim().slice(0, 120) || null : null,
    };
  } catch {
    return { name: null, username: null };
  }
}

async function readConversationMessages(
  conversationId: string,
  fields: string,
) {
  const id = z.string().trim().min(1).max(500).regex(/^[A-Za-z0-9_:-]+$/).parse(conversationId);
  const { accountId } = graphConfiguration();
  const body = await graphGet(id, { fields });
  const normalized = normalizeMatpinAdminConversationMessages(body.messages, accountId);
  if (!normalized.recipientId) throw new Error("meta_admin_recipient_unavailable");
  return { id, normalized };
}

function replyGuardFromMessages(
  normalized: ReturnType<typeof normalizeMatpinAdminConversationMessages>,
): MatpinInstagramReplyGuard {
  if (!normalized.recipientId) throw new Error("meta_admin_recipient_unavailable");
  const latestInboundAt = normalized.messages
    .filter((message) => message.direction === "inbound")
    .at(-1)?.createdAt ?? null;
  const replyWindow = matpinAdminReplyWindow(latestInboundAt);
  return {
    recipientId: normalized.recipientId,
    canReply: replyWindow.canReply,
    replyWindowEndsAt: replyWindow.endsAt,
  };
}

export async function readMatpinInstagramReplyGuard(
  conversationId: string,
): Promise<MatpinInstagramReplyGuard> {
  const { normalized } = await readConversationMessages(conversationId, REPLY_GUARD_MESSAGE_FIELDS);
  return replyGuardFromMessages(normalized);
}

async function readMatpinInstagramConversationWithProfile(
  conversationId: string,
  includeProfile: boolean,
): Promise<MatpinInstagramConversation> {
  const { id, normalized } = await readConversationMessages(conversationId, CONVERSATION_MESSAGE_FIELDS);
  const replyGuard = replyGuardFromMessages(normalized);
  const profile = includeProfile
    ? await readProfile(replyGuard.recipientId)
    : { name: null, username: null };
  const updatedAt = normalized.messages.at(-1)?.createdAt ?? new Date(0).toISOString();
  return {
    id,
    updatedAt,
    recipientId: replyGuard.recipientId,
    profile,
    messages: normalized.messages,
    canReply: replyGuard.canReply,
    replyWindowEndsAt: replyGuard.replyWindowEndsAt,
  };
}

export async function readMatpinInstagramConversation(
  conversationId: string,
): Promise<MatpinInstagramConversation> {
  return readMatpinInstagramConversationWithProfile(conversationId, true);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(values.length);
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      results[index] = await mapper(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

export async function listMatpinInstagramConversations(
  after?: string | null,
): Promise<MatpinInstagramConversationPage> {
  const { accountId } = graphConfiguration();
  const cursor = after ? z.string().trim().min(1).max(1_000).parse(after) : null;
  const body = await graphGet(`${accountId}/conversations`, {
    platform: "instagram",
    fields: "id,updated_time",
    limit: String(CONVERSATION_LIMIT),
    ...(cursor ? { after: cursor } : {}),
  });
  const conversationIds = dataRecords(body).flatMap((row) => {
    const id = typeof row.id === "string" ? row.id.trim() : "";
    return id ? [id] : [];
  }).slice(0, CONVERSATION_LIMIT);
  const settled = await mapWithConcurrency(conversationIds, 4, async (id) => {
    try {
      return await readMatpinInstagramConversationWithProfile(id, false);
    } catch {
      return null;
    }
  });
  const conversations = settled.filter((item): item is MatpinInstagramConversation => Boolean(item));
  if (conversationIds.length > 0 && conversations.length === 0) {
    throw new Error("meta_admin_fetch_failed:conversation_details");
  }
  const paging = asRecord(body.paging);
  const cursors = asRecord(paging?.cursors);
  const nextCursor = typeof cursors?.after === "string" && paging?.next
    ? cursors.after
    : null;
  return {
    conversations,
    nextCursor,
    partial: conversations.length !== conversationIds.length,
  };
}
