import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  /** narrow(기본): 중앙 560px 1열 — 전 화면 모바일 친화 · wide: 슬롯 덱 등 전폭 필요 화면 */
  width?: "wide" | "narrow";
}

/** 페이지 공통 셸 — 중앙 정렬 단일 컬럼 (미니멀 리디자인) */
export function PageShell({ className, width = "narrow", ...props }: PageShellProps) {
  return (
    <main
      className={cn(
        "mx-auto min-h-dvh w-full px-5 pb-32 pt-4",
        width === "narrow" ? "max-w-narrow" : "max-w-wide lg:px-10",
        className,
      )}
      {...props}
    />
  );
}
