"use client";

// [S5] 수신자 공개 카드 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
import { VotePanel } from "@/components/organisms/journey/vote-panel";

export default function PublicCardPage({ params }: { params: { slug: string } }) {
  return <VotePanel slug={params.slug} />;
}
