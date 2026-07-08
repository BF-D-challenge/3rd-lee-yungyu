"use client";

/**
 * [S1] IntroOverlay — 인트로 연속샷 (디자인 리셋 D8/D17, 후보 C "덱의 기원" 확정).
 * 프로토타입: public/_preview/intro-c.html · 설계: prds/assets/인트로-판-설계-산출.json(candidates[2]).
 *
 * 실제 판(SlotMachine) 위에 뜨는 오버레이 하나로 재생한다 — 별도 라우트·페이지 없음(D17).
 * 판은 이미 최종(rest) 상태로 마운트돼 있고(빈 5칸·씨앗 조준 펄스·덱 드리프트·컨트롤),
 * 오버레이는 그 위를 불투명 배경으로 덮고 있다가 끝에서 페이드아웃해 그대로 드러낸다 —
 * 그래서 "마지막 프레임 = 판 첫 프레임"이 항상 픽셀 일치한다(가짜로 흉내내지 않음).
 *
 * 5씬(총 5.5s, 컷 없이 하나의 rAF 타임라인):
 *  S1 0~900    글리치 워드 + 바닥에 옅은 덱 힌트
 *  S2 900~1900 히어로 카드(덱 아펙스)가 카메라로 들려 올라와 화면보다 커짐
 *  S3 1900~2800 카드 정체 공개(시머·광원 점화) + 카메라 하강 틸트 시작, 워드 페이드아웃
 *  S4 2800~4100 5장(필수4+✨스페셜)이 실제 슬롯 칸 좌표(getBoundingClientRect)로 아크 비행
 *  S5 4100~5500 카메라 rest 근접 + 배경 페이드아웃 → 실제 판 그대로 노출
 *
 * 매 방문 재생(D8) — 세션 게이트 없음. 아무 입력이든 즉시 스킵. prefers-reduced-motion 생략.
 */

import { useEffect, useMemo, useRef } from "react";
import type { AxisId } from "@/lib/pools";
import { CardSurface, CARD_SURFACE_CSS } from "./card-surface";

export interface IntroOverlayProps {
  /** 실제 슬롯 칸 DOM ref — 5장 딜아웃의 진짜 목적지(getBoundingClientRect) */
  cellRefs: Record<AxisId, React.RefObject<HTMLDivElement>>;
  /** 재생 완료 또는 스킵 시 1회 호출 — 부모가 오버레이를 언마운트한다 */
  onDone: () => void;
}

const DEAL_ORDER: AxisId[] = ["seed", "pain", "format", "situation", "psych"];

