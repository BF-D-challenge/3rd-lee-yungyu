import {
  allowedPairsFor,
  allowFor,
  combos,
  formatById,
  painById,
  type CardAudience,
  type CardMechanism,
  type CardPlatform,
  type CardProductType,
  type Format,
  type FrontStory,
  type Pain,
  type Track,
} from "./combos";
import { getGoldenSync } from "./golden-store";
import { fillTemplate, josa } from "./josa";

export interface Seed {
  id: string;
  label: string;
  track: Track;
  custom?: boolean;
}

export interface Combo {
  seed: Seed;
  pain: Pain;
  format: Format;
  situation: string;
  psych: string;
  title: string | null;
  oneliner: string | null;
  target: string;
  mvp: string[] | null;
  evidence: string | null;
  todayAction: string | null;
  buildPrompt: string | null;
  appName: string | null;
  frontStory: FrontStory | null;
  audiences: CardAudience[] | null;
  platforms: CardPlatform[] | null;
  productTypes: CardProductType[] | null;
  anchorName: string | null;
  sourceUrl: string | null;
  sourceFidelityScore: number | null;
  adaptationChange: string | null;
  mechanism: CardMechanism | null;
  golden: boolean;
}

const recent: string[] = []; // 세션 내 중복 회피 큐 (R13)

const key = (seedId: string, painId: number, formatId: string) => `${seedId}|${painId}|${formatId}`;

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

const remember = (c: Combo): Combo => {
  recent.push(key(c.seed.id, c.pain.id, c.format.id));
  if (recent.length > 30) recent.shift();
  return c;
};

const defaultTarget = (seed: Seed): string =>
  seed.track === "like" ? `${josa(seed.label, "을/를")} 좋아하는 사람` : `${seed.label} 실무자`;

/**
 * 씨앗-conditioned 뽑기 (R12·R14).
 * 불편·형태는 반드시 씨앗 allowlist 안에서만 추출하고, 첫 3스핀은 사전검수 골든 조합을 우선한다.
 * 숨은 축(상황·심리)은 매 스핀 함께 흔들어 뻔함을 깬다 (R13).
 */
export function draw(seed: Seed, spinIndex: number, locked: { pain?: Pain; format?: Format }): Combo {
  const situation = pick(combos.situations).label;
  const psych = pick(combos.psychs).label;

  if (!locked.pain && !locked.format && spinIndex < 3) {
    const goldens = getGoldenSync().filter(
      (g) => g.seed === seed.id && !recent.includes(key(seed.id, g.pain, g.format)),
    );
    const g = goldens[spinIndex % goldens.length];
    if (g) {
      const pain = painById(g.pain);
      const format = formatById(g.format);
      if (pain && format) {
        return remember({
          seed, pain, format, situation, psych,
          title: g.title, oneliner: g.oneliner, target: g.target, mvp: g.mvp,
          evidence: g.evidence ?? null, todayAction: g.todayAction ?? null, buildPrompt: g.buildPrompt ?? null,
          appName: g.appName ?? null, frontStory: g.frontStory ?? null,
          audiences: g.audiences ?? null, platforms: g.platforms ?? null, productTypes: g.productTypes ?? null,
          anchorName: g.anchorName ?? null,
          sourceUrl: g.sourceUrl ?? null, sourceFidelityScore: g.sourceFidelityScore ?? null,
          adaptationChange: g.adaptationChange ?? null, mechanism: g.mechanism ?? null,
          golden: true,
        });
      }
    }
  }

  const pairPool = allowedPairsFor(seed.id)
    .filter((pair) => !locked.pain || pair.pain === locked.pain.id)
    .filter((pair) => !locked.format || pair.format === locked.format.id);
  const freshPairs = pairPool.filter((pair) => !recent.includes(key(seed.id, pair.pain, pair.format)));

  const pair = pick(freshPairs.length ? freshPairs : pairPool);
  let pain = pair ? painById(pair.pain) : undefined;
  let format = pair ? formatById(pair.format) : undefined;

  if (!pain || !format) {
    const pool = allowFor(seed.id);
    const pains = pool.pains.map(painById).filter((p): p is Pain => !!p);
    const formats = pool.formats.map(formatById).filter((f): f is Format => !!f);
    const total = (locked.pain ? 1 : pains.length) * (locked.format ? 1 : formats.length);

    pain = locked.pain ?? pick(pains);
    format = locked.format ?? pick(formats);
    let guard = 0;
    while (recent.includes(key(seed.id, pain.id, format.id)) && guard++ < total) {
      pain = locked.pain ?? pick(pains);
      format = locked.format ?? pick(formats);
    }
  }

  if (!pain || !format) {
    throw new Error(`No drawable pain/format pair for seed "${seed.id}"`);
  }

  const g = getGoldenSync().find((x) => x.seed === seed.id && x.pain === pain.id && x.format === format.id);
  return remember({
    seed, pain, format, situation, psych,
    title: g?.title ?? null,
    oneliner: g?.oneliner ?? null,
    target: g?.target ?? defaultTarget(seed),
    mvp: g?.mvp ?? null,
    evidence: g?.evidence ?? null,
    todayAction: g?.todayAction ?? null,
    buildPrompt: g?.buildPrompt ?? null,
    appName: g?.appName ?? null,
    frontStory: g?.frontStory ?? null,
    audiences: g?.audiences ?? null,
    platforms: g?.platforms ?? null,
    productTypes: g?.productTypes ?? null,
    anchorName: g?.anchorName ?? null,
    sourceUrl: g?.sourceUrl ?? null,
    sourceFidelityScore: g?.sourceFidelityScore ?? null,
    adaptationChange: g?.adaptationChange ?? null,
    mechanism: g?.mechanism ?? null,
    golden: !!g,
  });
}

/** 결과 한 문장 — 트랙별 템플릿 + 조사 자동교정 */
export function sentence(c: Combo): string {
  return fillTemplate(combos.sentenceTemplates[c.seed.track], {
    situation: c.situation,
    psych: c.psych,
    target: c.target,
    seed: c.seed.label,
    painShort: c.pain.short,
    format: c.format.short,
  });
}
