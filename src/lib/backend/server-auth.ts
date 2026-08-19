import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export type VerifiedAuthUser = { id: string };

export function isVerifiedMatpinManagerUser(
  user: Pick<User, "id" | "email_confirmed_at" | "app_metadata" | "is_anonymous">,
): boolean {
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers
    : [user.app_metadata.provider];
  return Boolean(
    user.id
    && user.email_confirmed_at
    && user.is_anonymous !== true
    && providers.includes("google"),
  );
}

export function hasTrustedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

export async function getVerifiedAuthUser(): Promise<VerifiedAuthUser | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    || process.env.SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // A verified session can still be read when this context cannot refresh cookies.
          }
        },
      },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || !isVerifiedMatpinManagerUser(data.user)) return null;
    return { id: data.user.id };
  } catch {
    return null;
  }
}
