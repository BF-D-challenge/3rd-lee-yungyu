"use client";

/**
 * [FourCard] 슬롯 칸 한 장 — slot/slot-cell.tsx의 이식본(도메인 결합·axisArtSrc 제거, AxisId→string).
 * 플립/팝인/블룸/조준 펄스 시퀀스는 원본 충실 보존:
 *  빈 칸 → 안착: 팝인 300ms cubic-bezier(.34,1.3,.5,1) → 240ms 후 플립 720ms
 *  cubic-bezier(.4,0,.15,1) + 리프트(-14px→-4px, 700ms 잔류) + 퍼플 블룸(900ms, 잔광 .35).
 *  교체(swap): 뒤집었다 400ms 후 내용 스왑 + 재플립 + 블룸 800ms.
 * 카드 앞면은 CardFace의 SVG 각인 대신 "카드 위 리치 텍스트"(390px에서 긴 한국어 문장이 읽히도록)를
 * CardSurface 오로라 위에 축 의미색으로 얹는다(원본 카드 물성 유지, 텍스트 오버플로 금지 — line-clamp).
 * 조준(pulse) = 원본 slotpulse의 다크 등가(글로우 링 펄스) — 색은 장식 토큰(deco, 블루)로 통일.
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { backSvg } from "../slot/card-back";
import { CardSurface } from "../slot/card-surface";

export interface FourCardContent {
  /** 축 의미의 짧은 머리말 — 예: 원본명·플랫폼, 변화 종류 */
  eyebrow?: string;
  /** 카드 본문(값) */
  value: string;
  /** 카드 하단 보조 문구 */
  detail?: string;
}

export interface FourCardCellProps {
  /** 축 라벨: 검증된 원본 · 돈 낼 사람 · 필요한 순간 · 한 끗 변화 */
  axisLabel: string;
  /** 축 의미색 (semantic token 값) */
  axisColor: string;
  /** 축 배열 인덱스(0~3) — CardSurface 애니 위상 어긋내기 용 */
  axisIndex: number;
  content: FourCardContent | null;
  /** 내용 정체성 — 바뀌면 플립 애니메이션 */
  contentKey: string;
  /** 덱 드래그가 이 칸 위에 있을 때 하이라이트 */
  hot?: boolean;
  /** 현재 조준 축 — 빈 칸에 글로우 링 펄스 + data-pulse 훅 */
  pulse?: boolean;
  /** 칸 좌상단 배지 — 순번(1~4) */
  badge?: string;
  /** 완성 후 부유 (원본 floaty) */
  floaty?: boolean;
  /** 부유 시작 지연 인덱스 (원본 i*.35s) */
  floatDelay?: number;
  /** 빈 칸 탭 → 풀에서 한 장 채움 */
  onFill?: () => void;
  /** 채워진 카드 탭 → 그 축만 교체 */
  onSwap?: () => void;
  /** 캐러셀 미리보기에서는 내부 버튼을 탭 순서와 입력 대상에서 제외 */
  interactive?: boolean;
  /** 루트에 병합할 추가 클래스 */
  className?: string;
  /** 카드 프레임(aspect-ratio 박스) 폭 제어 — 기본 max-w-[200px]. 모바일 2×2에서 뷰포트 높이 기반 clamp로 대체 */
  frameClassName?: string;
}

/* 원본 실측: .flip{transition:transform .72s cubic-bezier(.4,0,.15,1)} */
const FLIP = "transform 720ms cubic-bezier(.4,0,.15,1)";
const CARD_ASPECT_RATIO = "84 / 122";
const CARD_BORDER_RADIUS = "8px";

const FLOAT_CSS = `
@keyframes fc-floaty{from{translate:0 0}to{translate:0 -5px}}
.fc-floaty{animation:fc-floaty 5s ease-in-out infinite alternate}
@media (prefers-reduced-motion:reduce){.fc-floaty{animation:none}}
`;

