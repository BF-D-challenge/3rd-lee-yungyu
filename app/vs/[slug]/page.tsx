"use client";

// [S5-VS] A/B 응원 대결 수신자 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
import { DuelPanel } from "@/components/organisms/journey/duel-panel";

export default function DuelPage({ params }: { params: { slug: string } }) {
  return <DuelPanel slug={params.slug} />;
}
