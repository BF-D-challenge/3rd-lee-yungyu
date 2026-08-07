import { NextResponse } from "next/server";
import { resendMatpinMap } from "@/lib/matpin/resend";
import { verifyMatpinAdminRequest } from "@/lib/matpin/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!verifyMatpinAdminRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }
  try {
    const result = await resendMatpinMap(id);
    return NextResponse.json({ ok: true, ...result }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-resend] failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "resend_failed" }, { status: 502 });
  }
}
