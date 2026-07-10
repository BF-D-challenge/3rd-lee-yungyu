"use client";

import { forwardRef } from "react";
import { backSvg, BACK_RAYS } from "./card-back";
import type { IdeaCandidate } from "@/lib/idea";
import { cn } from "@/lib/utils";

export interface IdeaCandidateCardProps {
  candidate: IdeaCandidate;
  index: 0 | 1;
  active: boolean;
  dragOver: boolean;
  revealed: boolean;
  onOpen: () => void;
}

const titleOf = (candidate: IdeaCandidate) =>
  candidate.combo.appName ?? candidate.combo.title ?? `${candidate.combo.seed.label} 아이디어`;

export const IdeaCandidateCard = forwardRef<HTMLButtonElement, IdeaCandidateCardProps>(function IdeaCandidateCard(
  { candidate, index, active, dragOver, revealed, onOpen },
  ref,
) {
  const label = index === 0 ? "A" : "B";
  const combo = candidate.combo;

  return (
    <button
      ref={ref}
      type="button"
      disabled={!active}
      data-drop-target={dragOver ? "active" : undefined}
      aria-label={revealed ? `카드 ${label}, ${titleOf(candidate)}` : `카드 ${label} 열기`}
      onClick={onOpen}
      className={cn(
        "group relative aspect-[300/485] min-h-12 w-full overflow-hidden rounded-[10px] border bg-[#0a0a0b] text-left [perspective:1200px]",
        "transition-[border-color,box-shadow,opacity,transform] duration-200",
        active && "border-glow shadow-[0_0_0_1px_rgba(109,180,245,.2),0_0_28px_rgba(109,180,245,.16)] hover:-translate-y-0.5",
        dragOver && "border-glow shadow-[0_0_0_2px_rgba(109,180,245,.7),0_0_36px_rgba(109,180,245,.3)]",
        !active && !revealed && "border-white/15 opacity-55",
        revealed && "border-white/25 opacity-100",
      )}
    >
      {!revealed ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: backSvg(18) }}
          />
          <div className="absolute inset-x-0 bottom-4 z-10 px-3 text-center [text-shadow:0_1px_10px_rgba(0,0,0,.95)]">
            <small className="block text-[10px] font-bold text-glow">카드 {label}</small>
            <span className="mt-1 block text-xs text-ink">{active ? "탭해서 열기" : "첫 장을 열면 활성화"}</span>
          </div>
        </>
      ) : (
        <div
          data-anim
          className="absolute inset-0 flex flex-col overflow-hidden bg-[#0d0d0f] p-3 sm:p-4"
          style={{ animation: "candidate-reveal 520ms cubic-bezier(.4,0,.15,1) both" }}
        >
          <svg
            aria-hidden
            viewBox="0 0 300 485"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          >
            <g stroke="rgba(234,234,234,.18)" strokeWidth="1.7" strokeLinecap="round" dangerouslySetInnerHTML={{ __html: BACK_RAYS }} />
          </svg>
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
            <small className="text-[10px] font-bold text-glow">카드 {label}</small>
            <span className="text-[10px] text-mist">{combo.seed.label}</span>
          </div>
          <div className="relative z-10 flex flex-1 flex-col justify-center">
            <h2 className="line-clamp-3 font-serif text-sm font-bold leading-snug text-ink sm:text-base">
              {titleOf(candidate)}
            </h2>
            <p className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-mist sm:text-xs">
              {combo.oneliner ?? `${combo.pain.short}을 ${combo.format.short}(으)로 푸는 아이디어`}
            </p>
          </div>
          <div className="relative z-10 border-t border-white/10 pt-2 text-[10px] text-caption">
            오늘 바로 만들 후보
          </div>
        </div>
      )}
    </button>
  );
});

IdeaCandidateCard.displayName = "IdeaCandidateCard";
