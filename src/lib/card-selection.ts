import type { Golden } from "./combos";
import qualityGates from "@/data/card-quality-gates.json";
import { categoryOfSeed } from "./pools";
import { normalizePreferences, type PreferenceId } from "./preferences";

interface PreferenceProfile {
  categories: string[];
  formats: string[];
  keywords?: RegExp;
  preferDirect?: boolean;
}

const PROFILES: Record<PreferenceId, PreferenceProfile> = {
  "make-now": {
    categories: ["no-code", "mobile-apps", "productivity", "dev", "design-tools"],
    formats: ["template-gen", "calc-tool", "curation", "vote-card"],
  },
  "share-reaction": {
    categories: ["social-media", "community", "games", "entertainment"],
    formats: ["vote-card", "landing-waitlist", "share-link"],
    keywords: /공유|반응|투표|알림|친구|팔로워/,
  },
  paid: {
    categories: ["commerce", "sales", "saas", "marketing"],
    formats: ["calc-tool", "dashboard", "landing-waitlist"],
    preferDirect: true,
  },
  community: {
    categories: ["community", "social-media", "games"],
    formats: ["vote-card", "crud-app", "chatbot"],
    keywords: /커뮤니티|모임|팀|친구|댓글|동료/,
  },
  "ai-tools": {
    categories: ["ai", "mobile-apps", "dev"],
    formats: ["calc-tool", "template-gen", "chatbot"],
    keywords: /AI|진단|요약|자동|오류/,
  },
  "one-day": {
    categories: ["mobile-apps", "no-code", "productivity", "dev", "design-tools"],
    formats: ["template-gen", "calc-tool", "curation", "vote-card"],
    keywords: /오늘|반나절|첫|빠르|간단/,
  },
  "friend-vote": {
    categories: ["games", "community", "travel", "entertainment"],
    formats: ["vote-card"],
    keywords: /투표|카드|친구|동행|동료|팔로워/,
  },
  content: {
    categories: ["content", "social-media", "marketing"],
    formats: ["template-gen", "digest-bot", "curation"],
    keywords: /문장|콘텐츠|글|방송|팟캐스트|책/,
  },
  "light-fun": {
    categories: ["entertainment", "games", "travel", "food"],
    formats: ["vote-card", "curation"],
    keywords: /게임|데이트|여행|술자리|운세|카페/,
  },
  b2b: {
    categories: ["saas", "sales", "recruiting-hr", "marketing", "commerce", "legal"],
    formats: ["dashboard", "calc-tool", "template-gen"],
    preferDirect: true,
    keywords: /영업|제안|지원|업무|가입|고객|발주/,
  },
  local: {
    categories: ["food", "commerce", "sales", "travel", "no-code"],
    formats: ["dashboard", "curation", "template-gen", "calc-tool"],
    keywords: /가게|동네|카페|소상공인|방문|지역|여행|매장/,
  },
  education: {
    categories: ["education", "ai", "fitness", "content"],
    formats: ["calc-tool", "template-gen", "vote-card"],
    keywords: /학습|학생|취준|강의|연습|피드백|면접|노트/,
  },
};

export interface SelectedGolden {
  card: Golden;
  preferenceId: PreferenceId;
  variant: SelectionVariant;
}

export type SelectionVariant = "fit-contrast-v2" | "appeal-first-v1";

const recentKeys: string[] = [];
const cardKey = (card: Golden) => `${card.seed}|${card.pain}|${card.format}`;
const quarantinedKeys = new Set(qualityGates.quarantined.map((item) => item.key));
const appealCohort = qualityGates.cohorts["appeal-first-v1"];
const appealCohortKeys = new Set(appealCohort.keys);
const appealCohortPreferences = new Set<PreferenceId>(appealCohort.preferences as PreferenceId[]);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const shuffled = <T,>(items: readonly T[]): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
};

const cardText = (card: Golden) =>
  [card.title, card.oneliner, card.target, card.differentiationAxis?.socialContext].filter(Boolean).join(" ");

export function preferenceFitScore(card: Golden, preferenceId: PreferenceId): number {
  const profile = PROFILES[preferenceId];
  const category = categoryOfSeed(card.seed)?.category.id;
  const categoryIndex = category ? profile.categories.indexOf(category) : -1;
  let score = categoryIndex === 0 ? 8 : categoryIndex > 0 ? Math.max(3, 6 - categoryIndex) : 0;
  if (profile.formats.includes(card.format)) score += 3;
  if (profile.keywords?.test(cardText(card))) score += 2;
  if (profile.preferDirect && card.needSource === "direct") score += 2;
  return score;
}

