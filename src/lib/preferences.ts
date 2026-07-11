import { categoryOfSeed, type Taste } from "./pools";

export type PreferenceGroupId = "audience" | "platform" | "product-type";

export const PREFERENCE_GROUPS = [
  { id: "audience", label: "누구를 위한 제품인가요?" },
  { id: "platform", label: "어디에서 쓰고 싶나요?" },
  { id: "product-type", label: "어떤 방식이 끌리나요?" },
] as const satisfies readonly { id: PreferenceGroupId; label: string }[];

export const PREFERENCE_OPTIONS = [
  { id: "b2c", label: "개인용", group: "audience", taste: { track: "like", categoryId: "entertainment" } },
  { id: "b2b", label: "업무용", group: "audience", taste: { track: "know", categoryId: "saas" } },
  { id: "web", label: "웹", group: "platform", taste: { track: "know", categoryId: "no-code" } },
  { id: "app", label: "앱", group: "platform", taste: { track: "know", categoryId: "mobile-apps" } },
  { id: "plugin", label: "플러그인", group: "platform", taste: { track: "know", categoryId: "dev" } },
  { id: "ai-agent", label: "AI 에이전트", group: "product-type", taste: { track: "know", categoryId: "ai" } },
  { id: "automation", label: "업무 자동화", group: "product-type", taste: { track: "know", categoryId: "productivity" } },
  { id: "dashboard", label: "대시보드", group: "product-type", taste: { track: "know", categoryId: "analytics" } },
  { id: "analyzer", label: "분석기", group: "product-type", taste: { track: "know", categoryId: "analytics" } },
  { id: "utility", label: "유틸리티", group: "product-type", taste: { track: "know", categoryId: "utilities" } },
] as const satisfies readonly {
  id: string;
  label: string;
  group: PreferenceGroupId;
  taste: Taste;
}[];

export type PreferenceId = (typeof PREFERENCE_OPTIONS)[number]["id"];

export const MIN_PREFERENCES = PREFERENCE_GROUPS.length;
export const MAX_PREFERENCES = 6;

const STORAGE_KEY = "oneul:preferences:v2";
const preferenceIds = new Set<string>(PREFERENCE_OPTIONS.map((option) => option.id));

export const normalizePreferences = (values: readonly string[]): PreferenceId[] =>
  [...new Set(values)]
    .filter((value): value is PreferenceId => preferenceIds.has(value))
    .slice(0, MAX_PREFERENCES);

export const preferenceForId = (id: PreferenceId) =>
  PREFERENCE_OPTIONS.find((option) => option.id === id) ?? PREFERENCE_OPTIONS[0];

export const preferenceGroupForId = (id: PreferenceId): PreferenceGroupId =>
  preferenceForId(id).group;

export const selectedPreferenceGroups = (values: readonly PreferenceId[]): Set<PreferenceGroupId> =>
  new Set(normalizePreferences(values).map(preferenceGroupForId));

export const hasRequiredPreferenceGroups = (values: readonly PreferenceId[]): boolean =>
  PREFERENCE_GROUPS.every((group) => selectedPreferenceGroups(values).has(group.id));

const storageKey = (actorId?: string) => `${STORAGE_KEY}:${actorId ?? "device"}`;

export function loadPreferences(actorId?: string): PreferenceId[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(actorId)) ?? "[]") as unknown;
    return Array.isArray(value)
      ? normalizePreferences(value.filter((item): item is string => typeof item === "string"))
      : [];
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

export function legacyTasteFor(values: readonly PreferenceId[], index = 0): Taste {
  const normalized = normalizePreferences(values);
  const id = normalized[index % Math.max(1, normalized.length)] ?? PREFERENCE_OPTIONS[0].id;
  return preferenceForId(id).taste;
}

const businessCategories = new Set([
  "analytics",
  "commerce",
  "customer-support",
  "dev",
  "legal",
  "marketing",
  "no-code",
  "recruiting-hr",
  "saas",
  "sales",
  "security",
]);

export function preferencesForSeed(seedId: string, preferred?: PreferenceId): PreferenceId[] {
  const category = categoryOfSeed(seedId)?.category.id;
  const audience: PreferenceId = category && businessCategories.has(category) ? "b2b" : "b2c";
  const platform: PreferenceId = category === "mobile-apps" ? "app" : category === "dev" ? "plugin" : "web";
  const productType: PreferenceId =
    category === "ai"
      ? "ai-agent"
      : category === "analytics" || category === "security"
        ? "analyzer"
        : category === "productivity" || category === "sales" || category === "marketing"
          ? "automation"
          : "utility";
  return normalizePreferences([preferred ?? audience, audience, platform, productType]);
}
