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
  decryptMatpinValue,
  encryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinSender,
  MatpinConfigurationError,
} from "@/lib/matpin/security";
import type { MatpinAnalysisResult } from "@/lib/matpin/reel-analyzer";

const ingestResultSchema = z.object({
  accepted: z.boolean(),
  duplicate: z.boolean(),
  messageId: z.string().uuid().optional(),
  queueMessageId: z.number().int().optional(),
});

const requeueResultSchema = z.object({
  accepted: z.boolean(),
  queueMessageId: z.number().int().optional(),
});

const claimedJobSchema = z.object({
  skipped: z.boolean().optional(),
  queueMessageId: z.number().int().optional(),
  message: z.object({
    id: z.string().uuid(),
    sender_hash: z.string().length(64),
    reel_id: z.string(),
    reel_url: z.string().url().nullable(),
    attachment_type: z.enum(["share", "video", "ig_reel", "reel"]),
    media_url_ciphertext: z.string().nullable(),
    attempt_count: z.number().int(),
  }).optional(),
  user: z.object({
    sender_hash: z.string().length(64),
    sender_ciphertext: z.string(),
    access_token_hash: z.string().length(64),
  }).optional(),
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
  messageId: string;
  senderHash: string;
  senderScopedId: string;
  accessToken: string;
  reelId: string;
  reelUrl: string | null;
  attachmentType: MatpinInboundMessage["attachmentType"];
  mediaUrl: string;
  attemptCount: number;
};

export function getMatpinServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new MatpinConfigurationError("matpin_store_not_configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ingestMatpinMessage(
  input: MatpinInboundMessage,
): Promise<z.infer<typeof ingestResultSchema>> {
  const value = matpinInboundMessageSchema.parse(input);
  const senderHash = hashMatpinSender(value.senderScopedId);
  const accessToken = createMatpinAccessToken(value.senderScopedId);
  const client = getMatpinServerClient();
  const { data, error } = await client.rpc("matpin_ingest_message", {
    p_meta_message_id: value.metaMessageId,
    p_sender_hash: senderHash,
    p_sender_ciphertext: encryptMatpinValue(value.senderScopedId),
    p_access_token_hash: hashMatpinAccessToken(accessToken),
    p_reel_id: value.reelId,
    p_reel_url: value.reelUrl,
    p_attachment_type: value.attachmentType,
    p_media_url_ciphertext: encryptMatpinValue(value.mediaUrl),
    p_received_at: value.receivedAt,
  });
  if (error) throw new Error(`matpin_ingest_failed:${error.message}`);
  return ingestResultSchema.parse(data);
}

export async function claimNextMatpinMessage(): Promise<MatpinClaimedJob | null> {
  const client = getMatpinServerClient();
  const { data, error } = await client.rpc("matpin_claim_next_message");
  if (error) throw new Error(`matpin_claim_failed:${error.message}`);
  if (!data) return null;

  const claimed = claimedJobSchema.parse(data);
  if (claimed.skipped || !claimed.message || !claimed.user || !claimed.queueMessageId) return null;
  if (!claimed.message.media_url_ciphertext) throw new Error("matpin_media_url_missing");

  const senderScopedId = decryptMatpinValue(claimed.user.sender_ciphertext);
  const accessToken = createMatpinAccessToken(senderScopedId);
  if (hashMatpinAccessToken(accessToken) !== claimed.user.access_token_hash) {
    throw new Error("matpin_access_token_mismatch");
  }

  return {
    queueMessageId: claimed.queueMessageId,
    messageId: claimed.message.id,
    senderHash: claimed.message.sender_hash,
    senderScopedId,
    accessToken,
    reelId: claimed.message.reel_id,
    reelUrl: claimed.message.reel_url,
    attachmentType: claimed.message.attachment_type,
    mediaUrl: decryptMatpinValue(claimed.message.media_url_ciphertext),
    attemptCount: claimed.message.attempt_count,
  };
}

export async function completeMatpinAnalysis(input: {
  messageId: string;
  queueMessageId: number;
  status: "needs_confirmation" | "saved" | "failed";
  candidates: MatpinPlaceCandidate[];
  metrics: MatpinAnalysisResult["metrics"] | null;
  replied: boolean;
}): Promise<void> {
  const candidates = z.array(matpinPlaceCandidateSchema).max(3).parse(input.candidates);
  const client = getMatpinServerClient();
  const { error } = await client.rpc("matpin_complete_analysis", {
    p_message_id: input.messageId,
    p_queue_message_id: input.queueMessageId,
    p_status: input.status,
    p_candidates: candidates,
    p_analysis_model: input.metrics?.model ?? null,
    p_analysis_duration_ms: input.metrics?.durationMs ?? null,
    p_media_bytes: input.metrics?.mediaBytes ?? null,
    p_input_tokens: input.metrics?.inputTokens ?? null,
    p_output_tokens: input.metrics?.outputTokens ?? null,
    p_total_tokens: input.metrics?.totalTokens ?? null,
    p_replied: input.replied,
  });
  if (error) throw new Error(`matpin_complete_failed:${error.message}`);
}

export async function retryMatpinMessage(input: {
  messageId: string;
  queueMessageId: number;
  error: string;
}): Promise<"retry" | "failed"> {
  const client = getMatpinServerClient();
  const result = await client.rpc("matpin_retry_message", {
    p_message_id: input.messageId,
    p_queue_message_id: input.queueMessageId,
    p_error: input.error.slice(0, 500),
  });
  if (result.error) throw new Error(`matpin_retry_failed:${result.error.message}`);
  return z.enum(["retry", "failed"]).parse(result.data);
}

export async function requeueFailedMatpinMessage(messageId: string): Promise<boolean> {
  const id = z.string().uuid().parse(messageId);
  const client = getMatpinServerClient();
  const { data: message, error: readError } = await client
    .from("matpin_instagram_messages")
    .select("id,status,reel_url")
    .eq("id", id)
    .maybeSingle<{ id: string; status: string; reel_url: string | null }>();
  if (readError) throw new Error(`matpin_requeue_read_failed:${readError.message}`);
  if (!message || message.status !== "failed" || !message.reel_url) return false;

  const { data, error } = await client.rpc("matpin_requeue_failed_message", {
    p_message_id: id,
    p_media_url_ciphertext: encryptMatpinValue(message.reel_url),
  });
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
        ? "영상 단서와 실제 장소 후보를 비교한 뒤 찾은 장소를 모두 저장해주세요."
        : row.status === "saved"
          ? "역별 릴스 보관함에 저장된 장소예요."
          : "장소를 확인하지 못했어요. 원본 릴스에서 식당 이름을 확인해 다시 보내주세요.",
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
