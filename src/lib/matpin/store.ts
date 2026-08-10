import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  matpinInboundMessageSchema,
  matpinMessagePublicSchema,
  matpinPlaceCandidateSchema,
  matpinSavedPlaceSchema,
  type MatpinInboundMessage,
  type MatpinMessagePublic,
  type MatpinPlaceCandidate,
  type MatpinSavedPlace,
} from "@/lib/matpin/contract";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  decryptMatpinValue,
  encryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinShortLinkCode,
  hashMatpinSender,
  MatpinConfigurationError,
} from "@/lib/matpin/security";
import type { MatpinAnalysisResult } from "@/lib/matpin/reel-analyzer";

const ingestResultSchema = z.object({
  accepted: z.boolean(),
  duplicate: z.boolean(),
  messageId: z.string().uuid().optional(),
  queueMessageId: z.number().int().optional(),
  acknowledged: z.boolean().optional(),
  replyRequired: z.boolean().optional(),
});

const conversationContextSchema = z.object({
  knownUser: z.boolean(),
  inboundMessageCount: z.number().int().nonnegative(),
  savedPlaceCount: z.number().int().nonnegative(),
  hasSavedMedia: z.boolean(),
});

const requeueResultSchema = z.object({
  accepted: z.boolean(),
  queueMessageId: z.number().int().optional(),
});

const outboundStateSchema = z.enum([
  "pending",
  "leased",
  "sending",
  "succeeded",
  "failed",
  "uncertain",
  "superseded",
]);

const preparedWebhookEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("supported"),
    metaMessageId: z.string().trim().min(1).max(500),
    senderHash: z.string().regex(/^[0-9a-f]{64}$/),
    outboundSenderHash: z.string().regex(/^[0-9a-f]{64}$/),
    senderCiphertext: z.string().min(1),
    accessTokenHash: z.string().regex(/^[0-9a-f]{64}$/),
    shortLinkHash: z.string().regex(/^[0-9a-f]{64}$/),
    reelId: z.string().trim().min(1).max(500),
    reelUrl: z.string().url().nullable(),
    attachmentType: z.enum(["share", "ig_reel", "reel"]),
    mediaUrlCiphertext: z.string().min(1),
    receivedAt: z.string().datetime({ offset: true }),
    receiptDedupHash: z.string().regex(/^[0-9a-f]{64}$/),
    recipientCiphertext: z.string().min(1),
    bodyCiphertext: z.string().min(1),
    returningBodyCiphertext: z.string().min(1),
    alreadySavedBodyCiphertext: z.string().min(1),
  }),
  z.object({
    type: z.literal("guidance"),
    dedupHash: z.string().regex(/^[0-9a-f]{64}$/),
    senderHash: z.string().regex(/^[0-9a-f]{64}$/),
    outboundSenderHash: z.string().regex(/^[0-9a-f]{64}$/),
    recipientCiphertext: z.string().min(1),
    bodyCiphertext: z.string().min(1),
  }),
]);

const webhookBatchResultSchema = z.object({
  accepted: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  receiptsQueued: z.number().int().nonnegative(),
  guidanceQueued: z.number().int().nonnegative(),
  guidanceCooldown: z.number().int().nonnegative(),
  results: z.array(z.object({
    type: z.enum(["supported", "guidance"]),
    accepted: z.boolean().optional(),
    queued: z.boolean().optional(),
    duplicate: z.boolean(),
    cooldown: z.boolean().optional(),
    messageId: z.string().uuid().optional(),
    outboundId: z.string().uuid().nullable().optional(),
    deliveryState: z.union([outboundStateSchema, z.literal("not_required")]).optional(),
  })),
});

const claimedOutboundSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["receipt", "guidance", "final"]),
  dedup_hash: z.string().regex(/^[0-9a-f]{64}$/),
  message_id: z.string().uuid().nullable(),
  generation: z.number().int().nonnegative(),
  sender_hash: z.string().regex(/^[0-9a-f]{64}$/),
  recipient_ciphertext: z.string().min(1),
  body_ciphertext: z.string().min(1),
  state: z.literal("leased"),
  lease_token: z.string().uuid(),
  lease_expires_at: z.string().datetime({ offset: true }),
  attempt_count: z.number().int().min(0).max(3),
  expires_at: z.string().datetime({ offset: true }),
});

