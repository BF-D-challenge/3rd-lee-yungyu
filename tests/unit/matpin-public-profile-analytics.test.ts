import { describe, expect, it } from "vitest";
import {
  isPrivateMatpinTokenPath,
  isPublicMatpinProfilePath,
} from "@/components/analytics/analytics-path";

describe("Matpin public profile analytics boundary", () => {
  it("excludes both the public URL and its internal rewrite target", () => {
    expect(isPublicMatpinProfilePath("/@public.foodie")).toBe(true);
    expect(isPublicMatpinProfilePath("/matpin/public/public.foodie")).toBe(true);
    expect(isPublicMatpinProfilePath("/matpin/saved/public.foodie")).toBe(true);
    expect(isPublicMatpinProfilePath("/matpin/saved")).toBe(false);
    expect(isPublicMatpinProfilePath("/privacy")).toBe(false);
  });

  it("also excludes every private token-bearing Matpin screen", () => {
    for (const path of [
      "/matpin/saved",
      "/matpin/delete",
      "/matpin/confirm",
      "/matpin/station/역삼역",
      "/matpin/reel/Post_123",
    ]) {
      expect(isPrivateMatpinTokenPath(path)).toBe(true);
    }
    expect(isPrivateMatpinTokenPath("/matpin")).toBe(false);
  });
});
