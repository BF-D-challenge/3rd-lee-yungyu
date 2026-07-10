// [S1] 축별 카드 풀 + 취향 가중 뽑기 (정적 데모 v6 "앵커 친화도" 모델의 웹 이식).
// draw.ts는 3릴 시절 순수 함수로 남겨두고, 빈-슬롯 모델의 뽑기는 전부 여기서 담당한다.
import {
  allowedPairsFor,
  allowFor,
  combos,
  formatById,
  painById,
  type Axis as ComboAxis,
  type Category,
  type Format,
  type Golden,
  type Pain,
  type Track,
} from "./combos";
import type { Seed } from "./draw";
import { getGoldenSync } from "./golden-store";

export type AxisId = "seed" | "pain" | "format" | "situation" | "psych";

/** 슬롯 칸 하나에 들어가는 값 — 덱 카드와 스토어가 같은 형태를 공유한다 */
export type AxisValue =
  | { axis: "seed"; seed: Seed }
  | { axis: "pain"; pain: Pain }
  | { axis: "format"; format: Format }
  | { axis: "situation"; item: ComboAxis }
  | { axis: "psych"; item: ComboAxis };

export interface Taste {
  track: Track;
  categoryId: string;
}

/* ── 취향 저장 (localStorage `oneul:taste`) ── */
const TASTE_KEY = "oneul:taste";

export function loadTaste(): Taste | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TASTE_KEY);
    const t = raw ? (JSON.parse(raw) as Taste) : null;
    return t && (t.track === "like" || t.track === "know") && t.categoryId ? t : null;
  } catch {
    return null;
  }
}

export function saveTaste(taste: Taste): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TASTE_KEY, JSON.stringify(taste));
  } catch {
    /* 시크릿 모드 등 — 세션 메모리로만 동작 */
  }
}

/* ── 풀 구성 ── */
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const RECENT_SEED_LIMIT = 8;
const RECENT_COMBO_LIMIT = 12;
const recentSeedIds: string[] = [];
const recentComboKeys: string[] = [];

const comboKey = (seedId: string, painId: number, formatId: string): string => `${seedId}|${painId}|${formatId}`;

function rememberSpin(seedId: string, painId: number, formatId: string): void {
  recentSeedIds.push(seedId);
  if (recentSeedIds.length > RECENT_SEED_LIMIT) recentSeedIds.shift();
  recentComboKeys.push(comboKey(seedId, painId, formatId));
  if (recentComboKeys.length > RECENT_COMBO_LIMIT) recentComboKeys.shift();
}

/** 현재 값과 다른 카드 우선 — 대안이 없으면 그대로 반환 */
const pickNot = <T,>(xs: readonly T[], notId: string | number | undefined, id: (x: T) => string | number): T => {
  const rest = notId === undefined ? xs : xs.filter((x) => id(x) !== notId);
  return pick(rest.length ? rest : xs);
};

const isRuntimeSeed = (seedId: string): boolean => !!combos.allow[seedId];

const seedsOf = (track: Track, cat: Category): Seed[] =>
  cat.seeds
    .filter((s) => isRuntimeSeed(s.id))
    .map((s) => ({ id: s.id, label: s.label, track }));

export function allSeeds(): Seed[] {
  return (["like", "know"] as const).flatMap((t) =>
    combos.tracks[t].categories.flatMap((c) => seedsOf(t, c)),
  );
}

export function categoryOfSeed(seedId: string): { track: Track; category: Category } | null {
  for (const t of ["like", "know"] as const) {
    const category = combos.tracks[t].categories.find((c) => c.seeds.some((s) => s.id === seedId));
    if (category) return { track: t, category };
  }
  return null;
}

/** 씨앗 풀 — 취향 설정 후엔 해당 카테고리 seeds에서만 */
export function seedPool(taste: Taste | null): Seed[] {
  if (taste) {
    const cat = combos.tracks[taste.track].categories.find((c) => c.id === taste.categoryId);
    if (cat) {
      const seeds = seedsOf(taste.track, cat);
      if (seeds.length) return seeds;
    }
  }
  return allSeeds();
}

const allPains = (): Pain[] => combos.pains;
const allFormats = (): Format[] => combos.formats;

