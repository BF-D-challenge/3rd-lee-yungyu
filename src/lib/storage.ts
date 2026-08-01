// localStorage 키 일원화 — 화면들이 문자열 키를 직접 만지지 않는다.
import type { Seed } from "./draw";
import { isFeedbackWriteAccess, type FeedbackWriteAccess } from "./feedback-access";
import type { CardPayload } from "./share";
import type { TastepinResolveResponse } from "./tastepin-contract";
import type { TastepinLibraryPlace } from "./tastepin-library-contract";
import type { MatpickDmCandidate, MatpickDmResponse } from "./matpick-dm-contract";

const KEYS = {
  seed: "oneul:seed",
  published: "oneul:published",
  votes: (slug: string) => `oneul:votes:${slug}`,
  voted: (slug: string) => `oneul:voted:${slug}`,
  duels: "oneul:duels",
  duelVotes: (slug: string) => `oneul:duelvotes:${slug}`,
  duelVoted: (slug: string) => `oneul:duelvoted:${slug}`,
  pendingDuelVotes: "oneul:pending-duel-votes:v1",
  tastepinSaves: "oneul:tastepin-saves:v1",
  matpickPlaceIds: "matpick:saved-place-ids:v1",
  matpickDmSaves: "matpick:dm-saves:v1",
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
  feedbackReadToken?: string;
  publishedAt: number;
}

const readArray = <T,>(key: string): T[] => {
  const v = read<T[]>(key);
  return Array.isArray(v) ? v : []; // 손상된 값(객체/null 등)은 빈 배열로
};

export interface SavedTastepinResult {
  id: string;
  sourceUrl: string;
  result: TastepinResolveResponse;
  savedAt: number;
}

const isSavedTastepinResult = (value: unknown): value is SavedTastepinResult => {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<SavedTastepinResult>;
  return (
    typeof saved.id === "string" &&
    typeof saved.sourceUrl === "string" &&
    typeof saved.savedAt === "number" &&
    Boolean(saved.result && typeof saved.result === "object")
  );
};

export const loadTastepinSaves = (): SavedTastepinResult[] =>
  readArray<unknown>(KEYS.tastepinSaves).filter(isSavedTastepinResult);

export interface SavedMatpickDmPlace {
  id: string;
  reelUrl: string;
  reel: MatpickDmResponse["reel"];
  candidate: MatpickDmCandidate;
  savedAt: number;
}

const isSavedMatpickDmPlace = (value: unknown): value is SavedMatpickDmPlace => {
  if (!value || typeof value !== "object") return false;
  const saved = value as Partial<SavedMatpickDmPlace>;
  return (
    typeof saved.id === "string" &&
    typeof saved.reelUrl === "string" &&
    typeof saved.savedAt === "number" &&
    Boolean(saved.reel && typeof saved.reel === "object") &&
    Boolean(saved.candidate && typeof saved.candidate === "object")
  );
};

export const loadMatpickDmSaves = (): SavedMatpickDmPlace[] =>
  readArray<unknown>(KEYS.matpickDmSaves).filter(isSavedMatpickDmPlace);

export const saveMatpickDmPlace = (
  result: MatpickDmResponse,
  candidate: MatpickDmCandidate,
): { saved: SavedMatpickDmPlace; duplicate: boolean } => {
  const current = loadMatpickDmSaves();
  const id = `${result.reel.id}:${candidate.id}`;
  const existing = current.find((item) => item.id === id);
  if (existing) return { saved: existing, duplicate: true };

  const saved: SavedMatpickDmPlace = {
    id,
    reelUrl: result.reel.url,
    reel: result.reel,
    candidate,
    savedAt: Date.now(),
  };
  write(KEYS.matpickDmSaves, [saved, ...current].slice(0, 100));
  return { saved, duplicate: false };
};

