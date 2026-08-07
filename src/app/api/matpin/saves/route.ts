import { NextResponse } from "next/server";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { listMatpinSavedPlaces } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const places = await listMatpinSavedPlaces(token);
    if (!places) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ places }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "not_configured" : "read_failed" }, { status });
  }
}
