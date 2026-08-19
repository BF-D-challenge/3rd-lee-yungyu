import { describe, expect, it } from "vitest";
import {
  hasTrustedMutationOrigin,
  isVerifiedMatpinManagerUser,
} from "@/lib/backend/server-auth";

const googleUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email_confirmed_at: "2026-08-15T00:00:00.000Z",
  is_anonymous: false,
  app_metadata: { provider: "google", providers: ["google"] },
};

describe("Matpin manager identity", () => {
  it("accepts only a confirmed non-anonymous Google user", () => {
    expect(isVerifiedMatpinManagerUser(googleUser)).toBe(true);
    expect(isVerifiedMatpinManagerUser({ ...googleUser, email_confirmed_at: undefined })).toBe(false);
    expect(isVerifiedMatpinManagerUser({ ...googleUser, is_anonymous: true })).toBe(false);
    expect(isVerifiedMatpinManagerUser({
      ...googleUser,
      app_metadata: { provider: "email", providers: ["email"] },
    })).toBe(false);
  });

  it("rejects browser mutations from another origin", () => {
    expect(hasTrustedMutationOrigin(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
      headers: { origin: "https://matpin.example", "sec-fetch-site": "same-origin" },
    }))).toBe(true);
    expect(hasTrustedMutationOrigin(new Request("https://matpin.example/api/matpin/account", {
      method: "DELETE",
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    }))).toBe(false);
  });
});
