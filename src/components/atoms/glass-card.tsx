import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  gold?: boolean;
}

/** glassmorphism 2.0 기본 표면 (PRD §7) — 패널·카드·시트 공통 */
export function GlassCard({ className, strong = false, gold = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        gold ? "glass-gold" : strong ? "glass-strong" : "glass",
        className,
      )}
      {...props}
    />
  );
}
