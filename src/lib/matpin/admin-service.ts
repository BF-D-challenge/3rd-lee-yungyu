import type { User } from "@supabase/supabase-js";
import {
  type MatpinAdminConversation,
  type MatpinAdminConversationDetail,
  type MatpinAdminFilter,
  type MatpinAdminRange,
  type MatpinAdminSummary,
} from "@/lib/matpin/admin-contract";
import {
  listMatpinInstagramConversations,
  readMatpinInstagramConversation,
  readMatpinInstagramReplyGuard,
  type MatpinInstagramConversation,
  type MatpinInstagramReplyGuard,
} from "@/lib/matpin/admin-instagram";
import {
  claimMatpinAdminAction,
  completeMatpinAdminAction,
  readMatpinAdminActionReplay,
  readMatpinAdminMessageOwner,
  readMatpinAdminStoredContexts,
  readMatpinAdminSummary,
  type MatpinAdminAction,
  type MatpinAdminStoredContext,
} from "@/lib/matpin/admin-store";
import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import { resendMatpinLibrary } from "@/lib/matpin/resend";
import { hashMatpinSender } from "@/lib/matpin/security";
import { requeueFailedMatpinMessage } from "@/lib/matpin/store";

function needsReply(conversation: MatpinInstagramConversation): boolean {
  const latest = conversation.messages.at(-1);
  return latest?.direction === "inbound";
}

function mergeConversation(
  live: MatpinInstagramConversation,
  stored: MatpinAdminStoredContext,
): MatpinAdminConversation {
  return {
    id: live.id,
    updatedAt: live.updatedAt,
    profile: live.profile,
    latestMessage: live.messages.at(-1) ?? null,
    latestStoredMessage: stored.messages[0] ?? null,
    savedPlaceCount: stored.savedPlaces.length,
    failedMessageCount: stored.messages.filter((message) => message.status === "failed").length,
    needsReply: needsReply(live),
    canReply: live.canReply,
    replyWindowEndsAt: live.replyWindowEndsAt,
  };
}

function matchesFilter(conversation: MatpinAdminConversation, filter: MatpinAdminFilter) {
  const status = conversation.latestStoredMessage?.status;
  if (filter === "all") return true;
  if (filter === "attention") return conversation.needsReply;
  if (filter === "processing") return status === "received" || status === "processing";
  if (filter === "saved") return status === "saved";
  return conversation.failedMessageCount > 0;
}

export async function listMatpinAdminConversations(input: {
  after?: string | null;
  filter: MatpinAdminFilter;
}) {
  const live = await listMatpinInstagramConversations(input.after);
  const senderHashes = live.conversations.map((conversation) => hashMatpinSender(conversation.recipientId));
  const stored = await readMatpinAdminStoredContexts(senderHashes);
  return {
    conversations: live.conversations
      .map((conversation) => mergeConversation(
        conversation,
        stored.get(hashMatpinSender(conversation.recipientId)) ?? { messages: [], savedPlaces: [] },
      ))
      .filter((conversation) => matchesFilter(conversation, input.filter)),
    nextCursor: live.nextCursor,
    partial: live.partial,
    liveSummary: {
      instagramAvailable: true,
      recentConversations: live.conversations.length,
      replyNeeded: live.conversations.filter(needsReply).length,
    },
    messageLimit: 20 as const,
  };
}

export async function readMatpinAdminConversation(
  conversationId: string,
): Promise<MatpinAdminConversationDetail> {
  const live = await readMatpinInstagramConversation(conversationId);
  const senderHash = hashMatpinSender(live.recipientId);
  const contexts = await readMatpinAdminStoredContexts([senderHash]);
  const stored = contexts.get(senderHash) ?? { messages: [], savedPlaces: [] };
  return {
    ...mergeConversation(live, stored),
    messages: live.messages,
    storedMessages: stored.messages,
    savedPlaces: stored.savedPlaces,
    messageLimit: 20,
  };
}

