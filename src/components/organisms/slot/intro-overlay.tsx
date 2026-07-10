"use client";

/**
 * IntroOverlay — 인트로 스토리보드 v2 "빛의 자리, 검은 카드".
 *
 * 유지하는 골격: 판 위 오버레이, 단일 rAF 타임라인, 실제 SlotCell rect 목적지,
 * 모든 입력 즉시 스킵, prefers-reduced-motion 생략.
 */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { buildDeck, type AxisId } from "@/lib/pools";
import { backSvg } from "./card-back";
import { CardSurface, CARD_SURFACE_CSS } from "./card-surface";
import { FanDeck } from "./fan-deck";

export interface IntroOverlayProps {
  /** 실제 슬롯 칸 DOM ref — 자리 점화와 5장 딜아웃의 진짜 목적지(getBoundingClientRect) */
  cellRefs: Record<AxisId, RefObject<HTMLDivElement>>;
  /** 재생 완료 또는 스킵 시 1회 호출 — 부모가 오버레이를 언마운트한다 */
  onDone: () => void;
}

/** v8: 화면에 보이는 카드는 4장(psych는 백엔드 전용) — 딜아웃도 4장만 */
const DEAL_ORDER: AxisId[] = ["seed", "pain", "format", "situation"];

/** 씬 경계(ms, 누적) — 총 5.0s */
const T = { s1: 800, s2: 1900, s3: 3000, s4: 4200, s5: 5000 };
const CARD_RATIO = 485 / 300;

