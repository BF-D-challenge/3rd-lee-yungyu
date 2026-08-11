import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export type MatpinAdminAccess =
  | { state: "authorized"; user: User }
  | { state: "unauthenticated" }
  | { state: "forbidden"; email: string | null }
  | { state: "not_configured" };

function supabaseBrowserConfiguration(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function matpinAdminEmails(): Set<string> {
  return new Set(
    (process.env.MATPIN_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedMatpinAdmin(user: Pick<User, "email" | "email_confirmed_at" | "app_metadata">): boolean {
  const email = user.email?.trim().toLowerCase();
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers
    : [user.app_metadata.provider];
  return Boolean(
    email
    && user.email_confirmed_at
    && providers.includes("google")
    && matpinAdminEmails().has(email),
  );
}

export async function getMatpinAdminAccess(): Promise<MatpinAdminAccess> {
  const config = supabaseBrowserConfiguration();
  if (!config || matpinAdminEmails().size === 0) return { state: "not_configured" };

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Scoped middleware refreshes the session.
        }
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { state: "unauthenticated" };
  if (!isAllowedMatpinAdmin(data.user)) {
    return { state: "forbidden", email: data.user.email ?? null };
  }
  return { state: "authorized", user: data.user };
}