const outboundFinishResultSchema = z.object({
  state: outboundStateSchema,
  retryAt: z.string().datetime({ offset: true }).nullable(),
});

const completeAnalysisV2ResultSchema = z.object({
  completed: z.boolean(),
  outboundId: z.string().uuid().nullable(),
  deliveryState: outboundStateSchema.nullable(),
});

export type MatpinPreparedWebhookEvent = z.infer<typeof preparedWebhookEventSchema>;
export type MatpinWebhookBatchResult = z.infer<typeof webhookBatchResultSchema>;
export type MatpinClaimedOutbound = z.infer<typeof claimedOutboundSchema>;
export type MatpinOutboundState = z.infer<typeof outboundStateSchema>;
export type MatpinOutboundFinishResult = z.infer<typeof outboundFinishResultSchema>;

const matpinUsageEventInputSchema = z.object({
  messageId: z.string().uuid(),
  stage: z.enum(["extraction", "place_resolution"]),
  provider: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120).nullable(),
  outcome: z.enum(["success", "error"]).default("success"),
  requestCount: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  thoughtTokens: z.number().int().nonnegative().nullable(),
  toolUseTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  groundingQueryCount: z.number().int().nonnegative().nullable(),
  durationMs: z.number().int().nonnegative().nullable(),
});

export type MatpinUsageEventInput = z.input<typeof matpinUsageEventInputSchema>;

const mediaAnalysisCacheClaimSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("owner"),
    claimToken: z.string().uuid(),
  }),
  z.object({ state: z.literal("pending") }),
  z.object({
    state: z.literal("hit"),
    outcome: z.enum(["resolved", "insufficient"]),
    candidates: z.array(matpinPlaceCandidateSchema).max(3),
  }),
]);

const claimedJobEnvelopeSchema = z.object({
  skipped: z.boolean().optional(),
  poisoned: z.boolean().optional().default(false),
  terminalFailureRequired: z.boolean().optional().default(false),
  queueMessageId: z.number().int().optional(),
});

const claimedJobSchema = z.object({
  skipped: z.boolean().optional(),
  poisoned: z.literal(false).optional().default(false),
  terminalFailureRequired: z.literal(false).optional().default(false),
  queueMessageId: z.number().int().positive(),
  message: z.object({
    id: z.string().uuid(),
    sender_hash: z.string().length(64),
    reel_id: z.string(),
    reel_url: z.string().url().nullable(),
    attachment_type: z.enum(["share", "ig_reel", "reel"]),
    media_url_ciphertext: z.string().nullable(),
    reply_required: z.boolean(),
    attempt_count: z.number().int(),
    outbound_generation: z.number().int().nonnegative(),
    analysis_claim_token: z.string().uuid(),
  }),
  user: z.object({
    sender_hash: z.string().length(64),
    sender_ciphertext: z.string(),
    access_token_hash: z.string().length(64),
    short_link_hash: z.string().length(64).nullable(),
  }),
});

const claimedTerminalFailureJobSchema = z.object({
  skipped: z.boolean().optional(),
  poisoned: z.boolean().optional().default(false),
  terminalFailureRequired: z.literal(true).optional().default(true),
  queueMessageId: z.number().int().positive(),
  message: z.object({
    id: z.string().uuid(),
    sender_hash: z.string().length(64),
    reel_id: z.unknown().transform((value) => typeof value === "string" ? value : "unreadable"),
    reel_url: z.unknown().transform((value) => {
      if (typeof value !== "string") return null;
      try {
        return new URL(value).toString();
      } catch {
        return null;
      }
    }),
    attachment_type: z.unknown().transform((value): MatpinInboundMessage["attachmentType"] => (
      value === "ig_reel" || value === "reel" ? value : "share"
    )),
    reply_required: z.boolean(),
    attempt_count: z.number().int(),
    outbound_generation: z.number().int().nonnegative(),
    analysis_claim_token: z.string().uuid(),
  }),
  user: z.object({
    sender_hash: z.string().length(64),
    sender_ciphertext: z.unknown().transform((value) => typeof value === "string" ? value : ""),
  }),
}).superRefine((value, context) => {
  if (value.message.sender_hash !== value.user.sender_hash) {
    context.addIssue({
      code: "custom",
      message: "matpin_poison_sender_mismatch",
      path: ["user", "sender_hash"],
    });
  }
});

