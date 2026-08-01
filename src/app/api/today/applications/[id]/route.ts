import { NextResponse } from "next/server";
import {
  cancelTodayApplication,
  readTodayApplication,
  TodayDeliveryConfigurationError,
} from "@/lib/today-server";

export const dynamic = "force-dynamic";

function tokenFrom(request: Request) {
  return request.headers.get("x-today-access-token")?.trim() ?? "";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = tokenFrom(request);
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
  try {
    const job = await readTodayApplication(id, token);
    if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(
      { mode: "server_queue", job },
      { headers: { "cache-control": "no-store, max-age=0" } },
    );
  } catch (error) {
    if (error instanceof TodayDeliveryConfigurationError) {
      return NextResponse.json({ error: "delivery_unavailable" }, { status: 503 });
    }
    console.error("today application read failed", error);
    return NextResponse.json({ error: "read_failed" }, { status: 502 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = tokenFrom(request);
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
  try {
    const cancelled = await cancelTodayApplication(id, token);
    if (!cancelled) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TodayDeliveryConfigurationError) {
      return NextResponse.json({ error: "delivery_unavailable" }, { status: 503 });
    }
    console.error("today application cancellation failed", error);
    return NextResponse.json({ error: "cancel_failed" }, { status: 502 });
  }
}
