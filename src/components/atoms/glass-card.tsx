import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  gold?: boolean;
}

/** 콘텐츠는 불투명 표면을 기본으로 하고, 부상 레이어만 glass를 사용한다. */
export function GlassCard({ className, strong = false, gold = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-card",
        gold ? "glass-gold" : strong ? "glass-strong" : "surface-card",
        className,
      )}
      {...props}
    />
  );
}
