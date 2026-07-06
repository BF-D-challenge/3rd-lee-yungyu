"use client";

// 9:16 공유 카드 프리뷰 — 인스타 스토리에 올릴 만큼 예쁘게 (PRD §6.3, R8 · P3 소연)
import { Pill } from "@/components/atoms/pill";
import { painById } from "@/lib/combos";
import type { CardPayload } from "@/lib/share";
import { cn } from "@/lib/utils";

/** 카드 제목 — 골든 title이 없으면 씨앗 × 불편으로 조합 생성 */
export function cardTitle(payload: CardPayload): string {
  if (payload.title) return payload.title;
  const pain = painById(payload.painId);
  return pain ? `${payload.seedLabel} × ${pain.short}` : payload.seedLabel;
}

export interface PublishCardProps {
  payload: CardPayload;
  className?: string;
}

export function PublishCard({ payload, className }: PublishCardProps) {
  return (
    <div
      className={cn(
        "aurora relative mx-auto flex aspect-[9/16] w-full max-w-[300px] flex-col overflow-hidden rounded-card p-6",
        className,
      )}
    >
      {/* 가독성용 어둠 레이어 — Aurora 위 텍스트 대비 확보 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/30" />

      <div className="relative flex flex-1 flex-col">
        <Pill className="self-start">🌱 {payload.seedLabel}</Pill>

        <div className="flex flex-1 flex-col justify-center">
          <h2 className="font-serif text-2xl leading-snug text-ink">{cardTitle(payload)}</h2>
          {payload.oneliner && <p className="mt-3 truncate text-sm text-white/70">{payload.oneliner}</p>}
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <p className="font-swash text-lg leading-none text-white/90">today, maybe</p>
          <p className="mt-1 font-serif text-sm tracking-tight text-ink">오늘 해볼까</p>
        </div>
      </div>
    </div>
  );
}
