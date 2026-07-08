"use client";

// [S0] 씨앗 온보딩 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
import { Onboarding } from "@/components/organisms/journey/onboarding";

export default function StartPage() {
  return <Onboarding />;
}
