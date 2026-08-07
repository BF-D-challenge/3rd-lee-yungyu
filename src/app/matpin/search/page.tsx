import type { Metadata } from "next";
import { MatpinSaved } from "@/components/organisms/tastepin/matpin-saved";

export const metadata: Metadata = {
  title: "맛집 릴스 검색 | 맛핀",
  description: "Instagram에서 저장한 맛집 릴스를 역과 가게 이름으로 찾습니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function MatpinSearchPage() {
  return <MatpinSaved autoFocusSearch />;
}
