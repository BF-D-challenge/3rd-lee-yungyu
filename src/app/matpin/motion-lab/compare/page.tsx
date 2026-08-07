import type { Metadata } from "next";
import { MatpinMotionComparison } from "@/components/organisms/tastepin/matpin-motion-comparison";

export const metadata: Metadata = {
  title: "맛핀 모션 비교 | CSS 3D vs 2.5D",
  description: "맛핀의 CSS 3D와 2.5D 패럴랙스 프로토타입을 같은 장면에서 나란히 비교합니다.",
};

export default function MatpinMotionComparePage() {
  return <MatpinMotionComparison />;
}
