import type { Metadata } from "next";
import { MatpinRiveStatePrototype } from "@/components/organisms/tastepin/matpin-advanced-motion-prototypes";

export const metadata: Metadata = {
  title: "맛핀 모션 실험 05 | Rive 상태 구조",
  description: "실제 .riv 연결 전에 공유·확인·저장 상태 전환을 검증하는 맛핀 동작 구조 프로토타입",
};

export default function MatpinRiveStatePage() {
  return <MatpinRiveStatePrototype />;
}
