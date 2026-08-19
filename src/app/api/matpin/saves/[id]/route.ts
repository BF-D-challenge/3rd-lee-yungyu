import { NextResponse } from "next/server";
import { getVerifiedAuthUser, hasTrustedMutationOrigin } from "@/lib/backend/server-auth";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { deleteMatpinSavedPlace } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "cross_origin_forbidden" }, { status: 403 });
  }
  const user = await getVerifiedAuthUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });
  const { id } = await context.params;
  const token = bearerToken(request);
  const numericId = Number(id);
  if (!token || !Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: token ? "not_found" : "private_link_required" }, { status: token ? 404 : 401 });
  }
  try {
    const deleted = await deleteMatpinSavedPlace(numericId, token, user.id);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "not_configured" : "delete_failed" }, { status });
  }
}
