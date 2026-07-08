"use client";

/**
 * [확정 분기] — 뜨거울 때 묻는다 (PRD §5, R1).
 * 확정 후 결과 = 아이디어 flip 카드(앞면 설명+고통 타임라인 / 뒷면 해결+근거).
 * 공유해야 만들 프롬프트가 열리는 공유 게이트 = K 루프 강제. (플랜 990 폐지 §3.4)
 */

import { useRouter } from "next/navigation";
import { buildPrompt } from "@/lib/brief";
import type { Combo } from "@/lib/draw";
import { shareUrl, toPayload } from "@/lib/share";
import { track } from "@/lib/track";
import { copyText } from "./copy";
import { IdeaFlipCard } from "./idea-flip-card";

export interface ConfirmBranchProps {
  open: boolean;
  combo: Combo | null;
  /** 결과 한 문장 — 카드에 appName/oneliner가 없을 때의 폴백 (IdeaFlipCard가 내부 처리) */
  line: string | null;
  /** 뒤로 — 슬롯으로 복귀 */
  onClose: () => void;
}

export function ConfirmBranch({ open, combo, onClose }: ConfirmBranchProps) {
  const router = useRouter();
  if (!open || !combo) return null;

  const onVote = () => {
    track("confirm_vote_first_click", { seed_tag: combo.seed.id });
    sessionStorage.setItem("oneul:confirmed", JSON.stringify(toPayload(combo)));
    router.push("/publish");
  };

  const onShare = async (): Promise<boolean> => {
    const ok = await copyText(shareUrl(toPayload(combo)));
    if (ok) track("confirm_share_click", { seed_tag: combo.seed.id });
    return ok;
  };

  const onCopyPrompt = async (): Promise<boolean> => {
    const ok = await copyText(buildPrompt(combo));
    if (ok) track("prompt_copied", { seed_tag: combo.seed.id, is_golden: combo.golden });
    return ok;
  };

  return (
    <div
      className="ambient fixed inset-0 z-40 flex flex-col items-center overflow-y-auto bg-bg/95 px-5 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="아이디어 확정"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫고 슬롯으로 돌아가기"
        className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full text-mist transition-colors hover:text-ink"
      >
        ✕
      </button>

      <div
        className="mt-auto w-full"
        style={{ animation: "fade-up .5s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <IdeaFlipCard
          combo={combo}
          story={combo.frontStory}
          seedLabel={combo.seed.label}
          appName={combo.appName}
          onShare={onShare}
          onCopyPrompt={onCopyPrompt}
          onVote={onVote}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          track("confirm_later_click", { seed_tag: combo.seed.id });
          router.push("/dashboard");
        }}
        className="mb-auto mt-4 text-sm text-caption transition-colors hover:text-mist"
        style={{ animation: "fade-up .5s ease .25s both" }}
      >
        나중에 할래요
      </button>
    </div>
  );
}
