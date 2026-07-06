// [S1] 빈-슬롯 모델 스토어 — 필수 4칸(씨앗·불편·형태·장면) + 옵션 마음.
// 개별 채움/교체/제거는 캡 미소모, 🎲 전체 다시 뽑기만 SPIN_CAP을 소모한다.
// 🔒 고정(원본 v7 Prioritize): 잠긴 축은 교체·제거·전체 뽑기에서 면제되고 그대로 유지된다.
import { create } from "zustand";
import type { Axis as ComboAxis, Format, Pain } from "./combos";
import type { Seed } from "./draw";
import {
  drawFormat,
  drawPain,
  drawPsych,
  drawSeed,
  drawSituation,
  goldenFor,
  loadTaste,
  saveTaste,
  type AxisId,
  type AxisValue,
  type Taste,
} from "./pools";
import { track } from "./track";

export const SPIN_CAP = 5;
export const REQUIRED: readonly AxisId[] = ["seed", "pain", "format", "situation"];
/** 전체 다시 뽑기에서 💭마음 옵션 칸이 5번째로 등장할 확률 */
const PSYCH_CHANCE = 0.35;

export interface Slots {
  seed: Seed | null;
  pain: Pain | null;
  format: Format | null;
  situation: ComboAxis | null;
  psych: ComboAxis | null;
}

const EMPTY: Slots = { seed: null, pain: null, format: null, situation: null, psych: null };

export type LockMap = Record<AxisId, boolean>;
const NO_LOCKS: LockMap = { seed: false, pain: false, format: false, situation: false, psych: false };

export const filledRequired = (slots: Slots): AxisId[] => REQUIRED.filter((a) => !!slots[a]);
export const isComplete = (slots: Slots): boolean => filledRequired(slots).length === REQUIRED.length;

const applyValue = (slots: Slots, v: AxisValue): Slots => {
  switch (v.axis) {
    case "seed":
      return { ...slots, seed: v.seed };
    case "pain":
      return { ...slots, pain: v.pain };
    case "format":
      return { ...slots, format: v.format };
    case "situation":
      return { ...slots, situation: v.item };
    case "psych":
      return { ...slots, psych: v.item };
  }
};

interface SlotState {
  slots: Slots;
  /** 🔒 축별 고정 — 잠긴 카드는 교체·제거·🎲 전체 뽑기에서 유지 (원본 v7 Prioritize) */
  locked: LockMap;
  /** 💭 옵션 칸 노출 여부 (5칸 그리드) */
  psychOpen: boolean;
  spins: number;
  capHit: boolean;
  taste: Taste | null;
  /** 설정했거나 "아무거나 볼래요"로 넘김 — 자동 시트 다시 안 띄움 */
  tasteResolved: boolean;
  tasteAsked: boolean;
  tasteSheetOpen: boolean;
  /** localStorage 취향을 스토어로 (마운트 1회) */
  hydrateTaste: () => void;
  /** 덱/빈칸에서 카드 한 장 채우기·교체 (캡 미소모) */
  place: (v: AxisValue) => void;
  /** 채워진 칸 탭 → 그 축만 새 카드 (캡 미소모 · 🔒 잠긴 축은 무시) */
  swap: (axis: AxisId) => void;
  removeAxis: (axis: AxisId) => void;
  /** 🔒 고정 토글 — 잠긴 축은 스핀에서 유지되고 탭 교체·✕가 비활성 */
  toggleLock: (axis: AxisId) => void;
  /** 💭 빈 옵션 칸만 노출 (덱의 마음 카드 비행 목적지 확보) */
  openPsych: () => void;
  /** 🎲 전체 다시 뽑기 — 유일한 캡 소모 경로 */
  spinAll: (opts?: { keepSeed?: boolean }) => void;
  setTaste: (t: Taste) => void;
  skipTaste: () => void;
  openTasteSheet: () => void;
  closeTasteSheet: () => void;
  /** 수신자 프리필(R9) — 씨앗 칸만 채움, 계측 없음 */
  prefillSeed: (seed: Seed) => void;
  reset: () => void;
}

/**
 * 첫 아이디어는 방해 없이 완성되게 두고, 두 번째 전체 뽑기부터
 * 취향 미설정이면 가끔(40%) 시트를 띄운다. 제출/스킵하면 다시 안 묻는다.
 */
const TASTE_ASK_CHANCE = 0.4;
const maybeAskTaste = (s: SlotState): Partial<SlotState> =>
  !s.tasteResolved && s.spins >= 1 && Math.random() < TASTE_ASK_CHANCE
    ? { tasteSheetOpen: true, tasteAsked: true }
    : {};

