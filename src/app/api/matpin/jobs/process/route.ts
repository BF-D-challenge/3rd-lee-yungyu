import { NextResponse } from "next/server";
import { verifyMatpinWorkerRequest } from "@/lib/matpin/security";
import { processMatpinQueue } from "@/lib/matpin/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!verifyMatpinWorkerRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.MATPIN_INSTAGRAM_PIPELINE_MODE !== "live") {
    return NextResponse.json({ error: "pipeline_not_live" }, { status: 409 });
  }
  try {
    const processed = await processMatpinQueue(3);
    return NextResponse.json({ ok: true, processed }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-worker] failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "worker_failed" }, { status: 502 });
  }
}
