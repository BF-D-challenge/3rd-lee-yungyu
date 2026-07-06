"use client";

/**
 * [S1] 슬롯 칸 한 장 (비율 300:485) — 원본 v7 시퀀스 충실 이식:
 * 빈 칸 → 안착: 팝인 300ms cubic-bezier(.34,1.3,.5,1) → 240ms 후 플립 720ms
 * cubic-bezier(.4,0,.15,1) + 리프트(-14px→-4px, 700ms, 잔류) + 퍼플 블룸(900ms, 잔광 .35).
 * 교체(swap): 뒤집었다 400ms 후 내용 스왑 + 재플립 + 블룸 800ms.
 * 뒷면은 덱과 같은 인그레이빙(테두리+방사 문양+축 힌트), 앞면은 축 라벨·이모지·라벨·괘선·서브텍스트.
 * 카드 탭 = 교체 · ✕ = 비움 · 🔒 = 고정(원본 Prioritize — 잠기면 탭·✕ 비활성, 전체 뽑기 면제).
 * 필수 4칸 완성 시 floaty(5s, -5px 왕복) 부유.
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { backSvg } from "./fan-deck";

export interface CellContent {
  emoji: string;
  title: string;
  sub?: string;
}

export interface SlotCellProps {
  /** 축 라벨: 씨앗 · 불편 · 형태 · 장면 · 마음 */
  axisLabel: string;
  axisEmoji: string;
  content: CellContent | null;
  /** 내용 정체성 — 바뀌면 플립 애니메이션 */
  contentKey: string;
  /** 씨앗 칸 골드 표면 */
  gold?: boolean;
  /** 덱 드래그가 이 칸 위에 있을 때 하이라이트 */
  hot?: boolean;
  /** 💭 옵션 칸 표기 */
  optional?: boolean;
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
}

/* 원본 실측: .flip{transition:transform .72s cubic-bezier(.4,0,.15,1)} */
const FLIP = "transform 720ms cubic-bezier(.4,0,.15,1)";

const FLOAT_CSS = `
@keyframes sc-floaty{from{translate:0 0}to{translate:0 -5px}}
.sc-floaty{animation:sc-floaty 5s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.sc-floaty{animation:none}}
`;

export const SlotCell = forwardRef<HTMLDivElement, SlotCellProps>(function SlotCell(
  {
    axisLabel,
    axisEmoji,
    content,
    contentKey,
    gold,
    hot,
    optional,
    locked,
    floaty,
    floatDelay = 0,
    onFill,
    onSwap,
    onRemove,
    onToggleLock,
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
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <style>{FLOAT_CSS}</style>
      <div
        ref={ref}
        className={cn("relative w-full transition-transform duration-300", hot && "scale-[1.05]")}
        style={{ aspectRatio: "300 / 485", perspective: "1200px" }}
      >
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
              {/* 뒷면 — 덱과 같은 인그레이빙(테두리+방사 문양+축 힌트) */}
              <div
                className="absolute inset-0 overflow-hidden rounded-card"
                style={{ backfaceVisibility: "hidden" }}
                dangerouslySetInnerHTML={{ __html: backSvg(axisEmoji) }}
              />
              {/* 앞면 */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-between rounded-card border p-2 text-center sm:p-3",
                  gold ? "glass-gold border-gold/60" : "border-white/15 bg-white/[0.08]",
                  hot && "border-glow shadow-glow-hero",
                  locked && "ring-2 ring-gold/70",
                )}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <span className="text-[9px] tracking-[.14em] text-caption">
                  {axisEmoji} {axisLabel}
                </span>
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
                  <span className="text-2xl leading-none sm:text-3xl">{shown?.emoji}</span>
                  <span className="font-serif text-[11px] leading-snug text-ink sm:text-sm">
                    {shown?.title}
                  </span>
                </div>
                {/* 원본 .rule — 제목/키워드 사이 괘선 */}
                <span className="h-px w-5 shrink-0 bg-white/30" aria-hidden />
                <span className="line-clamp-2 min-h-[2em] text-[9px] leading-tight text-caption">
                  {shown?.sub}
                </span>
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
                  ? "bg-gold/90 text-black"
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
          /* 빈 칸 — 점선 유리 placeholder */
          <button
            type="button"
            onClick={onFill}
            aria-label={`${axisLabel} 칸 채우기`}
            className={cn(
              "absolute inset-0 flex w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-white/20 bg-white/[0.03] transition-colors hover:border-glow/60 hover:bg-white/[0.06]",
              hot && "border-glow bg-white/[0.07] shadow-glow-hero",
            )}
          >
            <span className="text-2xl opacity-40">{axisEmoji}</span>
            <span className="text-[10px] tracking-[.12em] text-caption">{axisLabel}</span>
            {optional && <span className="text-[9px] text-caption/70">옵션</span>}
          </button>
        )}
      </div>
    </div>
  );
});
