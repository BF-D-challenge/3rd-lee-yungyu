import { NextResponse } from "next/server";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { deleteMatpinSavedPlace } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = bearerToken(request);
  const numericId = Number(id);
  if (!token || !Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const deleted = await deleteMatpinSavedPlace(numericId, token);
    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "not_configured" : "delete_failed" }, { status });
  }
}
