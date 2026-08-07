import type { Metadata } from "next";
import { MatpinMotionComparison34 } from "@/components/organisms/tastepin/matpin-motion-comparison";

export const metadata: Metadata = {
  title: "맛핀 모션 비교 | Motion vs 사전 렌더 영상",
  description: "맛핀의 Motion 스크롤과 사전 렌더 영상 프로토타입을 같은 장면에서 나란히 비교합니다.",
};

export default function MatpinMotionCompare34Page() {
  return <MatpinMotionComparison34 />;
}
