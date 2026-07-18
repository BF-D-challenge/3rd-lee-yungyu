"use client";

/**
 * [FourCard] 슬롯 칸 한 장 — slot/slot-cell.tsx의 이식본(도메인 결합·axisArtSrc 제거, AxisId→string).
 * 플립/팝인/블룸/조준 펄스 시퀀스는 원본 충실 보존:
 *  빈 칸 → 안착: 짧은 팝인 뒤 플립·리프트·블룸을 300ms 안에 마친다.
 *  교체(swap): 반쯤 뒤집힌 지점에서 내용을 바꾸고 즉시 재플립한다.
 * 카드 앞면은 CardFace의 SVG 각인 대신 "카드 위 리치 텍스트"(390px에서 긴 한국어 문장이 읽히도록)를
 * CardSurface 오로라 위에 축 의미색으로 얹는다(원본 카드 물성 유지, 텍스트 오버플로 금지 — line-clamp).
 * 조준(pulse) = 원본 slotpulse의 다크 등가(글로우 링 펄스) — 색은 장식 토큰(deco, 블루)로 통일.
 */

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { backSvg } from "../slot/card-back";
import { CardSurface } from "../slot/card-surface";
import { TarotArt } from "./tarot-art";

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
  onFill?: (options?: { skipMotion?: boolean }) => void;
  /** 채워진 카드 탭 → 그 축만 교체 */
  onSwap?: () => void;
  /** 캐러셀 미리보기에서는 내부 버튼을 탭 순서와 입력 대상에서 제외 */
  interactive?: boolean;
  /** 루트에 병합할 추가 클래스 */
  className?: string;
  /** 카드 프레임(aspect-ratio 박스) 폭 제어 — 기본 max-w-[200px]. 모바일 2×2에서 뷰포트 높이 기반 clamp로 대체 */
  frameClassName?: string;
}

/* 반복되는 리빌은 빠르게, 감속이 분명한 ease-out으로 끝낸다. */
const FLIP = "transform 280ms cubic-bezier(.23,1,.32,1)";
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
      /* 안착 팝인 → 60ms 후 플립 + 짧은 리프트 + 블룸 */
      setShown(content);
      liftRef.current?.animate(
        [
          { transform: "scale(.96)", opacity: 0.86 },
          { transform: "scale(1.01)", offset: 0.5 },
          { transform: "scale(1)", opacity: 1 },
        ],
          { duration: 220, easing: "cubic-bezier(.23,1,.32,1)" },
        );
      const t = setTimeout(() => {
        setFlipped(true);
        liftRef.current?.animate(
          [
            { transform: "translateY(0) scale(1)" },
            { transform: "translateY(-5px) scale(1.01)", offset: 0.45 },
            { transform: "translateY(0) scale(1)" },
          ],
          { duration: 240, easing: "cubic-bezier(.23,1,.32,1)", fill: "forwards" },
        );
        auraRef.current?.animate(
          [
            { opacity: 0, transform: "scale(.9)" },
            { opacity: 0.3, transform: "scale(1.04)", offset: 0.4 },
            { opacity: 0.1, transform: "scale(1)" },
          ],
          { duration: 260, easing: "cubic-bezier(.23,1,.32,1)", fill: "forwards", delay: 20 },
        );
      }, 60);
      return () => clearTimeout(t);
    }
    /* 교체: 카드가 옆면이 되는 시점에 내용 스왑 + 재플립 + 짧은 블룸 */
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
        { duration: 240, easing: "cubic-bezier(.23,1,.32,1)", fill: "forwards" },
      );
    }, 140);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, content]);

  const face = shown ?? content;
  const reducedMotion = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className={cn("flex w-full min-w-0 flex-col", className)}>
      <style>{FLOAT_CSS}</style>
      <div
        ref={ref}
        data-pulse={pulse ? "true" : undefined}
        className={cn(
          "relative w-full self-center transition-transform duration-200 ease-out",
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
                transition: reducedMotion ? "none" : FLIP,
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
              {/* 앞면 — 편집형 단색 디더 아트 + 축 의미색 리치 텍스트 */}
              <div
                className="absolute inset-0 overflow-hidden border"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderColor: "rgba(255,255,255,.16)",
                  borderRadius: CARD_BORDER_RADIUS,
                  containerType: "inline-size",
                  background: "#090a0d",
                }}
              >
                <TarotArt
                  axisIndex={axisIndex}
                  color={axisColor}
                  className="absolute inset-x-0 top-0 h-[48%] border-b border-white/10"
                />
                <div className="absolute inset-x-0 bottom-0 top-[48%] flex flex-col justify-start overflow-hidden bg-[#090a0d] px-[6.5cqi] py-[5.5cqi] text-left">
                  <span
                    className="mb-[2.5cqi] border-l-[1cqi] pl-[3cqi] text-[6.25cqi] font-black leading-none tracking-tight"
                    style={{ color: axisColor }}
                  >
                    {face?.eyebrow ?? axisLabel}
                  </span>
                  <strong
                    data-card-title
                    className="text-[8.25cqi] font-bold leading-[1.5] text-ink"
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
                      data-card-body
                      className="mt-[2.5cqi] text-[5.5cqi] leading-[1.75] text-mist"
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
            onClick={() => onFill?.()}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onFill?.({ skipMotion: true });
            }}
            aria-label={`${axisLabel} 카드 뽑기`}
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
                data-empty-guide
                className="pointer-events-none relative z-10 flex max-w-[82%] flex-col items-center gap-[4cqi] text-center"
              >
                <strong
                  className="text-[8cqi] font-black leading-[1.5]"
                  style={{ color: "rgba(244,241,233,.94)" }}
                >
                  카드를 눌러 뽑거나
                </strong>
                <small
                  className="text-[5.5cqi] font-semibold leading-[1.75]"
                  style={{ color: "rgba(255,255,255,.52)" }}
                >
                  아래 덱에서 끌어 놓으세요
                </small>
              </span>
            ) : (
              <span
                className="relative z-10 text-[26cqi] font-semibold leading-none"
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
