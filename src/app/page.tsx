import { MvpLab } from "@/components/organisms/mvp-lab/mvp-lab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "오늘 해볼까 — 필요한 결과로 고르는 4개 앱",
  description: "맛핀, 한입코치, 오늘 해볼까, 카드너머의 입력과 바로 받는 결과를 비교하고 로그인 없이 시작하세요.",
};

export default function HomePage() {
  return <MvpLab kind="hub" />;
}