export async function readMatpinAdminDashboardSummary(
  range: MatpinAdminRange,
  includeInstagram = true,
): Promise<MatpinAdminSummary> {
  let live: { conversations: number; replyNeeded: number } | null = null;
  if (includeInstagram) {
    try {
      const page = await listMatpinInstagramConversations();
      live = {
        conversations: page.conversations.length,
        replyNeeded: page.conversations.filter(needsReply).length,
      };
    } catch {
      // DB 지표는 계속 제공하고 Meta 부분만 partial 상태로 표시한다.
    }
  }
  return readMatpinAdminSummary(range, live);
}

function safeErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  return message.split(":", 1)[0].replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 200) || "unknown_error";
}

function hasUncertainOutcome(error: unknown): boolean {
  const code = safeErrorCode(error);
  return code === "meta_send_outcome_uncertain" || code === "matpin_requeue_failed";
}

function duplicateResult(claim: Awaited<ReturnType<typeof claimMatpinAdminAction>>) {
  if (claim.state !== "duplicate") return null;
  if (claim.status === "succeeded") {
    return { duplicate: true as const, metaMessageId: claim.metaMessageId };
  }
  if (claim.status === "pending") throw new Error("admin_action_in_progress");
  if (claim.status === "uncertain") throw new Error("admin_action_completion_uncertain");
  throw new Error("admin_action_already_failed");
}

async function runAuditedAction<T>(input: {
  user: User;
  senderHash: string;
  messageId?: string | null;
  action: MatpinAdminAction;
  idempotencyKey: string;
  payload?: string | null;
  payloadFingerprint?: string | null;
  run: () => Promise<{ value: T; metaMessageId?: string | null }>;
}): Promise<T | { duplicate: true; metaMessageId: string | null }> {
  const claim = await claimMatpinAdminAction({
    adminUserId: input.user.id,
    senderHash: input.senderHash,
    messageId: input.messageId,
    action: input.action,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
    payloadFingerprint: input.payloadFingerprint,
  });
  const duplicate = duplicateResult(claim);
  if (duplicate) return duplicate;
  let result: { value: T; metaMessageId?: string | null };
  try {
    result = await input.run();
  } catch (error) {
    if (hasUncertainOutcome(error)) {
      try {
        await completeMatpinAdminAction({
          id: claim.id,
          status: "uncertain",
          errorCode: "admin_action_completion_uncertain",
        });
      } catch {
        // A later replay reconciles a stale pending row to uncertain. Never
        // classify an unknown delivery as failed or automatically resend it.
      }
      throw new Error("admin_action_completion_uncertain");
    }
    try {
      await completeMatpinAdminAction({
        id: claim.id,
        status: "failed",
        errorCode: safeErrorCode(error),
      });
    } catch {
      throw new Error("admin_action_completion_uncertain");
    }
    throw error;
  }
  try {
    await completeMatpinAdminAction({
      id: claim.id,
      status: "succeeded",
      metaMessageId: result.metaMessageId,
    });
  } catch {
    throw new Error("admin_action_completion_uncertain");
  }
  return result.value;
}

function assertSameRecipient(
  live: MatpinInstagramReplyGuard,
  recipientId: string,
  senderHash: string,
  errorCode: string,
) {
  if (live.recipientId !== recipientId || hashMatpinSender(live.recipientId) !== senderHash) {
    throw new Error(errorCode);
  }
}

export async function sendMatpinAdminReply(input: {
  user: User;
  conversationId: string;
  text: string;
  idempotencyKey: string;
}) {
  const payloadFingerprint = JSON.stringify([input.conversationId, input.text]);
  const replay = await readMatpinAdminActionReplay({
    adminUserId: input.user.id,
    action: "manual_reply",
    idempotencyKey: input.idempotencyKey,
    payload: input.text,
    payloadFingerprint,
  });
  if (replay) return duplicateResult(replay)!;
  const claimedLive = await readMatpinInstagramReplyGuard(input.conversationId);
  const senderHash = hashMatpinSender(claimedLive.recipientId);
  return runAuditedAction({
    user: input.user,
    senderHash,
    action: "manual_reply",
    idempotencyKey: input.idempotencyKey,
    payload: input.text,
    payloadFingerprint,
    run: async () => {
      const live = await readMatpinInstagramReplyGuard(input.conversationId);
      assertSameRecipient(live, claimedLive.recipientId, senderHash, "admin_reply_recipient_mismatch");
      if (!live.canReply) throw new Error("admin_reply_window_closed");
      const metaMessageId = await sendMatpinInstagramMessage(live.recipientId, input.text);
      return { value: { duplicate: false as const, metaMessageId }, metaMessageId };
    },
  });
}

