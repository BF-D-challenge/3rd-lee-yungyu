import type { Metadata } from "next";
import { MatpickDm } from "@/components/organisms/tastepin/matpick-dm";

export const metadata: Metadata = {
  title: "Instagram 릴스 저장 — MATPICK",
  description: "공개 맛집 릴스 링크에서 장소 후보를 찾고, 직접 확인한 뒤 내 저장함에 추가합니다.",
};

export default function MatpickDmPage() {
  return <MatpickDm />;
}
