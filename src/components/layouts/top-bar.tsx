import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  right?: ReactNode;
  className?: string;
}

/** 상단 바 — 핵심 제작기와 같은 좌측 정렬·산세리프 워드마크를 사용한다. */
export function TopBar({ right, className }: TopBarProps) {
  return (
    <header className={cn("relative flex h-14 items-center", className)}>
      <Link href="/" className="text-base font-extrabold tracking-[-0.025em] text-primary transition-colors hover:text-primary-hover">
        오늘 해볼까
      </Link>
      {right && <div className="absolute right-0 top-1/2 -translate-y-1/2">{right}</div>}
    </header>
  );
}
