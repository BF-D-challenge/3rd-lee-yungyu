import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function MvpAppHeader({
  backClassName,
  backHref = "/",
  backLabel,
  className,
  meta,
  metaClassName,
}: {
  backClassName: string;
  backHref?: string;
  backLabel: string;
  className: string;
  meta: ReactNode;
  metaClassName?: string;
}) {
  return (
    <header className={className}>
      <Link
        href={backHref}
        className={backClassName}
        aria-label={`${backLabel}로 돌아가기`}
      >
        <ArrowLeft aria-hidden="true" size={18} />
        {backLabel}
      </Link>
      <span className={metaClassName}>{meta}</span>
    </header>
  );
}