const loadImportedYoutubePlaces = (): TastepinLibraryPlace[] =>
  loadTastepinSaves().flatMap((saved) => {
    const videoId = saved.sourceUrl.match(/\/shorts\/([A-Za-z0-9_-]{11})/)?.[1];
    if (!videoId) return [];

    return saved.result.mapCandidates.flatMap((candidate) => {
      const latitude = Number(candidate.latitude);
      const longitude = Number(candidate.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

      const clue = saved.result.extraction.places.find((place) => (
        place.name === candidate.name
      )) ?? saved.result.extraction.places[0];
      const area = clue?.regionHints[0]
        ?? candidate.roadAddress.split(" ").slice(0, 2).join(" ")
        ?? "직접 추가";

      return [{
        id: `import-${videoId}-${candidate.id}`,
        name: candidate.name,
        area: area || "직접 추가",
        category: candidate.category || "음식점",
        occasion: "직접 추가",
        address: candidate.roadAddress || candidate.address || "주소 확인 중",
        latitude,
        longitude,
        distanceMeters: 0,
        mapUrl: candidate.mapUrl,
        source: {
          platform: "youtube_shorts" as const,
          creator: "직접 추가",
          url: saved.sourceUrl,
        },
        instagramMentions: [],
        youtubeMentions: [{
          id: videoId,
          kind: "shorts" as const,
          title: clue?.menus[0]
            ? `${candidate.name} · ${clue.menus[0]}`
            : `${candidate.name}을 언급한 Shorts`,
          channel: "내가 추가한 YouTube Shorts",
          duration: "Shorts",
          url: saved.sourceUrl,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          viewCount: null,
          publishedAt: null,
        }],
        savedAt: new Date(saved.savedAt).toISOString(),
      }];
    });
  });

const loadImportedInstagramPlaces = (): TastepinLibraryPlace[] =>
  loadMatpickDmSaves().map((saved) => ({
    id: saved.candidate.id,
    name: saved.candidate.name,
    area: saved.candidate.area,
    category: saved.candidate.category,
    occasion: "내가 저장",
    address: saved.candidate.address,
    latitude: saved.candidate.latitude,
    longitude: saved.candidate.longitude,
    distanceMeters: 0,
    mapUrl: saved.candidate.mapUrl,
    source: {
      platform: "instagram_reel" as const,
      creator: saved.reel.creator,
      url: saved.reel.url,
    },
    instagramMentions: [{
      id: saved.reel.id,
      kind: "reel" as const,
      title: saved.reel.title,
      creator: saved.reel.creator,
      url: saved.reel.url,
      embedUrl: `${saved.reel.url}embed/captioned/`,
      thumbnailUrl: saved.reel.thumbnailUrl,
      publishedAt: saved.reel.publishedAt,
    }],
    youtubeMentions: [],
    savedAt: new Date(saved.savedAt).toISOString(),
  }));

export const loadImportedMatpickPlaces = (): TastepinLibraryPlace[] => {
  const places = [...loadImportedInstagramPlaces(), ...loadImportedYoutubePlaces()];
  return places.filter((place, index) => (
    places.findIndex((candidate) => candidate.id === place.id) === index
  ));
};

export const saveTastepinResult = (
  sourceUrl: string,
  result: TastepinResolveResponse,
): SavedTastepinResult => {
  const saved: SavedTastepinResult = {
    id: sourceUrl,
    sourceUrl,
    result,
    savedAt: Date.now(),
  };
  const list = loadTastepinSaves().filter((item) => item.id !== saved.id);
  write(KEYS.tastepinSaves, [saved, ...list].slice(0, 50));
  return saved;
};

export const loadSavedMatpickPlaceIds = (): string[] =>
  readArray<unknown>(KEYS.matpickPlaceIds)
    .filter((value): value is string => typeof value === "string");

export const saveMatpickPlace = (
  place: Pick<TastepinLibraryPlace, "id">,
): string[] => {
  const current = loadSavedMatpickPlaceIds();
  if (current.includes(place.id)) return current;
  const ids = [place.id, ...current];
  write(KEYS.matpickPlaceIds, ids);
  return ids;
};

export const toggleSavedMatpickPlace = (
  place: Pick<TastepinLibraryPlace, "id">,
): { saved: boolean; ids: string[] } => {
  const current = loadSavedMatpickPlaceIds();
  const saved = !current.includes(place.id);
  const ids = saved
    ? [place.id, ...current]
    : current.filter((id) => id !== place.id);
  write(KEYS.matpickPlaceIds, ids);
  return { saved, ids };
};

export const loadPublished = (): PublishedCard[] => readArray<PublishedCard>(KEYS.published);
export const addPublished = (card: PublishedCard): void => {
  const list = loadPublished().filter((c) => c.slug !== card.slug);
  write(KEYS.published, [card, ...list]);
};

// 긍정 전용 4칩 — 응원 강도가 곧 수요 그라디언트 (need > notify > watch > cheer). 부정칩 없음.
export type VoteType = "need" | "notify" | "watch" | "cheer";

export interface Vote {
  id?: string;
  type: VoteType;
  comment?: string;
  at: number;
}

export const loadVotes = (slug: string): Vote[] => readArray<Vote>(KEYS.votes(slug));
export const addVote = (slug: string, vote: Vote): void => {
  if (hasVoted(slug)) return;
  write(KEYS.votes(slug), [...loadVotes(slug), vote]);
  write(KEYS.voted(slug), true);
};
export const hasVoted = (slug: string): boolean => read<unknown>(KEYS.voted(slug)) === true;
export const removeVote = (slug: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEYS.votes(slug));
    localStorage.removeItem(KEYS.voted(slug));
  } catch {
    /* 스토리지 실패 시 원격 전송 결과가 진실의 원천이다. */
  }
};

