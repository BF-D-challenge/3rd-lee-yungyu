import type { Metadata } from "next";
import { MatpickSearch } from "@/components/organisms/tastepin/matpick-search";
import { createTastepinLibrary } from "@/lib/tastepin-library-data";

export const metadata: Metadata = {
  title: "맛집 검색 — MATPICK",
  description: "음식점, 지역, 메뉴로 MATPICK의 릴스와 쇼츠 맛집을 검색합니다.",
};

export default function MatpickSearchPage() {
  return <MatpickSearch initialLibrary={createTastepinLibrary()} />;
}
