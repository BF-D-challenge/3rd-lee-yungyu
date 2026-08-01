import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/backend/auth", () => ({
  authEnabled: false,
  getUser: auth.getUser,
  signInAnonymously: auth.signInAnonymously,
  signInWithGoogle: auth.signInWithGoogle,
  signOut: vi.fn(),
}));

vi.mock("@/lib/backend/client", () => ({
  supabaseEnabled: true,
}));

import {
  beginAnonymousAuth,
  beginAuth,
  checkAuthSession,
  reservationUsesSupabase,
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
    location: new URL("https://bfd-seven.vercel.app/reserve/matpick"),
  });
  auth.getUser.mockReset();
  auth.signInAnonymously.mockReset();
  auth.signInAnonymously.mockResolvedValue({
    user: {
      id: "55555555-5555-4555-8555-555555555555",
      is_anonymous: true,
    },
    error: null,
  });
  auth.signInWithGoogle.mockReset();
  auth.signInWithGoogle.mockResolvedValue({ error: null });
});

describe("reservation auth in a Supabase-connected runtime", () => {
  it("starts real Google OAuth even when the legacy global flag is off", async () => {
    expect(reservationUsesSupabase).toBe(true);

    await expect(beginAuth("/reserve/matpick", {
      requireSupabaseWhenConfigured: true,
    })).resolves.toEqual({ status: "redirecting" });

    expect(auth.signInWithGoogle).toHaveBeenCalledWith(
      "https://bfd-seven.vercel.app/auth/callback",
    );
  });

  it("never accepts a local demo session when the reservation requires Supabase", async () => {
    localStorage.setItem("oneul:demo-auth", "1");
    auth.getUser.mockResolvedValue(null);

    await expect(checkAuthSession({
      requireSupabaseWhenConfigured: true,
    })).resolves.toBeNull();
  });

  it("creates an anonymous Supabase owner without starting Google OAuth", async () => {
    await expect(beginAnonymousAuth()).resolves.toEqual({
      status: "authenticated",
      session: {
        actorId: "55555555-5555-4555-8555-555555555555",
        authenticated: true,
        demo: false,
        anonymous: true,
      },
    });

    expect(auth.signInAnonymously).toHaveBeenCalledOnce();
    expect(auth.signInWithGoogle).not.toHaveBeenCalled();
  });

  it("marks an existing anonymous Supabase user as anonymous", async () => {
    auth.getUser.mockResolvedValue({
      id: "55555555-5555-4555-8555-555555555555",
      is_anonymous: true,
      user_metadata: {},
    });

    await expect(checkAuthSession({
      requireSupabaseWhenConfigured: true,
    })).resolves.toMatchObject({
      actorId: "55555555-5555-4555-8555-555555555555",
      authenticated: true,
      demo: false,
      anonymous: true,
    });
  });

  it("returns the verified Supabase user after OAuth", async () => {
    auth.getUser.mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      user_metadata: { full_name: "예약 사용자" },
    });

    await expect(checkAuthSession({
      requireSupabaseWhenConfigured: true,
    })).resolves.toMatchObject({
      actorId: "44444444-4444-4444-8444-444444444444",
      authenticated: true,
      demo: false,
      displayName: "예약 사용자",
    });
  });
});