const messageRowSchema = z.object({
  id: z.string().uuid(),
  sender_hash: z.string().length(64),
  status: z.enum(["received", "processing", "needs_confirmation", "saved", "failed", "deleted"]),
  selected_place_id: z.string().nullable(),
  reel_url: z.string().url().nullable(),
  candidates: z.array(matpinPlaceCandidateSchema).max(3),
  received_at: z.string().datetime({ offset: true }),
});

const savedPlaceRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  message_id: z.string().uuid(),
  reel_id: z.string(),
  reel_url: z.string().url().nullable(),
  place: matpinPlaceCandidateSchema,
  confirmation_source: z.enum(["automatic_high_confidence", "user_confirmation"]),
  saved_at: z.string().datetime({ offset: true }),
});

export type MatpinClaimedJob = {
  queueMessageId: number;
  analysisClaimToken: string;
  poisoned: boolean;
  terminalFailureRequired: boolean;
  messageId: string;
  senderHash: string;
  senderScopedId: string;
  accessToken: string;
  shortLinkCode: string;
  reelId: string;
  reelUrl: string | null;
  attachmentType: MatpinInboundMessage["attachmentType"];
  mediaUrl: string;
  replyRequired: boolean;
  attemptCount: number;
  outboundGeneration: number;
};

export type MatpinMediaAnalysisCacheClaim = z.infer<typeof mediaAnalysisCacheClaimSchema>;
export type MatpinConversationContext = z.infer<typeof conversationContextSchema>;

export function getMatpinServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new MatpinConfigurationError("matpin_store_not_configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function withAbortSignal<T>(request: T, signal?: AbortSignal): T {
  if (!signal) return request;
  return (request as T & { abortSignal(value: AbortSignal): T }).abortSignal(signal);
}

export async function enqueueMatpinWebhookBatch(
  events: MatpinPreparedWebhookEvent[],
  options: { signal?: AbortSignal } = {},
): Promise<MatpinWebhookBatchResult> {
  const values = z.array(preparedWebhookEventSchema).max(100).parse(events);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_ingest_webhook_batch", {
    p_events: values,
  }), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_webhook_batch_failed:${error.message}`);
  return webhookBatchResultSchema.parse(data);
}

export async function ingestMatpinBackfillMessage(
  input: MatpinInboundMessage,
  options: { signal?: AbortSignal } = {},
): Promise<z.infer<typeof ingestResultSchema>> {
  const value = matpinInboundMessageSchema.parse(input);
  const senderHash = hashMatpinSender(value.senderScopedId);
  const accessToken = createMatpinAccessToken(value.senderScopedId);
  const shortLinkCode = createMatpinShortLinkCode(value.senderScopedId);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_backfill_message", {
    p_meta_message_id: value.metaMessageId,
    p_sender_hash: senderHash,
    p_sender_ciphertext: encryptMatpinValue(value.senderScopedId),
    p_access_token_hash: hashMatpinAccessToken(accessToken),
    p_short_link_hash: hashMatpinShortLinkCode(shortLinkCode),
    p_reel_id: value.reelId,
    p_reel_url: value.reelUrl,
    p_attachment_type: value.attachmentType,
    p_media_url_ciphertext: encryptMatpinValue(value.mediaUrl),
    p_received_at: value.receivedAt,
  }), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_backfill_ingest_failed:${error.message}`);
  return ingestResultSchema.parse(data);
}

