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
}

export interface Axis {
  id: string;
  label: string;
}

export interface CombosData {
  version: number;
  tracks: Record<Track, { label: string; categories: Category[] }>;
  presetSeeds: PresetSeed[];
  pains: Pain[];
  formats: Format[];
  allow: Record<string, { pains: number[]; formats: string[] }>;
  golden: Golden[];
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
