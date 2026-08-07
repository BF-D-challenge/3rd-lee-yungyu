import type { Metadata } from "next";
import { MatpinParallaxPrototype } from "@/components/organisms/tastepin/matpin-css-3d-prototype";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 02 | 2.5D 패럴랙스",
  description: "릴스 공유부터 역별 저장까지 배경·주체·전경의 속도 차이로 이어지는 맛핀 2.5D 패럴랙스 프로토타입",
};

export default function MatpinParallaxPrototypePage() {
  return <MatpinParallaxPrototype />;
}
