import type { Metadata } from "next";
import { StoryCards } from "@/components/organisms/story-cards/story-cards";

export const metadata: Metadata = {
  title: "상황 카드 — 장면을 고르고 바로 대화하기",
  description: "오늘 마음에 가까운 타로 스타일 상황 카드 하나를 고르고, 장면 속 안내자와 로그인 없이 바로 대화하세요.",
};

export default function StoryCardsPage() { return <StoryCards />; }
