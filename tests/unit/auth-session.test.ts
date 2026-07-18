import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/backend/auth", () => ({
  authEnabled: true,
  getUser: vi.fn(),
  signInWithGoogle: authMocks.signInWithGoogle,
  signOut: authMocks.signOut,
}));

import {
  beginAuth,
  consumeAuthPending,
  consumeAuthReturnTo,
  endAuthSession,
  markAuthPending,
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
  vi.stubGlobal("localStorage", makeStorage());
  vi.stubGlobal("window", {
    location: new URL("https://bfd-seven.vercel.app/vs/long-card-slug?from=share"),
  });
  authMocks.signInWithGoogle.mockReset();
  authMocks.signInWithGoogle.mockResolvedValue({ error: null });
  authMocks.signOut.mockReset();
  authMocks.signOut.mockResolvedValue(undefined);
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

  it("clears local demo and redirect state when the account signs out", async () => {
    localStorage.setItem("oneul:demo-auth", "1");
    sessionStorage.setItem("oneul:auth-pending", "creator");
    sessionStorage.setItem("oneul:auth-active", "1");
    sessionStorage.setItem("oneul:auth-return-to", "/dashboard");

    await endAuthSession();

    expect(authMocks.signOut).toHaveBeenCalledOnce();
    expect(localStorage.getItem("oneul:demo-auth")).toBeNull();
    expect(sessionStorage.getItem("oneul:auth-pending")).toBeNull();
    expect(sessionStorage.getItem("oneul:auth-active")).toBeNull();
    expect(sessionStorage.getItem("oneul:auth-return-to")).toBeNull();
  });

  it("accepts a recent auth handoff once and expires stale attribution", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000);
    markAuthPending("receiver");
    now.mockReturnValue(2_000);
    expect(consumeAuthPending("receiver")).toBe(true);
    expect(consumeAuthPending("receiver")).toBe(false);

    now.mockReturnValue(10_000);
    markAuthPending("creator");
    now.mockReturnValue(10_000 + 10 * 60 * 1_000 + 1);
    expect(consumeAuthPending("creator")).toBe(false);
    expect(sessionStorage.getItem("oneul:auth-pending")).toBeNull();
  });
});
