import { categoryOfSeed, type Taste } from "./pools";

export const PREFERENCE_OPTIONS = [
  { id: "make-now", label: "바로 만들기", taste: { track: "know", categoryId: "no-code" } },
  { id: "share-reaction", label: "공유 반응", taste: { track: "like", categoryId: "social-media" } },
  { id: "paid", label: "돈 받을 수 있음", taste: { track: "know", categoryId: "commerce" } },
  { id: "community", label: "커뮤니티", taste: { track: "like", categoryId: "community" } },
  { id: "ai-tools", label: "AI 도구", taste: { track: "know", categoryId: "ai" } },
  { id: "one-day", label: "하루 MVP", taste: { track: "know", categoryId: "mobile-apps" } },
  { id: "friend-vote", label: "친구 투표", taste: { track: "like", categoryId: "games" } },
  { id: "content", label: "콘텐츠", taste: { track: "like", categoryId: "content" } },
  { id: "light-fun", label: "가벼운 재미", taste: { track: "like", categoryId: "entertainment" } },
  { id: "b2b", label: "B2B", taste: { track: "know", categoryId: "saas" } },
  { id: "local", label: "로컬", taste: { track: "know", categoryId: "marketplace" } },
  { id: "education", label: "교육", taste: { track: "know", categoryId: "education" } },
] as const satisfies readonly { id: string; label: string; taste: Taste }[];

export type PreferenceId = (typeof PREFERENCE_OPTIONS)[number]["id"];

export const MIN_PREFERENCES = 3;
export const MAX_PREFERENCES = 8;

const STORAGE_KEY = "oneul:preferences:v1";
const preferenceIds = new Set<string>(PREFERENCE_OPTIONS.map((option) => option.id));

export const normalizePreferences = (values: readonly string[]): PreferenceId[] =>
  [...new Set(values)]
    .filter((value): value is PreferenceId => preferenceIds.has(value))
    .slice(0, MAX_PREFERENCES);

const storageKey = (actorId?: string) => `${STORAGE_KEY}:${actorId ?? "device"}`;

export function loadPreferences(actorId?: string): PreferenceId[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(actorId)) ?? "[]") as unknown;
    return Array.isArray(value) ? normalizePreferences(value.filter((item): item is string => typeof item === "string")) : [];
  } catch {
    return [];
  }
}

export function savePreferences(values: readonly PreferenceId[], actorId?: string): PreferenceId[] {
  const normalized = normalizePreferences(values);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(storageKey(actorId), JSON.stringify(normalized));
    } catch {
      // Storage failure keeps the current in-memory selection usable.
    }
  }
  return normalized;
}

export const preferenceForId = (id: PreferenceId) =>
  PREFERENCE_OPTIONS.find((option) => option.id === id) ?? PREFERENCE_OPTIONS[0];

export function legacyTasteFor(values: readonly PreferenceId[], index = 0): Taste {
  const normalized = normalizePreferences(values);
  const id = normalized[index % Math.max(1, normalized.length)] ?? PREFERENCE_OPTIONS[0].id;
  return preferenceForId(id).taste;
}

const relatedPreferences: Record<string, readonly PreferenceId[]> = {
  "no-code": ["make-now", "one-day", "ai-tools"],
  dev: ["make-now", "one-day", "ai-tools"],
  "mobile-apps": ["one-day", "make-now", "ai-tools"],
  productivity: ["make-now", "one-day", "b2b"],
  "design-tools": ["make-now", "one-day", "content"],
  "social-media": ["share-reaction", "community", "friend-vote"],
  community: ["community", "share-reaction", "friend-vote"],
  commerce: ["paid", "b2b", "make-now"],
  sales: ["paid", "b2b", "local"],
  saas: ["b2b", "paid", "make-now"],
  marketing: ["b2b", "paid", "content"],
  legal: ["b2b", "paid", "make-now"],
  "recruiting-hr": ["b2b", "paid", "education"],
  games: ["friend-vote", "light-fun", "share-reaction"],
  entertainment: ["light-fun", "friend-vote", "share-reaction"],
  travel: ["light-fun", "friend-vote", "local"],
  food: ["local", "light-fun", "friend-vote"],
  content: ["content", "share-reaction", "make-now"],
  education: ["education", "ai-tools", "one-day"],
  ai: ["ai-tools", "education", "one-day"],
  fitness: ["education", "one-day", "light-fun"],
  marketplace: ["local", "paid", "make-now"],
};

export function preferencesForSeed(seedId: string, preferred?: PreferenceId): PreferenceId[] {
  const category = categoryOfSeed(seedId);
  const matching = category
    ? PREFERENCE_OPTIONS.find(
        (option) => option.taste.track === category.track && option.taste.categoryId === category.category.id,
      )?.id
    : undefined;
  const related = category ? relatedPreferences[category.category.id] : undefined;
  return normalizePreferences([preferred ?? matching ?? "make-now", ...(related ?? ["make-now", "one-day", "share-reaction"])]);
}
