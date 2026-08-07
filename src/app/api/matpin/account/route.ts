import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/matpin/security";
import { deleteMatpinAccount } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const deleted = await deleteMatpinAccount(token);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-account] delete_failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "delete_failed" }, { status: 503 });
  }
}
