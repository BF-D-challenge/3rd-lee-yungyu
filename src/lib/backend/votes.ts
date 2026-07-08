// 응원 데이터층 — Supabase(진실의 원천)를 우선하고 localStorage로 낙관·중복차단·오프라인 폴백.
//   피벗 P0의 핵심: 수신자의 응원이 "투표자 브라우저"에 갇히지 않고 발행자 대시보드에 실제 도달.
//   Supabase 미설정(로컬 데모)이면 전 함수가 자동으로 localStorage로 폴백한다.
import { getSupabase } from "./client";
import {
  addDuelVote as localAddDuel,
  addVote as localAddVote,
  attachComment as localAttachComment,
  hasDuelVoted,
  hasVoted,
  loadDuelVotes as localLoadDuel,
  loadVotes as localLoadVotes,
  type DuelSide,
  type DuelVotes,
  type Vote,
  type VoteType,
} from "../storage";

export { hasVoted, hasDuelVoted };
export type { Vote, VoteType, DuelSide, DuelVotes };

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
  localAddVote(slug, { type, comment, at: Date.now() });
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

/** 발행자 대시보드용 — 이 카드의 실제 응원 전부(Supabase 우선, 폴백 localStorage). */
export async function fetchVotes(slug: string): Promise<Vote[]> {
  const sb = getSupabase();
  if (!sb) return localLoadVotes(slug);
  try {
    const { data, error } = await sb
      .from("card_votes")
      .select("kind,comment,created_at")
      .eq("slug", slug)
      .order("created_at", { ascending: true });
    if (error || !data) return localLoadVotes(slug);
    return data.map((r) => ({
      type: r.kind as VoteType,
      comment: r.comment ?? undefined,
      at: new Date(r.created_at as string).getTime(),
    }));
  } catch {
    return localLoadVotes(slug);
  }
}

// ── A/B 응원 대결 ───────────────────────────────────────────────────────────

export async function castDuelVote(slug: string, side: DuelSide, comment?: string): Promise<void> {
  localAddDuel(slug, side, comment);
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb
      .from("duel_votes")
      .upsert(
        { slug, side, comment: comment ?? null, voter_fp: voterFp() },
        { onConflict: "slug,voter_fp", ignoreDuplicates: true },
      );
  } catch {
    /* noop */
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