type RectLike = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** t를 [a,b] 구간에서 [0,1]로 정규화 후 이징 적용 — 구간 밖이면 0 또는 1로 고정(단조) */
const remap = (t: number, a: number, b: number, ease: (p: number) => number = easeInOutCubic) =>
  ease(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const center = (r: RectLike): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const arcPoint = (from: Point, to: Point, p: number, lift: number): Point => {
  const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
  const inv = 1 - p;
  return {
    x: inv * inv * from.x + 2 * inv * p * mid.x + p * p * to.x,
    y: inv * inv * from.y + 2 * inv * p * mid.y + p * p * to.y,
  };
};

const INTRO_CSS = `
@keyframes io-aim{0%,100%{opacity:.72;transform:translate(-50%,-50%) scale(1)}50%{opacity:.18;transform:translate(-50%,-50%) scale(1.12)}}
.io-aim{animation:io-aim 1s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.io-aim{animation:none}}
`;

export function IntroOverlay({ cellRefs, onDone }: IntroOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLParagraphElement>(null);
  const tryRef = useRef<HTMLParagraphElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const aimRef = useRef<HTMLDivElement>(null);
  const wellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dealtRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** S2/S4 공용 캡처 — 실제 슬롯 칸 목적지(레이아웃 흔들림 없게 고정) */
  const targetsRef = useRef<RectLike[] | null>(null);
  const doneRef = useRef(false);

  const finish = useMemo(
    () => () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    },
    [onDone],
  );
  const introDeck = useMemo(() => buildDeck(null, null), []);
  const cardBack = useMemo(() => backSvg(), []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }

    let raf = 0;
    const t0 = performance.now();

    const captureTargets = () => {
      targetsRef.current = DEAL_ORDER.map((axis) => {
        const r = cellRefs[axis]?.current?.getBoundingClientRect();
        return r
          ? { x: r.left, y: r.top, w: r.width, h: r.height }
          : { x: innerWidth / 2 - 60, y: innerHeight - 260, w: 120, h: 194 };
      });
    };

    const deckOrigin = (): RectLike => {
      const mobile = innerWidth < 761;
      const w = mobile ? 84 : 100;
      const h = mobile ? 122 : 146;
      const cy = innerHeight - (mobile ? 150 : 175);
      return { x: innerWidth / 2 - w / 2, y: cy - h / 2, w, h };
    };

    const placeRect = (el: HTMLElement, rect: RectLike) => {
      el.style.left = `${rect.x + rect.w / 2}px`;
      el.style.top = `${rect.y + rect.h / 2}px`;
      el.style.width = `${rect.w}px`;
      el.style.height = `${rect.h}px`;
    };

    captureTargets();

    const tick = (now: number) => {
      const t = now - t0;
      if (!targetsRef.current && t >= T.s1) captureTargets();

      // ── 카메라: S5에서 판 rest와 맞추며 dolly-out (rotateX 2°→8°, translateZ 40→-480) ──
      const stageP = remap(t, T.s4, T.s5, easeOutCubic);
      const camZ = lerp(40, -480, stageP);
      const tilt = lerp(2, 8, stageP);
      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${camZ}px) rotateX(${tilt}deg)`;
      }

      // ── S1 말: "오늘" → "해볼까" 순차 등장 + 블루 고스트 ──
      const wordFade = 1 - remap(t, T.s1 + 120, T.s2, easeOutCubic);
      const todayIn = remap(t, 80, 320, easeOutCubic);
      const tryIn = remap(t, 300, 650, easeOutCubic);
      if (todayRef.current) {
        todayRef.current.style.opacity = String(todayIn * wordFade);
        todayRef.current.style.transform = `translateY(${lerp(8, 0, todayIn)}px)`;
      }
      if (tryRef.current) {
        tryRef.current.style.opacity = String(tryIn * wordFade);
        tryRef.current.style.transform = `translateY(${lerp(10, 0, tryIn)}px)`;
      }

      // ── S2 자리: 실제 슬롯 위치 위에서 5개 우물이 왼쪽부터 점화되고 가라앉는다 ──
      if (targetsRef.current) {
        wellRefs.current.forEach((el, i) => {
          if (!el || !targetsRef.current) return;
          const dest = targetsRef.current[i];
          placeRect(el, dest);
          const ignite = remap(t, T.s1 + i * 165, T.s1 + 420 + i * 165, easeOutCubic);
          const settle = lerp(1, 0.58, remap(t, T.s1 + 460 + i * 165, T.s2 + 160, easeOutCubic));
          const fade = 1 - remap(t, T.s4 + 250, T.s5 - 120, easeOutCubic);
          const breath = Math.sin(Math.min(1, ignite) * Math.PI);
          const opacity = ignite * settle * fade;
          el.style.opacity = String(opacity);
          el.style.transform = `translate(-50%,-50%) scale(${0.96 + breath * 0.08})`;
        });
      }

      // ── S3 덱: 실제 FanDeck이 하단에서 슬라이드인 ──
      if (deckRef.current) {
        const deckIn = remap(t, T.s2, T.s3 - 350, easeOutCubic);
        const deckOut = 1 - remap(t, T.s4 + 260, T.s5 - 100, easeOutCubic);
        deckRef.current.style.opacity = String(deckIn * deckOut);
        deckRef.current.style.transform = `translateY(${lerp(180, 0, deckIn)}px) scale(${lerp(0.96, 1, deckIn)})`;
      }

      const origin = deckOrigin();
      const originCenter = center(origin);
      const seed = targetsRef.current?.[0];

      // ── S4: 덱이 완전히 자리 잡으면(deckIn 종료 지점) 곧바로 필수 4장 + 히든 psych 1장을 실제 슬롯 rect로 순차 딜.
      //    (이전에 있던 "카드 1장 왕복 예고" 연출은 안착 안 하고 튕겨 나오는 것처럼 보여 제거함 — 2026-07-08)
      const dealStart = T.s3 - 200;
      const dealFade = 1 - remap(t, T.s4 + 420, T.s5 - 80, easeOutCubic);
      dealtRefs.current.forEach((el, i) => {
        if (!el || !targetsRef.current) return;
        const dest = targetsRef.current[i];
        const raw = clamp01((t - (dealStart + i * 112)) / 470);
        const p = easeInOutCubic(raw);
        const pos = arcPoint(originCenter, center(dest), p, 130 - i * 6);
        const w = lerp(origin.w, dest.w, p);
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${w * CARD_RATIO}px`;
        el.style.opacity = String((raw > 0 ? 1 : 0) * dealFade);
        el.style.transform = `translate(-50%,-50%) rotate(${lerp((i - 2) * 5, 0, p)}deg)`;
      });

      // ── S5 무대: 상단 질문 캡션과 씨앗 자리 조준 펄스 ──
      const captionP = remap(t, T.s4 + 80, T.s5 - 150, easeOutCubic);
      if (captionRef.current) {
        captionRef.current.style.opacity = String(captionP);
        captionRef.current.style.transform = `translate(-50%,${lerp(-6, 0, captionP)}px)`;
      }
      if (aimRef.current && seed) {
        placeRect(aimRef.current, seed);
        // 씨앗 카드가 실제로 안착한 직후부터 켜져서 끝까지 유지 — "여기가 방금 채워진 자리"를 알려줌
        const aimP = remap(t, dealStart + 470, dealStart + 700, easeOutCubic);
        aimRef.current.style.opacity = String(aimP);
      }

      // ── 배경 페이드아웃 → 실제 판 노출 ──
      const bgOut = remap(t, T.s5 - 520, T.s5, easeOutCubic);
      if (backdropRef.current) backdropRef.current.style.opacity = String(1 - bgOut);
      if (rootRef.current) rootRef.current.style.pointerEvents = bgOut > 0.98 ? "none" : "auto";

      if (t >= T.s5) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const skip = () => {
      cancelAnimationFrame(raf);
      finish();
    };
    const evts = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    evts.forEach((e) => window.addEventListener(e, skip, { once: true }));

    return () => {
      cancelAnimationFrame(raf);
      evts.forEach((e) => window.removeEventListener(e, skip));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ perspective: 1300, perspectiveOrigin: "50% 40%" }}
    >
      <style>{CARD_SURFACE_CSS}</style>
      <style>{INTRO_CSS}</style>
      <div ref={backdropRef} className="absolute inset-0 bg-bg" />

      <div ref={worldRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {/* S1 말 — 세리프 + 블루 고스트 2겹 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p ref={todayRef} className="relative font-serif text-2xl italic tracking-[.06em] text-ink opacity-0 sm:text-3xl">
            <span
              aria-hidden
              className="absolute inset-0 -translate-y-[3px] text-[#3b6cff] opacity-70 blur-[2px]"
            >
              오늘
            </span>
            오늘
          </p>
          <p ref={tryRef} className="relative mt-1 font-serif text-2xl italic tracking-[.06em] text-ink opacity-0 sm:text-3xl">
            <span
              aria-hidden
              className="absolute inset-0 translate-y-[3px] text-[#3b6cff] opacity-70 blur-[2px]"
            >
              해볼까
            </span>
            해볼까
          </p>
        </div>
      </div>

      {/* S5 질문 캡션 — 실제 판의 stepbar 질문으로 자연스럽게 넘겨주는 잔광 */}
      <div
        ref={captionRef}
        className="fixed left-1/2 top-[clamp(70px,12dvh,118px)] z-[4] text-center font-serif text-sm italic text-glow opacity-0"
      >
        무엇에서 시작할까?
      </div>

      {/* S2 자리 점화 — 실제 SlotCell rect 위의 빛. 카드는 아니므로 CardSurface empty/aim을 유지한다. */}
      {DEAL_ORDER.map((axis, i) => (
        <div
          key={`well-${axis}`}
          ref={(el) => {
            wellRefs.current[i] = el;
          }}
          className="fixed z-[2] overflow-hidden rounded-card opacity-0"
          style={{ left: "50%", top: "100vh", width: 120, height: 194, transform: "translate(-50%,-50%)" }}
        >
          <CardSurface tier="empty" aim injectStyle={false} phase={i} className="rounded-card" />
        </div>
      ))}

      {/* S3 실제 FanDeck — 하단에서 올라오는 검은 카드지 덱 */}
      <div ref={deckRef} className="pointer-events-none fixed inset-0 z-[3] opacity-0">
        <FanDeck
          cards={introDeck}
          aimAxis={null}
          inactiveAxes={[]}
          getTargetRect={() => null}
          onDragOver={() => undefined}
          onPick={() => undefined}
        />
      </div>

      {/* 씨앗 자리 조준 펄스 — 씨앗 카드 안착 직후 점화 + 마지막 프레임 플레이 가능 상태 */}
      <div
        ref={aimRef}
        className="io-aim fixed z-[5] rounded-card border-2 border-glow opacity-0 shadow-[0_0_34px_rgba(109,180,245,.34)]"
        style={{ left: "50%", top: "100vh", width: 120, height: 194 }}
      />

      {/* 5장 딜아웃 — world 밖(2D 고정좌표)에서 실제 슬롯 rect로 아크 비행 */}
      {DEAL_ORDER.map((axis, i) => (
        <div
          key={axis}
          ref={(el) => {
            dealtRefs.current[i] = el;
          }}
          className="fixed z-[6] overflow-hidden rounded-card opacity-0 shadow-[0_16px_28px_rgba(0,0,0,.48)] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
          style={{ left: "50%", top: "100vh", width: 100, height: 146, transform: "translate(-50%,-50%)" }}
          dangerouslySetInnerHTML={{ __html: cardBack }}
        />
      ))}
    </div>
  );
}
