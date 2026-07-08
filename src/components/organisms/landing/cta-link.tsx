"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";

export interface CtaLinkProps {
  href: string;
  /** 계측: landing_cta_click{position} */
  position: string;
  children: ReactNode;
  className?: string;
}

/** 주요 CTA 링크 — Button aurora variant와 동일한 Aurora Mesh 표면 */
export function CtaLink({ href, position, children, className }: CtaLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => track("landing_cta_click", { position })}
      className={cn(
        "aurora inline-flex min-h-[52px] items-center justify-center gap-2 rounded-pill px-8",
        "text-base font-semibold transition-all duration-200 active:translate-y-[1px]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
