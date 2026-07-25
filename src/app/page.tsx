import { MvpLab } from "@/components/organisms/mvp-lab/mvp-lab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘의 작은 실험 — 세 가지 MVP",
  description: "맛핀, 한입코치, 아이디어핏을 각각 가볍게 써보는 실험 허브입니다.",
};

export default function HomePage() {
  return <MvpLab kind="hub" />;
}
