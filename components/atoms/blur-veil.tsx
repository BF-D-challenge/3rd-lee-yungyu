import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BlurVeilProps extends HTMLAttributes<HTMLDivElement> {
  /** 블러 위에 겹칠 잠금 안내 (CTA 등) */
  overlay?: ReactNode;
}

/** 유료 잠금 콘텐츠 블러 — 수요 리포트·실행 플랜 (PRD §6.4, R5) */
export function BlurVeil({ className, overlay, children, ...props }: BlurVeilProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-card", className)} {...props}>
      <div aria-hidden className="pointer-events-none select-none blur-md opacity-60">
        {children}
      </div>
      {overlay && <div className="absolute inset-0 grid place-items-center p-4">{overlay}</div>}
    </div>
  );
}
