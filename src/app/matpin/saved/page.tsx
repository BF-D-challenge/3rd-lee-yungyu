import type { Metadata } from "next";
import { MatpinSaved } from "@/components/organisms/tastepin/matpin-saved";

export const metadata: Metadata = {
  title: "역별 맛집 릴스 | 맛핀",
  description: "Instagram에서 맛핀으로 보낸 맛집 릴스를 가까운 역별로 확인합니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function MatpinSavedPage() {
  return <MatpinSaved />;
}
