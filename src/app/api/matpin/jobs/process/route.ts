import { after, NextResponse } from "next/server";
import { backfillMatpinConversationHistory } from "@/lib/matpin/backfill";
import { verifyMatpinWorkerRequest } from "@/lib/matpin/security";
import { createMatpinWorkerDeadline } from "@/lib/matpin/deadline";
import { isMatpinPipelineLive } from "@/lib/matpin/pipeline-mode";
import {
  MATPIN_WORK_LIVENESS,
  processMatpinWorkCycle,
} from "@/lib/matpin/work-cycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function workerAccessError(request: Request): Response | null {
  if (!verifyMatpinWorkerRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isMatpinPipelineLive()) {
    return NextResponse.json({ error: "pipeline_not_live" }, { status: 409 });
  }
  return null;
}

export async function GET(request: Request) {
  const accessError = workerAccessError(request);
  if (accessError) return accessError;
  const deadline = createMatpinWorkerDeadline({ parentSignal: request.signal });
  try {
    const shouldBackfill = new URL(request.url).searchParams.get("backfill") === "1";
    let backfill: Awaited<ReturnType<typeof backfillMatpinConversationHistory>>
      | { error: string }
      | { skipped: true; reason?: string } = { skipped: true };
    const cycle = await processMatpinWorkCycle({ deadline });
    if (shouldBackfill) {
      if (!deadline.canStart(1_000)) {
        backfill = { skipped: true, reason: "deadline_reserve" };
      } else {
        try {
          backfill = await backfillMatpinConversationHistory({
            signal: deadline.signalFor(Math.min(45_000, deadline.workRemainingMs())),
          });
        } catch (error) {
          const code = error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error";
          console.error("[matpin-worker] backfill_failed", code);
          backfill = { error: code };
        }
      }
    }
    return NextResponse.json({
      ok: true,
      cycle,
      processed: cycle.analysis.results,
      backfill,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[matpin-worker] failed", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ error: "worker_failed" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const accessError = workerAccessError(request);
  if (accessError) return accessError;

  after(async () => {
    try {
      // Poller 연결의 5초 timeout과 분리된 새 255초 deadline을 사용한다.
      await processMatpinWorkCycle();
    } catch (error) {
      const code = error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error";
      console.error("[matpin-worker] asynchronous_cycle_failed", code);
    }
  });

  return NextResponse.json({
    ok: true,
    accepted: true,
    completed: false,
    mode: "asynchronous_poller_kick",
    liveness: MATPIN_WORK_LIVENESS,
  }, {
    status: 202,
    headers: { "cache-control": "no-store" },
  });
}
