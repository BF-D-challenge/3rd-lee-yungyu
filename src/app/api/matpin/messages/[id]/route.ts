import { NextResponse } from "next/server";
import { bearerToken, MatpinConfigurationError } from "@/lib/matpin/security";
import { readMatpinMessage } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = bearerToken(request);
  if (!token || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const result = await readMatpinMessage(id, token);
    if (!result) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(result.message, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = error instanceof MatpinConfigurationError ? 503 : 500;
    return NextResponse.json({ error: status === 503 ? "not_configured" : "read_failed" }, { status });
  }
}
