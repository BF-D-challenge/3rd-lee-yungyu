// [S1] 슬롯 조합 → 결과 한 문장 + Combo 조립 헬퍼.
// lib/draw.sentence()는 심리 축이 항상 있던 3릴용이라, 마음이 옵션인 빈-슬롯 모델은
// 여기서 조립한다 (fillTemplate·조사 교정은 lib/josa 재사용, 수정 금지 원칙).
import { combos, type Track } from "@/lib/combos";
import type { Combo } from "@/lib/draw";
import { fillTemplate, josa } from "@/lib/josa";
import { goldenFor } from "@/lib/pools";
import type { Slots } from "@/lib/slot-store";

/** 마음(psych) 없이도 자연스러운 축약 템플릿 */
const SHORT_TEMPLATES: Record<Track, string> = {
  like: '{situation}에 — {seed}의 "{painShort}"를 {format}(으)로 푸는 도구',
  know: '{situation}에 — "{painShort}"를 {format}(으)로 끝내는 {seed} 실무 도구',
};

const defaultTarget = (seedLabel: string, track: Track): string =>
  track === "like" ? `${josa(seedLabel, "을/를")} 좋아하는 사람` : `${seedLabel} 실무자`;

/** 필수 4칸이 다 찼을 때만 문장 — 아니면 null */
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

/** 확정 경로용 Combo — toPayload/ConfirmBranch 호환 (페이로드 형식 불변) */
export function assembleCombo(slots: Slots): Combo | null {
  const { seed, pain, format, situation, psych } = slots;
  if (!seed || !pain || !format || !situation) return null;
  const g = goldenFor(seed.id, pain.id, format.id);
  return {
    seed,
    pain,
    format,
    situation: situation.label,
    psych: psych?.label ?? "",
    title: g?.title ?? null,
    oneliner: g?.oneliner ?? null,
    target: g?.target ?? defaultTarget(seed.label, seed.track),
    mvp: g?.mvp ?? null,
    golden: !!g,
  };
}
