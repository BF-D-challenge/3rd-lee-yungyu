import type { Golden } from "./combos";
import qualityGates from "@/data/card-quality-gates.json";
import { categoryOfSeed } from "./pools";
import {
  normalizePreferences,
  preferenceGroupForId,
  type PreferenceGroupId,
  type PreferenceId,
} from "./preferences";

export interface SelectedGolden {
  card: Golden;
  preferenceId: PreferenceId;
  variant: SelectionVariant;
}

export type SelectionVariant = "source-fidelity-v1" | "fit-contrast-v2" | "appeal-first-v1";

const DEFAULT_PREFERENCES: PreferenceId[] = ["b2b", "web", "utility"];
const REQUIRED_GROUPS: PreferenceGroupId[] = ["audience", "platform", "product-type"];
const recentKeys: string[] = [];
const cardKey = (card: Golden) => `${card.seed}|${card.pain}|${card.format}`;
const quarantinedKeys = new Set(qualityGates.quarantined.map((item) => item.key));

const shuffled = <T,>(items: readonly T[]): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
};

export function isSourceFidelityCard(card: Golden): boolean {
  const mechanism = card.mechanism;
  return Boolean(
    card.source === "source-fidelity-v1" &&
      card.sourceRecordId &&
      card.sourceUrl &&
      card.sourceFidelityScore != null &&
      card.sourceFidelityScore > 80 &&
      card.sourceFidelityScore < 100 &&
      card.specificityScore != null &&
      card.specificityScore >= 4 &&
      card.sourcePreserved &&
      card.sourcePreserved.length >= 4 &&
      card.adaptationChange?.trim() &&
      card.audiences?.length &&
      card.platforms?.length &&
      card.productTypes?.length &&
      mechanism?.input.trim() &&
      mechanism.process.trim() &&
      mechanism.output.trim(),
  );
}

const matchesPreference = (card: Golden, preferenceId: PreferenceId): boolean => {
  switch (preferenceId) {
    case "b2b":
    case "b2c":
      return card.audiences?.includes(preferenceId) ?? false;
    case "web":
    case "app":
    case "plugin":
      return card.platforms?.includes(preferenceId) ?? false;
    case "ai-agent":
    case "automation":
    case "dashboard":
    case "analyzer":
    case "utility":
      return card.productTypes?.includes(preferenceId) ?? false;
  }
};

const legacyPreferenceFitScore = (card: Golden, preferenceId: PreferenceId): number => {
  const category = categoryOfSeed(card.seed)?.category.id;
  if (!category) return 0;
  const format = card.format;
  switch (preferenceId) {
    case "b2b":
      return ["analytics", "commerce", "customer-support", "dev", "legal", "marketing", "recruiting-hr", "saas", "sales", "security"].includes(category) ? 6 : 0;
    case "b2c":
      return ["education", "entertainment", "fitness", "food", "games", "mobile-apps", "social-media", "travel"].includes(category) ? 6 : 1;
    case "web":
      return category === "mobile-apps" ? 1 : 4;
    case "app":
      return category === "mobile-apps" ? 7 : 0;
    case "plugin":
      return category === "dev" || format === "chrome-ext" ? 7 : 0;
    case "ai-agent":
      return category === "ai" || format === "chatbot" ? 7 : 0;
    case "automation":
      return ["digest-bot", "template-gen"].includes(format) ? 6 : 0;
    case "dashboard":
      return format === "dashboard" ? 8 : 0;
    case "analyzer":
      return format === "calc-tool" || category === "analytics" ? 7 : 0;
    case "utility":
      return ["calc-tool", "chrome-ext", "curation"].includes(format) ? 6 : 1;
  }
};

export function preferenceFitScore(card: Golden, preferenceId: PreferenceId): number {
  if (!isSourceFidelityCard(card)) return legacyPreferenceFitScore(card, preferenceId);
  return matchesPreference(card, preferenceId) ? 8 : 0;
}

const groupMatchCount = (card: Golden, preferences: readonly PreferenceId[]): number =>
  REQUIRED_GROUPS.reduce((count, group) => {
    const groupPreferences = preferences.filter((id) => preferenceGroupForId(id) === group);
    return count + (groupPreferences.some((id) => matchesPreference(card, id)) ? 1 : 0);
  }, 0);

const combinedFitScore = (card: Golden, preferences: readonly PreferenceId[]): number => {
  const matches = groupMatchCount(card, preferences);
  const fidelity = Math.max(0, (card.sourceFidelityScore ?? 80) - 80) / 5;
  const specificity = Math.max(0, (card.specificityScore ?? 4) - 3);
  return matches * 10 + fidelity + specificity;
};

