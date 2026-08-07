import type { Metadata } from "next";
import { MatpinStoryboardRanking } from "@/components/organisms/tastepin/matpin-storyboard-ranking";

export const metadata: Metadata = {
  title: "맛핀 스토리보드 랭킹",
  description: "맛핀 스토리보드를 별점과 의견으로 평가하고 라운드별로 후보를 좁힙니다.",
};

export default function MatpinStoryboardRankingPage() {
  return <MatpinStoryboardRanking />;
}
