// 응원 데이터층 — Supabase(진실의 원천)를 우선하고 localStorage로 낙관·중복차단·오프라인 폴백.
//   피벗 P0의 핵심: 수신자의 응원이 "투표자 브라우저"에 갇히지 않고 발행자 대시보드에 실제 도달.
//   Supabase 미설정(로컬 데모)이면 전 함수가 자동으로 localStorage로 폴백한다.
import { getSupabase } from "./client";
import {
  addDuelVote as localAddDuel,
  addVote as localAddVote,
  attachComment as localAttachComment,
  loadPendingDuelVotes,
  hasDuelVoted,
  hasVoted,
  loadDuelVotes as localLoadDuel,
  loadVotes as localLoadVotes,
  removePendingDuelVote,
  upsertPendingDuelVote,
  type DuelPraiseId,
  type DuelSide,
  type DuelVotes,
  type PendingDuelVote,
  type Vote,
  type VoteType,
} from "../storage";

export { hasVoted, hasDuelVoted };
export type { Vote, VoteType, DuelSide, DuelVotes, DuelPraiseId };

const FP_KEY = "oneul:fp";

/** 익명 투표자 지문 — 브라우저 localStorage UUID (1인 1표 dedup 키). PII 아님. */
export function voterFp(): string {
  if (typeof window === "undefined") return "server";
  try {
    let fp = localStorage.getItem(FP_KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(FP_KEY, fp);
    }
    return fp;
  } catch {
    return "anon";
  }
}

// ── 단일 카드 응원 ──────────────────────────────────────────────────────────

/** 응원 1표 — 낙관적으로 localStorage에 남기고(중복차단) Supabase에 upsert(1인1표). */
export async function castVote(slug: string, type: VoteType, comment?: string): Promise<void> {
  localAddVote(slug, {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined,
    type,
    comment,
    at: Date.now(),
  });
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb
      .from("card_votes")
      .upsert(
        { slug, kind: type, comment: comment ?? null, voter_fp: voterFp() },
        { onConflict: "slug,voter_fp", ignoreDuplicates: true },
      );
  } catch {
    /* 네트워크 실패는 localStorage에 이미 반영됨 */
  }
}

/** 응원 후 한마디를 뒤늦게 붙일 때 — 내 행 comment 갱신. */
export async function attachVoteComment(slug: string, comment: string): Promise<void> {
  localAttachComment(slug, comment);
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("card_votes").update({ comment }).eq("slug", slug).eq("voter_fp", voterFp());
  } catch {
    /* noop */
  }
}

/** 발행자 대시보드용 — 이 카드의 실제 응원 전부(Supabase 우선, 폴백 localStorage).
 *  내(현재 브라우저) voter_fp는 제외한다 — 발행자가 자기 링크를 열어 직접 응원해도
 *  "검증된 고유 투표자" 표본·리포트 게이트에 섞이지 않도록. */
export async function fetchVotes(slug: string): Promise<Vote[]> {
  const sb = getSupabase();
  if (!sb) return localLoadVotes(slug);
  try {
    const { data, error } = await sb
      .from("card_votes")
      .select("id,kind,comment,created_at,voter_fp")
      .eq("slug", slug)
      .order("created_at", { ascending: true });
    if (error || !data) return localLoadVotes(slug);
    const myFp = voterFp();
    return data
      .filter((r) => r.voter_fp !== myFp)
      .map((r) => ({
        id: typeof r.id === "string" ? r.id : undefined,
        type: r.kind as VoteType,
        comment: r.comment ?? undefined,
        at: new Date(r.created_at as string).getTime(),
      }));
  } catch {
    return localLoadVotes(slug);
  }
}

// ── A/B 응원 대결 ───────────────────────────────────────────────────────────

export interface DuelVoteInput {
  slug: string;
  side: DuelSide;
  roundId: string;
  userId: string;
  candidateId: string;
  praiseId: DuelPraiseId;
  idempotencyKey: string;
  comment?: string;
}

export type CastDuelVoteInput = DuelVoteInput;
export type DuelVoteResult = "synced" | "queued";

export interface FlushPendingDuelVotesResult {
  synced: number;
  queued: number;
}

type BrowserSupabase = NonNullable<ReturnType<typeof getSupabase>>;

const offline = (): boolean => typeof navigator !== "undefined" && navigator.onLine === false;
const browserSupabase = (): BrowserSupabase | null => {
  try {
    return getSupabase();
  } catch {
    return null;
  }
};

