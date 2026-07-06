"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layouts/page-shell";
import { IntroSequence } from "@/components/organisms/intro-sequence";
import { Faq, FinalCta, Hero, HowItWorks } from "@/components/organisms/landing";
import { track } from "@/lib/track";

/**
 * [L] 랜딩 + 인트로 — 미니멀 4섹션 (히어로 · 어떻게 되나요 · FAQ · 최종 CTA)
 * - 디자인 북극성: docs/references/simplicity-intro/f11-4510ms.jpg
 *   (순흑 배경 + 중앙 9:16 카드 하나 + pill 버튼 하나)
 * - 인트로는 세션 1회, reduced-motion 시 생략, 아무 입력이든 즉시 스킵.
 * - 인트로 D단계에서 오버레이가 걷히며 히어로 중앙 카드가 settle-to-card로 안착
 *   → 인트로와 랜딩은 두 장면이 아니라 하나의 연속 샷.
 */

type Stage = "boot" | "intro" | "landing";

export default function LandingPage() {
  const [stage, setStage] = useState<Stage>("boot");
  const [entrance, setEntrance] = useState<"settle" | "static">("static");

  useEffect(() => {
    track("view_landing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || sessionStorage.getItem("introSeen")) {
      setStage("landing"); // 정적 히어로
    } else {
      setStage("intro");
    }
  }, []);

  return (
    <>
      {/* 하이드레이션 전 랜딩 플래시 방지 커버 (인트로 여부 판정 전) */}
      {stage === "boot" && <div aria-hidden className="fixed inset-0 z-50 bg-bg" />}

      {stage === "intro" && (
        <IntroSequence
          onSettle={() => setEntrance("settle")}
          onDone={() => setStage("landing")}
        />
      )}

      <PageShell className="pb-16 pt-0">
        <Hero entrance={entrance} />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </PageShell>
    </>
  );
}
