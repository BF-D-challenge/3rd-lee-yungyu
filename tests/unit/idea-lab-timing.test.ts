import { describe, expect, it } from "vitest";
import {
  IDEA_LAB_AUTO_ADVANCE_ENABLED,
  ideaLabReadDurationMs,
} from "../../src/lib/idea-lab-timing";

describe("Idea Lab timing", () => {
  it("never advances a revealed card with a timer", () => {
    expect(IDEA_LAB_AUTO_ADVANCE_ENABLED).toBe(false);
  });

  it("records only a safe non-negative dwell duration", () => {
    expect(ideaLabReadDurationMs(1_000, 3_512.4)).toBe(2_512);
    expect(ideaLabReadDurationMs(null, 3_000)).toBe(0);
    expect(ideaLabReadDurationMs(4_000, 3_000)).toBe(0);
    expect(ideaLabReadDurationMs(Number.NaN, 3_000)).toBe(0);
  });
});
