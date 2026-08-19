import { NextResponse } from "next/server";
import { getVerifiedAuthUser, hasTrustedMutationOrigin } from "@/lib/backend/server-auth";
import { bearerToken } from "@/lib/matpin/security";
import { deleteMatpinAccount } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "cross_origin_forbidden" }, { status: 403 });
  }
  const user = await getVerifiedAuthUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "private_link_required" }, { status: 401 });
  try {
    const deleted = await deleteMatpinAccount(token, user.id);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-account] delete_failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "delete_failed" }, { status: 503 });
  }
}