export async function reprocessMatpinAdminMessage(input: {
  user: User;
  messageId: string;
  conversationId: string;
  idempotencyKey: string;
}) {
  const replay = await readMatpinAdminActionReplay({
    adminUserId: input.user.id,
    messageId: input.messageId,
    action: "reprocess",
    idempotencyKey: input.idempotencyKey,
    payload: input.conversationId,
  });
  if (replay) return duplicateResult(replay)!;
  const claimedOwner = await readMatpinAdminMessageOwner(input.messageId);
  if (!claimedOwner) throw new Error("admin_reprocess_unavailable");
  const claimedLive = await readMatpinInstagramReplyGuard(input.conversationId);
  if (
    hashMatpinSender(claimedLive.recipientId) !== claimedOwner.senderHash
    || claimedLive.recipientId !== claimedOwner.senderScopedId
  ) {
    throw new Error("admin_reprocess_recipient_mismatch");
  }
  return runAuditedAction({
    user: input.user,
    senderHash: claimedOwner.senderHash,
    messageId: input.messageId,
    action: "reprocess",
    idempotencyKey: input.idempotencyKey,
    payload: input.conversationId,
    run: async () => {
      const owner = await readMatpinAdminMessageOwner(input.messageId);
      if (!owner || owner.senderHash !== claimedOwner.senderHash || owner.status !== "failed") {
        throw new Error("admin_reprocess_unavailable");
      }
      const live = await readMatpinInstagramReplyGuard(input.conversationId);
      assertSameRecipient(live, owner.senderScopedId, owner.senderHash, "admin_reprocess_recipient_mismatch");
      const accepted = await requeueFailedMatpinMessage(input.messageId, { replyRequired: false });
      if (!accepted) throw new Error("admin_reprocess_unavailable");
      return { value: { duplicate: false as const, accepted } };
    },
  });
}

export async function resendMatpinAdminLibrary(input: {
  user: User;
  messageId: string;
  conversationId: string;
  idempotencyKey: string;
}) {
  const replay = await readMatpinAdminActionReplay({
    adminUserId: input.user.id,
    messageId: input.messageId,
    action: "resend_library",
    idempotencyKey: input.idempotencyKey,
    payload: input.conversationId,
  });
  if (replay) return duplicateResult(replay)!;
  const claimedOwner = await readMatpinAdminMessageOwner(input.messageId);
  if (!claimedOwner) throw new Error("admin_resend_unavailable");
  const claimedLive = await readMatpinInstagramReplyGuard(input.conversationId);
  if (
    hashMatpinSender(claimedLive.recipientId) !== claimedOwner.senderHash
    || claimedLive.recipientId !== claimedOwner.senderScopedId
  ) {
    throw new Error("admin_resend_recipient_mismatch");
  }
  return runAuditedAction({
    user: input.user,
    senderHash: claimedOwner.senderHash,
    messageId: input.messageId,
    action: "resend_library",
    idempotencyKey: input.idempotencyKey,
    payload: input.conversationId,
    run: async () => {
      const owner = await readMatpinAdminMessageOwner(input.messageId);
      if (
        !owner
        || owner.senderHash !== claimedOwner.senderHash
        || owner.status !== "saved"
        || owner.savedPlaceCount === 0
      ) {
        throw new Error("admin_resend_unavailable");
      }
      const result = await resendMatpinLibrary(input.messageId, owner.senderScopedId, async () => {
        const live = await readMatpinInstagramReplyGuard(input.conversationId);
        assertSameRecipient(live, owner.senderScopedId, owner.senderHash, "admin_resend_recipient_mismatch");
        if (!live.canReply) throw new Error("admin_reply_window_closed");
      });
      return {
        value: { duplicate: false as const, savedPlaceCount: result.savedPlaceCount, metaMessageId: result.metaMessageId },
        metaMessageId: result.metaMessageId,
      };
    },
  });
}
