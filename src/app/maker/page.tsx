import type { Metadata } from "next";
import { TodayApp } from "@/components/organisms/oneul/today-app";

export const metadata: Metadata = {
  title: "오늘 해볼까 — 오늘 만들 아이디어 한 개",
  description: "검증된 제품에서 오늘 만들 한 가지를 찾아보세요.",
};

export default function MakerPage() {
  return <TodayApp />;
}