const pairCollisionPenalty = (left: Golden, right: Golden): number => {
  const leftCategory = categoryOfSeed(left.seed)?.category.id;
  const rightCategory = categoryOfSeed(right.seed)?.category.id;
  let penalty = 0;
  if (left.seed === right.seed) penalty += 8;
  if (leftCategory === rightCategory) penalty += 6;
  if (left.format === right.format) penalty += 4;
  if (left.psychologyPrinciple === right.psychologyPrinciple) penalty += 3;
  return penalty;
};

export const pairContrastScore = (left: Golden, right: Golden): number =>
  21 - pairCollisionPenalty(left, right);

const poolFor = (cards: readonly Golden[], preferenceId: PreferenceId, uniform = false) => {
  const scored = cards
    .map((card) => ({ card, score: preferenceFitScore(card, preferenceId) }))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score || cardKey(a.card).localeCompare(cardKey(b.card)));
  const pool = scored.length ? scored : cards.map((card) => ({ card, score: 1 }));
  return uniform ? pool.map(({ card }) => ({ card, score: 5 })) : pool;
};

const weightedPick = (pool: ReturnType<typeof poolFor>) => {
  const fresh = pool.filter(({ card }) => !recentKeys.includes(cardKey(card)));
  const candidates = fresh.length ? fresh : pool;
  const weights = candidates.map(({ score }) => Math.max(1, score - 4) ** 2);
  let cursor = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index].card;
  }
  return candidates.at(-1)!.card;
};

const selectSecond = (cards: readonly Golden[], first: Golden, preferenceId: PreferenceId, uniform = false): Golden => {
  const candidatesByFit = poolFor(cards, preferenceId, uniform).filter(({ card }) => cardKey(card) !== cardKey(first));
  const differentSeeds = candidatesByFit.filter(({ card }) => card.seed !== first.seed);
  const pool = differentSeeds.length ? differentSeeds : candidatesByFit;
  if (!pool.length) return pick(cards.filter((card) => cardKey(card) !== cardKey(first)));
  const candidates = new Map<string, Golden>();
  for (let guard = 0; candidates.size < Math.min(3, pool.length) && guard < 30; guard += 1) {
    const card = weightedPick(pool);
    candidates.set(cardKey(card), card);
  }
  return [...candidates.values()]
    .sort((a, b) => pairCollisionPenalty(first, a) - pairCollisionPenalty(first, b))[0] ?? pick(pool).card;
};

export function selectGoldenPair(
  cards: readonly Golden[],
  preferences: readonly PreferenceId[],
): [SelectedGolden, SelectedGolden] | null {
  const eligibleCards = cards.filter((card) => !quarantinedKeys.has(cardKey(card)));
  if (eligibleCards.length < 2) return null;
  const normalized = normalizePreferences(preferences);
  const selected = normalized.length ? normalized : (["make-now"] as PreferenceId[]);
  // The first three are the primary tastes shown on the draw screen; later choices are secondary signals.
  const primaryPreferences = selected.slice(0, appealCohort.preferences.length);
  const cohortCards = eligibleCards.filter((card) => appealCohortKeys.has(cardKey(card)));
  const cohortCoverage = primaryPreferences.every(
    (preferenceId) =>
      new Set(
        cohortCards.filter((card) => preferenceFitScore(card, preferenceId) >= 5).map((card) => card.seed),
      ).size >= 4,
  );
  const useAppealCohort =
    cohortCards.length === appealCohortKeys.size &&
    primaryPreferences.length === appealCohortPreferences.size &&
    primaryPreferences.every((preferenceId) => appealCohortPreferences.has(preferenceId)) &&
    cohortCoverage;
  const drawCards = useAppealCohort ? cohortCards : eligibleCards;
  const drawPreferences = useAppealCohort ? primaryPreferences : selected;
  const variant: SelectionVariant = useAppealCohort ? "appeal-first-v1" : "fit-contrast-v2";
  const preferenceOrder = shuffled(drawPreferences);
  const firstPreference = preferenceOrder[0];
  const secondPreference = preferenceOrder[1] ?? firstPreference;
  const first = weightedPick(poolFor(drawCards, firstPreference, useAppealCohort));
  const second = selectSecond(drawCards, first, secondPreference, useAppealCohort);

  for (const card of [first, second]) {
    recentKeys.push(cardKey(card));
    if (recentKeys.length > 12) recentKeys.shift();
  }
  return [
    { card: first, preferenceId: firstPreference, variant },
    { card: second, preferenceId: secondPreference, variant },
  ];
}
