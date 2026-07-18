import { describe, expect, it } from "vitest";
import {
  IDEA_LAB_READABLE_PAUSE_MS,
  ideaLabReadablePauseMs,
} from "../../src/lib/idea-lab-timing";

describe("idea lab readable pause", () => {
  it("keeps the production reading window at two and a half seconds", () => {
    expect(IDEA_LAB_READABLE_PAUSE_MS).toBe(2_500);
    expect(ideaLabReadablePauseMs()).toBe(2_500);
    expect(ideaLabReadablePauseMs({ e2eOverride: "40" })).toBe(2_500);
  });

  it("accepts a shorter duration only for the explicit e2e build", () => {
    expect(ideaLabReadablePauseMs({ e2e: true, e2eOverride: "40" })).toBe(40);
    expect(ideaLabReadablePauseMs({ e2e: true, e2eOverride: "invalid" })).toBe(2_500);
  });
});