export const useSlot = create<SlotState>((set, get) => ({
  slots: EMPTY,
  locked: NO_LOCKS,
  psychOpen: false,
  spins: 0,
  capHit: false,
  taste: null,
  tasteResolved: false,
  tasteAsked: false,
  tasteSheetOpen: false,

  hydrateTaste: () => {
    const taste = loadTaste();
    if (taste) set({ taste, tasteResolved: true });
  },

  place: (v) => {
    const s = get();
    if (s.locked[v.axis]) return; // 🔒 잠긴 축은 덱 드롭으로도 안 바뀐다 (원본: 고정 카드는 리롤 면제)
    const slots = applyValue(s.slots, v);
    track("slot_fill", { axis: v.axis });
    set({
      slots,
      ...(v.axis === "psych" ? { psychOpen: true } : {}),
    });
  },

  swap: (axis) => {
    const { slots, taste, locked } = get();
    if (!slots[axis] || locked[axis]) return;
    const anchor = slots.seed;
    const next: Slots = { ...slots };
    if (axis === "seed") next.seed = drawSeed(taste, slots.seed?.id);
    else if (axis === "pain") next.pain = drawPain(anchor, taste, slots.pain?.id);
    else if (axis === "format") next.format = drawFormat(anchor, taste, slots.format?.id);
    else if (axis === "situation") next.situation = drawSituation(slots.situation?.id);
    else next.psych = drawPsych(slots.psych?.id);
    track("slot_swap", { axis });
    set({ slots: next });
  },

  removeAxis: (axis) => {
    const { slots, locked } = get();
    if (locked[axis]) return;
    track("slot_remove", { axis });
    set({
      slots: { ...slots, [axis]: null },
      ...(axis === "psych" ? { psychOpen: false } : {}),
    });
  },

  toggleLock: (axis) => {
    const s = get();
    if (!s.slots[axis]) return; // 빈 칸은 고정할 게 없다
    const next = !s.locked[axis];
    track("reel_lock_toggle", { axis, locked: next });
    set({ locked: { ...s.locked, [axis]: next } });
  },

  openPsych: () => set({ psychOpen: true }),

  spinAll: (opts) => {
    const s = get();
    if (s.spins >= SPIN_CAP) {
      track("spin_cap_hit", { daily_count: s.spins, seed_tag: s.slots.seed?.id ?? null });
      set({ capHit: true }); // → S1b 페이월 (가짜 문①)
      return;
    }
    // 🔒 원본 v7 batchRemix: 잠긴 축은 그대로, 나머지만 새로 — 씨앗이 잠기면 keepSeed와 동일
    // (불편·형태는 유지된 씨앗을 앵커로 뽑힌다). 새로 뽑을 땐 직전 카드를 피한다(원본 pickCard avoid).
    const L = s.locked;
    const keepSeed = (L.seed || opts?.keepSeed) && !!s.slots.seed;
    const seed = keepSeed && s.slots.seed ? s.slots.seed : drawSeed(s.taste, s.slots.seed?.id);
    const pain = L.pain && s.slots.pain ? s.slots.pain : drawPain(seed, s.taste, s.slots.pain?.id);
    const format =
      L.format && s.slots.format ? s.slots.format : drawFormat(seed, s.taste, s.slots.format?.id);
    const situation =
      L.situation && s.slots.situation ? s.slots.situation : drawSituation(s.slots.situation?.id);
    const keepPsych = L.psych && !!s.slots.psych;
    const withPsych = keepPsych || Math.random() < PSYCH_CHANCE;
    const psych = keepPsych ? s.slots.psych : withPsych ? drawPsych(s.slots.psych?.id) : null;
    const slots: Slots = { seed, pain, format, situation, psych };
    track("slot_spin", {
      spin_index: s.spins + 1,
      seed_tag: seed.id,
      pain_reel: pain.id,
      form_reel: format.id,
      is_golden: !!goldenFor(seed.id, pain.id, format.id),
      filled_axes: filledRequired(s.slots).length,
    });
    set({
      slots,
      psychOpen: withPsych,
      spins: s.spins + 1,
      ...maybeAskTaste(s),
    });
  },

  setTaste: (taste) => {
    saveTaste(taste);
    track("taste_submitted", { track: taste.track, category: taste.categoryId });
    set({ taste, tasteResolved: true, tasteSheetOpen: false });
  },

  skipTaste: () => {
    track("taste_skipped", {});
    set({ tasteResolved: true, tasteSheetOpen: false });
  },

  openTasteSheet: () => set({ tasteSheetOpen: true, tasteAsked: true }),
  closeTasteSheet: () => set({ tasteSheetOpen: false }),

  prefillSeed: (seed) => set((s) => ({ slots: { ...s.slots, seed } })),

  reset: () =>
    set({
      slots: EMPTY,
      locked: NO_LOCKS,
      psychOpen: false,
      spins: 0,
      capHit: false,
      tasteSheetOpen: false,
    }),
}));
