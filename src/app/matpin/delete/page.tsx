import type { Metadata } from "next";
import { MatpinDeleteData } from "@/components/organisms/tastepin/matpin-delete-data";

export const metadata: Metadata = {
  title: "내 데이터 삭제 | 맛핀",
  description: "맛핀 역별 보관함에 저장된 릴스 장소와 계정 연결 데이터를 삭제합니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function MatpinDeletePage() {
  return <MatpinDeleteData />;
}
