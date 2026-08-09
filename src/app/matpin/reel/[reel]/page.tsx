import type { Metadata } from "next";
import { MatpinReelDetail } from "@/components/organisms/tastepin/matpin-reel-detail";

export const metadata: Metadata = {
  title: "저장한 맛집 게시물 | 맛핀",
  description: "저장한 원본 게시물와 선택한 역에서 가까운 장소 정보를 확인합니다.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function MatpinReelPage({
  params,
  searchParams,
}: {
  params: Promise<{ reel: string }>;
  searchParams: Promise<{ station?: string }>;
}) {
  const [{ reel }, query] = await Promise.all([params, searchParams]);
  return <MatpinReelDetail reelId={decodeURIComponent(reel)} stationName={query.station ?? ""} />;
}
