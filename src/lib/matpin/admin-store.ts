import { createHash } from "node:crypto";
import { z } from "zod";
import {
  matpinAdminPublicFailure,
  matpinAdminSince,
  type MatpinAdminRange,
  type MatpinAdminSavedPlace,
  type MatpinAdminStoredMessage,
  type MatpinAdminSummary,
} from "@/lib/matpin/admin-contract";
import { decryptMatpinValue } from "@/lib/matpin/security";
import { getMatpinServerClient } from "@/lib/matpin/store";

const storedMessageSchema = z.object({
  id: z.string().uuid(),
  sender_hash: z.string().length(64),
  status: z.enum(["received", "processing", "needs_confirmation", "saved", "failed", "deleted"]),
  attachment_type: z.enum(["share", "ig_reel", "reel"]),
  reel_url: z.string().url().nullable(),
  received_at: z.string(),
  replied_at: z.string().nullable(),
  acknowledged_at: z.string().nullable(),
  attempt_count: z.number().int().nonnegative(),
  last_error: z.string().nullable(),
  analysis_duration_ms: z.number().int().nonnegative().nullable(),
  total_tokens: z.number().int().nonnegative().nullable(),
});

const savedPlaceSchema = z.object({
  id: z.coerce.number().int().positive(),
  sender_hash: z.string().length(64),
  message_id: z.string().uuid(),
  place: z.object({
    name: z.string().min(1),
    address: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
  }).passthrough(),
  saved_at: z.string(),
});

export type MatpinAdminStoredContext = {
  messages: MatpinAdminStoredMessage[];
  savedPlaces: MatpinAdminSavedPlace[];
};

export type MatpinAdminAction = "manual_reply" | "reprocess" | "resend_library";

const adminAuditStatusSchema = z.enum(["pending", "succeeded", "failed", "uncertain"]);
const adminAuditClaimSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("claimed"),
    id: z.string().uuid(),
  }),
  z.object({
    state: z.literal("duplicate"),
    id: z.string().uuid(),
    status: adminAuditStatusSchema,
    metaMessageId: z.string().nullable(),
  }),
]);
const adminAuditReplaySchema = z.object({
  state: z.literal("duplicate"),
  id: z.string().uuid(),
  status: adminAuditStatusSchema,
  metaMessageId: z.string().nullable(),
  action: z.enum(["manual_reply", "reprocess", "resend_library"]),
  messageId: z.string().uuid().nullable(),
  payloadSha256: z.string().length(64).nullable(),
});

type AuditInput = {
  adminUserId: string;
  senderHash: string;
  messageId?: string | null;
  action: MatpinAdminAction;
  idempotencyKey: string;
  payload?: string | null;
  payloadFingerprint?: string | null;
};

export type MatpinAdminAuditClaim =
  | { state: "claimed"; id: string }
  | {
    state: "duplicate";
    id: string;
    status: "pending" | "succeeded" | "failed" | "uncertain";
    metaMessageId: string | null;
  };
export type MatpinAdminAuditReplay = Extract<MatpinAdminAuditClaim, { state: "duplicate" }>;

function throwIfError(error: { message: string } | null, code: string) {
  if (error) throw new Error(`${code}:${error.message}`);
}

function auditPayloadSha256(input: Pick<AuditInput, "payload" | "payloadFingerprint">): string | null {
  const value = input.payloadFingerprint ?? input.payload ?? null;
  return value === null ? null : createHash("sha256").update(value).digest("hex");
}

function publicMessage(
  row: z.infer<typeof storedMessageSchema>,
  savedPlaceCount: number,
): MatpinAdminStoredMessage {
  const failure = matpinAdminPublicFailure(row.last_error);
  return {
    id: row.id,
    status: row.status,
    attachmentType: row.attachment_type,
    reelUrl: row.reel_url,
    receivedAt: row.received_at,
    repliedAt: row.replied_at,
    acknowledgedAt: row.acknowledged_at,
    attemptCount: row.attempt_count,
    failureCode: failure?.code ?? null,
    failureReason: failure?.reason ?? null,
    lastError: failure?.reason ?? null,
    analysisDurationMs: row.analysis_duration_ms,
    totalTokens: row.total_tokens,
    savedPlaceCount,
  };
}

