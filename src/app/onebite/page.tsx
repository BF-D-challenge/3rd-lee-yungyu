import type { Metadata } from "next";
import { Onebite } from "@/components/organisms/onebite/onebite";

export const metadata: Metadata = {
  title: "한입코치 — 음식 사진으로 다음 한 끼 정하기",
  description: "음식 사진 한 장에서 보이는 음식 그룹을 확인하고 다음 끼니의 작은 행동 하나를 받습니다.",
};

export default function OnebitePage() {
  return <Onebite />;
}
