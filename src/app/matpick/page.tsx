import type { Metadata } from "next";
import { MatpickLanding } from "@/components/organisms/tastepin/matpick-landing";

export const metadata: Metadata = {
  title: "MATPICK — 저장한 맛집 릴스를 다시 찾는 가장 짧은 방법",
  description: "저장한 맛집 릴스는 많은데 오늘 갈 곳을 찾기 어렵다면, MATPICK 초기 체험을 예약해보세요.",
};

export default function MatpickPage() {
  return <MatpickLanding />;
}
