import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/backend/client", () => ({
  getSupabase: clientMocks.getSupabase,
  supabaseEnabled: true,
}));

import { peekAuthReturnTo } from "@/lib/auth-session";
import { signInWithMatpinAdminGoogle } from "@/lib/matpin/admin-client-auth";

const makeStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
};

beforeEach(() => {
  vi.stubGlobal("window", {
    location: new URL("https://matpin-kr.vercel.app/matpin/admin"),
  });
  vi.stubGlobal("sessionStorage", makeStorage());
  clientMocks.signInWithOAuth.mockReset();
  clientMocks.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
  clientMocks.getSupabase.mockReset();
  clientMocks.getSupabase.mockReturnValue({
    auth: { signInWithOAuth: clientMocks.signInWithOAuth },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Matpin admin Google login", () => {
  it("uses the fixed callback and keeps the admin return path in this tab", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_LOGIN", "");

    await expect(signInWithMatpinAdminGoogle()).resolves.toEqual({ error: null });

    expect(clientMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://matpin-kr.vercel.app/auth/callback" },
    });
    expect(peekAuthReturnTo()).toBe("/matpin/admin");
  });

  it("reports unavailable Supabase configuration without starting OAuth", async () => {
    clientMocks.getSupabase.mockReturnValue(null);

    await expect(signInWithMatpinAdminGoogle()).resolves.toEqual({ error: "auth-disabled" });
    expect(clientMocks.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("returns the Supabase OAuth error without exposing credentials", async () => {
    clientMocks.signInWithOAuth.mockResolvedValue({
      data: {},
      error: { message: "provider unavailable" },
    });

    await expect(signInWithMatpinAdminGoogle()).resolves.toEqual({
      error: "provider unavailable",
    });
  });
});
