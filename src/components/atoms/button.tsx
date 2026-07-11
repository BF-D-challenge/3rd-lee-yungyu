import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "aurora" | "gold" | "glass" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  // 주요 CTA: Aurora Mesh (PRD §7 — .aurora가 그라데이션·글로우·링 전부 담당)
  aurora: "aurora font-semibold active:translate-y-[1px]",
  // 레거시 gold 호출부도 Primary 단일색으로 수렴한다.
  gold: "bg-primary text-white font-semibold shadow-hard hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] active:translate-y-[2px] active:shadow-none",
  glass: "glass text-ink hover:bg-white/10",
  ghost: "text-mist hover:text-ink",
};

const sizes: Record<Size, string> = {
  md: "h-12 min-h-[48px] px-5 text-sm",
  lg: "h-13 min-h-[52px] px-7 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "glass", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill transition-all duration-200",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
