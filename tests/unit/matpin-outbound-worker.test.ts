import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  claim: vi.fn(),
  decrypt: vi.fn(),
  finish: vi.fn(),
  hashProviderMessage: vi.fn(),
  preflight: vi.fn(),
  release: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/matpin/store", () => ({
  beginMatpinOutboundSend: mocks.begin,
  claimNextMatpinOutbound: mocks.claim,
  finishMatpinOutbound: mocks.finish,
  releaseMatpinOutboundLease: mocks.release,
}));

vi.mock("@/lib/matpin/security", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/matpin/security")>();
  return {
    ...original,
    decryptMatpinValue: mocks.decrypt,
    hashMatpinOutboundProviderMessage: mocks.hashProviderMessage,
  };
});

vi.mock("@/lib/matpin/instagram-send", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/matpin/instagram-send")>();
  return {
    ...original,
    preflightMatpinInstagramMessage: mocks.preflight,
    sendMatpinInstagramMessage: mocks.send,
  };
});

import {
  MatpinInstagramSendError,
} from "@/lib/matpin/instagram-send";
import {
  MATPIN_OUTBOUND_MIN_JOB_TIME_MS,
  processMatpinOutboundQueue,
} from "@/lib/matpin/outbound-worker";
import { MatpinConfigurationError } from "@/lib/matpin/security";
import type { MatpinClaimedOutbound } from "@/lib/matpin/store";

const providerHash = "f".repeat(64);

function delivery(index = 1): MatpinClaimedOutbound {
  const suffix = String(index).padStart(12, "0");
  return {
    id: `11111111-1111-4111-8111-${suffix}`,
    kind: "receipt",
    dedup_hash: "a".repeat(64),
    message_id: `22222222-2222-4222-8222-${suffix}`,
    generation: 0,
    sender_hash: "b".repeat(64),
    recipient_ciphertext: `recipient-${index}-ciphertext`,
    body_ciphertext: `body-${index}-ciphertext`,
    state: "leased",
    lease_token: `33333333-3333-4333-8333-${suffix}`,
    lease_expires_at: "2026-08-10T12:00:30.000Z",
    attempt_count: 0,
    expires_at: "2026-08-17T12:00:00.000Z",
  };
}

function queueClaims(values: MatpinClaimedOutbound[]) {
  const queue = [...values];
  mocks.claim.mockImplementation(async () => queue.shift() ?? null);
}

