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
            "h-1.5 rounded-full transition-all duration-300",
            i === current ? "w-5 bg-gold" : "w-1.5 bg-white/20",
          )}
        />
      ))}
    </div>
  );
}
