import { describe, expect, it } from "vitest";
import {
  createMatpinWorkerDeadline,
  MatpinDeadline,
  MATPIN_WORKER_DEADLINE_MS,
  MATPIN_WORKER_RETRY_RESERVE_MS,
} from "@/lib/matpin/deadline";

describe("Matpin worker deadline", () => {
  it("uses a monotonic 255 second budget and keeps 15 seconds for retry RPCs", () => {
    let now = 10_000;
    const deadline = createMatpinWorkerDeadline({ now: () => now });

    expect(MATPIN_WORKER_DEADLINE_MS).toBe(255_000);
    expect(MATPIN_WORKER_RETRY_RESERVE_MS).toBe(15_000);
    expect(deadline.remainingMs()).toBe(255_000);
    expect(deadline.workRemainingMs()).toBe(240_000);

    now += 239_999;
    expect(deadline.canStart(1)).toBe(true);
    now += 1;
    expect(deadline.canStart(1)).toBe(false);
    expect(() => deadline.throwIfInsufficient()).toThrow("worker_deadline_exceeded");
  });

  it("caps a child budget at the parent's work deadline", () => {
    let now = 0;
    const parent = new MatpinDeadline({
      durationMs: 100_000,
      reserveMs: 10_000,
      now: () => now,
    });
    now = 82_000;

    const child = parent.fork(15_000, 0);

    expect(child.remainingMs()).toBe(8_000);
    expect(child.reserveMs).toBe(0);
  });

  it("passes an abort signal into bounded operations", async () => {
    const deadline = new MatpinDeadline({ durationMs: 1_000, reserveMs: 100 });
    const received: AbortSignal[] = [];

    await deadline.run(async (signal) => {
      received.push(signal);
      return "ok";
    }, 200);

    expect(received[0]).toBeInstanceOf(AbortSignal);
    expect(received[0].aborted).toBe(false);
  });
});
