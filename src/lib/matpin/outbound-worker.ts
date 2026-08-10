import {
  MatpinInstagramSendError,
  preflightMatpinInstagramMessage,
  sendMatpinInstagramMessage,
} from "@/lib/matpin/instagram-send";
import {
  decryptMatpinValue,
  hashMatpinOutboundProviderMessage,
  MatpinConfigurationError,
} from "@/lib/matpin/security";
import {
  beginMatpinOutboundSend,
  claimNextMatpinOutbound,
  finishMatpinOutbound,
  releaseMatpinOutboundLease,
  type MatpinClaimedOutbound,
  type MatpinOutboundState,
} from "@/lib/matpin/store";

const DEFAULT_DRAIN_LIMIT = 5;
const MAX_DRAIN_LIMIT = 100;
const DEFAULT_CONCURRENCY = 5;
const MAX_CONCURRENCY = 5;
const PREFLIGHT_RETRY_SECONDS = 30;
const SETTLEMENT_TIMEOUT_MS = 5_000;

// One delivery can spend eight seconds in Meta's request plus its database
// transitions. Do not claim a fresh lease when the caller has less room.
export const MATPIN_OUTBOUND_MIN_JOB_TIME_MS = 10_000;

export type MatpinOutboundWorkerErrorCode =
  | "outbound_aborted"
  | "outbound_begin_rejected"
  | "outbound_begin_record_failed"
  | "outbound_ciphertext_invalid"
  | "outbound_claim_failed"
  | "outbound_config_unavailable"
  | "outbound_finish_record_failed"
  | "outbound_payload_invalid"
  | "outbound_provider_hash_failed"
  | "outbound_provider_rejected"
  | "outbound_rate_limited"
  | "outbound_release_record_failed"
  | "outbound_send_uncertain";

export type MatpinOutboundWorkerResult = {
  deliveryId?: string;
  kind?: MatpinClaimedOutbound["kind"];
  state: MatpinOutboundState | "skipped" | "error";
  errorCode?: MatpinOutboundWorkerErrorCode;
};

export type ProcessMatpinOutboundQueueOptions = {
  limit?: number;
  concurrency?: number;
  signal?: AbortSignal;
  remainingTimeMs?: number;
};

type PreparedOutbound = {
  recipientId: string;
  text: string;
};

type SendFailure = {
  outcome: "known_not_sent" | "failed" | "uncertain";
  errorCode: MatpinOutboundWorkerErrorCode;
  providerStatus: number | null;
};

function normalizeCount(value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.floor(value)));
}

