// localStorage 키 일원화 — 화면들이 문자열 키를 직접 만지지 않는다.
import type { Seed } from "./draw";
import type { CardPayload } from "./share";

const KEYS = {
  seed: "oneul:seed",
  published: "oneul:published",
  votes: (slug: string) => `oneul:votes:${slug}`,
  voted: (slug: string) => `oneul:voted:${slug}`,
  duels: "oneul:duels",
  duelVotes: (slug: string) => `oneul:duelvotes:${slug}`,
  duelVoted: (slug: string) => `oneul:duelvoted:${slug}`,
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 스토리지 실패 무시 (시크릿 모드 등) */
  }
}

export const loadSeed = (): Seed | null => read<Seed>(KEYS.seed);
export const saveSeed = (seed: Seed): void => write(KEYS.seed, seed);

export interface PublishedCard {
  slug: string;
  payload: CardPayload;
  publishedAt: number;
}

const readArray = <T,>(key: string): T[] => {
  const v = read<T[]>(key);
  return Array.isArray(v) ? v : []; // 손상된 값(객체/null 등)은 빈 배열로
};

export const loadPublished = (): PublishedCard[] => readArray<PublishedCard>(KEYS.published);
export const addPublished = (card: PublishedCard): void => {
  const list = loadPublished().filter((c) => c.slug !== card.slug);
  write(KEYS.published, [card, ...list]);
};

// 긍정 전용 4칩 — 응원 강도가 곧 수요 그라디언트 (need > notify > watch > cheer). 부정칩 없음.
export type VoteType = "need" | "notify" | "watch" | "cheer";

export interface Vote {
  type: VoteType;
  comment?: string;
  at: number;
}

export const loadVotes = (slug: string): Vote[] => readArray<Vote>(KEYS.votes(slug));
export const addVote = (slug: string, vote: Vote): void => {
  write(KEYS.votes(slug), [...loadVotes(slug), vote]);
  write(KEYS.voted(slug), true);
};
export const hasVoted = (slug: string): boolean => read<boolean>(KEYS.voted(slug)) ?? false;

/** 응원 직후 한마디만 뒤늦게 붙일 때 — 표는 늘리지 않고 마지막 응원에 코멘트만 단다 */
export const attachComment = (slug: string, comment: string): void => {
  const list = loadVotes(slug);
  if (list.length === 0) return;
  list[list.length - 1] = { ...list[list.length - 1], comment };
  write(KEYS.votes(slug), list);
};

// ── A/B 응원 대결 — 기존 투표와 같은 로컬 원칙: 응원은 수신자 브라우저에 쌓인다 ──

export type DuelSide = "a" | "b";

export interface DuelComment {
  side: DuelSide;
  text: string;
  at: number;
}

export interface DuelVotes {
  a: number;
  b: number;
  comments: DuelComment[];
}

export const loadDuelVotes = (slug: string): DuelVotes => {
  const v = read<DuelVotes>(KEYS.duelVotes(slug));
  if (!v || typeof v.a !== "number" || typeof v.b !== "number") return { a: 0, b: 0, comments: [] };
  return { a: v.a, b: v.b, comments: Array.isArray(v.comments) ? v.comments : [] };
};

export const addDuelVote = (slug: string, side: DuelSide, comment?: string): void => {
  const cur = loadDuelVotes(slug);
  const text = comment?.trim();
  write(KEYS.duelVotes(slug), {
    a: cur.a + (side === "a" ? 1 : 0),
    b: cur.b + (side === "b" ? 1 : 0),
    comments: text ? [...cur.comments, { side, text, at: Date.now() }] : cur.comments,
  });
  write(KEYS.duelVoted(slug), true);
};

/** 응원 후 한마디만 뒤늦게 붙일 때 — 표는 늘리지 않는다 */
export const addDuelComment = (slug: string, side: DuelSide, text: string): void => {
  const cur = loadDuelVotes(slug);
  write(KEYS.duelVotes(slug), { ...cur, comments: [...cur.comments, { side, text, at: Date.now() }] });
};

export const hasDuelVoted = (slug: string): boolean => read<boolean>(KEYS.duelVoted(slug)) ?? false;

export interface Duel {
  slug: string;
  a: CardPayload;
  b: CardPayload;
  createdAt: number;
}

export const loadDuels = (): Duel[] => readArray<Duel>(KEYS.duels);
export const addDuel = (duel: Duel): void => {
  const list = loadDuels().filter((d) => d.slug !== duel.slug);
  write(KEYS.duels, [duel, ...list]);
};
