import type { User } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readConversation: vi.fn(),
  readReplyGuard: vi.fn(),
  listConversations: vi.fn(),
  readContexts: vi.fn(),
  readSummary: vi.fn(),
  readOwner: vi.fn(),
  readReplay: vi.fn(),
  claimAction: vi.fn(),
  completeAction: vi.fn(),
  sendMessage: vi.fn(),
  resendLibrary: vi.fn(),
  requeue: vi.fn(),
}));

vi.mock("@/lib/matpin/admin-instagram", () => ({
  readMatpinInstagramConversation: mocks.readConversation,
  readMatpinInstagramReplyGuard: mocks.readReplyGuard,
  listMatpinInstagramConversations: mocks.listConversations,
}));

vi.mock("@/lib/matpin/admin-store", () => ({
  readMatpinAdminStoredContexts: mocks.readContexts,
  readMatpinAdminSummary: mocks.readSummary,
  readMatpinAdminMessageOwner: mocks.readOwner,
  readMatpinAdminActionReplay: mocks.readReplay,
  claimMatpinAdminAction: mocks.claimAction,
  completeMatpinAdminAction: mocks.completeAction,
}));

vi.mock("@/lib/matpin/instagram-send", () => ({
  sendMatpinInstagramMessage: mocks.sendMessage,
}));

vi.mock("@/lib/matpin/resend", () => ({
  resendMatpinLibrary: mocks.resendLibrary,
}));

vi.mock("@/lib/matpin/store", () => ({
  requeueFailedMatpinMessage: mocks.requeue,
}));

vi.mock("@/lib/matpin/security", () => ({
  hashMatpinSender: () => "a".repeat(64),
}));

import {
  listMatpinAdminConversations,
  readMatpinAdminDashboardSummary,
  reprocessMatpinAdminMessage,
  resendMatpinAdminLibrary,
  sendMatpinAdminReply,
} from "@/lib/matpin/admin-service";

const user = { id: "11111111-1111-4111-8111-111111111111" } as User;
const baseConversation = {
  id: "conversation-1",
  updatedAt: "2026-08-09T10:00:00.000Z",
  recipientId: "scoped-user-1",
  profile: { name: "테스터", username: "tester" },
  messages: [{
    id: "meta-message-1",
    direction: "inbound" as const,
    text: "게시물을 보냈습니다.",
    attachmentKind: "share" as const,
    createdAt: "2026-08-09T10:00:00.000Z",
  }],
  canReply: true,
  replyWindowEndsAt: "2026-08-10T10:00:00.000Z",
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("Matpin admin manual reply", () => {
  it("rechecks the live conversation after claiming and audits an expired reply without sending", async () => {
    mocks.readReplyGuard
      .mockResolvedValueOnce(baseConversation)
      .mockResolvedValueOnce({ ...baseConversation, canReply: false });
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_reply_window_closed");
    expect(mocks.claimAction).toHaveBeenCalledTimes(1);
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorCode: "admin_reply_window_closed",
    }));
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it("audits metadata and sends to the server-verified recipient once", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.sendMessage.mockResolvedValue("meta-outbound-1");
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).resolves.toEqual({ duplicate: false, metaMessageId: "meta-outbound-1" });
    expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
    expect(mocks.sendMessage).toHaveBeenCalledWith("scoped-user-1", "확인했습니다.");
    expect(mocks.claimAction).toHaveBeenCalledWith(expect.objectContaining({
      action: "manual_reply",
      senderHash: "a".repeat(64),
      payload: "확인했습니다.",
    }));
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "succeeded",
      metaMessageId: "meta-outbound-1",
    }));
    expect(mocks.readReplyGuard).toHaveBeenCalledTimes(2);
    expect(mocks.readConversation).not.toHaveBeenCalled();
  });

  it("returns a completed idempotent result without sending again", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({
      state: "duplicate",
      id: "33333333-3333-4333-8333-333333333333",
      status: "succeeded",
      metaMessageId: "meta-outbound-1",
    });

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).resolves.toEqual({ duplicate: true, metaMessageId: "meta-outbound-1" });
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.completeAction).not.toHaveBeenCalled();
    expect(mocks.readConversation).not.toHaveBeenCalled();
  });

  it("blocks a matching uncertain fingerprint even when a new key was submitted", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({
      state: "duplicate",
      id: "33333333-3333-4333-8333-333333333333",
      status: "uncertain",
      metaMessageId: null,
    });

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "55555555-5555-4555-8555-555555555555",
    })).rejects.toThrow("admin_action_completion_uncertain");
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.completeAction).not.toHaveBeenCalled();
  });

  it("replays a completed key before making another Meta request", async () => {
    mocks.readReplay.mockResolvedValue({
      state: "duplicate",
      id: "33333333-3333-4333-8333-333333333333",
      status: "succeeded",
      metaMessageId: "meta-outbound-1",
    });

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).resolves.toEqual({ duplicate: true, metaMessageId: "meta-outbound-1" });
    expect(mocks.readReplyGuard).not.toHaveBeenCalled();
    expect(mocks.readConversation).not.toHaveBeenCalled();
    expect(mocks.claimAction).not.toHaveBeenCalled();
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it("records a stable failure code when the send fails", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.sendMessage.mockRejectedValue(new Error("meta_send_failed:private upstream response"));
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("meta_send_failed");
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorCode: "meta_send_failed",
    }));
  });

  it("records an uncertain terminal state when delivery cannot be proved", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.sendMessage.mockRejectedValue(new Error("meta_send_outcome_uncertain"));

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_action_completion_uncertain");
    expect(mocks.completeAction).toHaveBeenCalledWith({
      id: "33333333-3333-4333-8333-333333333333",
      status: "uncertain",
      errorCode: "admin_action_completion_uncertain",
    });
  });

  it("keeps a pre-send guard timeout retryable because no delivery was attempted", async () => {
    mocks.readReplyGuard
      .mockResolvedValueOnce(baseConversation)
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("timed out");
    expect(mocks.sendMessage).not.toHaveBeenCalled();
    expect(mocks.completeAction).toHaveBeenCalledWith({
      id: "33333333-3333-4333-8333-333333333333",
      status: "failed",
      errorCode: "timed_out",
    });
  });

  it("never downgrades a delivered message when the success audit update fails", async () => {
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.sendMessage.mockResolvedValue("meta-outbound-1");
    mocks.completeAction.mockRejectedValue(new Error("matpin_admin_audit_complete_failed"));

    await expect(sendMatpinAdminReply({
      user,
      conversationId: "conversation-1",
      text: "확인했습니다.",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_action_completion_uncertain");
    expect(mocks.completeAction).toHaveBeenCalledTimes(1);
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({ status: "succeeded" }));
  });
});