export const FourCardCell = forwardRef<HTMLDivElement, FourCardCellProps>(function FourCardCell(
  {
    axisLabel,
    axisColor,
    axisIndex,
    content,
    contentKey,
    hot,
    pulse,
    badge,
    floaty,
    floatDelay = 0,
    onFill,
    onSwap,
    interactive = true,
    className,
    frameClassName,
  },
  ref,
) {
  const [shown, setShown] = useState<FourCardContent | null>(content);
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
            { opacity: 0.3, transform: "scale(1.04)", offset: 0.4 },
            { opacity: 0.1, transform: "scale(1)" },
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
          { opacity: 0.26, transform: "scale(1.04)", offset: 0.4 },
          { opacity: 0.09, transform: "scale(1)" },
        ],
        { duration: 800, easing: "ease-out", fill: "forwards" },
      );
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, content]);

  const face = shown ?? content;

  return (
    <div className={cn("flex w-full min-w-0 flex-col", className)}>
      <style>{FLOAT_CSS}</style>
      <div
        ref={ref}
        data-pulse={pulse ? "true" : undefined}
        className={cn(
          "relative w-full self-center transition-transform duration-300",
          frameClassName ?? "max-w-[200px]",
          hot && "scale-[1.05]",
        )}
        style={{ aspectRatio: CARD_ASPECT_RATIO, perspective: "1200px" }}
      >
        {/* 퍼플 블룸 오라 — 플립 순간 피었다가 잔광으로 남는다 */}
        <div
          ref={auraRef}
          className="pointer-events-none absolute -inset-6 rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(closest-side, rgba(178,136,246,.55), rgba(178,136,246,.2) 55%, transparent 75%)",
          }}
        />

        {content ? (
          <div
            ref={liftRef}
            className={cn("absolute inset-0", floaty && "fc-floaty")}
            style={floaty ? { animationDelay: `${floatDelay * 0.35}s` } : undefined}
          >
            <button
              type="button"
              onClick={onSwap}
              aria-label={`${axisLabel} 카드 교체`}
              aria-hidden={interactive ? undefined : true}
              tabIndex={interactive ? undefined : -1}
              className="absolute inset-0 w-full"
              style={{
                transformStyle: "preserve-3d",
                transition: FLIP,
                transform: flipped ? "rotateY(180deg)" : "none",
              }}
            >
              {/* 뒷면 — 덱과 같은 인그레이빙 카드지 */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ backfaceVisibility: "hidden", borderRadius: CARD_BORDER_RADIUS }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: backSvg() }}
                />
              </div>
              {/* 앞면 — CardSurface 오로라 위에 축 의미색 리치 텍스트 */}
              <div
                className="absolute inset-0 overflow-hidden border"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderColor: "rgba(255,255,255,.16)",
                  borderRadius: CARD_BORDER_RADIUS,
                  containerType: "inline-size",
                }}
              >
                <CardSurface tier="filled" phase={axisIndex} calm injectStyle={false} />
                {/* 축 의미색 틴트 오버레이 */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, color-mix(in srgb, ${axisColor} 9%, transparent), transparent 44%, rgba(6,9,14,.72) 100%)`,
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-[7cqi] text-left">
                  <span
                    className="mb-[3cqi] text-[7cqi] font-black leading-none tracking-tight"
                    style={{ color: axisColor }}
                  >
                    {face?.eyebrow ?? axisLabel}
                  </span>
                  <strong
                    className="text-[8.75cqi] font-bold leading-[1.25] text-ink"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {face?.value}
                  </strong>
                  {face?.detail ? (
                    <p
                      className="mt-[4cqi] text-[6.5cqi] leading-[1.4] text-mist"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {face.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* 빈 칸 — 현재 칸은 축 색상 점선, 나머지는 흐린 점선 */
          <button
            type="button"
            onClick={onFill}
            aria-label={`${axisLabel} 칸 채우기`}
            aria-hidden={interactive ? undefined : true}
            tabIndex={interactive ? undefined : -1}
            className={cn(
              "absolute inset-0 flex w-full flex-col items-center justify-center overflow-hidden border border-dashed transition-colors",
              !(pulse || hot) && "border-white/20 hover:border-white/35",
              hot && "shadow-glow-deco",
            )}
            style={{
              containerType: "inline-size",
              borderColor: pulse || hot
                ? `color-mix(in srgb, ${axisColor} ${hot ? 92 : 72}%, transparent)`
                : undefined,
              borderRadius: CARD_BORDER_RADIUS,
              background: hot ? `color-mix(in srgb, ${axisColor} 10%, transparent)` : undefined,
            }}
          >
            <CardSurface
              tier={hot ? "hot" : "empty"}
              aim={!hot && pulse}
              phase={axisIndex}
              calm
              injectStyle={false}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(90% 60% at 50% 118%, color-mix(in srgb, ${axisColor} 22%, transparent), transparent 60%)`,
              }}
            />
            {pulse || hot ? (
              <span
                className="relative max-w-[78%] text-center text-[8cqi] font-black leading-[1.3]"
                style={{ color: "rgba(244,241,233,.94)" }}
              >
                여기에 카드 놓기
              </span>
            ) : (
              <span
                className="relative text-[26cqi] font-semibold leading-none"
                style={{ color: "rgba(255,255,255,.24)" }}
              >
                ?
              </span>
            )}
            {badge && (
              <span
                className={cn(
                  "absolute left-2 top-2 text-[9px] tabular-nums tracking-[.04em]",
                  pulse || hot ? "font-bold" : "text-caption/60",
                )}
                style={pulse || hot ? { color: axisColor } : undefined}
              >
                {badge}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
});
