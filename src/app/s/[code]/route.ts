import { NextResponse } from "next/server";
import { resolveMatpinShortLink } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{16}$/;

function unavailable() {
  return NextResponse.json(
    { error: "link_unavailable" },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  if (!SHORT_CODE_PATTERN.test(code)) return unavailable();

  try {
    const accessToken = await resolveMatpinShortLink(code);
    if (!accessToken) return unavailable();
    const destination = new URL("/matpin/saved", request.url);
    destination.hash = `token=${encodeURIComponent(accessToken)}`;
    return NextResponse.redirect(destination, {
      status: 307,
      headers: {
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  } catch {
    return unavailable();
  }
}
