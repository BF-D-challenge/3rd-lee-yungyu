import type { Metadata } from "next";
import { MatpinSplineScenePrototype } from "@/components/organisms/tastepin/matpin-advanced-motion-prototypes";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 06 | Spline 장면 구조",
  description: "실제 Spline 장면 연결 전에 릴스와 저장 결과 사이 카메라 동선을 검증하는 맛핀 장면 구조 프로토타입",
};

export default function MatpinSplineScenePage() {
  return <MatpinSplineScenePrototype />;
}
