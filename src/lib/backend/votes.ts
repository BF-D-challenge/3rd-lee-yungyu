// 응원 데이터층 — Supabase(진실의 원천)를 우선하고 localStorage로 낙관·중복차단·오프라인 폴백.
//   피벗 P0의 핵심: 수신자의 응원이 "투표자 브라우저"에 갇히지 않고 발행자 대시보드에 실제 도달.
//   Supabase 미설정(로컬 데모)이면 전 함수가 자동으로 localStorage로 폴백한다.
import type { FeedbackOwnerAccess, FeedbackWriteAccess } from "../feedback-access";
import {
  feedbackApiConfigured,
  readCardVotes,
  readDuelVotes,
  sendCardVote,
  sendDuelVote,
  updateCardComment,
  updateDuelComment,
} from "./feedback-api";
import {
  addDuelVote as localAddDuel,
  addVote as localAddVote,
  attachComment as localAttachComment,
  loadPendingDuelVotes,
  hasDuelVoted,
  hasVoted,
  loadDuelVotes as localLoadDuel,
  loadVotes as localLoadVotes,
  removeVote as localRemoveVote,
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
let memoryFp: string | null = null;

const freshUuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // 보안 설정이 UUID 생성을 막으면 아래 세션 한정 식별자로 폴백한다.
  }
  return `browser-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/** 익명 투표자 지문 — 브라우저 localStorage UUID (1인 1표 dedup 키). PII 아님. */
export function voterFp(): string {
  if (typeof window === "undefined") return "server";
  try {
    let fp = localStorage.getItem(FP_KEY);
    if (!fp) {
      fp = freshUuid();
      localStorage.setItem(FP_KEY, fp);
    }
    return fp;
  } catch {
    return (memoryFp ??= freshUuid());
  }
}

// ── 단일 카드 응원 ──────────────────────────────────────────────────────────

export type VoteMutationResult = "synced" | "local-only" | "failed";

/** 응원 1표 — 로컬 데모는 기기에 보존하고, Supabase 사용 시 실제 원격 반영 여부를 반환한다. */
export async function castVote(
  slug: string,
  type: VoteType,
  comment?: string,
  access?: FeedbackWriteAccess,
): Promise<VoteMutationResult> {
  const alreadyVoted = hasVoted(slug);
  localAddVote(slug, {
    id: freshUuid(),
    type,
    comment,
    at: Date.now(),
  });
  if (!access) {
    if (!feedbackApiConfigured()) return "local-only";
    if (!alreadyVoted) localRemoveVote(slug);
    return "failed";
  }
  const result = await sendCardVote({
    access,
    voterToken: voterFp(),
    kind: type,
    comment,
  });
  if (result === "disabled") return "local-only";
  if (result === "failed") {
    if (!alreadyVoted) localRemoveVote(slug);
    return "failed";
  }
  return "synced";
}

/** 응원 후 한마디를 뒤늦게 붙일 때 — 내 행 comment 갱신. */
export async function attachVoteComment(
  slug: string,
  comment: string,
  access?: FeedbackWriteAccess,
): Promise<VoteMutationResult> {
  localAttachComment(slug, comment);
  if (!access) return feedbackApiConfigured() ? "failed" : "local-only";
  const result = await updateCardComment({ access, voterToken: voterFp(), comment });
  return result === "disabled" ? "local-only" : result;
}

/** 발행자 대시보드용 — 이 카드의 실제 응원 전부(Supabase 우선, 폴백 localStorage).
 *  내(현재 브라우저) voter_fp는 제외한다 — 발행자가 자기 링크를 열어 직접 응원해도
 *  "검증된 고유 투표자" 표본·리포트 게이트에 섞이지 않도록. */
export async function fetchVotes(
  slug: string,
  access?: Pick<FeedbackOwnerAccess, "requestId" | "readToken">,
): Promise<Vote[]> {
  if (!access) return localLoadVotes(slug);
  const result = await readCardVotes({
    requestId: access.requestId,
    readToken: access.readToken,
    excludeVoterToken: voterFp(),
  });
  return result.status === "ok" ? result.data.votes : localLoadVotes(slug);
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
  access?: FeedbackWriteAccess;
}

export type CastDuelVoteInput = DuelVoteInput;
export type DuelVoteResult = "synced" | "queued";

export interface FlushPendingDuelVotesResult {
  synced: number;
  queued: number;
}

const offline = (): boolean => typeof navigator !== "undefined" && navigator.onLine === false;

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
    feedbackAccess: "access" in input ? input.access ?? null : null,
    createdAt: Date.now(),
  };
};

const syncDuelVote = async (vote: PendingDuelVote): Promise<"synced" | "disabled" | "failed"> => {
  if (!vote.feedbackAccess) return feedbackApiConfigured() ? "failed" : "disabled";
  return sendDuelVote({
    access: vote.feedbackAccess,
    voterToken: vote.voterFp,
    side: vote.side,
    comment: vote.comment,
    roundId: vote.roundId,
    userId: vote.userId,
    candidateId: vote.candidateId,
    praiseId: vote.praiseId,
    idempotencyKey: vote.idempotencyKey,
  });
};

let flushInFlight: Promise<FlushPendingDuelVotesResult> | null = null;

export function flushPendingDuelVotes(): Promise<FlushPendingDuelVotesResult> {
  if (flushInFlight) return flushInFlight;

  const flush = async (): Promise<FlushPendingDuelVotesResult> => {
    const pending = loadPendingDuelVotes();
    if (offline()) return { synced: 0, queued: pending.length };

    let synced = 0;
    for (const vote of pending) {
      const result = await syncDuelVote(vote);
      if (result === "synced") {
        removePendingDuelVote(vote.id);
        synced += 1;
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
  if (offline()) {
    upsertPendingDuelVote(pending);
    return "queued";
  }

  const result = await syncDuelVote(pending);
  if (result === "synced") {
    removePendingDuelVote(pending.id);
    return "synced";
  }
  upsertPendingDuelVote(pending);
  return "queued";
}

export async function attachDuelComment(
  _slug: string,
  comment: string,
  access?: FeedbackWriteAccess,
): Promise<void> {
  if (!access) return;
  await updateDuelComment({ access, voterToken: voterFp(), comment });
}

export async function fetchDuelVotes(
  slug: string,
  access?: Pick<FeedbackOwnerAccess, "requestId" | "readToken">,
): Promise<DuelVotes> {
  if (!access) return localLoadDuel(slug);
  const result = await readDuelVotes(access);
  return result.status === "ok" ? result.data.votes : localLoadDuel(slug);
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
