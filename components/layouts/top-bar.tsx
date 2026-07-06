import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  right?: ReactNode;
  className?: string;
}

/** 상단 바 — 중앙 워드마크만 (미니멀). right 슬롯은 우측에 겹쳐 뜬다 */
export function TopBar({ right, className }: TopBarProps) {
  return (
    <header className={cn("relative flex h-14 items-center justify-center", className)}>
      <Link href="/" className="font-serif text-base tracking-tight text-mist transition-colors hover:text-ink">
        오늘 해볼까
      </Link>
      {right && <div className="absolute right-0 top-1/2 -translate-y-1/2">{right}</div>}
    </header>
  );
}