beforeEach(() => {
  mocks.begin.mockReset().mockResolvedValue(true);
  mocks.claim.mockReset();
  mocks.decrypt.mockReset().mockImplementation((value: string) => {
    if (value.startsWith("recipient-")) return value.replace("-ciphertext", "");
    if (value.startsWith("body-")) return `reply-${value.split("-")[1]}`;
    throw new Error("unexpected_ciphertext");
  });
  mocks.finish.mockReset().mockResolvedValue({ state: "succeeded", retryAt: null });
  mocks.hashProviderMessage.mockReset().mockReturnValue(providerHash);
  mocks.preflight.mockReset().mockReturnValue(undefined);
  mocks.release.mockReset().mockResolvedValue("pending");
  mocks.send.mockReset().mockResolvedValue("raw-provider-message-id");
  queueClaims([delivery()]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Matpin outbound worker", () => {
  it("claims one delivery, sends it once, and stores only the provider HMAC", async () => {
    const results = await processMatpinOutboundQueue({ limit: 1 });

    expect(results).toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "succeeded",
    }]);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.begin).toHaveBeenCalledWith({
      deliveryId: delivery().id,
      leaseToken: delivery().lease_token,
      signal: undefined,
    });
    expect(mocks.hashProviderMessage).toHaveBeenCalledWith("raw-provider-message-id");
    const finishInput = mocks.finish.mock.calls[0][0];
    expect(finishInput).toEqual({
      deliveryId: delivery().id,
      leaseToken: delivery().lease_token,
      outcome: "succeeded",
      providerMessageIdHash: providerHash,
      signal: expect.any(AbortSignal),
    });
    expect(JSON.stringify({ results, finishInput })).not.toContain("raw-provider-message-id");
  });

  it("runs decryption and preflight before beginning the send", async () => {
    const order: string[] = [];
    mocks.decrypt.mockImplementation((value: string) => {
      order.push(value.startsWith("recipient-") ? "decrypt-recipient" : "decrypt-body");
      return value.startsWith("recipient-") ? "recipient-1" : "reply-1";
    });
    mocks.preflight.mockImplementation(() => {
      order.push("preflight");
    });
    mocks.begin.mockImplementation(async () => {
      order.push("begin");
      return true;
    });
    mocks.send.mockImplementation(async () => {
      order.push("send");
      return "provider-1";
    });

    await processMatpinOutboundQueue({ limit: 1 });

    expect(order).toEqual([
      "decrypt-recipient",
      "decrypt-body",
      "preflight",
      "begin",
      "send",
    ]);
  });

  it("releases a transient configuration failure before begin", async () => {
    mocks.preflight.mockImplementation(() => {
      throw new MatpinConfigurationError("meta_send_not_configured");
    });

    await expect(processMatpinOutboundQueue({ limit: 1 })).resolves.toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "pending",
      errorCode: "outbound_config_unavailable",
    }]);
    expect(mocks.release).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "outbound_config_unavailable",
      permanent: false,
      signal: expect.any(AbortSignal),
    }));
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("uses a bounded independent signal to release after the work signal aborts", async () => {
    const controller = new AbortController();
    mocks.claim.mockImplementationOnce(async () => {
      controller.abort();
      return delivery();
    });

    await processMatpinOutboundQueue({ limit: 1, signal: controller.signal });

    const releaseSignal = mocks.release.mock.calls[0][0].signal as AbortSignal;
    expect(releaseSignal).not.toBe(controller.signal);
    expect(releaseSignal.aborted).toBe(false);
    expect(mocks.release).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "outbound_aborted",
      permanent: false,
    }));
  });

  it("permanently fails invalid ciphertext without beginning a send", async () => {
    mocks.decrypt.mockImplementation(() => {
      throw new Error("cipher authentication failed with sensitive details");
    });
    mocks.release.mockResolvedValue("failed");

    await expect(processMatpinOutboundQueue({ limit: 1 })).resolves.toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "failed",
      errorCode: "outbound_ciphertext_invalid",
    }]);
    expect(mocks.release).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "outbound_ciphertext_invalid",
      permanent: true,
    }));
    expect(mocks.begin).not.toHaveBeenCalled();
  });

  it("retries when decryption is unavailable because its secret is not configured", async () => {
    mocks.decrypt.mockImplementation(() => {
      throw new MatpinConfigurationError("matpin_data_secret_missing");
    });

    await processMatpinOutboundQueue({ limit: 1 });

    expect(mocks.release).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "outbound_config_unavailable",
      permanent: false,
    }));
    expect(mocks.begin).not.toHaveBeenCalled();
  });

  it("permanently fails invalid outbound text before begin", async () => {
    mocks.preflight.mockImplementation(() => {
      throw new Error("meta_send_text_invalid");
    });
    mocks.release.mockResolvedValue("failed");

    await processMatpinOutboundQueue({ limit: 1 });

    expect(mocks.release).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "outbound_payload_invalid",
      permanent: true,
    }));
    expect(mocks.begin).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("does not send when the begin transition rejects the lease", async () => {
    mocks.begin.mockResolvedValue(false);

    await expect(processMatpinOutboundQueue({ limit: 1 })).resolves.toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "skipped",
      errorCode: "outbound_begin_rejected",
    }]);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.finish).not.toHaveBeenCalled();
  });

  it("does not send when the begin transition response is ambiguous", async () => {
    mocks.begin.mockRejectedValue(new Error("database response detail"));

    await expect(processMatpinOutboundQueue({ limit: 1 })).resolves.toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "error",
      errorCode: "outbound_begin_record_failed",
    }]);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("retries only a known-not-sent 429", async () => {
    mocks.send.mockRejectedValue(new MatpinInstagramSendError(
      "provider detail must not escape",
      "known_not_sent",
      429,
      true,
    ));
    mocks.finish.mockResolvedValue({ state: "pending", retryAt: "2026-08-10T12:00:30.000Z" });

    await expect(processMatpinOutboundQueue({ limit: 1 })).resolves.toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "pending",
      errorCode: "outbound_rate_limited",
    }]);
    expect(mocks.finish).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "known_not_sent",
      errorCode: "outbound_rate_limited",
      providerStatus: 429,
    }));
  });

  it("permanently fails other provider 4xx responses", async () => {
    mocks.send.mockRejectedValue(new MatpinInstagramSendError(
      "meta rejected raw response",
      "known_not_sent",
      400,
      false,
    ));
    mocks.finish.mockResolvedValue({ state: "failed", retryAt: null });

    await processMatpinOutboundQueue({ limit: 1 });

    expect(mocks.finish).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "failed",
      errorCode: "outbound_provider_rejected",
      providerStatus: 400,
    }));
  });

  it.each([
    ["transport or timeout", null],
    ["provider 5xx", 503],
    ["provider body parse", 200],
  ])("marks %s failures uncertain", async (_label, status) => {
    mocks.send.mockRejectedValue(new MatpinInstagramSendError(
      "sensitive provider failure",
      "uncertain",
      status,
      false,
    ));
    mocks.finish.mockResolvedValue({ state: "uncertain", retryAt: null });

    await processMatpinOutboundQueue({ limit: 1 });

    expect(mocks.finish).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "uncertain",
      errorCode: "outbound_send_uncertain",
      providerStatus: status,
    }));
  });

  it("records an uncertain send with a fresh settlement signal after caller abort", async () => {
    const controller = new AbortController();
    mocks.send.mockImplementationOnce(async () => {
      controller.abort();
      throw new MatpinInstagramSendError(
        "caller timeout detail",
        "uncertain",
        null,
        false,
      );
    });
    mocks.finish.mockResolvedValue({ state: "uncertain", retryAt: null });

    await processMatpinOutboundQueue({ limit: 1, signal: controller.signal });

    const finishSignal = mocks.finish.mock.calls[0][0].signal as AbortSignal;
    expect(finishSignal).not.toBe(controller.signal);
    expect(finishSignal.aborted).toBe(false);
    expect(mocks.finish).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "uncertain",
      errorCode: "outbound_send_uncertain",
    }));
  });

  it("does not release or resend after a successful send cannot be recorded", async () => {
    mocks.finish.mockRejectedValue(new Error("database response with raw details"));

    const first = await processMatpinOutboundQueue({ limit: 1 });
    queueClaims([]);
    const second = await processMatpinOutboundQueue({ limit: 1 });

    expect(first).toEqual([{
      deliveryId: delivery().id,
      kind: "receipt",
      state: "error",
      errorCode: "outbound_finish_record_failed",
    }]);
    expect(second).toEqual([]);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("caps delivery concurrency at five", async () => {
    const deliveries = Array.from({ length: 6 }, (_, index) => delivery(index + 1));
    queueClaims(deliveries);
    let active = 0;
    let maximumActive = 0;
    let releaseSends = () => {};
    const sendGate = new Promise<void>((resolve) => {
      releaseSends = resolve;
    });
    mocks.send.mockImplementation(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (active === 5) releaseSends();
      await sendGate;
      active -= 1;
      return "provider-id";
    });

    const results = await processMatpinOutboundQueue({ limit: 6, concurrency: 99 });

    expect(results).toHaveLength(6);
    expect(maximumActive).toBe(5);
    expect(mocks.send).toHaveBeenCalledTimes(6);
  });

  it("defaults both the drain limit and delivery concurrency to five", async () => {
    queueClaims(Array.from({ length: 6 }, (_, index) => delivery(index + 1)));
    let active = 0;
    let maximumActive = 0;
    let releaseSends = () => {};
    const sendGate = new Promise<void>((resolve) => {
      releaseSends = resolve;
    });
    mocks.send.mockImplementation(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      if (active === 5) releaseSends();
      await sendGate;
      active -= 1;
      return "provider-id";
    });

    const results = await processMatpinOutboundQueue();

    expect(results).toHaveLength(5);
    expect(maximumActive).toBe(5);
    expect(mocks.send).toHaveBeenCalledTimes(5);
  });

  it("continues another lane when one delivery fails", async () => {
    queueClaims([delivery(1), delivery(2)]);
    mocks.send
      .mockRejectedValueOnce(new MatpinInstagramSendError(
        "provider 400 raw detail",
        "known_not_sent",
        400,
        false,
      ))
      .mockResolvedValueOnce("provider-2");
    mocks.finish.mockImplementation(async (input: { outcome: string }) => ({
      state: input.outcome === "succeeded" ? "succeeded" : "failed",
      retryAt: null,
    }));

    const results = await processMatpinOutboundQueue({ limit: 2, concurrency: 2 });

    expect(results.map((result) => result.state)).toEqual(["failed", "succeeded"]);
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it("does not claim a new delivery when the remaining budget is insufficient", async () => {
    const results = await processMatpinOutboundQueue({
      remainingTimeMs: MATPIN_OUTBOUND_MIN_JOB_TIME_MS - 1,
    });

    expect(results).toEqual([]);
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it("stops claiming after elapsed work consumes the remaining budget", async () => {
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    queueClaims([delivery(1), delivery(2)]);
    mocks.send.mockImplementationOnce(async () => {
      now += MATPIN_OUTBOUND_MIN_JOB_TIME_MS;
      return "provider-1";
    });

    const results = await processMatpinOutboundQueue({
      limit: 2,
      concurrency: 1,
      remainingTimeMs: MATPIN_OUTBOUND_MIN_JOB_TIME_MS,
    });

    expect(results).toHaveLength(1);
    expect(mocks.claim).toHaveBeenCalledTimes(1);
    expect(mocks.send).toHaveBeenCalledTimes(1);
  });
});
