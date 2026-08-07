import type { Metadata } from "next";
import { Suspense } from "react";
import { MatpinConfirm } from "@/components/organisms/tastepin/matpin-confirm";

export const metadata: Metadata = {
  title: "저장 확인 | 맛핀",
  description: "Instagram 릴스에서 확인한 장소를 가까운 역별 보관함에 저장합니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function MatpinConfirmPage() {
  return <Suspense fallback={null}><MatpinConfirm /></Suspense>;
}
