import type { Metadata } from "next";
import { MatpickLanding } from "@/components/organisms/tastepin/matpick-landing";

export const metadata: Metadata = {
  title: "맛핀 — 맛집 릴스를 공유하면 지도에 자동 정리",
  description: "Instagram 맛집 릴스를 matpin.kr로 공유하면 영상 속 장소를 찾아 원본 릴스와 함께 지도에 정리해요.",
};

export default function MatpickPage() {
  return <MatpickLanding />;
}
