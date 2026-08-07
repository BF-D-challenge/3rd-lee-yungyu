import type { Metadata } from "next";
import { MatpinMotionComparison56 } from "@/components/organisms/tastepin/matpin-motion-comparison";

export const metadata: Metadata = {
  title: "맛핀 모션 비교 | Rive 상태 구조 vs Spline 장면 구조",
  description: "Rive 상태 머신과 Spline 카메라 장면에 연결할 맛핀 동작 구조를 나란히 비교합니다.",
};

export default function MatpinMotionCompare56Page() {
  return <MatpinMotionComparison56 />;
}