/**
 * 앵커 allowlist — 슬롯에 씨앗이 있으면 그 씨앗의 allowFor(불변 조건: 러닝에 물류 불편 금지),
 * 없으면 취향 카테고리 seeds의 allowFor 합집합. 둘 다 없으면 null(전체 풀).
 */
function anchorAllow(anchor: Seed | null, taste: Taste | null): { pains: Pain[]; formats: Format[] } | null {
  const seeds = anchor ? [anchor] : taste ? seedPool(taste) : [];
  if (!seeds.length) return null;
  const painIds = new Set<number>();
  const formatIds = new Set<string>();
  seeds.forEach((s) => {
    const a = allowFor(s.id);
    a.pains.forEach((p) => painIds.add(p));
    a.formats.forEach((f) => formatIds.add(f));
  });
  return {
    pains: [...painIds].map(painById).filter((p): p is Pain => !!p),
    formats: [...formatIds].map(formatById).filter((f): f is Format => !!f),
  };
}

/** 취향/앵커 가중치: 80% allowlist 합집합 · 20% 전체 풀(다양성 슬롯) */
const IN_POOL = 0.8;
const weighted = <T,>(inPool: T[], full: T[]): T[] =>
  inPool.length && Math.random() < IN_POOL ? inPool : full;

/* ── 축별 뽑기 (교체·전체뽑기·빈칸 채움 공용) ── */
export const drawSeed = (taste: Taste | null, notId?: string): Seed => {
  const pool = seedPool(taste);
  const notCurrent = notId === undefined ? pool : pool.filter((s) => s.id !== notId);
  const notRecent = notCurrent.filter((s) => !recentSeedIds.includes(s.id));
  return pick(notRecent.length ? notRecent : notCurrent.length ? notCurrent : pool);
};

export const drawPain = (anchor: Seed | null, taste: Taste | null, notId?: number): Pain => {
  const a = anchorAllow(anchor, taste);
  return pickNot(a ? weighted(a.pains, allPains()) : allPains(), notId, (p) => p.id);
};

export const drawFormat = (anchor: Seed | null, taste: Taste | null, notId?: string): Format => {
  const a = anchorAllow(anchor, taste);
  return pickNot(a ? weighted(a.formats, allFormats()) : allFormats(), notId, (f) => f.id);
};

const V7_GOLDEN_CHANCE = 0.6;
const GOLDEN_POOL_WEIGHT = 3;

type SpinPairOptions = {
  lockedPain?: Pain | null;
  lockedFormat?: Format | null;
  notPainId?: number;
  notFormatId?: string;
};

type GoldenPair = { pain: Pain; format: Format; golden: Golden };

const goldenPairsFor = (seedId: string, opts: SpinPairOptions): GoldenPair[] => {
  const pairs = getGoldenSync().flatMap((g): GoldenPair[] => {
    if (g.seed !== seedId) return [];
    if (opts.lockedPain && g.pain !== opts.lockedPain.id) return [];
    if (opts.lockedFormat && g.format !== opts.lockedFormat.id) return [];
    const pain = painById(g.pain);
    const format = formatById(g.format);
    return pain && format ? [{ pain, format, golden: g }] : [];
  });
  const notCurrent = pairs.filter((p) => p.pain.id !== opts.notPainId || p.format.id !== opts.notFormatId);
  const notRecent = notCurrent.filter((p) => !recentComboKeys.includes(comboKey(seedId, p.pain.id, p.format.id)));
  return notRecent.length ? notRecent : notCurrent.length ? notCurrent : pairs;
};

