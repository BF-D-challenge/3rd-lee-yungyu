import { describe, expect, it } from "vitest";
import { shouldLoadProductAnalytics } from "@/components/analytics/analytics-path";

describe("product analytics route gate", () => {
  it("excludes the Matpin admin route and all of its private subroutes", () => {
    expect(shouldLoadProductAnalytics("/matpin/admin")).toBe(false);
    expect(shouldLoadProductAnalytics("/matpin/admin/conversations/user-1")).toBe(false);
  });

  it("keeps analytics enabled for public pages and similarly named routes", () => {
    expect(shouldLoadProductAnalytics("/")).toBe(true);
    expect(shouldLoadProductAnalytics("/matpin/saved")).toBe(true);
    expect(shouldLoadProductAnalytics("/matpin/administrator")).toBe(true);
    expect(shouldLoadProductAnalytics(null)).toBe(false);
  });
});