/** 씬 경계(ms, 누적) — S0=0 시작, S1..S5 끝 */
const T = { s1: 900, s2: 1900, s3: 2800, s4: 4100, s5: 5500 };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** t를 [a,b] 구간에서 [0,1]로 정규화 후 이징 적용 — 구간 밖이면 0 또는 1로 고정(단조) */
const remap = (t: number, a: number, b: number, ease: (p: number) => number = easeInOutCubic) =>
  ease(clamp01((t - a) / (b - a)));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export function IntroOverlay({ cellRefs, onDone }: IntroOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const deckHintRef = useRef<HTMLDivElement>(null);
  const dealtRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** S4 시작 시 1회 캡처 — 실제 슬롯 칸 목적지(레이아웃 흔들림 없게 고정) */
  const targetsRef = useRef<{ x: number; y: number; w: number; h: number }[] | null>(null);
  const doneRef = useRef(false);

  const finish = useMemo(
    () => () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    },
    [onDone],
  );

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
          : { x: innerWidth / 2 - 60, y: innerHeight - 160, w: 120, h: 194 };
      });
    };

    const originRect = () => {
      const h = heroRef.current?.getBoundingClientRect();
      return h
        ? { x: h.left, y: h.top, w: h.width, h: h.height }
        : { x: innerWidth / 2 - 20, y: innerHeight - 40, w: 40, h: 64 };
    };

    const tick = (now: number) => {
      const t = now - t0;

      // ── 카메라: 계속 뒤로 빠지며(translateZ↓) 늦게 아래로 기운다(rotateX↑) ──
      const camZ = lerp(40, -420, remap(t, 0, T.s5, easeOutCubic));
      const tilt = lerp(0, 8, remap(t, T.s2, T.s5));
      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${camZ}px) rotateX(${tilt}deg)`;
      }

      // ── 워드: 등장(S1) → 정체 공개 중 소멸(S3) ──
      const wordIn = remap(t, 100, 500, easeOutCubic);
      const wordOut = 1 - remap(t, T.s2 + 400, T.s3, easeOutCubic);
      if (wordRef.current) wordRef.current.style.opacity = String(Math.min(wordIn, wordOut));

      // ── 히어로 카드: 덱 아펙스(작게, 하단)에서 들려 올라와(overscale) → 정상 크기로 수축 → 서서히 소멸 ──
      let scale: number;
      let yFrac: number; // 0=상단, 1=하단(뷰포트 기준 카드 "중심" 위치 비율)
      let heroOpacity = 1;
      if (t < T.s1) {
        scale = lerp(0.16, 0.22, remap(t, 0, T.s1));
        yFrac = 0.92;
      } else if (t < T.s2) {
        scale = lerp(0.22, 3.1, remap(t, T.s1, T.s2, easeOutCubic));
        yFrac = lerp(0.92, 0.46, remap(t, T.s1, T.s2, easeOutCubic));
      } else if (t < T.s3) {
        scale = lerp(3.1, 1, remap(t, T.s2, T.s3));
        yFrac = lerp(0.46, 0.4, remap(t, T.s2, T.s3));
      } else if (t < T.s4) {
        scale = lerp(1, 0.55, remap(t, T.s3, T.s4));
        yFrac = lerp(0.4, 0.3, remap(t, T.s3, T.s4));
      } else {
        scale = lerp(0.55, 0.4, remap(t, T.s4, T.s5));
        yFrac = 0.3;
        heroOpacity = 1 - remap(t, T.s4 + 500, T.s5, easeOutCubic);
      }
      if (heroRef.current) {
        const w = 210 * scale;
        const h = w * (485 / 300);
        heroRef.current.style.width = `${w}px`;
        heroRef.current.style.height = `${h}px`;
        heroRef.current.style.left = "50%";
        heroRef.current.style.top = `${yFrac * 100}vh`;
        heroRef.current.style.transform = "translate(-50%,-50%)";
        heroRef.current.style.opacity = String(heroOpacity);
      }

      // ── 바닥 덱 힌트: S1에만 은은히, 이후 자연 소멸 ──
      if (deckHintRef.current) {
        deckHintRef.current.style.opacity = String(0.5 * (1 - remap(t, T.s1, T.s2)));
      }

      // ── S4: 5장이 히어로 자리에서 실제 슬롯 좌표로 딜아웃 ──
      if (t >= T.s3 && !targetsRef.current) captureTargets();
      const origin = targetsRef.current ? originRect() : null;
      const dealP = remap(t, T.s3 + 200, T.s4, easeOutCubic);
      const fadeOutP = remap(t, T.s4 + 400, T.s5 - 100);
      dealtRefs.current.forEach((el, i) => {
        if (!el || !targetsRef.current || !origin) return;
        const dest = targetsRef.current[i];
        const stagger = clamp01(dealP * 1.5 - i * 0.12);
        const p = easeOutCubic(stagger);
        const x = lerp(origin.x + origin.w / 2, dest.x + dest.w / 2, p);
        const y = lerp(origin.y + origin.h / 2, dest.y + dest.h / 2, p) - Math.sin(p * Math.PI) * 70;
        const w = lerp(origin.w * 0.5, dest.w, p);
        const h = lerp(origin.h * 0.5, dest.h, p);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.transform = "translate(-50%,-50%)";
        el.style.opacity = String(stagger > 0 ? 1 - fadeOutP : 0);
      });

      // ── 배경 페이드아웃 → 실제 판 노출 ──
      const bgOut = remap(t, T.s5 - 500, T.s5);
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
    <div ref={rootRef} aria-hidden className="fixed inset-0 z-50" style={{ perspective: 1300, perspectiveOrigin: "50% 40%" }}>
      <style>{CARD_SURFACE_CSS}</style>
      <div ref={backdropRef} className="absolute inset-0 bg-bg" />

      {/* 바닥 덱 힌트 — S1 전용, 실제 덱을 흉내내지 않고 은은한 빛으로만 존재를 암시 */}
      <div
        ref={deckHintRef}
        className="absolute inset-x-0 bottom-0 h-40 opacity-0"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 100%, rgba(109,180,245,.18), transparent 70%)",
        }}
      />

      <div ref={worldRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {/* 워드 — 세리프 + 블루 고스트 2겹 */}
        <div
          ref={wordRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-0"
        >
          <p className="relative font-serif text-2xl italic tracking-[.06em] text-ink sm:text-3xl">
            <span
              aria-hidden
              className="absolute inset-0 -translate-y-[3px] text-[#3b6cff] opacity-70 blur-[2px]"
            >
              오늘
            </span>
            오늘
          </p>
          <p className="relative mt-1 font-serif text-2xl italic tracking-[.06em] text-ink sm:text-3xl">
            <span
              aria-hidden
              className="absolute inset-0 translate-y-[3px] text-[#3b6cff] opacity-70 blur-[2px]"
            >
              해볼까
            </span>
            해볼까
          </p>
        </div>

        {/* 히어로 카드 — 덱 아펙스가 들려 올라온 것(CardSurface 재사용, 텍스트 없음) */}
        <div ref={heroRef} className="absolute overflow-hidden rounded-card" style={{ boxShadow: "0 0 60px rgba(72,106,255,.3)" }}>
          <CardSurface tier="hot" injectStyle={false} phase={0} className="rounded-card" />
        </div>
      </div>

      {/* 5장 딜아웃 — world 밖(2D 고정좌표)에서 실제 슬롯 rect로 직행, 카메라 3D와 별도 */}
      {DEAL_ORDER.map((axis, i) => (
        <div
          key={axis}
          ref={(el) => {
            dealtRefs.current[i] = el;
          }}
          className="fixed overflow-hidden rounded-card opacity-0"
          style={{ left: "50%", top: "100vh", width: 40, height: 64, transform: "translate(-50%,-50%)" }}
        >
          <CardSurface injectStyle={false} phase={i} className="rounded-card" />
        </div>
      ))}
    </div>
  );
}
