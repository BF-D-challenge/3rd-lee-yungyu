import type { Metadata } from "next";
import { Today } from "@/components/organisms/today/today";

export const metadata: Metadata = {
  title: "오늘 해볼까 — 아이디어 테스트 자료를 24시간 뒤에",
  description: "아이디어를 자료로 다듬거나 쉬운 질문으로 찾고, 24시간 뒤 광고 이미지·가짜문 랜딩·측정 기준 초안을 받습니다.",
  alternates: { canonical: "/today" },
};

export default function TodayPage() {
  return <Today />;
}
