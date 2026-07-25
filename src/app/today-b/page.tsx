import type { Metadata } from "next";
import { TodayB } from "@/components/organisms/today-b/today-b";

export const metadata: Metadata = {
  title: "Today B — 아이디어의 7일 수요 실험",
  description: "기존 아이디어에서 가장 위험한 가정을 찾고, 실제 행동을 세는 7일 수요 실험을 만듭니다.",
};

export default function TodayBPage() {
  return <TodayB />;
}
