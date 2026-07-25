import { Tastepin } from "@/components/organisms/tastepin/tastepin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "맛핀 — YouTube 맛집 쇼츠에서 식당 찾기",
  description: "YouTube Shorts 링크를 넣으면 Gemini가 영상 속 식당명, 메뉴, 지역 단서를 자동으로 찾습니다.",
};

export default function TastepinPage() {
  return <Tastepin />;
}
