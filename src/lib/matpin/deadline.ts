export const MATPIN_WORKER_DEADLINE_MS = 255_000;
export const MATPIN_WORKER_RETRY_RESERVE_MS = 15_000;

export type MatpinDeadlineOptions = {
  durationMs?: number;
  reserveMs?: number;
  parentSignal?: AbortSignal;
  now?: () => number;
};

export class MatpinDeadlineExceededError extends Error {
  readonly code = "worker_deadline_exceeded";
  readonly retryable = true;

  constructor() {
    super("worker_deadline_exceeded");
    this.name = "MatpinDeadlineExceededError";
  }
}

export class MatpinDeadline {
  readonly signal: AbortSignal;
  readonly reserveMs: number;

  private readonly expiresAt: number;
  private readonly now: () => number;

  constructor(options: MatpinDeadlineOptions = {}) {
    const durationMs = options.durationMs ?? MATPIN_WORKER_DEADLINE_MS;
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error("matpin_deadline_duration_invalid");
    }
    const reserveMs = options.reserveMs ?? MATPIN_WORKER_RETRY_RESERVE_MS;
    if (!Number.isFinite(reserveMs) || reserveMs < 0 || reserveMs >= durationMs) {
      throw new Error("matpin_deadline_reserve_invalid");
    }

    this.now = options.now ?? (() => performance.now());
    this.expiresAt = this.now() + durationMs;
    this.reserveMs = reserveMs;

    const ownSignal = AbortSignal.timeout(Math.max(1, Math.ceil(durationMs)));
    this.signal = options.parentSignal
      ? AbortSignal.any([options.parentSignal, ownSignal])
      : ownSignal;
  }

  remainingMs(): number {
    return Math.max(0, this.expiresAt - this.now());
  }

  workRemainingMs(reserveMs = this.reserveMs): number {
    return Math.max(0, this.remainingMs() - reserveMs);
  }

  canStart(requiredMs = 1, reserveMs = this.reserveMs): boolean {
    return !this.signal.aborted && this.workRemainingMs(reserveMs) >= requiredMs;
  }

  throwIfInsufficient(requiredMs = 1, reserveMs = this.reserveMs): void {
    if (!this.canStart(requiredMs, reserveMs)) {
      throw new MatpinDeadlineExceededError();
    }
  }

  signalFor(maxDurationMs: number, reserveMs = this.reserveMs): AbortSignal {
    if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
      throw new Error("matpin_deadline_stage_duration_invalid");
    }
    this.throwIfInsufficient(1, reserveMs);
    const durationMs = Math.max(1, Math.min(maxDurationMs, this.workRemainingMs(reserveMs)));
    return AbortSignal.any([
      this.signal,
      AbortSignal.timeout(Math.max(1, Math.floor(durationMs))),
    ]);
  }

  fork(maxDurationMs: number, reserveMs = 0): MatpinDeadline {
    if (!Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
      throw new Error("matpin_deadline_stage_duration_invalid");
    }
    this.throwIfInsufficient(1);
    const durationMs = Math.max(1, Math.min(maxDurationMs, this.workRemainingMs()));
    return new MatpinDeadline({
      durationMs,
      reserveMs,
      parentSignal: this.signal,
      now: this.now,
    });
  }

  async sleep(durationMs: number): Promise<void> {
    this.throwIfInsufficient(durationMs + 1);
    const signal = this.signalFor(durationMs + 1);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, durationMs);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new MatpinDeadlineExceededError());
      };
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) onAbort();
    });
  }

  async run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    maxDurationMs: number,
    reserveMs = this.reserveMs,
  ): Promise<T> {
    const signal = this.signalFor(maxDurationMs, reserveMs);
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const settle = (callback: () => void) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        callback();
      };
      const onAbort = () => settle(() => reject(new MatpinDeadlineExceededError()));
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
        return;
      }
      operation(signal).then(
        (value) => settle(() => resolve(value)),
        (error: unknown) => settle(() => reject(error)),
      );
    });
  }
}

export function createMatpinWorkerDeadline(
  options: MatpinDeadlineOptions = {},
): MatpinDeadline {
  return new MatpinDeadline(options);
}

export function matpinDeadlineSignal(
  deadline: MatpinDeadline | undefined,
  timeoutMs: number,
): AbortSignal {
  return deadline?.signalFor(timeoutMs) ?? AbortSignal.timeout(timeoutMs);
}