export async function readMatpinConversationContext(input: {
  senderScopedId: string;
  reelId?: string | null;
}, options: { signal?: AbortSignal } = {}): Promise<MatpinConversationContext> {
  const senderScopedId = z.string().trim().min(1).max(200).parse(input.senderScopedId);
  const reelId = z.string().trim().min(1).max(500).nullable().parse(input.reelId ?? null);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_conversation_context", {
    p_sender_hash: hashMatpinSender(senderScopedId),
    p_reel_id: reelId,
  }), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_conversation_context_failed:${error.message}`);
  return conversationContextSchema.parse(data);
}

export async function claimNextMatpinOutbound(
  options: { leaseSeconds?: number; signal?: AbortSignal } = {},
): Promise<MatpinClaimedOutbound | null> {
  const leaseSeconds = z.number().int().min(15).max(120).parse(options.leaseSeconds ?? 30);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_claim_next_outbound", {
    p_lease_seconds: leaseSeconds,
  }), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_outbound_claim_failed:${error.message}`);
  return data ? claimedOutboundSchema.parse(data) : null;
}

export async function beginMatpinOutboundSend(input: {
  deliveryId: string;
  leaseToken: string;
  signal?: AbortSignal;
}): Promise<boolean> {
  const deliveryId = z.string().uuid().parse(input.deliveryId);
  const leaseToken = z.string().uuid().parse(input.leaseToken);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_begin_outbound_send", {
    p_delivery_id: deliveryId,
    p_lease_token: leaseToken,
  }), input.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_outbound_begin_failed:${error.message}`);
  return z.boolean().parse(data);
}

export async function releaseMatpinOutboundLease(input: {
  deliveryId: string;
  leaseToken: string;
  errorCode: string;
  retryAfterSeconds?: number;
  permanent?: boolean;
  signal?: AbortSignal;
}): Promise<MatpinOutboundState> {
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_release_outbound_lease", {
    p_delivery_id: z.string().uuid().parse(input.deliveryId),
    p_lease_token: z.string().uuid().parse(input.leaseToken),
    p_error_code: z.string().trim().min(1).max(120).parse(input.errorCode),
    p_retry_after_seconds: z.number().int().min(1).max(3600).parse(input.retryAfterSeconds ?? 30),
    p_permanent: input.permanent ?? false,
  }), input.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_outbound_release_failed:${error.message}`);
  return outboundStateSchema.parse(data);
}

