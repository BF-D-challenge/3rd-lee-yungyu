import type { Metadata } from "next";
import { MatpinCss3dPrototype } from "@/components/organisms/tastepin/matpin-css-3d-prototype";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 01 | CSS 3D",
  description: "릴스 공유부터 역별 보관함 저장까지 이어지는 맛핀의 CSS 3D 스크롤 프로토타입",
};

export default function MatpinCss3dPrototypePage() {
  return <MatpinCss3dPrototype />;
}
