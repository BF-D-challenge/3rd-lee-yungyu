import type { Metadata } from "next";
import { TodayA } from "@/components/organisms/today-a/today-a";

export const metadata: Metadata = {
  title: "Today A — 조건에서 사업 구조 하나 찾기",
  description: "내 조건을 감사 통과 원본과 비교해 돈 낼 사람, 필요한 순간, 입력, 처리, 결과를 한 구조로 정리합니다.",
};

export default function TodayAPage() {
  return <TodayA />;
}
