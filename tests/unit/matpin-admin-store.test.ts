import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  decrypt: vi.fn(() => "scoped-user-1"),
}));

vi.mock("@/lib/matpin/store", () => ({
  getMatpinServerClient: mocks.getClient,
}));

vi.mock("@/lib/matpin/security", () => ({
  decryptMatpinValue: mocks.decrypt,
}));

import {
  claimMatpinAdminAction,
  completeMatpinAdminAction,
  readMatpinAdminActionReplay,
  readMatpinAdminMessageOwner,
  readMatpinAdminStoredContexts,
} from "@/lib/matpin/admin-store";

type QueryResult = {
  data: unknown;
  error: { code?: string; message: string } | null;
  count?: number | null;
};

function query(result: QueryResult) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & PromiseLike<QueryResult> = {} as never;
  for (const method of ["insert", "select", "update", "eq", "in", "is", "order", "limit"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single = vi.fn(async () => result);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Matpin admin audit idempotency", () => {
  const input = {
    adminUserId: "11111111-1111-4111-8111-111111111111",
    senderHash: "a".repeat(64),
    messageId: "22222222-2222-4222-8222-222222222222",
    action: "manual_reply" as const,
    idempotencyKey: "33333333-3333-4333-8333-333333333333",
    payload: "확인했습니다.",
  };
  const payloadSha256 = createHash("sha256").update(input.payload).digest("hex");
  const actionId = "44444444-4444-4444-8444-444444444444";
  const replayBase = {
    state: "duplicate" as const,
    id: actionId,
    status: "succeeded" as const,
    metaMessageId: "meta-message-1",
    action: input.action,
    messageId: input.messageId,
    payloadSha256,
  };

  it("claims atomically through the database without sending the raw payload", async () => {
    const rpc = vi.fn(async () => ({
      data: { state: "claimed", id: actionId },
      error: null,
    }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(claimMatpinAdminAction(input)).resolves.toEqual({
      state: "claimed",
      id: actionId,
    });
    expect(rpc).toHaveBeenCalledWith("matpin_claim_admin_action", {
      p_admin_user_id: input.adminUserId,
      p_sender_hash: input.senderHash,
      p_message_id: input.messageId,
      p_action: input.action,
      p_idempotency_key: input.idempotencyKey,
      p_payload_sha256: payloadSha256,
      p_payload_length: input.payload.length,
    });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(input.payload);
  });

  it("returns an uncertain fingerprint duplicate claimed under a different key", async () => {
    const rpc = vi.fn(async () => ({
      data: {
        state: "duplicate",
        id: actionId,
        status: "uncertain",
        metaMessageId: null,
      },
      error: null,
    }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(claimMatpinAdminAction({
      ...input,
      idempotencyKey: "55555555-5555-4555-8555-555555555555",
    })).resolves.toEqual({
      state: "duplicate",
      id: actionId,
      status: "uncertain",
      metaMessageId: null,
    });
  });

  it("preserves the public mismatch code returned by the database claim", async () => {
    const rpc = vi.fn(async () => ({
      data: null,
      error: { message: "admin_action_idempotency_mismatch" },
    }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(claimMatpinAdminAction(input)).rejects.toThrow("admin_action_idempotency_mismatch");
  });

  it("reads a matching completed key without requiring a live recipient lookup", async () => {
    const rpc = vi.fn(async () => ({ data: replayBase, error: null }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(readMatpinAdminActionReplay({
      adminUserId: input.adminUserId,
      messageId: input.messageId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    })).resolves.toEqual({
      state: "duplicate",
      id: actionId,
      status: "succeeded",
      metaMessageId: "meta-message-1",
    });
    expect(rpc).toHaveBeenCalledWith("matpin_read_admin_action_replay", {
      p_admin_user_id: input.adminUserId,
      p_idempotency_key: input.idempotencyKey,
    });
  });

  it("exposes a reconciled stale pending row only as uncertain", async () => {
    const rpc = vi.fn(async () => ({
      data: { ...replayBase, status: "uncertain", metaMessageId: null },
      error: null,
    }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(readMatpinAdminActionReplay({
      adminUserId: input.adminUserId,
      messageId: input.messageId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    })).resolves.toEqual(expect.objectContaining({ status: "uncertain" }));
  });

  it("rejects a replay whose action fingerprint differs", async () => {
    const rpc = vi.fn(async () => ({
      data: { ...replayBase, payloadSha256: createHash("sha256").update("다른 답장").digest("hex") },
      error: null,
    }));
    mocks.getClient.mockReturnValue({ rpc });

    await expect(readMatpinAdminActionReplay({
      adminUserId: input.adminUserId,
      messageId: input.messageId,
      action: input.action,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    })).rejects.toThrow("admin_action_idempotency_mismatch");
  });
});

describe("Matpin admin audit completion", () => {
  const actionId = "44444444-4444-4444-8444-444444444444";

  it("allows only a pending action to move to a terminal state", async () => {
    const completion = query({ data: { id: actionId }, error: null });
    mocks.getClient.mockReturnValue({ from: vi.fn(() => completion) });

    await expect(completeMatpinAdminAction({
      id: actionId,
      status: "succeeded",
      metaMessageId: "meta-message-1",
    })).resolves.toBeUndefined();
    expect(completion.eq).toHaveBeenCalledWith("status", "pending");
    expect(completion.select).toHaveBeenCalledWith("id");
  });

  it("records an uncertain outcome as a terminal state without raw content", async () => {
    const completion = query({ data: { id: actionId }, error: null });
    mocks.getClient.mockReturnValue({ from: vi.fn(() => completion) });

    await expect(completeMatpinAdminAction({
      id: actionId,
      status: "uncertain",
      errorCode: "admin_action_completion_uncertain",
    })).resolves.toBeUndefined();
    expect(completion.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "uncertain",
      error_code: "admin_action_completion_uncertain",
    }));
  });

  it("rejects a second terminal transition", async () => {
    const completion = query({ data: null, error: null });
    mocks.getClient.mockReturnValue({ from: vi.fn(() => completion) });

    await expect(completeMatpinAdminAction({
      id: actionId,
      status: "failed",
      errorCode: "meta_send_failed",
    })).rejects.toThrow("matpin_admin_audit_invalid_transition");
  });
});

describe("Matpin admin stored message safety", () => {
  it("never exposes the raw last_error value", async () => {
    const messages = query({
      data: [{
        id: "22222222-2222-4222-8222-222222222222",
        sender_hash: "a".repeat(64),
        status: "failed",
        attachment_type: "ig_reel",
        reel_url: "https://www.instagram.com/reel/example/",
        received_at: "2026-08-09T10:00:00.000Z",
        replied_at: null,
        acknowledged_at: null,
        attempt_count: 3,
        last_error: "gemini_upstream:api_key=private-secret",
        analysis_duration_ms: null,
        total_tokens: null,
      }],
      error: null,
    });
    const places = query({ data: [], error: null });
    mocks.getClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(messages)
        .mockReturnValueOnce(places),
    });

    const contexts = await readMatpinAdminStoredContexts(["a".repeat(64)]);
    const stored = contexts.get("a".repeat(64))?.messages[0];
    expect(stored).toEqual(expect.objectContaining({
      failureCode: "analysis_unavailable",
      failureReason: "게시물 분석을 완료하지 못했습니다.",
      lastError: "게시물 분석을 완료하지 못했습니다.",
    }));
    expect(JSON.stringify(stored)).not.toContain("private-secret");
  });

  it("counts only active places tied to the selected message", async () => {
    const messageId = "22222222-2222-4222-8222-222222222222";
    const messages = query({
      data: {
        sender_hash: "a".repeat(64),
        status: "saved",
        received_at: "2026-08-09T10:00:00.000Z",
      },
      error: null,
    });
    const places = query({ data: null, error: null, count: 1 });
    const user = query({ data: { sender_ciphertext: "encrypted-value" }, error: null });
    mocks.getClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce(messages)
        .mockReturnValueOnce(places)
        .mockReturnValueOnce(user),
    });

    await expect(readMatpinAdminMessageOwner(messageId)).resolves.toEqual({
      senderHash: "a".repeat(64),
      senderScopedId: "scoped-user-1",
      status: "saved",
      savedPlaceCount: 1,
      receivedAt: "2026-08-09T10:00:00.000Z",
    });
    expect(places.eq).toHaveBeenCalledWith("message_id", messageId);
    expect(places.eq).toHaveBeenCalledWith("sender_hash", "a".repeat(64));
    expect(places.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