export async function finishMatpinOutbound(input: {
  deliveryId: string;
  leaseToken: string;
  outcome: "succeeded" | "known_not_sent" | "failed" | "uncertain";
  errorCode?: string | null;
  providerMessageIdHash?: string | null;
  providerStatus?: number | null;
  signal?: AbortSignal;
}): Promise<MatpinOutboundFinishResult> {
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_finish_outbound", {
    p_delivery_id: z.string().uuid().parse(input.deliveryId),
    p_lease_token: z.string().uuid().parse(input.leaseToken),
    p_outcome: input.outcome,
    p_error_code: z.string().trim().min(1).max(120).nullable().parse(input.errorCode ?? null),
    p_provider_message_id_hash: z.string().regex(/^[0-9a-f]{64}$/).nullable()
      .parse(input.providerMessageIdHash ?? null),
    p_provider_status: z.number().int().min(100).max(599).nullable()
      .parse(input.providerStatus ?? null),
  }), input.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_outbound_finish_failed:${error.message}`);
  return outboundFinishResultSchema.parse(data);
}

export async function claimNextMatpinMessage(
  options: { signal?: AbortSignal } = {},
): Promise<MatpinClaimedJob | null> {
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_claim_next_message"), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_claim_failed:${error.message}`);
  if (!data) return null;

  const envelope = claimedJobEnvelopeSchema.parse(data);
  if (envelope.skipped || !envelope.queueMessageId) return null;
  const terminalFailureRequired = envelope.terminalFailureRequired || envelope.poisoned;
  const claimed = terminalFailureRequired
    ? claimedTerminalFailureJobSchema.parse(data)
    : claimedJobSchema.parse(data);
  if (!claimed.terminalFailureRequired && !claimed.message.media_url_ciphertext) {
    throw new Error("matpin_media_url_missing");
  }

  let senderScopedId: string;
  try {
    senderScopedId = decryptMatpinValue(claimed.user.sender_ciphertext);
  } catch (cause) {
    if (!claimed.terminalFailureRequired) throw cause;
    const quarantineRequest = withAbortSignal(client.rpc("matpin_terminalize_unreadable_claim", {
      p_message_id: claimed.message.id,
      p_queue_message_id: claimed.queueMessageId,
      p_analysis_claim_token: claimed.message.analysis_claim_token,
    }), options.signal);
    const { data: quarantined, error: quarantineError } = await quarantineRequest;
    if (quarantineError || quarantined !== true) {
      throw new Error(
        `matpin_poison_quarantine_failed:${quarantineError?.message ?? "not_terminalized"}`,
        { cause },
      );
    }
    return null;
  }
  let accessToken = "";
  let shortLinkCode = "";
  if (!claimed.terminalFailureRequired) {
    accessToken = createMatpinAccessToken(senderScopedId);
    shortLinkCode = createMatpinShortLinkCode(senderScopedId);
    if (hashMatpinAccessToken(accessToken) !== claimed.user.access_token_hash) {
      throw new Error("matpin_access_token_mismatch");
    }
    const shortLinkHash = hashMatpinShortLinkCode(shortLinkCode);
    if (claimed.user.short_link_hash && shortLinkHash !== claimed.user.short_link_hash) {
      throw new Error("matpin_short_link_mismatch");
    }
    if (!claimed.user.short_link_hash) {
      const shortLinkRequest = withAbortSignal(client
        .from("matpin_instagram_users")
        .update({ short_link_hash: shortLinkHash })
        .eq("sender_hash", claimed.user.sender_hash)
        .is("short_link_hash", null), options.signal);
      const { error: shortLinkError } = await shortLinkRequest;
      if (shortLinkError) throw new Error(`matpin_short_link_update_failed:${shortLinkError.message}`);
    }
  }

  return {
    queueMessageId: claimed.queueMessageId,
    analysisClaimToken: claimed.message.analysis_claim_token,
    poisoned: claimed.poisoned,
    terminalFailureRequired: claimed.terminalFailureRequired,
    messageId: claimed.message.id,
    senderHash: claimed.message.sender_hash,
    senderScopedId,
    accessToken,
    shortLinkCode,
    reelId: claimed.message.reel_id,
    reelUrl: claimed.message.reel_url,
    attachmentType: claimed.message.attachment_type,
    mediaUrl: claimed.terminalFailureRequired
      ? ""
      : decryptMatpinValue(claimed.message.media_url_ciphertext as string),
    replyRequired: claimed.message.reply_required,
    attemptCount: claimed.message.attempt_count,
    outboundGeneration: claimed.message.outbound_generation,
  };
}

export async function resolveMatpinShortLink(code: string): Promise<string | null> {
  const parsedCode = z.string().regex(/^[A-Za-z0-9_-]{16}$/).parse(code);
  const client = getMatpinServerClient();
  const { data, error } = await client
    .from("matpin_instagram_users")
    .select("sender_ciphertext,access_token_hash,link_expires_at")
    .eq("short_link_hash", hashMatpinShortLinkCode(parsedCode))
    .gt("link_expires_at", new Date().toISOString())
    .maybeSingle<{
      sender_ciphertext: string;
      access_token_hash: string;
      link_expires_at: string;
    }>();
  if (error) throw new Error(`matpin_short_link_read_failed:${error.message}`);
  if (!data) return null;

  const senderScopedId = decryptMatpinValue(data.sender_ciphertext);
  const accessToken = createMatpinAccessToken(senderScopedId);
  return hashMatpinAccessToken(accessToken) === data.access_token_hash ? accessToken : null;
}

