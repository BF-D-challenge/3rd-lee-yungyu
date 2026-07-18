import { describe, expect, it } from "vitest";
import { stepCursorByOnePixel } from "../../src/components/organisms/oneul/creator-auth-gate";

describe("login deck cursor motion", () => {
  it("moves toward either direction by at most one whole pixel", () => {
    expect(stepCursorByOnePixel(0, 12.8)).toBe(1);
    expect(stepCursorByOnePixel(0, -12.8)).toBe(-1);
    expect(stepCursorByOnePixel(8, 8.4)).toBe(8);
    expect(stepCursorByOnePixel(8, 8.6)).toBe(9);
  });
});
