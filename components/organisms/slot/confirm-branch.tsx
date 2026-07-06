"use client";

/**
 * [확정 분기] — 뜨거울 때 묻는다 (PRD §5, R1).
 * 확정 카드가 퍼플 글로우로 부상하는 풀스크린 분기:
 * 주 CTA = 지인 투표(무료, K 루프) · 보조 = 4주 플랜 990(가짜 문②) · 약한 링크 = 대시보드.
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import type { Combo } from "@/lib/draw";
import { toPayload } from "@/lib/share";
import { track } from "@/lib/track";

export interface ConfirmBranchProps {
  open: boolean;
  combo: Combo | null;
  /** 결과 한 문장 — 마음(psych) 유무에 따라 슬롯이 조립 (assemble.ts) */
  line: string | null;
  /** 보조 CTA — 부모에서 fakeDoor('plan', 990) 기록 후 FakeDoorSheet 오픈 */
  onPlan: () => void;
  /** 뒤로 — 슬롯으로 복귀 */
  onClose: () => void;
}

export function ConfirmBranch({ open, combo, line, onPlan, onClose }: ConfirmBranchProps) {
  const router = useRouter();
  if (!open || !combo) return null;

  const goVote = () => {
    track("confirm_vote_first_click", { seed_tag: combo.seed.id });
    sessionStorage.setItem("oneul:confirmed", JSON.stringify(toPayload(combo)));
    router.push("/publish");
  };

  return (
    <div
      className="ambient fixed inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-bg/95 px-5 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label="아이디어 확정"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫고 슬롯으로 돌아가기"
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-mist transition-colors hover:text-ink"
      >
        ✕
      </button>

      {/* 확정 카드 — 퍼플 글로우 부상 */}
      <div
        className="glass-strong w-full max-w-[420px] rounded-card border border-gold/50 p-7 text-center shadow-glow-hero"
        style={{ animation: "fade-up .5s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <p className="text-xs tracking-[.16em] text-glow">오늘 만들 한 개</p>
        <h2 className="mt-3 font-serif text-xl leading-snug text-ink">
          {combo.title ?? line}
        </h2>
        {combo.oneliner && <p className="mt-2 text-sm text-mist">{combo.oneliner}</p>}
        <p className="mt-4 text-xs text-caption">
          🌱 {combo.seed.label} × {combo.pain.short} × {combo.format.short}
        </p>
      </div>

      <p className="mt-8 font-serif text-lg text-ink" style={{ animation: "fade-up .5s ease .15s both" }}>
        이제 뭐부터 할까요?
      </p>

      <div
        className="mt-4 flex w-full max-w-[420px] flex-col gap-2"
        style={{ animation: "fade-up .5s ease .25s both" }}
      >
        <Button variant="aurora" size="lg" className="w-full flex-col gap-0 py-2" onClick={goVote}>
          <span>🗳 먼저 지인들에게 물어보기</span>
          <span className="text-[11px] font-normal opacity-80">3초 투표 · 로그인 없음</span>
        </Button>
        <Button variant="glass" size="lg" className="w-full" onClick={onPlan}>
          🛠 바로 만들 4주 플랜 <b className="text-gold">990</b>
        </Button>
        <button
          type="button"
          onClick={() => {
            track("confirm_later_click", { seed_tag: combo.seed.id });
            router.push("/dashboard");
          }}
          className="mt-2 text-sm text-caption transition-colors hover:text-mist"
        >
          나중에 할래요
        </button>
      </div>
    </div>
  );
}
