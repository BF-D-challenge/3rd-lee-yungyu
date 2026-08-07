import type { Metadata } from "next";
import { MatpinMotionScrollPrototype } from "@/components/organisms/tastepin/matpin-advanced-motion-prototypes";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 03 | Motion 스크롤",
  description: "Motion으로 릴스 공유부터 역별 저장까지 DOM 장면을 연결한 맛핀 스크롤 프로토타입",
};

export default function MatpinMotionScrollPage() {
  return <MatpinMotionScrollPrototype />;
}
