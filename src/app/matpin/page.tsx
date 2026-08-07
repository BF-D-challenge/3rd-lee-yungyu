import type { Metadata } from "next";
import { MatpinMobileFramePrototype } from "@/components/organisms/tastepin/matpin-mobile-frame";

export const metadata: Metadata = {
  title: "맛핀 | 맛집 릴스를 역별로 자동 정리",
  description: "Instagram에서 matpin.kr 계정으로 맛집 릴스를 보내면 장소를 확인해 가까운 역별 보관함에 정리해요.",
};

export default function MatpinPage() {
  return <MatpinMobileFramePrototype variant="landing" />;
}