describe("Matpin admin dashboard reads", () => {
  it("reads Meta once through the conversation response while summary stays DB-only", async () => {
    mocks.readSummary.mockResolvedValue({ range: "24h" });

    await expect(readMatpinAdminDashboardSummary("24h", false)).resolves.toEqual({ range: "24h" });
    expect(mocks.listConversations).not.toHaveBeenCalled();
    expect(mocks.readSummary).toHaveBeenCalledWith("24h", null);
  });

  it("returns unfiltered live counts with the filtered conversation page", async () => {
    mocks.listConversations.mockResolvedValue({
      conversations: [
        baseConversation,
        {
          ...baseConversation,
          id: "conversation-2",
          recipientId: "scoped-user-2",
          messages: [{ ...baseConversation.messages[0], id: "meta-message-2", direction: "outbound" }],
        },
      ],
      nextCursor: null,
      partial: false,
    });
    mocks.readContexts.mockResolvedValue(new Map());

    const result = await listMatpinAdminConversations({ filter: "attention" });
    expect(result.conversations).toHaveLength(1);
    expect(result.liveSummary).toEqual({
      instagramAvailable: true,
      recentConversations: 2,
      replyNeeded: 1,
    });
  });
});

describe("Matpin admin reprocess", () => {
  const failedOwner = {
    senderHash: "a".repeat(64),
    senderScopedId: "scoped-user-1",
    status: "failed" as const,
    savedPlaceCount: 0,
  };

  it("rechecks the owner and recipient, queues without an outbound reply, and audits success", async () => {
    mocks.readOwner.mockResolvedValue(failedOwner);
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.requeue.mockResolvedValue(true);
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(reprocessMatpinAdminMessage({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).resolves.toEqual(expect.objectContaining({ duplicate: false, accepted: true }));
    expect(mocks.readOwner).toHaveBeenCalledTimes(2);
    expect(mocks.readReplyGuard).toHaveBeenCalledTimes(2);
    expect(mocks.readReplyGuard).toHaveBeenCalledWith("conversation-1");
    expect(mocks.readConversation).not.toHaveBeenCalled();
    expect(mocks.requeue).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      { replyRequired: false },
    );
    expect(mocks.claimAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: "conversation-1",
    }));
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({ status: "succeeded" }));
  });

  it("audits a failed requeue and does not run the worker", async () => {
    mocks.readOwner.mockResolvedValue(failedOwner);
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.requeue.mockResolvedValue(false);
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(reprocessMatpinAdminMessage({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_reprocess_unavailable");
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorCode: "admin_reprocess_unavailable",
    }));
  });

  it("rejects a conversation owned by a different Instagram recipient", async () => {
    mocks.readOwner.mockResolvedValue(failedOwner);
    mocks.readReplyGuard.mockResolvedValue({ ...baseConversation, recipientId: "different-user" });

    await expect(reprocessMatpinAdminMessage({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_reprocess_recipient_mismatch");
    expect(mocks.claimAction).not.toHaveBeenCalled();
    expect(mocks.requeue).not.toHaveBeenCalled();
  });
});

describe("Matpin admin library resend", () => {
  const savedOwner = {
    senderHash: "a".repeat(64),
    senderScopedId: "scoped-user-1",
    status: "saved" as const,
    savedPlaceCount: 1,
  };

  it("binds the live conversation to the saved message and verified recipient", async () => {
    mocks.readOwner.mockResolvedValue(savedOwner);
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.resendLibrary.mockImplementation(async (
      _messageId: string,
      _recipientId: string,
      beforeSend: () => Promise<void>,
    ) => {
      await beforeSend();
      return { savedPlaceCount: 3, metaMessageId: "meta-outbound-2" };
    });
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(resendMatpinAdminLibrary({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).resolves.toEqual({ duplicate: false, savedPlaceCount: 3, metaMessageId: "meta-outbound-2" });
    expect(mocks.resendLibrary).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-444444444444",
      "scoped-user-1",
      expect.any(Function),
    );
    expect(mocks.readOwner).toHaveBeenCalledTimes(2);
    expect(mocks.readReplyGuard).toHaveBeenCalledTimes(2);
    expect(mocks.readConversation).not.toHaveBeenCalled();
    expect(mocks.claimAction).toHaveBeenCalledWith(expect.objectContaining({
      action: "resend_library",
      messageId: "44444444-4444-4444-8444-444444444444",
      payload: "conversation-1",
    }));
  });

  it("rejects a message without a saved place tied to it", async () => {
    mocks.readOwner
      .mockResolvedValueOnce(savedOwner)
      .mockResolvedValueOnce({ ...savedOwner, savedPlaceCount: 0 });
    mocks.readReplyGuard.mockResolvedValue(baseConversation);
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.completeAction.mockResolvedValue(undefined);

    await expect(resendMatpinAdminLibrary({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_resend_unavailable");
    expect(mocks.claimAction).toHaveBeenCalledTimes(1);
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorCode: "admin_resend_unavailable",
    }));
    expect(mocks.resendLibrary).not.toHaveBeenCalled();
  });

  it("runs the final reply-window check immediately before resend", async () => {
    mocks.readOwner.mockResolvedValue(savedOwner);
    mocks.readReplyGuard
      .mockResolvedValueOnce(baseConversation)
      .mockResolvedValueOnce({ ...baseConversation, canReply: false });
    mocks.claimAction.mockResolvedValue({ state: "claimed", id: "33333333-3333-4333-8333-333333333333" });
    mocks.completeAction.mockResolvedValue(undefined);
    mocks.resendLibrary.mockImplementation(async (
      _messageId: string,
      _recipientId: string,
      beforeSend: () => Promise<void>,
    ) => {
      await beforeSend();
      return { savedPlaceCount: 3, metaMessageId: "meta-outbound-2" };
    });

    await expect(resendMatpinAdminLibrary({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_reply_window_closed");
    expect(mocks.completeAction).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      errorCode: "admin_reply_window_closed",
    }));
  });

  it("rejects a different claimed live recipient before auditing or resending", async () => {
    mocks.readOwner.mockResolvedValue(savedOwner);
    mocks.readReplyGuard.mockResolvedValue({ ...baseConversation, recipientId: "different-user" });

    await expect(resendMatpinAdminLibrary({
      user,
      messageId: "44444444-4444-4444-8444-444444444444",
      conversationId: "conversation-1",
      idempotencyKey: "22222222-2222-4222-8222-222222222222",
    })).rejects.toThrow("admin_resend_recipient_mismatch");
    expect(mocks.claimAction).not.toHaveBeenCalled();
    expect(mocks.resendLibrary).not.toHaveBeenCalled();
  });
});

describe("Matpin admin mutation route budgets", () => {
  it("allows the three bounded Meta calls plus auth, DB preparation, and audit headroom", async () => {
    const [replyRoute, resendRoute] = await Promise.all([
      import("@/app/api/matpin/admin/conversations/[id]/messages/route"),
      import("@/app/api/matpin/admin/messages/[id]/resend/route"),
    ]);

    expect(replyRoute.maxDuration).toBe(60);
    expect(resendRoute.maxDuration).toBe(60);
  });
});
