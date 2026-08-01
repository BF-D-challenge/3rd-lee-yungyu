import type { Metadata } from "next";
import { TastepinMap } from "@/components/organisms/tastepin/tastepin-map";
import { createTastepinLibrary } from "@/lib/tastepin-library-data";

export const metadata: Metadata = {
  title: "MATPICK 데모 저장함",
  description: "공개 릴스에서 확인한 장소를 원본 영상과 함께 보는 MATPICK 데모 저장함입니다.",
};

export default function MatpickMapPage() {
  return <TastepinMap initialLibrary={createTastepinLibrary()} />;
}
