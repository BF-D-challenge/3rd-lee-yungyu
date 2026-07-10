"use client";

/**
 * [S1] 빈-슬롯 오케스트레이터 — 카드 4장(🌱씨앗·😖불편·📦형태·🎬장면)만 화면에 노출한다.
 * 마음(psych) 축은 v8부터 카드로 뽑지 않는 백엔드 전용 축 — 문장 템플릿에서만 조용히 쓰인다.
 * 진입 시 전부 빈 칸, 하단 부채꼴 덱에서 한 장씩 채운다 (정적 데모 v7 모델).
 * 채워진 카드 탭 = 그 축만 교체 · ✕ = 비움 · 하단 단일 버튼은 상태에 따라 전체 뽑기/전체 다시 뽑기.
 *
 * 원본 curAxis 게이트: 필수 4칸 중 빈 칸이 있는 동안 "다음 빈 필수 축"이 조준 축 —
 * 그 칸이 펄스하고, 덱의 모든 카드가 그 칸으로만 향한다(축 불일치 카드는 조준 축 풀에서
 * 새로 뽑아 안착 = 원본 pickCard(ai)). 4칸 완성 시 게이트 해제 → 카드 고유 축 믹스.
 * ✨ 한 번에 뽑기와 🎲 전체 다시 뽑기는 같은 버튼 — 미완성/완성 상태에 따라 라벨만 바뀐다.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/atoms/button";
import { PageShell } from "@/components/layouts/page-shell";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import {
  buildDeck,
  drawFormat,
  drawPain,
  drawPsych,
  drawSeed,
  drawSituation,
  goldenFor,
  type AxisId,
  type AxisValue,
} from "@/lib/pools";
import { buildSpinAllSlots, filledRequired, REQUIRED, SPIN_CAP, useSlot, type Slots } from "@/lib/slot-store";
import { shareOrCopy, shareUrl, toPayload } from "@/lib/share";
import { fakeDoor, track, trackShare } from "@/lib/track";
import { cn } from "@/lib/utils";
import { assembleCombo, assembleLine } from "./assemble";
import { CARD_SURFACE_CSS } from "./card-surface";
import { ConfirmBranch } from "./confirm-branch";
import { FanDeck, type FanDeckHandle } from "./fan-deck";
import { IntroOverlay } from "./intro-overlay";
import { PaywallSheet } from "./paywall-sheet";
import { SlotCell, type CellContent } from "./slot-cell";
import { TasteSheet } from "./taste-sheet";

/** v8: 화면 카드는 필수 4장만(씨앗·불편·형태·장면) — psych(마음)는 백엔드 전용 축으로 숨김 */
const AXES: { id: AxisId; label: string; emoji: string }[] = [
  { id: "seed", label: "씨앗", emoji: "🌱" },
  { id: "pain", label: "불편", emoji: "😖" },
  { id: "format", label: "형태", emoji: "📦" },
  { id: "situation", label: "장면", emoji: "🎬" },
];

/** 원본 finalize: 마지막 필수 카드 플립이 끝난 뒤 결과가 뜨기까지 1150ms */
const FINALIZE_DELAY_MS = 1150;
/** 전체 재뽑기 스태거(축별 130ms)를 끝까지 기다린 뒤 최종 카드만 다시 연다. */
const REROLL_REOPEN_DELAY_MS = 700;
/** 덱에서 슬롯으로 순차 이동하는 자동 뽑기 간격 — 원본 autoAll 리듬. */
const AUTO_DRAW_STEP_MS = 430;
const AUTO_DRAW_RETRY_MS = 120;
const AUTO_DRAW_MAX_RETRIES = 40;

/** 다음 빈 필수 축 = 조준 축 (원본 curAxis — 없으면 null = 게이트 해제) */
const nextEmptyRequired = (slots: ReturnType<typeof useSlot.getState>["slots"]): AxisId | null =>
  REQUIRED.find((a) => !slots[a]) ?? null;