function resultFor(
  delivery: MatpinClaimedOutbound,
  state: MatpinOutboundWorkerResult["state"],
  errorCode?: MatpinOutboundWorkerErrorCode,
): MatpinOutboundWorkerResult {
  return {
    deliveryId: delivery.id,
    kind: delivery.kind,
    state,
    ...(errorCode ? { errorCode } : {}),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function settlementSignal(): AbortSignal {
  return AbortSignal.timeout(SETTLEMENT_TIMEOUT_MS);
}

function classifySendFailure(error: unknown): SendFailure {
  if (!(error instanceof MatpinInstagramSendError)) {
    return {
      outcome: "uncertain",
      errorCode: "outbound_send_uncertain",
      providerStatus: null,
    };
  }

  if (
    error.deliveryOutcome === "known_not_sent"
    && error.httpStatus === 429
    && error.retryable
  ) {
    return {
      outcome: "known_not_sent",
      errorCode: "outbound_rate_limited",
      providerStatus: 429,
    };
  }

  if (error.deliveryOutcome === "known_not_sent") {
    return {
      outcome: "failed",
      errorCode: "outbound_provider_rejected",
      providerStatus: error.httpStatus,
    };
  }

  return {
    outcome: "uncertain",
    errorCode: "outbound_send_uncertain",
    providerStatus: error.httpStatus,
  };
}

async function releaseBeforeSend(
  delivery: MatpinClaimedOutbound,
  errorCode: MatpinOutboundWorkerErrorCode,
  permanent: boolean,
): Promise<MatpinOutboundWorkerResult> {
  try {
    const state = await releaseMatpinOutboundLease({
      deliveryId: delivery.id,
      leaseToken: delivery.lease_token,
      errorCode,
      retryAfterSeconds: PREFLIGHT_RETRY_SECONDS,
      permanent,
      // Settlement is independent from the caller's expired work budget, but
      // it still has a strict local cap.
      signal: settlementSignal(),
    });
    return resultFor(delivery, state, errorCode);
  } catch {
    return resultFor(delivery, "error", "outbound_release_record_failed");
  }
}

async function prepareOutbound(
  delivery: MatpinClaimedOutbound,
  signal?: AbortSignal,
): Promise<PreparedOutbound | MatpinOutboundWorkerResult> {
  let recipientId: string;
  let text: string;
  try {
    recipientId = decryptMatpinValue(delivery.recipient_ciphertext);
    text = decryptMatpinValue(delivery.body_ciphertext);
  } catch (error) {
    if (error instanceof MatpinConfigurationError || isAbortError(error)) {
      return releaseBeforeSend(delivery, "outbound_config_unavailable", false);
    }
    return releaseBeforeSend(delivery, "outbound_ciphertext_invalid", true);
  }

  try {
    preflightMatpinInstagramMessage(recipientId, text);
  } catch (error) {
    if (error instanceof MatpinConfigurationError || isAbortError(error)) {
      return releaseBeforeSend(delivery, "outbound_config_unavailable", false);
    }
    return releaseBeforeSend(delivery, "outbound_payload_invalid", true);
  }

  if (signal?.aborted) {
    return releaseBeforeSend(delivery, "outbound_aborted", false);
  }
  return { recipientId, text };
}

function isPreparedOutbound(
  value: PreparedOutbound | MatpinOutboundWorkerResult,
): value is PreparedOutbound {
  return "recipientId" in value;
}

async function finishFailure(
  delivery: MatpinClaimedOutbound,
  failure: SendFailure,
): Promise<MatpinOutboundWorkerResult> {
  try {
    const finished = await finishMatpinOutbound({
      deliveryId: delivery.id,
      leaseToken: delivery.lease_token,
      outcome: failure.outcome,
      errorCode: failure.errorCode,
      providerStatus: failure.providerStatus,
      signal: settlementSignal(),
    });
    return resultFor(delivery, finished.state, failure.errorCode);
  } catch {
    // The send may have reached Meta. Leaving the row in `sending` makes lease
    // expiry terminally uncertain instead of allowing another delivery.
    return resultFor(delivery, "error", "outbound_finish_record_failed");
  }
}

async function processClaimedOutbound(
  delivery: MatpinClaimedOutbound,
  signal?: AbortSignal,
): Promise<MatpinOutboundWorkerResult> {
  const prepared = await prepareOutbound(delivery, signal);
  if (!isPreparedOutbound(prepared)) return prepared;

  let began: boolean;
  try {
    began = await beginMatpinOutboundSend({
      deliveryId: delivery.id,
      leaseToken: delivery.lease_token,
      signal,
    });
  } catch {
    // The begin RPC may have committed even when its response was lost. Never
    // send in that state; lease recovery will decide leased versus uncertain.
    return resultFor(delivery, "error", "outbound_begin_record_failed");
  }
  if (!began) return resultFor(delivery, "skipped", "outbound_begin_rejected");

  let providerMessageId: string;
  try {
    providerMessageId = await sendMatpinInstagramMessage(
      prepared.recipientId,
      prepared.text,
      { signal },
    );
  } catch (error) {
    return finishFailure(delivery, classifySendFailure(error));
  }

  let providerMessageIdHash: string;
  try {
    providerMessageIdHash = hashMatpinOutboundProviderMessage(providerMessageId);
  } catch {
    return finishFailure(delivery, {
      outcome: "uncertain",
      errorCode: "outbound_provider_hash_failed",
      providerStatus: null,
    });
  }

  try {
    const finished = await finishMatpinOutbound({
      deliveryId: delivery.id,
      leaseToken: delivery.lease_token,
      outcome: "succeeded",
      providerMessageIdHash,
      signal: settlementSignal(),
    });
    return resultFor(delivery, finished.state);
  } catch {
    // A success that could not be durably recorded must never be sent again.
    return resultFor(delivery, "error", "outbound_finish_record_failed");
  }
}

export async function processMatpinOutboundQueue(
  options: ProcessMatpinOutboundQueueOptions = {},
): Promise<MatpinOutboundWorkerResult[]> {
  const limit = normalizeCount(options.limit, DEFAULT_DRAIN_LIMIT, MAX_DRAIN_LIMIT);
  const concurrency = normalizeCount(
    options.concurrency,
    DEFAULT_CONCURRENCY,
    MAX_CONCURRENCY,
  );
  if (limit === 0 || concurrency === 0) return [];

  const startedAt = Date.now();
  const results: Array<MatpinOutboundWorkerResult | undefined> = [];
  let claimedCount = 0;
  let stopped = false;
  let claimLock: Promise<void> = Promise.resolve();

  function hasTimeForAnotherClaim(): boolean {
    if (options.signal?.aborted) return false;
    if (options.remainingTimeMs === undefined) return true;
    if (!Number.isFinite(options.remainingTimeMs)) return false;
    const remaining = options.remainingTimeMs - (Date.now() - startedAt);
    return remaining >= MATPIN_OUTBOUND_MIN_JOB_TIME_MS;
  }

  async function takeClaim(): Promise<
    | { delivery: MatpinClaimedOutbound; index: number }
    | "stop"
  > {
    let unlock = () => {};
    const previous = claimLock;
    claimLock = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    await previous;

    try {
      if (stopped || claimedCount >= limit || !hasTimeForAnotherClaim()) {
        stopped = true;
        return "stop";
      }

      let delivery: MatpinClaimedOutbound | null;
      try {
        delivery = await claimNextMatpinOutbound({ signal: options.signal });
      } catch {
        results[claimedCount] = {
          state: "error",
          errorCode: "outbound_claim_failed",
        };
        stopped = true;
        return "stop";
      }

      if (!delivery) {
        stopped = true;
        return "stop";
      }
      const index = claimedCount;
      claimedCount += 1;
      return { delivery, index };
    } finally {
      unlock();
    }
  }

  async function lane(): Promise<void> {
    while (true) {
      const claimed = await takeClaim();
      if (claimed === "stop") return;
      results[claimed.index] = await processClaimedOutbound(
        claimed.delivery,
        options.signal,
      );
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(limit, concurrency) },
    () => lane(),
  ));

  return results.filter((result): result is MatpinOutboundWorkerResult => Boolean(result));
}
