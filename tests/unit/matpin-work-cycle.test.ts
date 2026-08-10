import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  outbound: vi.fn(),
  analysis: vi.fn(),
}));

vi.mock("@/lib/matpin/outbound-worker", () => ({
  MATPIN_OUTBOUND_MIN_JOB_TIME_MS: 10_000,
  processMatpinOutboundQueue: mocks.outbound,
}));
vi.mock("@/lib/matpin/worker", () => ({
  processMatpinQueue: mocks.analysis,
}));

import { createMatpinWorkerDeadline } from "@/lib/matpin/deadline";
import {
  MATPIN_WORK_LIVENESS,
  processMatpinWorkCycle,
} from "@/lib/matpin/work-cycle";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Matpin shared work cycle", () => {
  it("drains five outbound jobs, analyzes one job, then drains one final outbound", async () => {
    mocks.outbound
      .mockResolvedValueOnce([{ state: "succeeded", kind: "receipt" }])
      .mockResolvedValueOnce([{ state: "succeeded", kind: "final" }]);
    mocks.analysis.mockResolvedValue([{ state: "saved", messageId: "message-1" }]);
    const deadline = createMatpinWorkerDeadline();

    const result = await processMatpinWorkCycle({ deadline });

    expect(mocks.outbound).toHaveBeenNthCalledWith(1, {
      limit: 5,
      concurrency: 5,
      signal: expect.any(AbortSignal),
      remainingTimeMs: 20_000,
    });
    expect(mocks.analysis).toHaveBeenCalledTimes(1);
    expect(mocks.analysis).toHaveBeenCalledWith(1, { deadline });
    expect(mocks.outbound).toHaveBeenNthCalledWith(2, {
      limit: 1,
      concurrency: 1,
      signal: expect.any(AbortSignal),
      remainingTimeMs: 15_000,
    });
    expect(result).toMatchObject({
      liveness: MATPIN_WORK_LIVENESS,
      outboundBefore: { results: [{ kind: "receipt" }] },
      analysis: { results: [{ state: "saved" }] },
      outboundAfter: { results: [{ kind: "final" }] },
    });
  });

  it("still analyzes when the first outbound phase fails", async () => {
    mocks.outbound.mockRejectedValueOnce(new Error("outbound_phase_failed:detail"));
    mocks.analysis.mockResolvedValue([{ state: "empty" }]);

    const result = await processMatpinWorkCycle();

    expect(mocks.analysis).toHaveBeenCalledTimes(1);
    expect(result.outboundBefore).toEqual({
      results: [],
      error: "outbound_phase_failed",
    });
    expect(result.analysis.results).toEqual([{ state: "empty" }]);
  });

  it("keeps an analysis failure independent from the outbound result", async () => {
    mocks.outbound.mockResolvedValueOnce([{ state: "succeeded", kind: "guidance" }]);
    mocks.analysis.mockRejectedValueOnce(new Error("analysis_phase_failed:detail"));

    const result = await processMatpinWorkCycle();

    expect(result.outboundBefore.results).toEqual([{ state: "succeeded", kind: "guidance" }]);
    expect(result.analysis).toEqual({ results: [], error: "analysis_phase_failed" });
    expect(result.outboundAfter).toEqual({ results: [], skipped: true });
  });

  it("does not claim a final delivery inside the 15 second reserve", async () => {
    let now = 0;
    const deadline = createMatpinWorkerDeadline({ now: () => now });
    mocks.outbound.mockResolvedValueOnce([]);
    mocks.analysis.mockImplementationOnce(async () => {
      now = 231_000;
      return [{ state: "saved", messageId: "message-1" }];
    });

    const result = await processMatpinWorkCycle({ deadline });

    expect(deadline.remainingMs()).toBe(24_000);
    expect(deadline.workRemainingMs()).toBe(9_000);
    expect(mocks.outbound).toHaveBeenCalledTimes(1);
    expect(result.outboundAfter).toEqual({ results: [], skipped: true });
  });
});