export const drawSpinPair = (
  anchor: Seed,
  taste: Taste | null,
  opts: SpinPairOptions = {},
): { pain: Pain; format: Format } => {
  const goldens = goldenPairsFor(anchor.id, opts);
  const v7s = goldens.filter((p) => p.golden.source === "v7");
  const done = (pain: Pain, format: Format): { pain: Pain; format: Format } => {
    rememberSpin(anchor.id, pain.id, format.id);
    return { pain, format };
  };

  if (v7s.length && Math.random() < V7_GOLDEN_CHANCE) {
    const { pain, format } = pick(v7s);
    return done(pain, format);
  }

  if (goldens.length && Math.random() < GOLDEN_POOL_WEIGHT / (GOLDEN_POOL_WEIGHT + 1)) {
    const { pain, format } = pick(goldens);
    return done(pain, format);
  }

  const allowedPairs = allowedPairsFor(anchor.id)
    .filter((pair) => !opts.lockedPain || pair.pain === opts.lockedPain.id)
    .filter((pair) => !opts.lockedFormat || pair.format === opts.lockedFormat.id);
  const notCurrentPairs = allowedPairs.filter((pair) => pair.pain !== opts.notPainId || pair.format !== opts.notFormatId);
  const notRecentPairs = notCurrentPairs.filter((pair) => !recentComboKeys.includes(comboKey(anchor.id, pair.pain, pair.format)));
  const pair = pick(notRecentPairs.length ? notRecentPairs : notCurrentPairs.length ? notCurrentPairs : allowedPairs);
  const pain = pair ? painById(pair.pain) : undefined;
  const format = pair ? formatById(pair.format) : undefined;
  if (pain && format) return done(pain, format);

  const fallbackPain = opts.lockedPain ?? drawPain(anchor, taste, opts.notPainId);
  const fallbackFormat = opts.lockedFormat ?? drawFormat(anchor, taste, opts.notFormatId);
  return done(fallbackPain, fallbackFormat);
};

/** 장면·마음은 무조건 전체 풀 (6개씩) */
export const drawSituation = (notId?: string): ComboAxis => pickNot(combos.situations, notId, (x) => x.id);
export const drawPsych = (notId?: string): ComboAxis => pickNot(combos.psychs, notId, (x) => x.id);

/** 골든 조합 조회 — 씨앗 카드가 사전검수 조합에 정확히 일치할 때 ✨타이틀 */
export const goldenFor = (seedId: string, painId: number, formatId: string): Golden | undefined =>
  getGoldenSync().find((g) => g.seed === seedId && g.pain === painId && g.format === formatId);

/* ── 부채꼴 덱 구성 — psych(마음)는 v8부터 화면 카드로 노출하지 않는 백엔드 전용 축이라 덱에도 섞지 않는다 ── */
const DECK_MIX: Record<AxisId, number> = { seed: 4, pain: 7, format: 7, situation: 4, psych: 0 };

function sampleDistinct<T>(n: number, drawOne: () => T, id: (x: T) => string | number): T[] {
  const out: T[] = [];
  const seen = new Set<string | number>();
  let guard = 0;
  while (out.length < n && guard++ < n * 8) {
    const x = drawOne();
    if (!seen.has(id(x))) {
      seen.add(id(x));
      out.push(x);
    }
  }
  return out;
}

/** 덱 한 사이클 — 앵커·취향 가중치가 그대로 반영된 22장 셔플 */
export function buildDeck(anchor: Seed | null, taste: Taste | null): AxisValue[] {
  const list: AxisValue[] = [
    ...sampleDistinct(DECK_MIX.seed, () => drawSeed(taste), (s) => s.id).map(
      (seed): AxisValue => ({ axis: "seed", seed }),
    ),
    ...sampleDistinct(DECK_MIX.pain, () => drawPain(anchor, taste), (p) => p.id).map(
      (pain): AxisValue => ({ axis: "pain", pain }),
    ),
    ...sampleDistinct(DECK_MIX.format, () => drawFormat(anchor, taste), (f) => f.id).map(
      (format): AxisValue => ({ axis: "format", format }),
    ),
    ...sampleDistinct(DECK_MIX.situation, () => drawSituation(), (x) => x.id).map(
      (item): AxisValue => ({ axis: "situation", item }),
    ),
    ...sampleDistinct(DECK_MIX.psych, () => drawPsych(), (x) => x.id).map(
      (item): AxisValue => ({ axis: "psych", item }),
    ),
  ];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** 덱 카드 정체성 키 (FanDeck 재구축 판단용) */
export const axisValueKey = (v: AxisValue): string => {
  switch (v.axis) {
    case "seed":
      return `s:${v.seed.id}`;
    case "pain":
      return `p:${v.pain.id}`;
    case "format":
      return `f:${v.format.id}`;
    case "situation":
      return `sc:${v.item.id}`;
    case "psych":
      return `m:${v.item.id}`;
  }
};
