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

const audienceLabels = { b2b: "B2B", b2c: "B2C" } as const;
const platformLabels = { web: "웹", app: "앱", plugin: "플러그인" } as const;
const productTypeLabels = {
  "ai-agent": "AI 에이전트",
  automation: "자동화",
  dashboard: "대시보드",
  analyzer: "분석기",
  utility: "유틸리티",
} as const;

export const IdeaCandidateCard = forwardRef<HTMLButtonElement, IdeaCandidateCardProps>(function IdeaCandidateCard(
  { candidate, index, active, dragOver, revealed, onOpen },
  ref,
) {
  const label = index === 0 ? "A" : "B";
  const combo = candidate.combo;
  const tags = [
    combo.audiences?.[0] ? audienceLabels[combo.audiences[0]] : null,
    combo.platforms?.[0] ? platformLabels[combo.platforms[0]] : null,
    combo.productTypes?.[0] ? productTypeLabels[combo.productTypes[0]] : null,
  ].filter((value) => value !== null);

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
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <small className="text-[10px] font-bold text-glow">카드 {label}</small>
            <span className="truncate text-[10px] text-mist">
              {combo.sourceFidelityScore ? `출처 충실도 ${combo.sourceFidelityScore}%` : combo.seed.label}
            </span>
          </div>
          <div className="relative z-10 flex flex-1 flex-col justify-center py-2">
            {tags.length ? (
              <p className="mb-2 text-[9px] font-bold text-glow/90">{tags.join(" · ")}</p>
            ) : null}
            <h2 className="line-clamp-2 font-serif text-sm font-bold leading-snug text-ink sm:text-base">
              {titleOf(candidate)}
            </h2>
            <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-mist sm:text-xs">
              {combo.oneliner ?? `${combo.pain.short}을 ${combo.format.short}(으)로 푸는 아이디어`}
            </p>
            {combo.mechanism ? (
              <dl className="mt-3 space-y-1 border-t border-white/10 pt-2 text-[9px] leading-snug sm:text-[10px]">
                <div className="grid grid-cols-[28px_1fr] gap-1.5">
                  <dt className="font-bold text-caption">입력</dt>
                  <dd className="line-clamp-1 text-mist">{combo.mechanism.input}</dd>
                </div>
                <div className="grid grid-cols-[28px_1fr] gap-1.5">
                  <dt className="font-bold text-caption">처리</dt>
                  <dd className="line-clamp-1 text-mist">{combo.mechanism.process}</dd>
                </div>
                <div className="grid grid-cols-[28px_1fr] gap-1.5">
                  <dt className="font-bold text-caption">결과</dt>
                  <dd className="line-clamp-1 text-ink/80">{combo.mechanism.output}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <div className="relative z-10 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[9px] text-caption">
            <span className="truncate">출처 · {combo.anchorName ?? combo.seed.label}</span>
            <span className="shrink-0">열어서 비교</span>
          </div>
        </div>
      )}
    </button>
  );
});

IdeaCandidateCard.displayName = "IdeaCandidateCard";
