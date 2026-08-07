import { NextResponse } from "next/server";
import { processMatpinQueue } from "@/lib/matpin/worker";
import { verifyMatpinWorkerRequest } from "@/lib/matpin/security";
import { requeueFailedMatpinMessage } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!verifyMatpinWorkerRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (process.env.MATPIN_INSTAGRAM_PIPELINE_MODE !== "live") {
    return NextResponse.json({ error: "pipeline_not_live" }, { status: 409 });
  }
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }
  try {
    const accepted = await requeueFailedMatpinMessage(id);
    if (!accepted) return NextResponse.json({ error: "message_unavailable" }, { status: 409 });
    const processed = await processMatpinQueue(1);
    return NextResponse.json({ ok: true, processed }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-reprocess] failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "reprocess_failed" }, { status: 502 });
  }
}
