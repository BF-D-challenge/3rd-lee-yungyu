"use client";

import { Check } from "lucide-react";
import { forwardRef, type KeyboardEvent } from "react";
import { GlassCard } from "@/components/atoms/glass-card";
import { Pill } from "@/components/atoms/pill";
import type { DuelSide } from "@/lib/backend/votes";
import type { CardPayload } from "@/lib/share";
import { cn } from "@/lib/utils";
import { cardTitle } from "./publish-card";

interface DuelCardProps {
  side: DuelSide;
  payload: CardPayload;
  chosen: DuelSide | null;
  disabled: boolean;
  tabIndex: number;
  onPick: (side: DuelSide) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, side: DuelSide) => void;
}

export const DuelCard = forwardRef<HTMLButtonElement, DuelCardProps>(function DuelCard(
  { side, payload, chosen, disabled, tabIndex, onPick, onKeyDown },
  ref,
) {
  const isChosen = chosen === side;
  const dimmed = chosen !== null && !isChosen;
  const title = cardTitle(payload);

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={isChosen}
      aria-disabled={disabled}
      aria-label={`카드 ${side.toUpperCase()}, ${title}`}
      tabIndex={tabIndex}
      onClick={() => onPick(side)}
      onKeyDown={(event) => onKeyDown(event, side)}
      className={cn(
        "min-h-[48px] min-w-0 w-full text-left transition-opacity duration-200 focus-visible:outline-none",
        "focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-glow",
        dimmed && "opacity-[.72]",
      )}
    >
      <GlassCard
        strong={isChosen}
        className={cn(
          "h-full min-w-0 border border-white/10 p-4 transition-[border-color,box-shadow] sm:p-5",
          isChosen && "border-glow shadow-glow-hero ring-2 ring-glow",
        )}
      >
        <div className="flex items-center justify-between">
          <Pill>{side === "a" ? "A" : "B"}</Pill>
          <span
            aria-hidden
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors",
              isChosen ? "border-glow bg-glow text-bg" : "border-white/20 text-transparent",
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </div>
        <p className="mt-4 break-words text-xs font-semibold text-gold [overflow-wrap:anywhere]">{payload.seedLabel}</p>
        <h2 className="mt-1 break-words font-serif text-base leading-snug text-ink [overflow-wrap:anywhere] sm:text-lg">
          {title}
        </h2>
        {payload.oneliner ? (
          <p className="mt-3 break-words text-xs leading-relaxed text-mist [overflow-wrap:anywhere] sm:text-sm">
            {payload.oneliner}
          </p>
        ) : null}
      </GlassCard>
    </button>
  );
});

DuelCard.displayName = "DuelCard";
