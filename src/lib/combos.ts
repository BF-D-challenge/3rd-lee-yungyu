import raw from "@/data/combos.json";

export type Track = "like" | "know";

export interface SeedDef {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  seeds: SeedDef[];
}

export interface Pain {
  id: number;
  label: string;
  short: string;
}

export interface Format {
  id: string;
  label: string;
  short: string;
  desc: string;
  buildDays: string;
  action: string;
}

export interface PresetSeed {
  id: string;
  label: string;
  track: Track;
  pains: number[];
  formats: string[];
}

export interface ComboPair {
  pain: number;
  format: string;
}

export interface AllowEntry {
  pains: number[];
  formats: string[];
  /** Optional explicit allowlist. When present, use these pairs instead of the full pains x formats product. */
  pairs?: ComboPair[];
}

/** flip 카드 앞면 = 이 카드를 쓸 사람의 고통 아크 (설명 + 3스텝 타임라인) */
export interface FrontStoryStep {
  t: string;
  act: string;
  emo: string;
  pain: boolean;
}
export interface FrontStory {
  persona: string;
  timeline: FrontStoryStep[];
}

export interface Golden {
  seed: string;
  pain: number;
  format: string;
  title: string;
  oneliner: string;
  target: string;
  mvp: string[];
  /** 실수요 근거(매출 또는 사용량·순위) — 카드 표면엔 안 나가고 리포트/디버그용 */
  evidenceType?: "revenue" | "usage";
  anchorName?: string;
  anchorDetail?: string;
  /** v7 카드 필드 — 실제 카드 표면에 렌더 (근거 한 줄·오늘 할 것·빌드 프롬프트) */
  evidence?: string;
  todayAction?: string;
  buildPrompt?: string;
  /** 스토어 SEO 제목 = "{appName} — {부제}"에서 브랜드 이름만 */
  appName?: string;
  /** flip 카드 앞면 고통 아크 */
  frontStory?: FrontStory;
  source?: string;
  needSource?: "direct" | "external" | "adjacent" | "inferred";
  psychologyPrinciple?: string;
  whyItMatters?: string;
  differentiationAxis?: {
    psychology?: string;
    socialContext?: string;
    outputShape?: string;
    emotionalResolution?: string;
    anchorMechanism?: string;
  };
}

export interface Axis {
  id: string;
  label: string;
}

/**
 * golden(v7 카드 콘텐츠)은 이 파일에 없다 — src/data/combos.json에서 분리해
 * public/data/golden.json으로 옮겼다(런타임 fetch, @/lib/golden-store 참고).
 * 이 파일은 계속 정적 import되므로 가벼운 축(tracks/pains/formats/allow 등)만 남겨
 * "use client" 번들에 골든 카드 수천 건이 딸려가지 않게 한다.
 */
export interface CombosData {
  version: number;
  tracks: Record<Track, { label: string; categories: Category[] }>;
  presetSeeds: PresetSeed[];
  pains: Pain[];
  formats: Format[];
  allow: Record<string, AllowEntry>;
  situations: Axis[];
  psychs: Axis[];
  sentenceTemplates: Record<Track, string>;
}

export const combos = raw as unknown as CombosData;

export const painById = (id: number): Pain | undefined =>
  combos.pains.find((p) => p.id === id);

export const formatById = (id: string): Format | undefined =>
  combos.formats.find((f) => f.id === id);

/** 자유입력 등 allowlist 밖 씨앗의 폴백 풀 — 도메인 무관하게 성립하는 범용 불편·형태만 */
export const GENERIC_POOL = {
  pains: [1, 4, 14, 16],
  formats: ["share-link", "vote-card", "curation", "landing-waitlist"],
};

export function allowFor(seedId: string): { pains: number[]; formats: string[] } {
  return combos.allow[seedId] ?? combos.presetSeeds.find((s) => s.id === seedId) ?? GENERIC_POOL;
}

export function allowedPairsFor(seedId: string): ComboPair[] {
  const allow = combos.allow[seedId] ?? combos.presetSeeds.find((s) => s.id === seedId) ?? GENERIC_POOL;
  if ("pairs" in allow && Array.isArray(allow.pairs) && allow.pairs.length) {
    return allow.pairs;
  }
  return allow.pains.flatMap((pain) => allow.formats.map((format) => ({ pain, format })));
}
