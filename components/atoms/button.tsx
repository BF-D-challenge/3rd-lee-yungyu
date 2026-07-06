import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "aurora" | "gold" | "glass" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  // 주요 CTA: Aurora Mesh (PRD §7 — .aurora가 그라데이션·글로우·링 전부 담당)
  aurora: "aurora font-semibold active:translate-y-[1px]",
  // 보조 시그니처: 솔리드 골드 + 하드 오프셋 그림자
  gold: "bg-gold text-bg font-semibold shadow-hard active:translate-y-[2px] active:shadow-none",
  glass: "glass text-ink hover:bg-white/10",
  ghost: "text-mist hover:text-ink",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
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