const overlapCount = <T,>(left: readonly T[] | undefined, right: readonly T[] | undefined): number => {
  if (!left || !right) return 0;
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
};

const pairCollisionPenalty = (left: Golden, right: Golden): number => {
  const leftCategory = categoryOfSeed(left.seed)?.category.id;
  const rightCategory = categoryOfSeed(right.seed)?.category.id;
  let penalty = 0;
  if (left.anchorName === right.anchorName) penalty += 12;
  if (left.seed === right.seed) penalty += 8;
  if (leftCategory === rightCategory) penalty += 4;
  penalty += overlapCount(left.productTypes, right.productTypes) * 3;
  penalty += overlapCount(left.platforms, right.platforms);
  return penalty;
};

export const pairContrastScore = (left: Golden, right: Golden): number =>
  Math.max(0, 30 - pairCollisionPenalty(left, right));

const weightedPick = (
  cards: readonly Golden[],
  score: (card: Golden) => number,
): Golden => {
  const fresh = cards.filter((card) => !recentKeys.includes(cardKey(card)));
  const candidates = fresh.length ? fresh : cards;
  const weights = candidates.map((card) => Math.max(1, score(card)) ** 2);
  let cursor = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }
  return candidates.at(-1)!;
};

const bestPreferenceFor = (card: Golden, preferences: readonly PreferenceId[]): PreferenceId =>
  [...preferences].sort((left, right) => {
    const score = preferenceFitScore(card, right) - preferenceFitScore(card, left);
    if (score !== 0) return score;
    const groupPriority: Record<PreferenceGroupId, number> = {
      audience: 1,
      platform: 2,
      "product-type": 3,
    };
    return groupPriority[preferenceGroupForId(right)] - groupPriority[preferenceGroupForId(left)];
  })[0] ?? DEFAULT_PREFERENCES[0];

const remember = (cards: readonly Golden[]) => {
  for (const card of cards) {
    recentKeys.push(cardKey(card));
    if (recentKeys.length > 12) recentKeys.shift();
  }
};

const selectSourcePair = (
  cards: readonly Golden[],
  preferences: readonly PreferenceId[],
): [SelectedGolden, SelectedGolden] => {
  const fullyMatched = cards.filter((card) => groupMatchCount(card, preferences) === REQUIRED_GROUPS.length);
  const drawPool = fullyMatched.length >= 2 ? fullyMatched : cards;
  const first = weightedPick(drawPool, (card) => combinedFitScore(card, preferences));
  const remaining = drawPool.filter((card) => cardKey(card) !== cardKey(first));
  const secondPool = remaining.length ? remaining : cards.filter((card) => cardKey(card) !== cardKey(first));
  const rankedSecond = shuffled(secondPool)
    .sort(
      (left, right) =>
        combinedFitScore(right, preferences) + pairContrastScore(first, right) -
        (combinedFitScore(left, preferences) + pairContrastScore(first, left)),
    )
    .slice(0, Math.min(5, secondPool.length));
  const second = weightedPick(rankedSecond, (card) => combinedFitScore(card, preferences) + pairContrastScore(first, card));
  remember([first, second]);
  return [
    { card: first, preferenceId: bestPreferenceFor(first, preferences), variant: "source-fidelity-v1" },
    { card: second, preferenceId: bestPreferenceFor(second, preferences), variant: "source-fidelity-v1" },
  ];
};

export function selectGoldenPair(
  cards: readonly Golden[],
  preferences: readonly PreferenceId[],
): [SelectedGolden, SelectedGolden] | null {
  const normalized = normalizePreferences(preferences);
  const selected = normalized.length ? normalized : DEFAULT_PREFERENCES;
  const sourceCards = cards.filter(isSourceFidelityCard);
  if (sourceCards.length >= 2) return selectSourcePair(sourceCards, selected);

  const legacyCards = cards.filter((card) => !quarantinedKeys.has(cardKey(card)));
  if (legacyCards.length < 2) return null;
  const first = weightedPick(legacyCards, (card) =>
    selected.reduce((sum, preference) => sum + preferenceFitScore(card, preference), 0),
  );
  const secondPool = legacyCards.filter((card) => cardKey(card) !== cardKey(first));
  const second = weightedPick(secondPool, (card) => pairContrastScore(first, card));
  remember([first, second]);
  return [
    { card: first, preferenceId: bestPreferenceFor(first, selected), variant: "fit-contrast-v2" },
    { card: second, preferenceId: bestPreferenceFor(second, selected), variant: "fit-contrast-v2" },
  ];
}
