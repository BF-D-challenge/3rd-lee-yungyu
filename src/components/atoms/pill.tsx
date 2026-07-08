import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 알약 라벨 — 카운터·뱃지·eyebrow 용 */
export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "glass inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs text-mist",
        className,
      )}
      {...props}
    />
  );
}
