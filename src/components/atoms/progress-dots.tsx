import { cn } from "@/lib/utils";

export interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
  className?: string;
}

/** 온보딩 상단 진행 인디케이터 */
export function ProgressDots({ total, current, className }: ProgressDotsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} role="progressbar"
      aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-5 origin-center rounded-full transition-transform duration-[200ms] ease-out",
            i === current ? "scale-x-100 bg-gold" : "scale-x-[.3] bg-white/20",
          )}
        />
      ))}
    </div>
  );
}
