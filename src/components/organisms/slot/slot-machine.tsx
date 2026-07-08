"use client";

/**
 * [S1] 빈-슬롯 오케스트레이터 — 필수 4칸(🌱씨앗·😖불편·📦형태·🎬장면) + ✨스페셜 1칸(상시 노출).
 * 스페셜 칸은 항상 보이는 5번째 칸 — 내용물은 기존 마음(psych) 풀 그대로, 채우면 조합에 들어간다.
 * 진입 시 전부 빈 칸, 하단 부채꼴 덱에서 한 장씩 채운다 (정적 데모 v7 모델).
 * 채워진 카드 탭 = 그 축만 교체 · ✕ = 비움 · 🎲 전체 다시 뽑기만 스핀 캡 소모.
 *
 * 원본 curAxis 게이트: 필수 4칸 중 빈 칸이 있는 동안 "다음 빈 필수 축"이 조준 축 —
 * 그 칸이 펄스하고, 덱의 모든 카드가 그 칸으로만 향한다(축 불일치 카드는 조준 축 풀에서
 * 새로 뽑아 안착 = 원본 pickCard(ai)). 4칸 완성 시 게이트 해제 → 카드 고유 축 믹스.
 * ✨ 한 번에 뽑기 = 원본 autoAll (남은 필수 칸을 아펙스 카드 비행으로 430ms 간격 순차 채움).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/atoms/button";
import { Pill } from "@/components/atoms/pill";
import { GlassCard } from "@/components/atoms/glass-card";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import {
  buildDeck,
  drawFormat,
  drawPain,
  drawPsych,
  drawSeed,
  drawSituation,
  type AxisId,
  type AxisValue,
} from "@/lib/pools";
import { SPIN_CAP, filledRequired, REQUIRED, useSlot } from "@/lib/slot-store";
import { fakeDoor, track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { AXIS_ART, AXIS_ACCENT, seedArt } from "@/lib/card-art";
import { assembleCombo, assembleLine } from "./assemble";
import { CARD_SURFACE_CSS } from "./card-surface";
import { ConfirmBranch } from "./confirm-branch";
import { FanDeck, type FanDeckHandle } from "./fan-deck";
import { GoldSentence } from "./gold-sentence";
import { IntroOverlay } from "./intro-overlay";
import { PaywallSheet } from "./paywall-sheet";
import { SlotCell, type CellContent } from "./slot-cell";
import { TasteSheet } from "./taste-sheet";

const AXES: { id: AxisId; label: string; emoji: string; optional?: boolean }[] = [
  { id: "seed", label: "씨앗", emoji: "🌱" },
  { id: "pain", label: "불편", emoji: "😖" },
  { id: "format", label: "형태", emoji: "📦" },
  { id: "situation", label: "장면", emoji: "🎬" },
  { id: "psych", label: "스페셜", emoji: "✨", optional: true },
];

/** 조준 축 안내 질문 (원본 stepbar의 sn-q) */
const QUESTION: Record<AxisId, string> = {
  seed: "무엇에서 시작할까?",
  pain: "뭐가 불편할까?",
  format: "어떤 모습으로?",
  situation: "언제·어디서?",
  psych: "사람 마음의 습관",
};

/** 원본 finalize: 마지막 필수 카드 플립이 끝난 뒤 결과가 뜨기까지 1150ms */
const FINALIZE_DELAY_MS = 1150;
/** 원본 autoAll: 카드 안착 → 다음 비행까지 430ms */
const AUTO_STEP_MS = 430;

/** 다음 빈 필수 축 = 조준 축 (원본 curAxis — 없으면 null = 게이트 해제) */
const nextEmptyRequired = (slots: ReturnType<typeof useSlot.getState>["slots"]): AxisId | null =>
  REQUIRED.find((a) => !slots[a]) ?? null;

