import type { Metadata } from "next";
import { TodayPreview } from "@/components/organisms/today/today-preview";

export const metadata: Metadata = {
  title: "오늘 해볼까 가짜문 랜딩 미리보기",
  robots: { index: false, follow: false },
};

export default async function TodayPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TodayPreview id={id} />;
}
