"use client";

import { prepareAuthRedirect } from "@/lib/auth-session";
import { getSupabase } from "@/lib/backend/client";

export const MATPIN_ADMIN_RETURN_PATH = "/matpin/admin";

export async function signInWithMatpinAdminGoogle(): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase || typeof window === "undefined") return { error: "auth-disabled" };

  const redirectTo = prepareAuthRedirect(MATPIN_ADMIN_RETURN_PATH);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  return { error: error?.message ?? null };
}
