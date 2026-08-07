import type { Metadata } from "next";
import { MatpinMotionComparison531 } from "@/components/organisms/tastepin/matpin-motion-comparison";

export const metadata: Metadata = {
  title: "맛핀 모션 비교 | 05 vs 03 vs 01",
  description: "고정 상태, Motion 전환, CSS 3D 깊이를 같은 장면에서 비교합니다.",
};

export default function MatpinMotionComparison531Page() {
  return <MatpinMotionComparison531 />;
}
