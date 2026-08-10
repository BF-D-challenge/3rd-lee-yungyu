import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    const response = NextResponse.next({ request });
    response.headers.set("cache-control", "private, no-store, max-age=0");
    return response;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  await supabase.auth.getUser();
  response.headers.set("cache-control", "private, no-store, max-age=0");
  response.headers.set("pragma", "no-cache");
  return response;
}

export const config = {
  matcher: ["/matpin/admin/:path*", "/api/matpin/admin/:path*"],
};