const toPendingDuelVote = (
  input: DuelVoteInput | { slug: string; side: DuelSide; comment?: string },
): PendingDuelVote => {
  const fp = voterFp();
  const legacy = !("idempotencyKey" in input);
  const idempotencyKey = legacy ? null : input.idempotencyKey;
  return {
    id: idempotencyKey ?? `legacy:${input.slug}:${fp}`,
    slug: input.slug,
    side: input.side,
    comment: input.comment,
    voterFp: fp,
    roundId: legacy ? null : input.roundId,
    userId: legacy ? null : input.userId,
    candidateId: legacy ? null : input.candidateId,
    praiseId: legacy ? null : input.praiseId,
    idempotencyKey,
    createdAt: Date.now(),
  };
};

const syncDuelVote = async (sb: BrowserSupabase, vote: PendingDuelVote): Promise<void> => {
  const { error } = await sb.from("duel_votes").upsert(
    {
      slug: vote.slug,
      side: vote.side,
      comment: vote.comment ?? null,
      voter_fp: vote.voterFp,
      round_id: vote.roundId,
      user_id: vote.userId,
      candidate_id: vote.candidateId,
      praise_id: vote.praiseId,
      idempotency_key: vote.idempotencyKey,
    },
    {
      onConflict: vote.idempotencyKey ? "idempotency_key" : "slug,voter_fp",
      ignoreDuplicates: true,
    },
  );
  if (error && error.code !== "23505") throw error;
};

let flushInFlight: Promise<FlushPendingDuelVotesResult> | null = null;

export function flushPendingDuelVotes(): Promise<FlushPendingDuelVotesResult> {
  if (flushInFlight) return flushInFlight;

  const flush = async (): Promise<FlushPendingDuelVotesResult> => {
    const pending = loadPendingDuelVotes();
    const sb = browserSupabase();
    if (!sb || offline()) return { synced: 0, queued: pending.length };

    let synced = 0;
    for (const vote of pending) {
      try {
        await syncDuelVote(sb, vote);
        removePendingDuelVote(vote.id);
        synced += 1;
      } catch {
        // Keep failed records queued; a later online event retries them with the same key.
      }
    }
    return { synced, queued: loadPendingDuelVotes().length };
  };

  flushInFlight = flush().finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
}

export function castDuelVote(input: DuelVoteInput): Promise<DuelVoteResult>;
export function castDuelVote(slug: string, side: DuelSide, comment?: string): Promise<DuelVoteResult>;
export async function castDuelVote(
  inputOrSlug: DuelVoteInput | string,
  legacySide?: DuelSide,
  legacyComment?: string,
): Promise<DuelVoteResult> {
  const input =
    typeof inputOrSlug === "string"
      ? { slug: inputOrSlug, side: legacySide ?? "a", comment: legacyComment }
      : inputOrSlug;
  const pending = toPendingDuelVote(input);

  localAddDuel(pending.slug, pending.side, pending.comment);
  const sb = browserSupabase();
  if (!sb || offline()) {
    upsertPendingDuelVote(pending);
    return "queued";
  }

  try {
    await syncDuelVote(sb, pending);
    removePendingDuelVote(pending.id);
    return "synced";
  } catch {
    upsertPendingDuelVote(pending);
    return "queued";
  }
}

export async function attachDuelComment(slug: string, comment: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("duel_votes").update({ comment }).eq("slug", slug).eq("voter_fp", voterFp());
  } catch {
    /* noop */
  }
}

export async function fetchDuelVotes(slug: string): Promise<DuelVotes> {
  const sb = getSupabase();
  if (!sb) return localLoadDuel(slug);
  try {
    const { data, error } = await sb
      .from("duel_votes")
      .select("side,comment,created_at")
      .eq("slug", slug)
      .order("created_at", { ascending: true });
    if (error || !data) return localLoadDuel(slug);
    const votes: DuelVotes = { a: 0, b: 0, comments: [] };
    for (const r of data) {
      const side = r.side as DuelSide;
      votes[side] += 1;
      if (r.comment) votes.comments.push({ side, text: r.comment as string, at: new Date(r.created_at as string).getTime() });
    }
    return votes;
  } catch {
    return localLoadDuel(slug);
  }
}

if (typeof window !== "undefined") {
  const retryWindow = window as Window & { __oneulDuelVoteRetryBound__?: boolean };
  if (!retryWindow.__oneulDuelVoteRetryBound__) {
    retryWindow.__oneulDuelVoteRetryBound__ = true;
    window.addEventListener("online", () => {
      void flushPendingDuelVotes();
    });
    if (!offline()) setTimeout(() => void flushPendingDuelVotes(), 0);
  }
}