export async function readMatpinAdminStoredContexts(
  senderHashes: string[],
): Promise<Map<string, MatpinAdminStoredContext>> {
  const hashes = [...new Set(senderHashes)].filter((value) => /^[a-f0-9]{64}$/.test(value));
  if (hashes.length === 0) return new Map();
  const client = getMatpinServerClient();
  const [messagesResult, placesResult] = await Promise.all([
    client
      .from("matpin_instagram_messages")
      .select("id,sender_hash,status,attachment_type,reel_url,received_at,replied_at,acknowledged_at,attempt_count,last_error,analysis_duration_ms,total_tokens")
      .in("sender_hash", hashes)
      .order("received_at", { ascending: false })
      .limit(500),
    client
      .from("matpin_saved_places")
      .select("id,sender_hash,message_id,place,saved_at")
      .in("sender_hash", hashes)
      .is("deleted_at", null)
      .order("saved_at", { ascending: false })
      .limit(2_000),
  ]);
  throwIfError(messagesResult.error, "matpin_admin_messages_read_failed");
  throwIfError(placesResult.error, "matpin_admin_places_read_failed");
  const messages = z.array(storedMessageSchema).parse(messagesResult.data ?? []);
  const places = z.array(savedPlaceSchema).parse(placesResult.data ?? []);
  const placeCountByMessage = new Map<string, number>();
  places.forEach((place) => placeCountByMessage.set(
    place.message_id,
    (placeCountByMessage.get(place.message_id) ?? 0) + 1,
  ));
  const contexts = new Map<string, MatpinAdminStoredContext>();
  hashes.forEach((hash) => contexts.set(hash, { messages: [], savedPlaces: [] }));
  messages.forEach((row) => contexts.get(row.sender_hash)?.messages.push(
    publicMessage(row, placeCountByMessage.get(row.id) ?? 0),
  ));
  places.forEach((row) => contexts.get(row.sender_hash)?.savedPlaces.push({
    id: row.id,
    messageId: row.message_id,
    name: row.place.name,
    address: row.place.address ?? null,
    stationName: row.place.area ?? null,
    savedAt: row.saved_at,
  }));
  return contexts;
}

export async function readMatpinAdminMessageOwner(messageId: string): Promise<{
  senderHash: string;
  senderScopedId: string;
  status: MatpinAdminStoredMessage["status"];
  savedPlaceCount: number;
  receivedAt: string;
} | null> {
  const id = z.string().uuid().parse(messageId);
  const client = getMatpinServerClient();
  const { data, error } = await client
    .from("matpin_instagram_messages")
    .select("sender_hash,status,received_at")
    .eq("id", id)
    .maybeSingle<{ sender_hash: string; status: MatpinAdminStoredMessage["status"]; received_at: string }>();
  throwIfError(error, "matpin_admin_message_owner_failed");
  if (!data) return null;
  const [countResult, userResult] = await Promise.all([
    client
      .from("matpin_saved_places")
      .select("id", { count: "exact", head: true })
      .eq("message_id", id)
      .eq("sender_hash", data.sender_hash)
      .is("deleted_at", null),
    client
      .from("matpin_instagram_users")
      .select("sender_ciphertext")
      .eq("sender_hash", data.sender_hash)
      .maybeSingle<{ sender_ciphertext: string }>(),
  ]);
  throwIfError(countResult.error, "matpin_admin_message_places_failed");
  throwIfError(userResult.error, "matpin_admin_message_user_failed");
  if (!userResult.data) return null;
  return {
    senderHash: data.sender_hash,
    senderScopedId: decryptMatpinValue(userResult.data.sender_ciphertext),
    status: data.status,
    savedPlaceCount: countResult.count ?? 0,
    receivedAt: data.received_at,
  };
}

