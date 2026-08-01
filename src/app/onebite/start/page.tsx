import type { Metadata } from "next";
import { OnebiteLanding } from "@/components/organisms/onebite-landing/onebite-landing";

export const metadata: Metadata = {
  title: "한입코치 — 다음 한 끼 행동 하나",
  description: "먹은 사람을 평가하지 않고 음식 사진에서 보이는 것만 확인해 다음 한 끼 행동 하나를 정합니다.",
};

export default function OnebiteStartPage() {
  return <OnebiteLanding />;
}
