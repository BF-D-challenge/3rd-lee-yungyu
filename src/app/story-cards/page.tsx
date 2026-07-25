import type { Metadata } from "next";
import { StoryCards } from "@/components/organisms/story-cards/story-cards";

export const metadata: Metadata = {
  title: "랜덤 엔딩 — 8번 고르면 한 편 완성",
  description: "랜덤 카드 한 장을 열고 8번 선택하면 결말을 바로 보는 무료 단편 MVP입니다.",
};

export default function StoryCardsPage() { return <StoryCards />; }
