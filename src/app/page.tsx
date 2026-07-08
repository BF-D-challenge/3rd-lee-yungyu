"use client";

import { useEffect } from "react";
import { PageShell } from "@/components/layouts/page-shell";
import { Faq, FinalCta, Hero, HowItWorks } from "@/components/organisms/landing";
import { track } from "@/lib/track";

/**
 * [L] 랜딩 — 인트로 없음. 첫 프레임이 곧 레퍼런스 프레임:
 * docs/references/simplicity-intro/f11-4510ms.jpg
 * (순흑 배경 + 중앙 글로우 카드 + 양옆 어두운 카드 + 하단 pill 버튼)
 * Hero는 full-bleed라 PageShell 밖에서 렌더한다.
 */

export default function LandingPage() {
  useEffect(() => {
    track("view_landing");
  }, []);

  return (
    <>
      <Hero />
      <PageShell className="pb-16 pt-0">
        <HowItWorks />
        <Faq />
        <FinalCta />
      </PageShell>
    </>
  );
}
