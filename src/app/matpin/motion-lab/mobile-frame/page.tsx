import type { Metadata } from "next";
import { MatpinMobileFramePrototype } from "@/components/organisms/tastepin/matpin-mobile-frame";

export const metadata: Metadata = {
  title: "맛핀 모바일 프레임 목업 | 릴스 보내기",
  description: "릴스를 matpin.kr로 보내고 역별 보관함에 저장하는 맛핀 모바일 앱 목업",
};

export default function MatpinMobileFramePage() {
  return <MatpinMobileFramePrototype />;
}