export function SlotMachine() {
  const {
    slots, locked, spins, capHit, taste, tasteSheetOpen, viaVote,
    swap, removeAxis, toggleLock, spinAll,
    setTaste, skipTaste, openTasteSheet,
  } = useSlot();

  const [hotAxis, setHotAxis] = useState<AxisId | null>(null);
  const [branchOpen, setBranchOpen] = useState(false);
  /** 인트로 연속샷 오버레이 — 매 방문 재생(D8, 세션 게이트 없음) */
  const [introActive, setIntroActive] = useState(true);
  /** 가짜 문 시트 — 실행 패스(day_pass)만. 플랜 990은 폐지(가치개선 계획 §3.4 — 실행 브리프 무료화) */
  const [fakeDoorOpen, setFakeDoorOpen] = useState(false);

  const deckRef = useRef<FanDeckHandle>(null);
  /** ✨ 한 번에 뽑기 진행 중 재진입 방지 */
  const autoBusy = useRef(false);
  /** 완성이 카드 한 장 안착에서 왔는지(→ 원본 finalize 1150ms 지연) / 🎲 배치에서 왔는지 */
  const fillOrigin = useRef<"single" | "batch">("batch");
  /** via=vote 자동 확정 — 세션당 1회만 (같은 세션에서 이후 수동 재스핀엔 영향 없음) */
  const autoConfirmedRef = useRef(false);

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
    fillOrigin.current = "single";
    const s = useSlot.getState();
    const cur = nextEmptyRequired(s.slots);
    if (cur && card.axis !== cur) {
      fillAxisFresh(cur);
      return;
    }
    s.place(card);
  };

  /** ✨ 한 번에 뽑기 — 남은 필수 칸 순차 자동 채움 (원본 autoAll: 아펙스 비행 → 430ms → 다음) */
  const autoFill = () => {
    if (autoBusy.current) return;
    autoBusy.current = true;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tries = 0;
    const step = () => {
      const cur = nextEmptyRequired(useSlot.getState().slots);
      const deck = deckRef.current;
      if (!cur || !deck) {
        deck?.hold(false);
        autoBusy.current = false;
        return;
      }
      deck.hold(true); // 시퀀스 동안 벨트 잠금 (원본 busy) — 덱 재구축 뒤에도 다시 잠근다
      if (deck.drawTo(cur, () => setTimeout(step, rm ? 0 : AUTO_STEP_MS))) {
        tries = 0;
        return;
      }
      if (++tries > 40) {
        deck.hold(false);
        autoBusy.current = false;
        return;
      }
      setTimeout(step, 120); // 덱 재구축(씨앗 앵커 갱신) 직후 등 — 잠깐 뒤 재시도
    };
    step();
  };

  const line = assembleLine(slots);
  const combo = useMemo(() => assembleCombo(slots), [slots]);
  const filled = filledRequired(slots).length;
  /** 조준 축 = 다음 빈 필수 칸 (원본 curAxis). null이면 필수 완성 */
  const aimAxis = nextEmptyRequired(slots);

  /** 원본 finalize: 카드 안착으로 필수 4칸이 완성되면 1150ms 뒤 결과 등장 (🎲 배치는 즉시) */
  const hasCombo = !!combo;
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

  const onConfirm = useCallback(() => {
    if (!combo) return;
    track("idea_confirmed", {
      seed_tag: combo.seed.id,
      combo: `${combo.pain.id}|${combo.format.id}`,
      is_golden: combo.golden,
      has_psych: !!slots.psych,
    });
    setBranchOpen(true);
  }, [combo, slots.psych]);

  /** via=vote로 자동 스핀이 끝나 카드가 revealed되면, 사용자가 탭하지 않아도 700ms 뒤 자동 확정한다.
   *  세션당 1회 — autoConfirmedRef가 소모되면 이후 수동 재스핀은 평소대로 수동 확정을 요구한다. */
  useEffect(() => {
    if (!revealed || !viaVote || autoConfirmedRef.current || !combo) return;
    autoConfirmedRef.current = true;
    useSlot.setState({ viaVote: false }); // 1회성 — 이후 재스핀엔 영향 없음
    const t = setTimeout(() => onConfirm(), 700);
    return () => clearTimeout(t);
  }, [revealed, viaVote, combo, onConfirm]);

  const aim = aimAxis ? AXES.find((a) => a.id === aimAxis) : null;

  return (
    <>
      {/* D17: 인트로는 별도 라우트가 아니라 판 위 오버레이 — 판은 처음부터 rest 상태로 마운트돼
          있고(빈 5칸·씨앗 조준 펄스·덱 드리프트·컨트롤), 오버레이가 그 위를 덮었다가 걷힌다. */}
      {introActive && <IntroOverlay cellRefs={cellRefs} onDone={() => setIntroActive(false)} />}

      {/* 디자인 리셋(D9): 판을 감싼 글래스 패널·앰비언트 오브는 폐기하되, 부채꼴 덱이 가장자리에서
          어색하게 끊기지 않도록 스테이지 박스(헤어라인 보더+미묘한 표면)는 부활 — 뷰포트는 최대한 활용. */}
      <PageShell width="wide" className="px-3 pb-4 pt-2 sm:px-5 md:px-8">
        <TopBar
          right={
            <Pill aria-label={`오늘 전체 뽑기 ${spins} / ${SPIN_CAP}`}>
              <span className="tabular-nums text-ink">{Math.min(spins, SPIN_CAP)}/{SPIN_CAP}</span>
            </Pill>
          }
        />

        {/* .wrap — 스테이지 외곽(max 1060, 모바일은 폭 꽉 채움: PageShell px-5 = 원본 padding 0 20px) */}
        <div className="mx-auto mt-2 w-full max-w-[1060px]">
          {/* .stage — perspective 무대. 하위 전부 이 안에 absolute. 헤어라인 보더 + 미묘한 표면(D9, 글래스
              아님·blur 없음) — 부채꼴 덱이 가장자리에서 끊기지 않게 경계를 다시 준다. 뷰포트 최대 활용. */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[28px] border border-[rgba(109,180,245,.14)] bg-[#050506] pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,.05)] md:block md:h-[clamp(620px,calc(100dvh-140px),900px)] md:pb-0 min-h-[calc(100dvh-152px)]"
            style={{
              perspective: "1300px",
              perspectiveOrigin: "50% 40%",
              backgroundImage:
                "radial-gradient(120% 70% at 50% -12%, rgba(109,180,245,.05), transparent 60%), radial-gradient(90% 55% at 50% 112%, rgba(109,180,245,.04), transparent 55%)",
            }}
          >
            {/* CardSurface CSS 1회 주입 — 5칸 각각의 중복 <style> 태그 방지 */}
            <style>{CARD_SURFACE_CSS}</style>
            {/* .stepbar — 모바일: 상단 흐름(짧은 질문·dots·작은 N/4, 간소화). 데스크톱: top:14 오버레이(원본 그대로). */}
            <div className="pointer-events-none relative z-[9] flex flex-col items-center gap-1.5 px-4 pb-1 pt-4 text-center md:absolute md:inset-x-0 md:top-3.5 md:gap-2 md:pb-0 md:pt-0">
              {!combo && aim && (
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs text-caption">
                  {/* 데스크톱 전용 크롬(번호배지·이모지·이탤릭 축명·middot·필수) — md+에서만 */}
                  <span className="hidden h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/10 text-[9px] tabular-nums text-mist md:grid">
                    {REQUIRED.indexOf(aim.id) + 1}
                  </span>
                  <span className="hidden md:inline" aria-hidden>
                    {aim.emoji}
                  </span>
                  <b className="hidden font-serif italic text-glow md:inline">{aim.label}</b>
                  {/* 모바일: 짧은 질문(세리프·글로우) / 데스크톱: "· 질문"(원본) */}
                  <span className="font-serif text-sm text-glow md:hidden">{QUESTION[aim.id]}</span>
                  <span className="hidden md:inline">· {QUESTION[aim.id]}</span>
                  {/* 공유 진행 N/4 — 스모크 "0/4"·"3/4" 리터럴(단일 노드, 모바일·데스크톱 공용) */}
                  <span className="tabular-nums text-mist">
                    {filled}/{REQUIRED.length}
                  </span>
                  <span className="hidden text-[10px] text-caption/70 md:inline">필수</span>
                </div>
              )}
              {combo && (
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-xs">
                  <span aria-hidden>✨</span>
                  <b className="font-serif italic text-ink">아이디어 완성!</b>
                  {!slots.psych && (
                    <span className="hidden text-caption md:inline">
                      ✨ 스페셜 카드를 얹으면 더 구체적이에요
                    </span>
                  )}
                </div>
              )}
              {/* 진행 dots — 필수 4칸 + ✨스페셜(작은 링), 5개 상시 */}
              <div className="flex gap-1.5">
                {AXES.map((ax) => {
                  const on = !!slots[ax.id];
                  return (
                    <span
                      key={ax.id}
                      className={cn(
                        "rounded-full transition-all",
                        ax.optional ? "h-1.5 w-1.5" : "h-[7px] w-[7px]",
                        on
                          ? "scale-110 bg-glow"
                          : ax.optional
                            ? "bg-transparent ring-1 ring-white/25"
                            : "bg-white/20",
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* .table — 모바일: 흐름 속 2×2 그리드(원근 왜곡 줄이려 틸트 2deg). 데스크톱: top:0 h:340
                오버레이 테이블(rotateX 8deg, 원본 시그니처). 정적 transform이라 reduced-motion 안전. */}
            <div className="relative mt-1 [transform-origin:50%_100%] [transform:rotateX(2deg)] md:absolute md:inset-x-0 md:top-0 md:mt-0 md:h-[340px] md:[transform:rotateX(8deg)]">
              {/* .slots — 5칸 상시. 모바일: 2열 그리드(필수 4=2×2, ✨스페셜=3행 full-width col-span-2).
                  데스크톱: 한 줄 flex 균등분배(원본, 줄바꿈 없음). */}
              <div className="relative grid grid-cols-2 place-items-center gap-3 px-4 md:absolute md:inset-x-0 md:top-[66px] md:flex md:flex-nowrap md:items-start md:justify-center md:gap-3 md:px-3.5">
                {AXES.map((ax, i) => (
                  <SlotCell
                    key={ax.id}
                    ref={cellRefs[ax.id]}
                    axisLabel={ax.label}
                    axisEmoji={ax.emoji}
                    axisIndex={i}
                    gold={ax.id === "seed"}
                    optional={ax.optional}
                    pulse={aimAxis === ax.id}
                    badge={ax.optional ? "스페셜" : String(i + 1)}
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
                    axisArtSrc={
                      ax.id === "seed" && slots.seed ? seedArt(slots.seed.id) : AXIS_ART[ax.id]
                    }
                    accent={AXIS_ACCENT[ax.id]}
                    className={ax.optional ? "col-span-2" : undefined}
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
                revealed && "opacity-[.16]",
              )}
            >
              <FanDeck
                ref={deckRef}
                cards={deckCards}
                aimAxis={aimAxis}
                inactiveAxes={aimAxis ? [] : AXES.filter((a) => locked[a.id]).map((a) => a.id)}
                getTargetRect={(axis) =>
                  locked[axis] ? null : cellRefs[axis].current?.getBoundingClientRect() ?? null
                } /* 🔒 잠긴 축은 덱의 목적지에서 제외 — 드롭·탭 비행이 조준하지 못한다 */
                onDragOver={setHotAxis}
                onPick={onDeckPick}
              />
            </div>

            {/* .result — 필수 완성 시 스테이지 가운데로 스프링하며 떠오르는 플로팅 패널(슬롯 위 오버레이).
                다크: glass-strong + shadow-glow-hero. 카드 안착 완성은 revealed 지연(원본 1150ms). */}
            {line && combo && (
              <div
                className={cn(
                  // 모바일: 그리드 아래 흐름(오버레이 아님, 슬롯과 겹침 0). 데스크톱: 42% 떠오르는 오버레이(원본).
                  "relative z-[14] mx-auto mt-2 w-[min(560px,92%)] transition-all duration-[550ms] md:absolute md:left-1/2 md:mt-0 md:top-[clamp(232px,42%,292px)] md:w-[min(560px,90%)] md:-translate-x-1/2",
                  revealed
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-3 opacity-0",
                )}
              >
                <GlassCard strong className="rounded-[20px] px-5 py-4 text-center shadow-glow-hero">
                  <p className="mb-1.5 text-[10px] uppercase tracking-[.16em] text-glow">
                    오늘 만들어볼 한 개
                  </p>
                  <GoldSentence text={line} marks={[combo.pain.short, combo.format.short]} />
                  {combo.golden && combo.title && (
                    <p className="mt-2 text-xs text-glow">✨ {combo.title}</p>
                  )}
                  {revealed && (
                    <p className="mt-2.5 text-[11px] leading-relaxed text-caption">
                      마음에 드는 카드는 <b className="text-mist">🔒 고정</b> — 🎲에서 그대로 남고 나머지만
                      새로 나와요
                      {!slots.psych && <> · ✨ 스페셜 카드를 얹으면 더 구체적이에요</>}
                    </p>
                  )}
                </GlassCard>
              </div>
            )}

            {/* 모바일 전용 덱 여백 — 부채꼴 아펙스를 그리드 아래에 앉혀 슬롯과 겹치지 않게 한다
                (데스크톱은 스테이지 하단 자체가 덱 자리라 불필요). */}
            <div className="h-28 min-h-[112px] flex-1 md:hidden" aria-hidden />

            {/* .ctrl — 모바일: 흐름 하단, 주 버튼(lg 강조) + 🎲 보조(경량). 데스크톱: bottom:16 오버레이(원본, md 위계). */}
            <div className="relative z-[16] mt-2 flex w-full flex-col items-center gap-2 pb-1 md:absolute md:bottom-4 md:left-1/2 md:mt-0 md:w-auto md:-translate-x-1/2 md:flex-row md:gap-2 md:pb-0">
              {/* 보조: 🎲 — 모바일 order-2(주 버튼 아래·경량), 데스크톱 order-1(왼쪽·원본) */}
              <Button
                variant="glass"
                size="md"
                className="order-2 h-10 whitespace-nowrap px-4 text-xs text-mist md:order-1 md:h-11 md:text-sm md:text-ink"
                onClick={() => {
                  fillOrigin.current = "batch";
                  spinAll();
                }}
              >
                🎲 전체 다시 뽑기
              </Button>
              {/* 주 버튼: 모바일 lg 강조·order-1(위), 데스크톱 md·order-2(오른쪽·원본) */}
              {combo ? (
                <Button
                  variant="aurora"
                  size="md"
                  className="order-1 min-h-[52px] whitespace-nowrap px-6 text-base md:order-2 md:min-h-0 md:px-6 md:text-sm"
                  onClick={onConfirm}
                >
                  ✓ 확정
                </Button>
              ) : (
                <Button
                  variant="aurora"
                  size="md"
                  className="order-1 min-h-[52px] whitespace-nowrap px-6 text-base md:order-2 md:min-h-0 md:px-4 md:text-sm"
                  onClick={autoFill}
                >
                  ✨ 한 번에 뽑기
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* .foot — 스테이지 아래 힌트 한 줄 + 취향 재선택 */}
        <div className="mx-auto mt-3 max-w-[1060px] px-2 text-center">
          <button
            type="button"
            onClick={openTasteSheet}
            className="text-xs text-caption underline-offset-4 transition-colors hover:text-mist hover:underline"
          >
            취향 다시 고르기
          </button>
          <p className="mt-1.5 text-[11px] leading-relaxed text-caption/80">
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
        onShareBoost={() => {
          // 목업: +3회 = 스핀 카운트를 2로 되감기 (캡 강제는 4주 범위 밖)
          useSlot.setState({ spins: 2, capHit: false });
        }}
        onDayPass={() => {
          fakeDoor("day_pass", 1900, { paywall: "spin_cap", seed_tag: seedId });
          useSlot.setState({ capHit: false });
          setFakeDoorOpen(true);
        }}
      />

      {/* 확정 분기 — 실행 브리프 + 준비물 복사 (플랜 990 CTA 폐지) */}
      <ConfirmBranch open={branchOpen} combo={combo} line={line} onClose={() => setBranchOpen(false)} />

      <FakeDoorSheet
        open={fakeDoorOpen}
        onClose={() => setFakeDoorOpen(false)}
        product="day_pass"
        title="실행 패스"
      />
    </>
  );
}
