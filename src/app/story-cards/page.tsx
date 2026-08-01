import type { Metadata } from "next";
import { StoryCards } from "@/components/organisms/story-cards/story-cards";

export const metadata: Metadata = {
  title: "카드너머 — 카드를 고르면, 그가 먼저 말을 걸어요",
  description: "네 장의 타로에서 서로 다른 남자 주인공을 고르고, 선택한 장면에서 바로 대화를 시작하세요.",
};

export default function StoryCardsPage() { return <StoryCards />; }