export async function completeMatpinAnalysisV2(input: {
  messageId: string;
  queueMessageId: number;
  analysisClaimToken: string;
  status: "needs_confirmation" | "saved" | "failed";
  candidates: MatpinPlaceCandidate[];
  metrics: MatpinAnalysisResult["metrics"] | null;
  finalOutbound?: {
    dedupHash: string;
    senderHash: string;
    recipientCiphertext: string;
    bodyCiphertext: string;
  } | null;
  signal?: AbortSignal;
}): Promise<z.infer<typeof completeAnalysisV2ResultSchema>> {
  const finalOutbound = z.object({
    dedupHash: z.string().regex(/^[0-9a-f]{64}$/),
    senderHash: z.string().regex(/^[0-9a-f]{64}$/),
    recipientCiphertext: z.string().min(1),
    bodyCiphertext: z.string().min(1),
  }).nullable().parse(input.finalOutbound ?? null);
  const candidates = z.array(matpinPlaceCandidateSchema).max(3).parse(input.candidates);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_complete_analysis_v2", {
    p_message_id: z.string().uuid().parse(input.messageId),
    p_queue_message_id: z.number().int().positive().parse(input.queueMessageId),
    p_analysis_claim_token: z.string().uuid().parse(input.analysisClaimToken),
    p_status: input.status,
    p_candidates: candidates,
    p_analysis_model: input.metrics?.model ?? null,
    p_analysis_duration_ms: input.metrics?.durationMs ?? null,
    p_media_bytes: input.metrics?.mediaBytes ?? null,
    p_input_tokens: input.metrics?.inputTokens ?? null,
    p_output_tokens: input.metrics?.outputTokens ?? null,
    p_total_tokens: input.metrics?.totalTokens ?? null,
    p_final_dedup_hash: finalOutbound?.dedupHash ?? null,
    p_final_sender_hash: finalOutbound?.senderHash ?? null,
    p_final_recipient_ciphertext: finalOutbound?.recipientCiphertext ?? null,
    p_final_body_ciphertext: finalOutbound?.bodyCiphertext ?? null,
  }), input.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_complete_v2_failed:${error.message}`);
  return completeAnalysisV2ResultSchema.parse(data);
}

export async function recordMatpinUsageEvent(
  input: MatpinUsageEventInput,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const value = matpinUsageEventInputSchema.parse(input);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.from("matpin_api_usage_events").insert({
    message_id: value.messageId,
    stage: value.stage,
    provider: value.provider,
    model: value.model,
    outcome: value.outcome,
    request_count: value.requestCount,
    input_tokens: value.inputTokens,
    output_tokens: value.outputTokens,
    thought_tokens: value.thoughtTokens,
    tool_use_tokens: value.toolUseTokens,
    total_tokens: value.totalTokens,
    grounding_query_count: value.groundingQueryCount,
    duration_ms: value.durationMs,
  }), options.signal);
  const { error } = await request;
  if (error) throw new Error(`matpin_usage_record_failed:${error.message}`);
}

export async function claimMatpinMediaAnalysis(
  mediaKey: string,
  options: { signal?: AbortSignal } = {},
): Promise<MatpinMediaAnalysisCacheClaim> {
  const key = z.string().trim().min(1).max(500).parse(mediaKey);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_claim_media_analysis", {
    p_media_key: key,
  }), options.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_cache_claim_failed:${error.message}`);
  return mediaAnalysisCacheClaimSchema.parse(data);
}

export async function completeMatpinMediaAnalysis(input: {
  mediaKey: string;
  claimToken: string;
  outcome: "resolved" | "insufficient";
  candidates: MatpinPlaceCandidate[];
  metrics: MatpinAnalysisResult["metrics"];
  signal?: AbortSignal;
}): Promise<void> {
  const key = z.string().trim().min(1).max(500).parse(input.mediaKey);
  const candidates = z.array(matpinPlaceCandidateSchema).max(3).parse(input.candidates);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_complete_media_analysis", {
    p_media_key: key,
    p_claim_token: z.string().uuid().parse(input.claimToken),
    p_outcome: input.outcome,
    p_candidates: candidates,
    p_analysis_model: input.metrics.model,
    p_analysis_duration_ms: input.metrics.durationMs,
    p_media_bytes: input.metrics.mediaBytes,
    p_input_tokens: input.metrics.inputTokens,
    p_output_tokens: input.metrics.outputTokens,
    p_total_tokens: input.metrics.totalTokens,
  }), input.signal);
  const { error } = await request;
  if (error) throw new Error(`matpin_cache_complete_failed:${error.message}`);
}