export async function readMatpinAdminSummary(
  range: MatpinAdminRange,
  instagram?: { conversations: number; replyNeeded: number } | null,
): Promise<MatpinAdminSummary> {
  const client = getMatpinServerClient();
  const since = matpinAdminSince(range);
  const usersQuery = client.from("matpin_instagram_users").select("sender_hash", { count: "exact", head: true });
  const messagesQuery = client
    .from("matpin_instagram_messages")
    .select("id,status", { count: "exact" })
    .neq("status", "deleted")
    .limit(10_000);
  const placesQuery = client
    .from("matpin_saved_places")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  const usageQuery = client
    .from("matpin_api_usage_events")
    .select("request_count,total_tokens")
    .limit(10_000);
  const cacheQuery = client
    .from("matpin_media_analysis_cache")
    .select("state,hit_count")
    .is("invalidated_at", null)
    .limit(10_000);
  if (since) {
    usersQuery.gte("created_at", since);
    messagesQuery.gte("received_at", since);
    placesQuery.gte("saved_at", since);
    usageQuery.gte("created_at", since);
    cacheQuery.gte("created_at", since);
  }
  const [users, messages, places, usage, cache] = await Promise.all([
    usersQuery, messagesQuery, placesQuery, usageQuery, cacheQuery,
  ]);
  throwIfError(users.error, "matpin_admin_users_summary_failed");
  throwIfError(messages.error, "matpin_admin_messages_summary_failed");
  throwIfError(places.error, "matpin_admin_places_summary_failed");
  throwIfError(usage.error, "matpin_admin_usage_summary_failed");
  throwIfError(cache.error, "matpin_admin_cache_summary_failed");
  const messageRows = (messages.data ?? []) as Array<{ status: string }>;
  const usageRows = (usage.data ?? []) as Array<{ request_count: number; total_tokens: number | null }>;
  const cacheRows = (cache.data ?? []) as Array<{ state: string; hit_count: number }>;
  return {
    range,
    generatedAt: new Date().toISOString(),
    instagramAvailable: Boolean(instagram),
    recentConversations: instagram?.conversations ?? null,
    replyNeeded: instagram?.replyNeeded ?? null,
    users: users.count ?? 0,
    messages: messages.count ?? 0,
    processing: messageRows.filter((row) => row.status === "received" || row.status === "processing").length,
    failed: messageRows.filter((row) => row.status === "failed").length,
    savedPlaces: places.count ?? 0,
    cacheEntries: cacheRows.filter((row) => row.state === "ready").length,
    cacheHits: cacheRows.reduce((sum, row) => sum + row.hit_count, 0),
    apiRequests: usageRows.reduce((sum, row) => sum + row.request_count, 0),
    totalTokens: usageRows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0),
  };
}

export async function claimMatpinAdminAction(input: AuditInput): Promise<MatpinAdminAuditClaim> {
  const client = getMatpinServerClient();
  const payload = input.payload ?? null;
  const payloadSha256 = auditPayloadSha256(input);
  const adminUserId = z.string().uuid().parse(input.adminUserId);
  const senderHash = z.string().regex(/^[a-f0-9]{64}$/).parse(input.senderHash);
  const messageId = input.messageId ? z.string().uuid().parse(input.messageId) : null;
  const idempotencyKey = z.string().uuid().parse(input.idempotencyKey);
  const result = await client.rpc("matpin_claim_admin_action", {
    p_admin_user_id: adminUserId,
    p_sender_hash: senderHash,
    p_message_id: messageId,
    p_action: input.action,
    p_idempotency_key: idempotencyKey,
    p_payload_sha256: payloadSha256,
    p_payload_length: payload?.length ?? null,
  });
  if (result.error) {
    if (result.error.message.includes("admin_action_idempotency_mismatch")) {
      throw new Error("admin_action_idempotency_mismatch");
    }
    throw new Error(`matpin_admin_audit_claim_failed:${result.error.message}`);
  }
  return adminAuditClaimSchema.parse(result.data);
}

export async function readMatpinAdminActionReplay(input: Omit<AuditInput, "senderHash">): Promise<MatpinAdminAuditReplay | null> {
  const client = getMatpinServerClient();
  const adminUserId = z.string().uuid().parse(input.adminUserId);
  const messageId = input.messageId ? z.string().uuid().parse(input.messageId) : null;
  const idempotencyKey = z.string().uuid().parse(input.idempotencyKey);
  const payloadSha256 = auditPayloadSha256(input);
  const result = await client.rpc("matpin_read_admin_action_replay", {
    p_admin_user_id: adminUserId,
    p_idempotency_key: idempotencyKey,
  });
  throwIfError(result.error, "matpin_admin_audit_replay_failed");
  if (!result.data) return null;
  const replay = adminAuditReplaySchema.parse(result.data);
  if (
    replay.action !== input.action
    || replay.messageId !== messageId
    || replay.payloadSha256 !== payloadSha256
  ) {
    throw new Error("admin_action_idempotency_mismatch");
  }
  return {
    state: "duplicate",
    id: replay.id,
    status: replay.status,
    metaMessageId: replay.metaMessageId,
  };
}

export async function completeMatpinAdminAction(input: {
  id: string;
  status: "succeeded" | "failed" | "uncertain";
  metaMessageId?: string | null;
  errorCode?: string | null;
}): Promise<void> {
  const client = getMatpinServerClient();
  const result = await client
    .from("matpin_admin_actions")
    .update({
      status: input.status,
      meta_message_id: input.metaMessageId ?? null,
      error_code: input.errorCode?.slice(0, 200) ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", z.string().uuid().parse(input.id))
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();
  throwIfError(result.error, "matpin_admin_audit_complete_failed");
  if (!result.data) throw new Error("matpin_admin_audit_invalid_transition");
}
