import type { Metadata } from "next";
import { Onebite } from "@/components/organisms/onebite/onebite";

export const metadata: Metadata = {
  title: "한입코치 — 사진 한 장이면 혼나고, 다음 끼니로 복귀",
  description: "음식 사진을 보내면 선택을 짚는 팩폭 한 방과 다음 끼니에 할 행동 하나를 받습니다.",
};

export default function OnebitePage() {
  return <Onebite />;
}
