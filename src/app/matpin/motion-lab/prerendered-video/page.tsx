import type { Metadata } from "next";
import { MatpinPrerenderedVideoPrototype } from "@/components/organisms/tastepin/matpin-advanced-motion-prototypes";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 04 | 사전 렌더 영상",
  description: "실사와 릴스 이미지를 미리 렌더한 영상을 스크롤로 재생하는 맛핀 프로토타입",
};

export default function MatpinPrerenderedVideoPage() {
  return <MatpinPrerenderedVideoPrototype />;
}
