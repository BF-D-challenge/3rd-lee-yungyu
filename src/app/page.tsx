import { MvpLab } from "@/components/organisms/mvp-lab/mvp-lab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘의 작은 실험 — 다섯 개 독립 MVP",
  description: "맛핀, 한입코치, Today A, Today B, 랜덤 엔딩을 각각 독립적으로 써보는 실험 허브입니다.",
};

export default function HomePage() {
  return <MvpLab kind="hub" />;
}
