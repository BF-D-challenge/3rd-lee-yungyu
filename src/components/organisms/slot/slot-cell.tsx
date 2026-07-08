"use client";

/**
 * [S1] 슬롯 칸 한 장 (비율 300:485) — 원본 v7 시퀀스 충실 이식:
 * 빈 칸 → 안착: 팝인 300ms cubic-bezier(.34,1.3,.5,1) → 240ms 후 플립 720ms
 * cubic-bezier(.4,0,.15,1) + 리프트(-14px→-4px, 700ms, 잔류) + 퍼플 블룸(900ms, 잔광 .35).
 * 교체(swap): 뒤집었다 400ms 후 내용 스왑 + 재플립 + 블룸 800ms.
 * 뒷면은 덱과 같은 인그레이빙(테두리+방사 문양+축 힌트), 앞면은 축 라벨·이모지·라벨·괘선·서브텍스트.
 * 카드 탭 = 교체 · ✕ = 비움 · 🔒 = 고정(원본 Prioritize — 잠기면 탭·✕ 비활성, 전체 뽑기 면제).
 * 필수 4칸 완성 시 floaty(5s, -5px 왕복) 부유.
 * 조준(pulse) = 원본 slot.current: 글로우 링 펄스(slotpulse 1.9s의 opacity/transform 등가) +
 * 상시 글로우 보더 + 플레이스홀더 강조 + data-pulse="true" 훅. 좌상단 badge = 원본 .num(순번/'선택').
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import { CARD_BACK } from "@/lib/card-art";
import { cn } from "@/lib/utils";
import { CardSurface } from "./card-surface";

export interface CellContent {
  emoji: string;
  title: string;
  sub?: string;
}

export interface SlotCellProps {
  /** 축 라벨: 씨앗 · 불편 · 형태 · 장면 · 마음 */
  axisLabel: string;
  axisEmoji: string;
  /** 축 배열 인덱스(0~4) — CardSurface 애니 위상 어긋내기 용 */
  axisIndex: number;
  content: CellContent | null;
  /** 내용 정체성 — 바뀌면 플립 애니메이션 */
  contentKey: string;
  /** 씨앗 칸 골드 표면 */
  gold?: boolean;
  /** 덱 드래그가 이 칸 위에 있을 때 하이라이트 */
  hot?: boolean;
  /** ✨ 스페셜 칸 표기 — 상시 노출, 빈 placeholder 문구 "＋ 스페셜 카드" */
  optional?: boolean;
  /** 현재 조준 축 (원본 slot.current) — 빈 칸에 골드/글로우 링 펄스 + data-pulse 훅 */
  pulse?: boolean;
  /** 칸 좌상단 배지 — 필수는 순번(1~4), 스페셜은 '스페셜' (원본 .num) */
  badge?: string;
  /** 🔒 고정 — 탭 교체·✕ 비활성, 🎲 전체 뽑기 유지 */
  locked?: boolean;
  /** 필수 완성 후 부유 (원본 floaty) */
  floaty?: boolean;
  /** 부유 시작 지연 인덱스 (원본 i*.35s) */
  floatDelay?: number;
  /** 빈 칸 탭 → 풀에서 한 장 채움 */
  onFill?: () => void;
  /** 채워진 카드 탭 → 그 축만 교체 */
  onSwap?: () => void;
  /** ✕ → 그 칸만 비움 */
  onRemove?: () => void;
  /** 🔒 토글 */
  onToggleLock?: () => void;
  /** 창에 들어갈 아르카나 아트 (artForValue) — 없으면 이모지 폴백 (docs/card-art-integration.md) */
  axisArtSrc?: string;
  /** 수트 액센트 색 (AXIS_ACCENT) — TarotCard 글로우 틴트 + 카투슈 라벨 */
  accent?: string;
  /** 루트에 병합할 추가 클래스 — 모바일 2×2 그리드 배치용(✨스페셜 칸 col-span-2 등) */
  className?: string;
}

/* 원본 실측: .flip{transition:transform .72s cubic-bezier(.4,0,.15,1)} */
const FLIP = "transform 720ms cubic-bezier(.4,0,.15,1)";

const FLOAT_CSS = `
@keyframes sc-floaty{from{translate:0 0}to{translate:0 -5px}}
.sc-floaty{animation:sc-floaty 5s ease-in-out infinite alternate}
@keyframes sc-pulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:0;transform:scale(1.075)}}
.sc-pulse{animation:sc-pulse 1.9s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.sc-floaty{animation:none}.sc-pulse{animation:none;opacity:.6}}
`;

