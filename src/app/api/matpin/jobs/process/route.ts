import { NextResponse } from "next/server";
import { backfillMatpinConversationHistory } from "@/lib/matpin/backfill";
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
    const shouldBackfill = new URL(request.url).searchParams.get("backfill") === "1";
    let backfill: Awaited<ReturnType<typeof backfillMatpinConversationHistory>>
      | { error: string }
      | { skipped: true } = { skipped: true };
    if (shouldBackfill) {
      try {
        backfill = await backfillMatpinConversationHistory();
      } catch (error) {
        const code = error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error";
        console.error("[matpin-worker] backfill_failed", code);
        backfill = { error: code };
      }
    }
    const processed = await processMatpinQueue(3);
    return NextResponse.json({ ok: true, backfill, processed }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-worker] failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "worker_failed" }, { status: 502 });
  }
}
