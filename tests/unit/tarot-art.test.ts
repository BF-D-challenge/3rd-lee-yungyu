import { describe, expect, it } from "vitest";
import { backSvg } from "@/components/organisms/slot/card-back";
import {
  TAROT_ART_PATHS,
  TAROT_ART_STATS,
  TAROT_PIXEL_GRID,
} from "@/components/organisms/four-card/tarot-art";

describe("tarot card art", () => {
  it("앞면은 고밀도 단색 픽셀이고 뒷면은 기존 흑백 인그레이빙이다", () => {
    expect(TAROT_PIXEL_GRID).toEqual({ width: 72, height: 46 });
    expect(TAROT_ART_PATHS).toHaveLength(4);
    expect(new Set(TAROT_ART_PATHS).size).toBe(4);

    TAROT_ART_STATS.forEach((stats, axisIndex) => {
      expect(stats.pixels).toBeGreaterThan(700);
      expect(stats.pathLength).toBeGreaterThan(3_500);
      expect(TAROT_ART_PATHS[axisIndex].match(/M/g)?.length).toBeGreaterThan(180);
    });

    const svg = backSvg();

    expect(new TextEncoder().encode(svg).byteLength).toBeLessThan(4_000);
    expect(svg).toContain('shape-rendering="geometricPrecision"');
    expect(svg).toContain('fill="#0a0a0b"');
    expect(svg).toContain('stroke="#eaeaea"');
    expect(svg).not.toMatch(/<image|data:image|(?:href|src)=/);
  });
});
