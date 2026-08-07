import type { Metadata } from "next";
import { OnebiteLanding } from "@/components/organisms/onebite-landing/onebite-landing";

export const metadata: Metadata = {
  title: "한입코치 — 혼나고 다음 끼니로 복귀",
  description: "사진 한 장이면 팩폭 한 방과 다음 끼니 행동 하나. 몸과 인격이 아니라 선택과 패턴만 짚습니다.",
};

export default function OnebiteStartPage() {
  return <OnebiteLanding />;
}
