import { MvpLab } from "@/components/organisms/mvp-lab/mvp-lab";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "아이디어핏 — 조건 기반 예시 후보",
  description: "관심 분야와 가능한 시간으로 검증 전 예시 아이디어 후보를 살펴봅니다.",
};

export default function IdeaFitPage() {
  return <MvpLab kind="idea-fit" />;
}
