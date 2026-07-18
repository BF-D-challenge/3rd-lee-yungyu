import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const completeUrl = (request: Request, error?: string) => {
  const url = new URL("/auth/complete", request.url);
  if (error) url.searchParams.set("error", error);
  return url;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code) return NextResponse.redirect(completeUrl(request, "missing_code"));
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(completeUrl(request, "missing_config"));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(
    completeUrl(request, error ? "exchange_failed" : undefined),
  );
}
