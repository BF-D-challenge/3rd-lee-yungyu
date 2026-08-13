import {
  createMatpinWorkerDeadline,
  type MatpinDeadline,
} from "@/lib/matpin/deadline";
import {
  MATPIN_OUTBOUND_MIN_JOB_TIME_MS,
  processMatpinOutboundQueue,
  type MatpinOutboundWorkerResult,
} from "@/lib/matpin/outbound-worker";
import { processMatpinQueue } from "@/lib/matpin/worker";

const INITIAL_OUTBOUND_BUDGET_MS = 20_000;
const FINAL_OUTBOUND_BUDGET_MS = 15_000;

export const MATPIN_WORK_LIVENESS = {
  vercelCron: "daily_fallback",
  releaseGate: "supabase_poller_required",
  pollIntervalSeconds: { min: 30, max: 60 },
} as const;

type WorkPhase<T> = {
  results: T;
  error?: string;
};

export type MatpinWorkCycleResult = {
  liveness: typeof MATPIN_WORK_LIVENESS;
  outboundBefore: WorkPhase<MatpinOutboundWorkerResult[]>;
  analysis: WorkPhase<Awaited<ReturnType<typeof processMatpinQueue>>>;
  outboundAfter: WorkPhase<MatpinOutboundWorkerResult[]> & { skipped?: true };
};

function phaseErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "unknown_work_cycle_error";
  const code = error.message.split(":", 1)[0]?.trim();
  return code && /^[a-z0-9_]{1,120}$/i.test(code) ? code : "unknown_work_cycle_error";
}

function containsCompletedAnalysis(
  results: Awaited<ReturnType<typeof processMatpinQueue>>,
): boolean {
  return results.some((result) => result.state === "saved" || result.state === "failed");
}

async function drainOutbound(
  deadline: MatpinDeadline,
  options: { limit: number; concurrency: number; budgetMs: number },
): Promise<MatpinOutboundWorkerResult[]> {
  if (!deadline.canStart(MATPIN_OUTBOUND_MIN_JOB_TIME_MS)) return [];
  const availableMs = Math.min(options.budgetMs, deadline.workRemainingMs());
  if (availableMs < MATPIN_OUTBOUND_MIN_JOB_TIME_MS) return [];
  return processMatpinOutboundQueue({
    limit: options.limit,
    concurrency: options.concurrency,
    signal: deadline.signalFor(availableMs),
    remainingTimeMs: availableMs,
  });
}

export async function processMatpinWorkCycle(
  options: { deadline?: MatpinDeadline } = {},
): Promise<MatpinWorkCycleResult> {
  const deadline = options.deadline ?? createMatpinWorkerDeadline();

  let outboundBefore: MatpinWorkCycleResult["outboundBefore"];
  try {
    outboundBefore = {
      results: await drainOutbound(deadline, {
        limit: 5,
        concurrency: 5,
        budgetMs: INITIAL_OUTBOUND_BUDGET_MS,
      }),
    };
  } catch (error) {
    outboundBefore = { results: [], error: phaseErrorCode(error) };
  }

  let analysis: MatpinWorkCycleResult["analysis"];
  try {
    analysis = { results: await processMatpinQueue(1, { deadline }) };
  } catch (error) {
    analysis = { results: [], error: phaseErrorCode(error) };
  }

  let outboundAfter: MatpinWorkCycleResult["outboundAfter"] = {
    results: [],
    skipped: true,
  };
  if (
    containsCompletedAnalysis(analysis.results)
    && deadline.canStart(MATPIN_OUTBOUND_MIN_JOB_TIME_MS)
  ) {
    try {
      outboundAfter = {
        results: await drainOutbound(deadline, {
          limit: 1,
          concurrency: 1,
          budgetMs: FINAL_OUTBOUND_BUDGET_MS,
        }),
      };
    } catch (error) {
      outboundAfter = { results: [], error: phaseErrorCode(error) };
    }
  }

  return {
    liveness: MATPIN_WORK_LIVENESS,
    outboundBefore,
    analysis,
    outboundAfter,
  };
}
