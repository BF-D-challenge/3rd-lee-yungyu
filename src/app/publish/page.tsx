"use client";

// [S3] 카드 발행 — 라우트는 organism에 위임 (TASK §1: 라우트에 로직 없음)
import { PublishFlow } from "@/components/organisms/journey/publish-flow";

export default function PublishPage() {
  return <PublishFlow />;
}