/** 응원 직후 한마디만 뒤늦게 붙일 때 — 표는 늘리지 않고 마지막 응원에 코멘트만 단다 */
export const attachComment = (slug: string, comment: string): void => {
  const list = loadVotes(slug);
  if (list.length === 0) return;
  list[list.length - 1] = { ...list[list.length - 1], comment };
  write(KEYS.votes(slug), list);
};

// ── A/B 응원 대결 — 기존 투표와 같은 로컬 원칙: 응원은 수신자 브라우저에 쌓인다 ──

export type DuelSide = "a" | "b";
export type DuelPraiseId = "need" | "notify" | "cheer";

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

export const hasDuelVoted = (slug: string): boolean => read<boolean>(KEYS.duelVoted(slug)) ?? false;

export const addDuelVote = (slug: string, side: DuelSide, comment?: string): void => {
  if (hasDuelVoted(slug)) return;
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

export interface PendingDuelVote {
  id: string;
  slug: string;
  side: DuelSide;
  comment?: string;
  voterFp: string;
  roundId: string | null;
  userId: string | null;
  candidateId: string | null;
  praiseId: DuelPraiseId | null;
  idempotencyKey: string | null;
  feedbackAccess?: FeedbackWriteAccess | null;
  createdAt: number;
}

const isPendingDuelVote = (value: unknown): value is PendingDuelVote => {
  if (!value || typeof value !== "object") return false;
  const vote = value as Partial<PendingDuelVote>;
  return (
    typeof vote.id === "string" &&
    typeof vote.slug === "string" &&
    (vote.side === "a" || vote.side === "b") &&
    (vote.comment === undefined || typeof vote.comment === "string") &&
    typeof vote.voterFp === "string" &&
    (vote.roundId === null || typeof vote.roundId === "string") &&
    (vote.userId === null || typeof vote.userId === "string") &&
    (vote.candidateId === null || typeof vote.candidateId === "string") &&
    (vote.praiseId === null || vote.praiseId === "need" || vote.praiseId === "notify" || vote.praiseId === "cheer") &&
    (vote.idempotencyKey === null || typeof vote.idempotencyKey === "string") &&
    (vote.feedbackAccess === undefined || vote.feedbackAccess === null || isFeedbackWriteAccess(vote.feedbackAccess)) &&
    typeof vote.createdAt === "number"
  );
};

export const loadPendingDuelVotes = (): PendingDuelVote[] =>
  readArray<unknown>(KEYS.pendingDuelVotes).filter(isPendingDuelVote);

/** 같은 재전송 건은 교체하고 큐 순서는 유지한다. */
export const upsertPendingDuelVote = (vote: PendingDuelVote): void => {
  const queue = loadPendingDuelVotes();
  const index = queue.findIndex((item) => item.id === vote.id);
  if (index === -1) queue.push(vote);
  else queue[index] = vote;
  write(KEYS.pendingDuelVotes, queue);
};

export const removePendingDuelVote = (id: string): void => {
  write(
    KEYS.pendingDuelVotes,
    loadPendingDuelVotes().filter((vote) => vote.id !== id),
  );
};

export const clearPendingDuelVotes = (): void => write(KEYS.pendingDuelVotes, []);

export interface Duel {
  slug: string;
  a: CardPayload;
  b: CardPayload;
  feedback?: FeedbackWriteAccess;
  feedbackReadToken?: string;
  createdAt: number;
}

export const loadDuels = (): Duel[] => readArray<Duel>(KEYS.duels);
export const addDuel = (duel: Duel): void => {
  const list = loadDuels().filter((d) => d.slug !== duel.slug);
  write(KEYS.duels, [duel, ...list]);
};
