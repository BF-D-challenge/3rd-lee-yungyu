import type { Metadata } from "next";
import { MatpickImport } from "@/components/organisms/tastepin/matpick-import";

export const metadata: Metadata = {
  title: "YouTube Shorts 저장 — 맛핀",
  description: "공개 맛집 Shorts 링크에서 장소 후보를 찾고, 확인한 뒤 맛핀 저장함에 추가합니다.",
};

export default function MatpickImportPage() {
  return <MatpickImport />;
}