export interface SlotMachineProps {
  initialIntroActive?: boolean;
}

export function SlotMachine({ initialIntroActive = true }: SlotMachineProps) {
  const {
    slots, locked, capHit, taste, tasteSheetOpen, viaVote, spins,
    swap, removeAxis, toggleLock,
    setTaste, skipTaste, openTasteSheet,
  } = useSlot();

  const [hotAxis, setHotAxis] = useState<AxisId | null>(null);
  const [branchOpen, setBranchOpen] = useState(false);
  /** 인트로 연속샷 오버레이 — 매 방문 재생(D8, 세션 게이트 없음) */
  const [introActive, setIntroActive] = useState(initialIntroActive);
  /** 가짜 문 시트 — 실행 패스(day_pass)만. 플랜 990은 폐지(가치개선 계획 §3.4 — 실행 브리프 무료화) */
  const [fakeDoorOpen, setFakeDoorOpen] = useState(false);

  /** 완성이 카드 한 장 안착에서 왔는지(→ 원본 finalize 1150ms 지연) / 🎲 배치에서 왔는지 */
  const fillOrigin = useRef<"single" | "batch">("batch");
  /** 완성된 같은 조합을 닫은 뒤 즉시 다시 열지 않기 위한 1회성 가드 */
  const openedComboKeyRef = useRef<string | null>(null);
  const autoOpenPausedRef = useRef(false);
  const rerollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deckRef = useRef<FanDeckHandle>(null);
  const drawAllBusyRef = useRef(false);
  const forcedPickAxisRef = useRef<AxisId | null>(null);
  const plannedSlotsRef = useRef<Slots | null>(null);
  const [autoOpenTick, setAutoOpenTick] = useState(0);
  const [drawAllBusy, setDrawAllBusy] = useState(false);

  const seedRef = useRef<HTMLDivElement>(null);
  const painRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const situationRef = useRef<HTMLDivElement>(null);
  const psychRef = useRef<HTMLDivElement>(null);
  const cellRefs: Record<AxisId, RefObject<HTMLDivElement>> = {
    seed: seedRef, pain: painRef, format: formatRef, situation: situationRef, psych: psychRef,
  };

  /** 덱 = 5축 혼합 — 취향·씨앗 앵커가 바뀔 때만 재구축 (buildDeck 내부는 80/20 가중) */
  const seedId = slots.seed?.id ?? null;
  const deckCards = useMemo(
    () => buildDeck(slots.seed, taste),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seedId, taste],
  );
  const deckInteractionDisabled = introActive || capHit || tasteSheetOpen || fakeDoorOpen;

  useEffect(() => {
    if (deckInteractionDisabled) setHotAxis(null);
  }, [deckInteractionDisabled]);

  const cellContent = (axis: AxisId): CellContent | null => {
    if (axis === "seed" && slots.seed)
      return {
        emoji: "🌱",
        title: slots.seed.label,
        sub: slots.seed.track === "like" ? "내가 좋아하는 것" : "내가 잘 아는 것",
      };
    if (axis === "pain" && slots.pain) return { emoji: "😖", title: slots.pain.short, sub: slots.pain.label };
    if (axis === "format" && slots.format)
      return { emoji: "📦", title: slots.format.short, sub: slots.format.label };
    if (axis === "situation" && slots.situation) return { emoji: "🎬", title: slots.situation.label };
    if (axis === "psych" && slots.psych) return { emoji: "💭", title: slots.psych.label };
    return null;
  };
  const cellKey = (axis: AxisId): string => {
    const v = slots[axis];
    return v ? `${axis}:${typeof v === "object" && "id" in v ? v.id : ""}` : `${axis}:-`;
  };

  /** 축 하나를 풀에서 새로 뽑아 채움 — 원본 fillSlot(ai, pickCard(ai)) 등가 (앵커·취향 가중 유지, 캡 미소모) */
  const fillAxisFresh = (axis: AxisId) => {
    fillOrigin.current = "single";
    const s = useSlot.getState();
    const anchor = s.slots.seed;
    const v: AxisValue =
      axis === "seed" ? { axis, seed: drawSeed(s.taste) }
      : axis === "pain" ? { axis, pain: drawPain(anchor, s.taste) }
      : axis === "format" ? { axis, format: drawFormat(anchor, s.taste) }
      : axis === "situation" ? { axis, item: drawSituation() }
      : { axis, item: drawPsych() };
    s.place(v);
  };

  /** 덱 안착 라우팅 — 원본 curAxis 게이트: 빈 필수 칸이 남아 있으면 무조건 그 칸부터.
   *  카드 축이 조준 축과 다르면 조준 축 풀에서 새로 뽑아 채운다 (원본 pickCard(ai)와 동일). */
  const onDeckPick = (card: AxisValue) => {
    if (deckInteractionDisabled) return;
    fillOrigin.current = "single";
    const forcedAxis = forcedPickAxisRef.current;
    if (forcedAxis) {
      const planned = plannedSlotsRef.current;
      if (planned) {
        useSlot.setState((cur) => ({ slots: { ...cur.slots, [forcedAxis]: planned[forcedAxis] } as Slots }));
      } else {
        fillAxisFresh(forcedAxis);
      }
      return;
    }
    const s = useSlot.getState();
    const cur = nextEmptyRequired(s.slots);
    if (cur && card.axis !== cur) {
      fillAxisFresh(cur);
      return;
    }
    s.place(card);
  };

  const line = assembleLine(slots);
  const combo = useMemo(() => assembleCombo(slots), [slots]);
  /** 조준 축 = 다음 빈 필수 칸 (원본 curAxis). null이면 필수 완성 */
  const aimAxis = nextEmptyRequired(slots);
  /** 매출 근거가 있는(v7 등) 사전검수 콤보와 정확히 일치하면 4장 전체를 황금 카드로 표시 */
  const isGolden = combo?.golden ?? false;
  const comboKey = combo
    ? [combo.seed.id, combo.pain.id, combo.format.id, combo.situation, combo.psych, combo.golden ? "gold" : "plain"].join("|")
    : null;

  /** 원본 finalize: 카드 안착으로 필수 4칸이 완성되면 1150ms 뒤 결과 등장 (🎲 배치는 즉시) */
  const hasCombo = !!combo;
  const spinCapReached = spins >= SPIN_CAP;
  const drawButtonLabel = spinCapReached ? "🔒 오늘 스핀 다 썼어요" : combo ? "🎲 전체 다시 뽑기" : "✨ 한 번에 뽑기";
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!hasCombo) {
      setRevealed(false);
      return;
    }
    if (fillOrigin.current !== "single" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), FINALIZE_DELAY_MS);
    return () => clearTimeout(t);
  }, [hasCombo]);

  useEffect(() => {
    if (autoOpenPausedRef.current) return;
    if (!combo || !comboKey) {
      setBranchOpen(false);
      openedComboKeyRef.current = null;
      return;
    }
    if (!revealed || openedComboKeyRef.current === comboKey) return;
    openedComboKeyRef.current = comboKey;
    track("idea_confirmed", {
      seed_tag: combo.seed.id,
      combo: `${combo.pain.id}|${combo.format.id}`,
      is_golden: combo.golden,
      has_psych: !!slots.psych,
    });
    if (viaVote) useSlot.setState({ viaVote: false });
    setBranchOpen(true);
  }, [autoOpenTick, combo, comboKey, revealed, slots.psych, viaVote]);

  useEffect(() => {
    return () => {
      if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
    };
  }, []);

  const onShareBoost = useCallback(async () => {
    const url = combo ? shareUrl(toPayload(combo)) : `${location.origin}/`;
    const result = await shareOrCopy(url, {
      title: combo?.appName ?? combo?.title ?? "오늘 해볼까",
      text: combo
        ? "오늘 해볼까에서 뽑은 아이디어야. 뭐가 나아?"
        : "오늘 해볼까에서 아이디어를 뽑아볼래?",
    });
    if (!result.ok) return;
    trackShare("paywall_share_boost", result.method, {
      paywall: "spin_cap",
      seed_tag: combo?.seed.id ?? seedId,
      has_combo: !!combo,
    });
    useSlot.setState({ spins: 2, capHit: false });
  }, [combo, seedId]);

  const applyPlannedAxis = (axis: AxisId, planned: Slots) => {
    useSlot.setState((cur) => ({ slots: { ...cur.slots, [axis]: planned[axis] } as Slots }));
  };

  const animateDeckToAxes = (axes: AxisId[], planned: Slots, onDone?: () => void) => {
    const targets = axes.filter((axis) => !useSlot.getState().locked[axis]);
    if (!targets.length) {
      onDone?.();
      return;
    }

    drawAllBusyRef.current = true;
    plannedSlotsRef.current = planned;
    setDrawAllBusy(true);
    deckRef.current?.hold(true);

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let retries = 0;

    const finish = () => {
      deckRef.current?.hold(false);
      forcedPickAxisRef.current = null;
      plannedSlotsRef.current = null;
      drawAllBusyRef.current = false;
      setDrawAllBusy(false);
      onDone?.();
    };

    const step = () => {
      const axis = targets[index];
      if (!axis) {
        finish();
        return;
      }

      const deck = deckRef.current;
      if (!deck || useSlot.getState().locked[axis]) {
        index += 1;
        retries = 0;
        setTimeout(step, reducedMotion ? 0 : AUTO_DRAW_STEP_MS);
        return;
      }

      forcedPickAxisRef.current = axis;
      const accepted = deck.drawTo(axis, () => {
        forcedPickAxisRef.current = null;
        index += 1;
        retries = 0;
        setTimeout(step, reducedMotion ? 0 : AUTO_DRAW_STEP_MS);
      });

      if (accepted) return;

      forcedPickAxisRef.current = null;
      retries += 1;
      if (retries > AUTO_DRAW_MAX_RETRIES) {
        applyPlannedAxis(axis, planned);
        index += 1;
        retries = 0;
        setTimeout(step, reducedMotion ? 0 : AUTO_DRAW_STEP_MS);
        return;
      }
      setTimeout(step, AUTO_DRAW_RETRY_MS);
    };

    step();
  };

  const drawAllFromButton = () => {
    if (drawAllBusyRef.current) return;

    const s = useSlot.getState();
    const planned = buildSpinAllSlots(s);
    const { seed, pain, format } = planned;
    if (!seed || !pain || !format) return;

    const axes = REQUIRED.filter((axis) => !s.locked[axis]);
    if (!axes.length) return;

    const consumed = s.consumeSpin({
      seed_tag: seed.id,
      pain_reel: pain.id,
      form_reel: format.id,
      is_golden: !!goldenFor(seed.id, pain.id, format.id),
      filled_axes: filledRequired(s.slots).length,
    }, { askTaste: false });
    if (!consumed) return;

    if (combo) {
      autoOpenPausedRef.current = true;
      setBranchOpen(false);
      fillOrigin.current = "single";
      if (rerollTimerRef.current) clearTimeout(rerollTimerRef.current);
      animateDeckToAxes(axes, planned, () => {
        rerollTimerRef.current = setTimeout(() => {
          autoOpenPausedRef.current = false;
          setAutoOpenTick((tick) => tick + 1);
        }, REROLL_REOPEN_DELAY_MS);
      });
      return;
    }

    fillOrigin.current = "single";
    animateDeckToAxes(axes, planned);
  };

  return (
    <>
      {/* D17: 인트로는 별도 라우트가 아니라 판 위 오버레이 — 판은 처음부터 rest 상태로 마운트돼
          있고(빈 5칸·씨앗 조준 펄스·덱 드리프트·컨트롤), 오버레이가 그 위를 덮었다가 걷힌다. */}
      {introActive && <IntroOverlay cellRefs={cellRefs} onDone={() => setIntroActive(false)} />}

      {/* 디자인 리셋(D9): 판을 감싼 글래스 패널·앰비언트 오브는 폐기하되, 부채꼴 덱이 가장자리에서
          어색하게 끊기지 않도록 스테이지 박스(헤어라인 보더+미묘한 표면)는 부활 — 뷰포트는 최대한 활용. */}
      <PageShell width="wide" className="px-4 pb-4 pt-4 sm:px-6 md:px-8">
        {/* .wrap — 스테이지 외곽(max 1060, 모바일은 폭 꽉 채움: PageShell px-5 = 원본 padding 0 20px) */}
        <div className="mx-auto w-full max-w-[1060px]">
          {/* .stage — perspective 무대. 하위 전부 이 안에 absolute. 헤어라인 보더 + 미묘한 표면(D9, 글래스
              아님·blur 없음) — 부채꼴 덱이 가장자리에서 끊기지 않게 경계를 다시 준다. 뷰포트 최대 활용. */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[24px] border border-[rgba(109,180,245,.14)] bg-[#050506] pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] md:block md:h-[clamp(768px,calc(100dvh-88px),976px)] md:pb-0 min-h-[calc(100dvh-152px)]"
            style={{
              perspective: "1300px",
              perspectiveOrigin: "50% 40%",
              backgroundImage:
                "radial-gradient(120% 70% at 50% -12%, rgba(109,180,245,.05), transparent 60%), radial-gradient(90% 55% at 50% 112%, rgba(109,180,245,.04), transparent 55%)",
            }}
          >
            {/* CardSurface CSS 1회 주입 — 5칸 각각의 중복 <style> 태그 방지 */}
            <style>{CARD_SURFACE_CSS}</style>

            {/* 완료 결과 — 모달/카드 장식 없이 항상 자리를 차지하는 회색 결과 패널.
                결과가 생길 때는 패널이 움직이지 않고 내부 문장만 페이드인된다. */}
            <div className="relative z-[18] px-4 pt-2 md:absolute md:inset-x-0 md:top-4 md:px-6 md:pt-0">
              <ConfirmBranch
                open={branchOpen}
                combo={combo}
                line={line}
              />
            </div>

            {/* .table — 모바일: 흐름 속 2×2 그리드(원근 왜곡 줄이려 틸트 2deg). 데스크톱: top:0 h:340
                오버레이 테이블(rotateX 8deg, 원본 시그니처). 정적 transform이라 reduced-motion 안전. */}
            <div
              className={cn(
                "relative mt-4 [transform-origin:50%_100%] [transform:rotateX(2deg)] md:absolute md:inset-x-0 md:top-[480px] md:mt-0 md:h-[224px] md:[transform:rotateX(8deg)]",
              )}
            >
              {/* .slots — 4칸 상시. 모바일: 2×2 그리드. 데스크톱: 한 줄 flex 균등분배(원본, 줄바꿈 없음). */}
              <div className="relative grid grid-cols-2 place-items-center gap-4 px-4 md:absolute md:inset-x-0 md:top-0 md:flex md:flex-nowrap md:items-start md:justify-center md:gap-4 md:px-4">
                {AXES.map((ax, i) => (
                  <SlotCell
                    key={ax.id}
                    ref={cellRefs[ax.id]}
                    axisLabel={ax.label}
                    axisEmoji={ax.emoji}
                    axisIndex={i}
                    gold={isGolden}
                    pulse={aimAxis === ax.id}
                    badge={String(i + 1)}
                    hot={hotAxis === ax.id}
                    locked={locked[ax.id]}
                    floaty={revealed}
                    floatDelay={i}
                    content={cellContent(ax.id)}
                    contentKey={cellKey(ax.id)}
                    onFill={() => fillAxisFresh(ax.id)}
                    onSwap={() => swap(ax.id)}
                    onRemove={() => removeAxis(ax.id)}
                    onToggleLock={() => toggleLock(ax.id)}
                  />
                ))}
              </div>
            </div>

            {/* .wheel — 부채꼴 덱을 스테이지 하단 안쪽에 담는다(뷰포트 fixed 아님). host가 스테이지를 꽉
                채우므로 geom() apex가 원본 .stage 실측과 정합. pointer-events-none(카드만 auto).
                완성 시 벨트는 물러난다(원본 .stage.done .wheel opacity .16). */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-500",
                revealed && (branchOpen ? "opacity-[.3]" : "opacity-[.16]"),
              )}
            >
              <FanDeck
                ref={deckRef}
                cards={deckCards}
                disabled={deckInteractionDisabled}
                aimAxis={aimAxis}
                inactiveAxes={aimAxis ? [] : AXES.filter((a) => locked[a.id]).map((a) => a.id)}
                getTargetRect={(axis) =>
                  deckInteractionDisabled || locked[axis] ? null : cellRefs[axis].current?.getBoundingClientRect() ?? null
                } /* 🔒 잠긴 축은 덱의 목적지에서 제외 — 드롭·탭 비행이 조준하지 못한다 */
                onDragOver={setHotAxis}
                onPick={onDeckPick}
              />
            </div>

            {/* 모바일 전용 덱 여백 — 부채꼴 아펙스를 그리드 아래에 앉혀 슬롯과 겹치지 않게 한다
                (데스크톱은 스테이지 하단 자체가 덱 자리라 불필요). */}
            <div className="h-28 min-h-[112px] flex-1 md:hidden" aria-hidden />

            {/* .ctrl — 현재 상태에 따라 같은 버튼이 "한 번에 뽑기" 또는 "전체 다시 뽑기"로 바뀐다. */}
            <div className="relative z-[16] mt-2 flex w-full flex-col items-center gap-2 pb-2 md:absolute md:bottom-4 md:left-1/2 md:mt-0 md:w-auto md:-translate-x-1/2 md:flex-row md:gap-2 md:pb-0">
              <Button
                variant="aurora"
                size="md"
                className="h-12 whitespace-nowrap px-6 text-base"
                disabled={drawAllBusy || spinCapReached}
                onClick={drawAllFromButton}
              >
                {drawButtonLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* .foot — 스테이지 아래 힌트 한 줄 + 취향 재선택 */}
        <div className="mx-auto mt-4 max-w-[1060px] px-2 text-center">
          <button
            type="button"
            onClick={openTasteSheet}
            className="text-xs text-caption underline-offset-4 transition-colors hover:text-mist hover:underline"
          >
            취향 다시 고르기
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-caption/80">
            내 것에서 시작해 오늘 바로 만들고, 지인에게 물어봐주는 도구
          </p>
        </div>
      </PageShell>

      {/* 중간 취향 질문 — 씨앗 고정 대체 */}
      <TasteSheet open={tasteSheetOpen} onSubmit={setTaste} onSkip={skipTaste} />

      {/* S1b 페이월① — 캡 소진 */}
      <PaywallSheet
        open={capHit}
        onClose={() => useSlot.setState({ capHit: false })}
        onShareBoost={onShareBoost}
        onDayPass={() => {
          fakeDoor("day_pass", 1900, { paywall: "spin_cap", seed_tag: seedId });
          useSlot.setState({ capHit: false });
          setFakeDoorOpen(true);
        }}
      />

      {/* 확정 분기 — 실행 브리프 + 준비물 복사 (플랜 990 CTA 폐지) */}
      <FakeDoorSheet
        open={fakeDoorOpen}
        onClose={() => setFakeDoorOpen(false)}
        product="day_pass"
        title="실행 패스"
      />
    </>
  );
}