export async function releaseMatpinMediaAnalysis(
  mediaKey: string,
  claimToken: string,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const key = z.string().trim().min(1).max(500).parse(mediaKey);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_release_media_analysis", {
    p_media_key: key,
    p_claim_token: z.string().uuid().parse(claimToken),
  }), options.signal);
  const { error } = await request;
  if (error) throw new Error(`matpin_cache_release_failed:${error.message}`);
}

export async function retryMatpinMessage(input: {
  messageId: string;
  queueMessageId: number;
  analysisClaimToken: string;
  error: string;
  signal?: AbortSignal;
}): Promise<"retry" | "complete_failed_required"> {
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_retry_message_v2", {
    p_message_id: input.messageId,
    p_queue_message_id: input.queueMessageId,
    p_analysis_claim_token: z.string().uuid().parse(input.analysisClaimToken),
    p_error: input.error.slice(0, 500),
  }), input.signal);
  const result = await request;
  if (result.error) throw new Error(`matpin_retry_failed:${result.error.message}`);
  return z.enum(["retry", "complete_failed_required"]).parse(result.data);
}

export async function requeueFailedMatpinMessage(
  messageId: string,
  options: { replyRequired?: boolean } = {},
): Promise<boolean> {
  const id = z.string().uuid().parse(messageId);
  const client = getMatpinServerClient();
  const { data: message, error: readError } = await client
    .from("matpin_instagram_messages")
    .select("id,status,reel_url")
    .eq("id", id)
    .maybeSingle<{ id: string; status: string; reel_url: string | null }>();
  if (readError) throw new Error(`matpin_requeue_read_failed:${readError.message}`);
  if (!message || message.status !== "failed" || !message.reel_url) return false;

  const replyRequired = options.replyRequired ?? true;
  const { data, error } = await client.rpc(
    replyRequired ? "matpin_requeue_failed_message" : "matpin_requeue_failed_message_without_reply",
    {
      p_message_id: id,
      p_media_url_ciphertext: encryptMatpinValue(message.reel_url),
    },
  );
  if (error) throw new Error(`matpin_requeue_failed:${error.message}`);
  return requeueResultSchema.parse(data).accepted;
}

export async function confirmMatpinPlace(input: {
  messageId: string;
  senderHash: string;
  candidate: MatpinPlaceCandidate;
  confirmationSource: "automatic_high_confidence" | "user_confirmation";
}): Promise<number> {
  const candidate = matpinPlaceCandidateSchema.parse(input.candidate);
  const client = getMatpinServerClient();
  const { data, error } = await client.rpc("matpin_confirm_place", {
    p_message_id: input.messageId,
    p_sender_hash: input.senderHash,
    p_place: candidate,
    p_confirmation_source: input.confirmationSource,
  });
  if (error) throw new Error(`matpin_confirm_failed:${error.message}`);
  return z.coerce.number().int().positive().parse(data);
}

export async function saveMatpinPlaces(input: {
  messageId: string;
  senderHash: string;
  candidates: MatpinPlaceCandidate[];
  confirmationSource: "automatic_high_confidence" | "user_confirmation";
}): Promise<number> {
  const candidates = z.array(matpinPlaceCandidateSchema).min(1).max(3).parse(input.candidates);
  const client = getMatpinServerClient();
  const { data, error } = await client.rpc("matpin_save_places", {
    p_message_id: input.messageId,
    p_sender_hash: input.senderHash,
    p_places: candidates,
    p_confirmation_source: input.confirmationSource,
  });
  if (error) throw new Error(`matpin_save_places_failed:${error.message}`);
  return z.coerce.number().int().min(1).max(3).parse(data);
}

export async function stageMatpinPlaces(input: {
  messageId: string;
  analysisClaimToken: string;
  senderHash: string;
  candidates: MatpinPlaceCandidate[];
  confirmationSource: "automatic_high_confidence" | "user_confirmation";
  signal?: AbortSignal;
}): Promise<number> {
  const candidates = z.array(matpinPlaceCandidateSchema).min(1).max(3).parse(input.candidates);
  const client = getMatpinServerClient();
  const request = withAbortSignal(client.rpc("matpin_stage_places", {
    p_message_id: input.messageId,
    p_analysis_claim_token: z.string().uuid().parse(input.analysisClaimToken),
    p_sender_hash: input.senderHash,
    p_places: candidates,
    p_confirmation_source: input.confirmationSource,
  }), input.signal);
  const { data, error } = await request;
  if (error) throw new Error(`matpin_stage_places_failed:${error.message}`);
  return z.coerce.number().int().min(1).max(3).parse(data);
}

