"use client";

import { ArrowRight, Bell, Heart, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/atoms/button";
import type { DuelPraiseId, DuelSide } from "@/lib/backend/votes";
import { cn } from "@/lib/utils";
import type { DuelSubmitState } from "./use-duel-controller";

const OPTIONS = [
  { id: "need", label: "나도 필요해", icon: Heart },
  { id: "notify", label: "완성하면 알려줘", icon: Bell },
  { id: "cheer", label: "너라면 만들어", icon: Sparkles },
] as const satisfies readonly { id: DuelPraiseId; label: string; icon: LucideIcon }[];

interface DuelPraisePanelProps {
  chosen: DuelSide | null;
  praise: DuelPraiseId | null;
  submitState: DuelSubmitState;
  canSelect: boolean;
  onSelect: (praise: DuelPraiseId) => void;
  onSubmit: () => void;
}

export function DuelPraisePanel({
  chosen,
  praise,
  submitState,
  canSelect,
  onSelect,
  onSubmit,
}: DuelPraisePanelProps) {
  if (!chosen) {
    return <p className="mt-6 text-center text-sm font-semibold text-gold">응원할 후보 하나를 골라주세요.</p>;
  }

  return (
    <>
      <section
        className="mt-7"
        aria-labelledby="praise-heading"
        data-duel-motion
        style={{ animation: "fade-up 300ms ease both" }}
      >
        <h2 id="praise-heading" className="text-center font-serif text-xl text-ink">
          어떤 마음을 전할까요?
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = praise === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                disabled={!canSelect}
                onClick={() => onSelect(option.id)}
                className={cn(
                  "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-btn border px-3 py-3 text-sm font-semibold transition-[opacity,border-color,background-color,box-shadow]",
                  selected
                    ? "border-glow bg-glow/15 text-ink shadow-[0_0_0_1px_rgba(167,139,250,.35)]"
                    : "border-white/15 bg-white/[.04] text-mist hover:border-white/30 hover:text-ink",
                  "disabled:pointer-events-none disabled:opacity-70",
                )}
              >
                <Icon aria-hidden className="h-4 w-4 shrink-0" />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {praise ? (
          <Button
            type="button"
            variant="aurora"
            size="lg"
            className="mt-5 w-full motion-reduce:transform-none"
            disabled={submitState !== "idle"}
            aria-busy={submitState === "submitting"}
            onClick={onSubmit}
          >
            {submitState === "submitting" ? "응원을 저장하는 중" : "응원하고 내 후보 만들기"}
            <ArrowRight aria-hidden className="h-5 w-5" />
          </Button>
        ) : null}
      </section>

      {submitState !== "idle" ? (
        <p
          role="status"
          className={cn(
            "mt-4 rounded-btn border px-4 py-3 text-center text-sm leading-relaxed",
            submitState === "synced" ? "border-good/40 text-good" : "border-white/15 text-mist",
          )}
        >
          {submitState === "submitting"
            ? "응원을 저장하고 있어요."
            : submitState === "synced"
              ? "응원을 보냈어요. 내 후보를 준비할게요."
              : "응원을 기기에 저장했어요. 연결되면 자동으로 보낼게요."}
        </p>
      ) : null}
    </>
  );
}
