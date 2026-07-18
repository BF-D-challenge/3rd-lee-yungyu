import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/backend/auth", () => ({
  authEnabled: true,
  getUser: vi.fn(),
  signInWithGoogle: authMocks.signInWithGoogle,
}));

import {
  beginAuth,
  consumeAuthReturnTo,
  peekAuthReturnTo,
  prepareAuthRedirect,
} from "@/lib/auth-session";

const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
};

beforeEach(() => {
  vi.stubGlobal("sessionStorage", makeStorage());
  vi.stubGlobal("window", {
    location: new URL("https://bfd-seven.vercel.app/vs/long-card-slug?from=share"),
  });
  authMocks.signInWithGoogle.mockReset();
  authMocks.signInWithGoogle.mockResolvedValue({ error: null });
});

describe("Google OAuth redirect handoff", () => {
  it("sends only the fixed callback to Supabase and keeps the long route in this tab", async () => {
    await expect(
      beginAuth("https://bfd-seven.vercel.app/vs/long-card-slug?from=share"),
    ).resolves.toEqual({ status: "redirecting" });

    expect(authMocks.signInWithGoogle).toHaveBeenCalledWith(
      "https://bfd-seven.vercel.app/auth/callback",
    );
    expect(peekAuthReturnTo()).toBe("/vs/long-card-slug?from=share");
    expect(consumeAuthReturnTo()).toBe("/vs/long-card-slug?from=share");
    expect(peekAuthReturnTo()).toBe("/");
  });

  it("blocks an external return target instead of creating an open redirect", () => {
    expect(prepareAuthRedirect("https://attacker.example/steal")).toBe(
      "https://bfd-seven.vercel.app/auth/callback",
    );
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it("does not loop back into an auth callback page", () => {
    prepareAuthRedirect("/auth/complete?error=exchange_failed");
    expect(consumeAuthReturnTo()).toBe("/");
  });
});