async function senderHashFromAccessToken(accessToken: string): Promise<string | null> {
  const tokenHash = hashMatpinAccessToken(accessToken);
  const client = getMatpinServerClient();
  const { data, error } = await client
    .from("matpin_instagram_users")
    .select("sender_hash")
    .eq("access_token_hash", tokenHash)
    .gt("link_expires_at", new Date().toISOString())
    .maybeSingle<{ sender_hash: string }>();
  if (error) throw new Error(`matpin_user_read_failed:${error.message}`);
  return data?.sender_hash ?? null;
}

export async function readMatpinMessage(
  messageId: string,
  accessToken: string,
): Promise<{ message: MatpinMessagePublic; senderHash: string } | null> {
  const senderHash = await senderHashFromAccessToken(accessToken);
  if (!senderHash) return null;
  const client = getMatpinServerClient();
  const { data, error } = await client
    .from("matpin_instagram_messages")
    .select("id,sender_hash,status,selected_place_id,reel_url,candidates,received_at")
    .eq("id", messageId)
    .eq("sender_hash", senderHash)
    .maybeSingle();
  if (error) throw new Error(`matpin_message_read_failed:${error.message}`);
  if (!data) return null;
  const row = messageRowSchema.parse(data);
  if (row.status === "received" || row.status === "processing") return null;

  return {
    senderHash,
    message: matpinMessagePublicSchema.parse({
      id: row.id,
      status: row.status,
      selectedPlaceId: row.selected_place_id,
      reelUrl: row.reel_url,
      candidates: row.candidates,
      receivedAt: row.received_at,
      notice: row.status === "needs_confirmation"
          ? "게시물 단서와 실제 장소 후보를 비교한 뒤 찾은 장소를 모두 저장해주세요."
        : row.status === "saved"
          ? "역별 게시물 보관함에 저장된 장소예요."
          : "장소를 확인하지 못했어요. 원본 게시물에서 장소 이름을 확인해 다시 보내주세요.",
    }),
  };
}

export async function listMatpinSavedPlaces(accessToken: string): Promise<MatpinSavedPlace[] | null> {
  const senderHash = await senderHashFromAccessToken(accessToken);
  if (!senderHash) return null;
  const client = getMatpinServerClient();
  const { data, error } = await client
    .from("matpin_saved_places")
    .select("id,message_id,reel_id,reel_url,place,confirmation_source,saved_at")
    .eq("sender_hash", senderHash)
    .is("deleted_at", null)
    .order("saved_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`matpin_saves_read_failed:${error.message}`);
  return z.array(savedPlaceRowSchema).parse(data ?? []).map((row) => matpinSavedPlaceSchema.parse({
    id: row.id,
    messageId: row.message_id,
    reelId: row.reel_id,
    reelUrl: row.reel_url,
    place: row.place,
    confirmationSource: row.confirmation_source,
    savedAt: row.saved_at,
  }));
}

export async function deleteMatpinSavedPlace(id: number, accessToken: string): Promise<boolean> {
  const senderHash = await senderHashFromAccessToken(accessToken);
  if (!senderHash) return false;
  const client = getMatpinServerClient();
  const { data, error } = await client.rpc("matpin_delete_saved_place", {
    p_saved_id: id,
    p_sender_hash: senderHash,
  });
  if (error) throw new Error(`matpin_save_delete_failed:${error.message}`);
  return data === true;
}

export async function deleteMatpinAccount(accessToken: string): Promise<boolean> {
  const senderHash = await senderHashFromAccessToken(accessToken);
  if (!senderHash) return false;
  const client = getMatpinServerClient();
  const { error, count } = await client
    .from("matpin_instagram_users")
    .delete({ count: "exact" })
    .eq("sender_hash", senderHash);
  if (error) throw new Error(`matpin_account_delete_failed:${error.message}`);
  return count === 1;
}
