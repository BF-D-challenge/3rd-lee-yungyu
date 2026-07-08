import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** 하단 고정 CTA 영역 — 엄지존 (v3 §10.3 공통 원칙) */
export function BottomCta({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-bg via-bg/90 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-narrow flex-col gap-2">{children}</div>
    </div>
  );
}
