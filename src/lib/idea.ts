import { combos, formatById, painById, type Golden, type Track } from "./combos";
import { pairContrastScore, preferenceFitScore, selectGoldenPair, type SelectionVariant } from "./card-selection";
import type { Combo } from "./draw";
import { getGoldenSync } from "./golden-store";
import { fillTemplate, josa } from "./josa";
import { legacyTasteFor, normalizePreferences, type PreferenceId } from "./preferences";
import { allSeeds, goldenFor } from "./pools";
import { buildSpinAllSlots, type LockMap, type Slots } from "./slot-store";

const SHORT_TEMPLATES: Record<Track, string> = {
  like: '{situation}에 — {seed}의 "{painShort}"를 {format}(으)로 푸는 도구',
  know: '{situation}에 — "{painShort}"를 {format}(으)로 끝내는 {seed} 실무 도구',
};

const defaultTarget = (seedLabel: string, track: Track): string =>
  track === "like" ? `${josa(seedLabel, "을/를")} 좋아하는 사람` : `${seedLabel} 실무자`;

export function assembleLine(slots: Slots): string | null {
  const { seed, pain, format, situation, psych } = slots;
  if (!seed || !pain || !format || !situation) return null;
  const template = psych ? combos.sentenceTemplates[seed.track] : SHORT_TEMPLATES[seed.track];
  return fillTemplate(template, {
    situation: situation.label,
    psych: psych?.label ?? "",
    target: defaultTarget(seed.label, seed.track),
    seed: seed.label,
    painShort: pain.short,
    format: format.short,
  });
}

export function assembleCombo(slots: Slots): Combo | null {
  const { seed, pain, format, situation, psych } = slots;
  if (!seed || !pain || !format || !situation) return null;
  const golden = goldenFor(seed.id, pain.id, format.id);
  return {
    seed,
    pain,
    format,
    situation: situation.label,
    psych: psych?.label ?? "",
    title: golden?.title ?? null,
    oneliner: golden?.oneliner ?? null,
    target: golden?.target ?? defaultTarget(seed.label, seed.track),
    mvp: golden?.mvp ?? null,
    evidence: golden?.evidence ?? null,
    todayAction: golden?.todayAction ?? null,
    buildPrompt: golden?.buildPrompt ?? null,
    appName: golden?.appName ?? null,
    frontStory: golden?.frontStory ?? null,
    golden: !!golden,
  };
}

export interface IdeaCandidate {
  combo: Combo;
  preferenceId: PreferenceId;
  selection: {
    variant: SelectionVariant | "legacy";
    preferenceFitScore: number | null;
    pairContrastScore: number | null;
  };
}

export const selectionEventParams = (candidates: readonly IdeaCandidate[]) => {
  const [first, second] = candidates;
  const key = (candidate: IdeaCandidate) =>
    `${candidate.combo.seed.id}|${candidate.combo.pain.id}|${candidate.combo.format.id}`;
  return {
    selection_variant: first?.selection.variant,
    candidate_a_key: first ? key(first) : null,
    candidate_b_key: second ? key(second) : null,
    candidate_a_preference_id: first?.preferenceId,
    candidate_b_preference_id: second?.preferenceId,
    candidate_a_fit_score: first?.selection.preferenceFitScore,
    candidate_b_fit_score: second?.selection.preferenceFitScore,
    pair_contrast_score: first?.selection.pairContrastScore,
  };
};

const EMPTY_SLOTS: Slots = { seed: null, pain: null, format: null, situation: null, psych: null };
const NO_LOCKS: LockMap = { seed: false, pain: false, format: false, situation: false, psych: false };

const candidateKey = (candidate: IdeaCandidate) =>
  `${candidate.combo.seed.id}|${candidate.combo.pain.id}|${candidate.combo.format.id}`;

const comboFromGolden = (card: Golden): Combo | null => {
  const seed = allSeeds().find((item) => item.id === card.seed);
  const pain = painById(card.pain);
  const format = formatById(card.format);
  if (!seed || !pain || !format) return null;
  return {
    seed,
    pain,
    format,
    situation: card.frontStory?.timeline[0]?.t ?? "오늘",
    psych: card.psychologyPrinciple ?? "",
    title: card.title,
    oneliner: card.oneliner,
    target: card.target,
    mvp: card.mvp,
    evidence: card.evidence ?? null,
    todayAction: card.todayAction ?? null,
    buildPrompt: card.buildPrompt ?? null,
    appName: card.appName ?? null,
    frontStory: card.frontStory ?? null,
    golden: true,
  };
};

const drawCandidate = (preferences: readonly PreferenceId[], index: number): IdeaCandidate => {
  const normalized = normalizePreferences(preferences);
  const preferenceId = normalized[index % normalized.length] ?? "make-now";
  const taste = legacyTasteFor(normalized, index);
  const slots = buildSpinAllSlots({ slots: EMPTY_SLOTS, locked: NO_LOCKS, taste });
  const combo = assembleCombo(slots);
  if (!combo) throw new Error("Failed to assemble idea candidate");
  return {
    combo,
    preferenceId,
    selection: { variant: "legacy", preferenceFitScore: null, pairContrastScore: null },
  };
};

export function drawIdeaCandidates(preferences: readonly PreferenceId[]): [IdeaCandidate, IdeaCandidate] {
  const selected = selectGoldenPair(getGoldenSync(), normalizePreferences(preferences));
  if (selected) {
    const firstCombo = comboFromGolden(selected[0].card);
    const secondCombo = comboFromGolden(selected[1].card);
    if (firstCombo && secondCombo) {
      const contrast = Number(pairContrastScore(selected[0].card, selected[1].card).toFixed(2));
      return [
        {
          combo: firstCombo,
          preferenceId: selected[0].preferenceId,
          selection: {
            variant: selected[0].variant,
            preferenceFitScore: preferenceFitScore(selected[0].card, selected[0].preferenceId),
            pairContrastScore: contrast,
          },
        },
        {
          combo: secondCombo,
          preferenceId: selected[1].preferenceId,
          selection: {
            variant: selected[1].variant,
            preferenceFitScore: preferenceFitScore(selected[1].card, selected[1].preferenceId),
            pairContrastScore: contrast,
          },
        },
      ];
    }
  }

  const first = drawCandidate(preferences, 0);
  let second = drawCandidate(preferences, 1);
  for (let retry = 2; retry < 6 && candidateKey(first) === candidateKey(second); retry += 1) {
    second = drawCandidate(preferences, retry);
  }
  return [first, second];
}
