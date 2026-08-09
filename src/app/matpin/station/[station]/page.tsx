import type { Metadata } from "next";
import { MatpinStation } from "@/components/organisms/tastepin/matpin-station";

export const metadata: Metadata = {
  title: "역별 맛집 게시물 | 맛핀",
  description: "선택한 역에서 가기 쉬운 저장 게시물을 확인합니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function MatpinStationPage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station } = await params;
  return <MatpinStation stationName={decodeURIComponent(station)} />;
}
