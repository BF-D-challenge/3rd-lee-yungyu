import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const original = await importOriginal<typeof import("@supabase/supabase-js")>();
  return { ...original, createClient: mocks.createClient };
});

import {
  beginMatpinOutboundSend,
  claimNextMatpinOutbound,
  completeMatpinAnalysisV2,
  enqueueMatpinWebhookBatch,
  finishMatpinOutbound,
  releaseMatpinOutboundLease,
} from "@/lib/matpin/store";

type QueryResult = { data: unknown; error: { message: string } | null };

function request(result: QueryResult) {
  const query = {} as PromiseLike<QueryResult> & {
    abortSignal: ReturnType<typeof vi.fn>;
  };
  query.abortSignal = vi.fn(() => query);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

const deliveryId = "11111111-1111-4111-8111-111111111111";
const messageId = "22222222-2222-4222-8222-222222222222";
const leaseToken = "33333333-3333-4333-8333-333333333333";
const analysisClaimToken = "44444444-4444-4444-8444-444444444444";
const hash = "a".repeat(64);

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("Matpin outbound store", () => {
  it("sends all prepared webhook events through one abortable batch RPC", async () => {
    const rpcRequest = request({
      data: {
        accepted: 0,
        duplicates: 0,
        receiptsQueued: 0,
        guidanceQueued: 1,
        guidanceCooldown: 0,
        results: [{
          type: "guidance",
          queued: true,
          duplicate: false,
          cooldown: false,
          outboundId: deliveryId,
          deliveryState: "pending",
        }],
      },
      error: null,
    });
    const rpc = vi.fn(() => rpcRequest);
    mocks.createClient.mockReturnValue({ rpc });
    const signal = AbortSignal.timeout(4_000);
    const event = {
      type: "guidance" as const,
      dedupHash: hash,
      senderHash: "c".repeat(64),
      outboundSenderHash: "b".repeat(64),
      recipientCiphertext: "encrypted-recipient",
      bodyCiphertext: "encrypted-body",
    };

    await expect(enqueueMatpinWebhookBatch([event], { signal })).resolves.toMatchObject({
      guidanceQueued: 1,
    });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("matpin_ingest_webhook_batch", { p_events: [event] });
    expect(rpcRequest.abortSignal).toHaveBeenCalledWith(signal);
  });

  it("rejects guidance that cannot bind its account hash to its outbound hash", async () => {
    const rpc = vi.fn();
    mocks.createClient.mockReturnValue({ rpc });
    const eventWithoutAccountHash = {
      type: "guidance",
      dedupHash: hash,
      outboundSenderHash: "b".repeat(64),
      recipientCiphertext: "encrypted-recipient",
      bodyCiphertext: "encrypted-body",
    };

    await expect(enqueueMatpinWebhookBatch([
      eventWithoutAccountHash as unknown as Parameters<typeof enqueueMatpinWebhookBatch>[0][number],
    ])).rejects.toThrow();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("parses a leased claim and applies the caller signal", async () => {
    const rpcRequest = request({
      data: {
        id: deliveryId,
        kind: "receipt",
        dedup_hash: hash,
        message_id: messageId,
        generation: 0,
        sender_hash: "b".repeat(64),
        recipient_ciphertext: "encrypted-recipient",
        body_ciphertext: "encrypted-body",
        state: "leased",
        lease_token: leaseToken,
        lease_expires_at: "2026-08-10T12:00:30.000Z",
        attempt_count: 0,
        expires_at: "2026-08-17T12:00:00.000Z",
      },
      error: null,
    });
    const rpc = vi.fn(() => rpcRequest);
    mocks.createClient.mockReturnValue({ rpc });
    const signal = AbortSignal.timeout(1_000);

    await expect(claimNextMatpinOutbound({ leaseSeconds: 45, signal })).resolves.toMatchObject({
      id: deliveryId,
      state: "leased",
      lease_token: leaseToken,
    });
    expect(rpc).toHaveBeenCalledWith("matpin_claim_next_outbound", { p_lease_seconds: 45 });
    expect(rpcRequest.abortSignal).toHaveBeenCalledWith(signal);
  });

  it("keeps lease, begin, and finish tokens aligned", async () => {
    const beginRequest = request({ data: true, error: null });
    const finishRequest = request({ data: { state: "succeeded", retryAt: null }, error: null });
    const rpc = vi.fn()
      .mockReturnValueOnce(beginRequest)
      .mockReturnValueOnce(finishRequest);
    mocks.createClient.mockReturnValue({ rpc });

    await expect(beginMatpinOutboundSend({ deliveryId, leaseToken })).resolves.toBe(true);
    await expect(finishMatpinOutbound({
      deliveryId,
      leaseToken,
      outcome: "succeeded",
      providerMessageIdHash: hash,
      providerStatus: 200,
    })).resolves.toEqual({ state: "succeeded", retryAt: null });
    expect(rpc).toHaveBeenNthCalledWith(1, "matpin_begin_outbound_send", {
      p_delivery_id: deliveryId,
      p_lease_token: leaseToken,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "matpin_finish_outbound", expect.objectContaining({
      p_delivery_id: deliveryId,
      p_lease_token: leaseToken,
      p_outcome: "succeeded",
      p_provider_message_id_hash: hash,
      p_provider_status: 200,
    }));
  });

  it("releases only the leased pre-send attempt with bounded input", async () => {
    const rpcRequest = request({ data: "pending", error: null });
    const rpc = vi.fn(() => rpcRequest);
    mocks.createClient.mockReturnValue({ rpc });

    await expect(releaseMatpinOutboundLease({
      deliveryId,
      leaseToken,
      errorCode: "outbound_config_unavailable",
      retryAfterSeconds: 30,
    })).resolves.toBe("pending");
    expect(rpc).toHaveBeenCalledWith("matpin_release_outbound_lease", {
      p_delivery_id: deliveryId,
      p_lease_token: leaseToken,
      p_error_code: "outbound_config_unavailable",
      p_retry_after_seconds: 30,
      p_permanent: false,
    });
  });

  it("atomically completes analysis and queues the encrypted final reply", async () => {
    const rpcRequest = request({
      data: { completed: true, outboundId: deliveryId, deliveryState: "pending" },
      error: null,
    });
    const rpc = vi.fn(() => rpcRequest);
    mocks.createClient.mockReturnValue({ rpc });
    const finalOutbound = {
      dedupHash: hash,
      senderHash: "b".repeat(64),
      recipientCiphertext: "encrypted-recipient",
      bodyCiphertext: "encrypted-body",
    };

    await expect(completeMatpinAnalysisV2({
      messageId,
      queueMessageId: 19,
      analysisClaimToken,
      status: "saved",
      candidates: [],
      metrics: null,
      finalOutbound,
    })).resolves.toEqual({ completed: true, outboundId: deliveryId, deliveryState: "pending" });
    expect(rpc).toHaveBeenCalledWith("matpin_complete_analysis_v2", expect.objectContaining({
      p_message_id: messageId,
      p_queue_message_id: 19,
      p_analysis_claim_token: analysisClaimToken,
      p_final_dedup_hash: hash,
      p_final_sender_hash: "b".repeat(64),
      p_final_recipient_ciphertext: "encrypted-recipient",
      p_final_body_ciphertext: "encrypted-body",
    }));
  });
});
