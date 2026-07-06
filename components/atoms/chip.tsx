import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** 객관식 입력의 기본 단위 — 44px 터치 타깃, 선택 시 골드 유리 (PRD §4-1) */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, ...props }, ref) => (
    <button
      ref={ref}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-input px-4 text-sm transition-all duration-200",
        selected ? "glass-gold text-gold" : "glass text-ink hover:bg-white/10",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
