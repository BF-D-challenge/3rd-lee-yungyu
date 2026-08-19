import { describe, expect, it } from "vitest";
import {
  isSameOriginMatpinAdminDestination,
  shouldLoadProductAnalytics,
} from "@/components/analytics/analytics-path";

describe("product analytics route gate", () => {
  it("excludes the Matpin admin route and all of its private subroutes", () => {
    expect(shouldLoadProductAnalytics("/matpin/admin")).toBe(false);
    expect(shouldLoadProductAnalytics("/matpin/admin/conversations/user-1")).toBe(false);
  });

  it("keeps analytics out of Matpin private and public profile pages", () => {
    expect(shouldLoadProductAnalytics("/")).toBe(true);
    expect(shouldLoadProductAnalytics("/matpin/saved")).toBe(false);
    expect(shouldLoadProductAnalytics("/matpin/saved/public.foodie")).toBe(false);
    expect(shouldLoadProductAnalytics("/matpin/reel/Post_123")).toBe(false);
    expect(shouldLoadProductAnalytics("/matpin/administrator")).toBe(true);
    expect(shouldLoadProductAnalytics(null)).toBe(false);
  });

  it("uses a document replacement only for verified same-origin admin destinations", () => {
    const origin = "https://bfd-seven.vercel.app";

    expect(isSameOriginMatpinAdminDestination("/matpin/admin", origin)).toBe(true);
    expect(isSameOriginMatpinAdminDestination(
      "/matpin/admin/conversations/user-1?range=24h#latest",
      origin,
    )).toBe(true);
    expect(isSameOriginMatpinAdminDestination(
      "https://bfd-seven.vercel.app/matpin/admin",
      origin,
    )).toBe(true);

    expect(isSameOriginMatpinAdminDestination(
      "https://attacker.example/matpin/admin",
      origin,
    )).toBe(false);
    expect(isSameOriginMatpinAdminDestination("//attacker.example/matpin/admin", origin)).toBe(false);
    expect(isSameOriginMatpinAdminDestination("/matpin/administrator", origin)).toBe(false);
    expect(isSameOriginMatpinAdminDestination("/matpin/admin%2Fconversations", origin)).toBe(false);
    expect(isSameOriginMatpinAdminDestination("/matpin/admin", "not-an-origin")).toBe(false);
  });
});