export const SlotCell = forwardRef<HTMLDivElement, SlotCellProps>(function SlotCell(
  {
    axisLabel,
    axisIndex,
    content,
    contentKey,
    hot,
    optional,
    pulse,
    badge,
    locked,
    floaty,
    floatDelay = 0,
    onFill,
    onSwap,
    onRemove,
    onToggleLock,
    axisArtSrc,
    className,
  },
  ref,
) {
  const [shown, setShown] = useState<CellContent | null>(content);
  const [flipped, setFlipped] = useState(false);
  const auraRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!content) {
      keyRef.current = null;
      setShown(null);
      setFlipped(false);
      return;
    }
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (keyRef.current === contentKey) {
      setShown(content);
      setFlipped(true); // StrictMode 재실행에도 펼침 보장
      return;
    }
    const wasEmpty = keyRef.current === null;
    keyRef.current = contentKey;
    if (rm) {
      setShown(content);
      setFlipped(true);
      return;
    }
    if (wasEmpty) {
      /* 원본 fillSlot: 팝인(300ms) → 240ms 후 플립 + 리프트(700ms 잔류) + 블룸(900ms, 딜레이 80) */
      setShown(content);
      liftRef.current?.animate(
        [
          { transform: "scale(.9)", opacity: 0.8 },
          { transform: "scale(1.02)", offset: 0.5 },
          { transform: "scale(1)", opacity: 1 },
        ],
        { duration: 300, easing: "cubic-bezier(.34,1.3,.5,1)" },
      );
      const t = setTimeout(() => {
        setFlipped(true);
        liftRef.current?.animate(
          [
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(-14px) scale(1.05)", offset: 0.45 },
            { transform: "translateY(-4px) scale(1.02)" },
          ],
          { duration: 700, easing: "cubic-bezier(.4,0,.15,1)", fill: "forwards" },
        );
        auraRef.current?.animate(
          [
            { opacity: 0, transform: "scale(.9)" },
            { opacity: 0.9, transform: "scale(1.06)", offset: 0.4 },
            { opacity: 0.35, transform: "scale(1)" },
          ],
          { duration: 900, easing: "ease-out", fill: "forwards", delay: 80 },
        );
      }, 240);
      return () => clearTimeout(t);
    }
    /* 원본 reroll: 뒤집었다가 400ms 후 내용 스왑 + 재플립 + 블룸 800ms(잔광 .3) */
    setFlipped(false);
    const t = setTimeout(() => {
      setShown(content);
      setFlipped(true);
      auraRef.current?.animate(
        [
          { opacity: 0, transform: "scale(.9)" },
          { opacity: 0.8, transform: "scale(1.05)", offset: 0.4 },
          { opacity: 0.3, transform: "scale(1)" },
        ],
        { duration: 800, easing: "ease-out", fill: "forwards" },
      );
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, content]);

  return (
    /* 원본 .slot 138×196 등가 — 데스크톱은 한 줄 flex 균등분배(max 122px 캡), 모바일은 2×2 그리드
       칸(폭 ≈132px, 아트·글자 읽힘). 높이는 카드아트 300:485 비율이 결정. col-span 등 배치는 className. */
    <div
      className={cn(
        "flex w-[min(122px,39vw)] min-w-0 flex-col items-center md:w-auto md:max-w-[122px] md:grow md:basis-0",
        className,
      )}
    >
      <style>{FLOAT_CSS}</style>
      <div
        ref={ref}
        data-pulse={pulse ? "true" : undefined}
        className={cn("relative w-full transition-transform duration-300", hot && "scale-[1.05]")}
        style={{ aspectRatio: "300 / 485", perspective: "1200px" }}
      >
        {/* 조준 링 — 원본 slotpulse(1.9s ease-in-out infinite)의 다크 등가. opacity/transform만 */}
        {pulse && !hot && (
          <span
            aria-hidden
            className="sc-pulse pointer-events-none absolute inset-0 rounded-card border-2 border-glow"
          />
        )}
        {/* 퍼플 블룸 오라 — 플립 순간 피었다가 잔광으로 남는다 (원본 fill:forwards) */}
        <div
          ref={auraRef}
          className="pointer-events-none absolute -inset-6 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(closest-side, rgba(178,136,246,.55), rgba(178,136,246,.2) 55%, transparent 75%)",
          }}
        />

        {content ? (
          /* 리프트/부유 래퍼 — 플립(rotateY)과 분리된 축에서 움직인다 */
          <div
            ref={liftRef}
            className={cn("absolute inset-0", floaty && "sc-floaty")}
            style={floaty ? { animationDelay: `${floatDelay * 0.35}s` } : undefined}
          >
            <button
              type="button"
              onClick={locked ? undefined : onSwap}
              aria-label={locked ? `${axisLabel} 카드 (고정됨)` : `${axisLabel} 카드 교체`}
              aria-disabled={locked || undefined}
              className={cn("absolute inset-0 w-full", locked && "cursor-default")}
              style={{
                transformStyle: "preserve-3d",
                transition: FLIP,
                transform: flipped ? "rotateY(180deg)" : "none",
              }}
            >
              {/* 뒷면 — 생성 아트 히어로 + 축 엠블럼 (docs/card-art-integration.md §3a) */}
              <div
                className="absolute inset-0 overflow-hidden rounded-card"
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CARD_BACK} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {axisArtSrc && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={axisArtSrc}
                    alt=""
                    className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 opacity-90"
                  />
                )}
              </div>
              {/* 앞면 — 확정 카드 배경(CardSurface): 방사형 검정→투명 잘린 타원 + inner glow + 초점 광원 */}
              <div
                className={cn(
                  "absolute inset-0 overflow-hidden rounded-card",
                  locked && "ring-2 ring-[#6db4f5]/70",
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <CardSurface tier={hot ? "hot" : "filled"} phase={axisIndex} injectStyle={false} />
              </div>
            </button>

            {/* 🔒 고정 토글 (원본 Prioritize) — 잠기면 탭·✕이 죽고 🎲에서 유지 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock?.();
              }}
              aria-label={locked ? `${axisLabel} 고정 풀기` : `${axisLabel} 카드 고정`}
              aria-pressed={locked || undefined}
              title="고정하면 전체 다시 뽑기에도 안 바뀌어요"
              className={cn(
                "absolute left-0.5 top-0.5 z-10 grid h-5 w-5 place-items-center rounded-full text-[9px] transition-all sm:h-6 sm:w-6 sm:text-[10px]",
                locked
                  ? "bg-glow/90 text-black"
                  : "glass text-mist opacity-60 hover:opacity-100",
              )}
            >
              {locked ? "🔒" : "🔓"}
            </button>

            {/* ✕ 제거 — 잠긴 카드는 제거 불가 (원본 규칙) */}
            {!locked && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
                aria-label={`${axisLabel} 카드 빼기`}
                className="glass absolute right-0.5 top-0.5 z-10 grid h-5 w-5 place-items-center rounded-full text-[9px] text-mist transition-colors hover:text-ink sm:h-6 sm:w-6 sm:text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          /* 빈 칸(D16) — 점선은 "카드가 놓일 자리" 표시로 유지, 그 안에 CardSurface(empty/aim/hot
             tier)를 채워 채워진 카드와 같은 물성의 은은한 그라데이션을 준다. 글자 없음. */
          <button
            type="button"
            onClick={onFill}
            aria-label={`${axisLabel} 칸 채우기`}
            className={cn(
              "absolute inset-0 flex w-full flex-col items-center justify-center overflow-hidden rounded-card border border-dashed transition-colors",
              pulse ? "border-glow/80" : "border-white/20 hover:border-glow/60",
              hot && "border-glow shadow-glow-hero",
            )}
          >
            <CardSurface
              tier={hot ? "hot" : "empty"}
              aim={!hot && pulse}
              phase={axisIndex}
              injectStyle={false}
              className="rounded-card"
            />
            {badge && (
              <span
                className={cn(
                  "absolute left-1.5 top-1.5 text-[9px] tabular-nums tracking-[.04em]",
                  pulse ? "text-glow" : "text-caption/60",
                )}
              >
                {badge}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 카드 밖 캡션(moonlight .slot .label) — 카드 면은 순수 글로우, 값·축 이름은 여기 하나로만 */}
      <p
        className={cn(
          "mt-2 max-w-full truncate px-1 font-serif text-[13px] italic",
          pulse ? "text-glow" : content ? "text-ink" : "text-caption",
        )}
      >
        {content ? shown?.title : optional ? "스페셜" : axisLabel}
      </p>
    </div>
  );
});
