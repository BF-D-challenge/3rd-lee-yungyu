import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/backend/auth", () => ({
  authEnabled: false,
  getUser: auth.getUser,
  signInWithGoogle: auth.signInWithGoogle,
  signOut: vi.fn(),
}));

vi.mock("@/lib/backend/client", () => ({
  supabaseEnabled: true,
}));

import {
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
