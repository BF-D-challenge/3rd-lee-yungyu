"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";

/**
 * [L] 인트로 4단계 (~4.5s) — toss.im/simplicity 이식 (docs/references/simplicity-intro/README.md)
 *
 *  A. 워드 등장   0~1.2s : `오늘` `해볼까` Playfair 자간 넓게 순차 페이드
 *  B. 빛줄기 스윕 0.6~2.4s: 골드→퍼플 그라디언트 스트립 + mix-blend-mode lighten (재현 원칙 1)
 *  C. 워드마크 블룸 2.4~3.3s: 두 워드 수렴 + 골드 라디얼 블룸
 *  D. 카드 안착   3.3~4.5s: 오버레이가 걷히며 히어로 중앙의 9:16 aurora 카드가
 *     settle-to-card로 축소 안착 — 카드 안에도 같은 세리프 `오늘 해볼까` 워드마크가 있어
 *     인트로 워드마크가 제자리에서 카드 속 워드마크로 이어진다
 *     (인트로 마지막 프레임 = 히어로 첫 프레임, 원 컨티뉴어스 샷, 재현 원칙 2)
 *
 * 아무 입력이든 즉시 스킵 · sessionStorage 세션 1회 · reduced-motion은 부모(page)에서 생략.
 */

type Phase = "words" | "streak" | "bloom" | "settle";

const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

export interface IntroSequenceProps {
  /** D단계 진입 시점 — 히어로 카드가 settle-to-card 애니메이션을 시작해야 함 */
  onSettle: () => void;
  /** 인트로 종료(완주 또는 스킵) — 오버레이 언마운트 */
  onDone: (skipped: boolean) => void;
}

export function IntroSequence({ onSettle, onDone }: IntroSequenceProps) {
  const [phase, setPhase] = useState<Phase>("words");
  const callbacks = useRef({ onSettle, onDone });
  callbacks.current = { onSettle, onDone };

  useEffect(() => {
    let finished = false;
    const finish = (skipped: boolean) => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem("introSeen", "1");
      } catch {
        /* 스토리지 차단돼도 인트로는 반드시 닫혀야 한다 */
      }
      if (skipped) track("intro_skip");
      callbacks.current.onDone(skipped);
    };
    const skip = () => finish(true);

    const timers = [
      setTimeout(() => setPhase("streak"), 600),
      setTimeout(() => setPhase("bloom"), 2400),
      setTimeout(() => {
        setPhase("settle");
        callbacks.current.onSettle();
      }, 3300),
      setTimeout(() => finish(false), 4500),
    ];

    const skipEvents = ["pointerdown", "wheel", "keydown"] as const;
    skipEvents.forEach((e) => window.addEventListener(e, skip));

    return () => {
      timers.forEach(clearTimeout);
      skipEvents.forEach((e) => window.removeEventListener(e, skip));
    };
  }, []);

  const settling = phase === "settle";
  const converged = phase === "bloom" || settling;

  return (
    <div
      data-intro
      aria-hidden
      className={cn(
        "fixed inset-0 z-50 grid place-items-center overflow-hidden bg-bg",
        // D단계: 오버레이가 걷히며 그 뒤 히어로 카드의 settle-to-card가 드러난다
        "transition-opacity duration-[1100ms] ease-out",
        settling ? "opacity-0" : "opacity-100",
      )}
    >
      {/* A→C: 워드 등장 → 워드마크 수렴 */}
      <h1
        className={cn(
          "flex select-none font-serif text-4xl text-ink transition-all duration-700 lg:text-6xl",
          converged
            ? "gap-[0.25em] tracking-[0.02em]"
            : "gap-[0.55em] tracking-[0.35em]",
          converged && "scale-110",
          settling && "scale-95 opacity-0",
        )}
      >
        <span style={{ animation: `fade-up 0.8s ${EASE} both` }}>오늘</span>
        <span style={{ animation: `fade-up 0.8s ${EASE} 0.35s both` }}>해볼까</span>
      </h1>

      {/* B: 빛줄기 스윕 — 검정 위 lighten 블렌드 (streak-sweep 1.8s ×2) */}
      {phase !== "words" && !settling && <div className="intro-streak" />}

      {/* C: 화면 가장자리 골드 라디얼 블룸 */}
      {converged && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            animation: `bloom 0.9s ${EASE} both`,
            background:
              "radial-gradient(140% 140% at 50% 50%, transparent 35%, rgba(201, 169, 98, 0.22) 78%, rgba(178, 136, 246, 0.18) 100%)",
          }}
        />
      )}
    </div>
  );
}
