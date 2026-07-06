// localStorage 키 일원화 — 화면들이 문자열 키를 직접 만지지 않는다.
import type { Seed } from "./draw";
import type { CardPayload } from "./share";

const KEYS = {
  seed: "oneul:seed",
  published: "oneul:published",
  votes: (slug: string) => `oneul:votes:${slug}`,
  voted: (slug: string) => `oneul:voted:${slug}`,
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

export type VoteType = "try" | "empathy" | "meh";

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
