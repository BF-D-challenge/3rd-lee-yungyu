"use client";

// [S6] 수요 대시보드 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
import { DemandBoard } from "@/components/organisms/journey/demand-board";

export default function DashboardPage() {
  return <DemandBoard />;
}
