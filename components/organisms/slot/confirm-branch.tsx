"use client";

/**
 * [확정 분기] — 뜨거울 때 묻는다 (PRD §5, R1) + 실행 브리프 승격 (가치개선 계획 §3.1).
 * 확정 카드가 한 장 카드가 아니라 무료 완제품 브리프: 오늘 만들 한 개 · 누구의 어떤 순간 ·
 * 만들 것(MVP+⏱) · 첫 실험(지인 투표). 주 CTA = 지인 투표(K 루프) ·
 * 보조 = 📋 만들 준비물 복사(빌드 프롬프트, v1 복원 →팩트 7). 플랜 990은 폐지(§3.4).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { buildBrief, buildPrompt } from "@/lib/brief";
import type { Combo } from "@/lib/draw";
import { toPayload } from "@/lib/share";
import { track } from "@/lib/track";
import { copyText } from "./copy";

export interface ConfirmBranchProps {
  open: boolean;
  combo: Combo | null;
  /** 결과 한 문장 — 마음(psych) 유무에 따라 슬롯이 조립 (assemble.ts) */
  line: string | null;
  /** 뒤로 — 슬롯으로 복귀 */
  onClose: () => void;
}

export function ConfirmBranch({ open, combo, line, onClose }: ConfirmBranchProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(resetTimer.current), []);
  if (!open || !combo) return null;

  const brief = buildBrief(combo);

  const goVote = () => {
    track("confirm_vote_first_click", { seed_tag: combo.seed.id });
    sessionStorage.setItem("oneul:confirmed", JSON.stringify(toPayload(combo)));
    router.push("/publish");
  };

  const copyPrompt = async () => {
    if (!(await copyText(buildPrompt(combo)))) return;
    track("prompt_copied", { seed_tag: combo.seed.id, is_golden: combo.golden });
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      /* justify-center 대신 mt-auto/mb-auto 센터링 — 카드가 길어져 넘칠 때 상단 클리핑 없이 스크롤 */
      className="ambient fixed inset-0 z-40 flex flex-col items-center overflow-y-auto bg-bg/95 px-5 py-10 backdrop-blur-sm"
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

      {/* 실행 브리프 카드 — 퍼플 글로우 부상 (§3.1 무료 완제품, 전체 공개) */}
      <div
        className="glass-strong mt-auto w-full max-w-[420px] rounded-card border border-gold/50 p-6 text-center shadow-glow-hero"
        style={{ animation: "fade-up .5s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <p className="text-xs tracking-[.16em] text-glow">오늘 만들 한 개</p>
        <h2 className="mt-2.5 font-serif text-xl leading-snug text-ink">
          {combo.title ?? line}
        </h2>
        {combo.oneliner && <p className="mt-1.5 text-sm text-mist">{combo.oneliner}</p>}
        <p className="mt-3 text-xs text-caption">
          🌱 {combo.seed.label} × {combo.pain.short} × {combo.format.short}
        </p>
        {/* 누구의 어떤 순간(§3.1-2 — 숨은 축 승격) · 방법 */}
        <div className="mt-3 flex items-center justify-center gap-5 border-t border-white/10 pt-3 text-[11px] leading-snug text-caption">
          <span className="flex items-center gap-2 text-left">
            <span className="grid h-7 w-7 shrink-0 place-items-center text-lg opacity-80" aria-hidden>
              👥
            </span>
            {brief.who}
          </span>
          <span className="flex shrink-0 items-center gap-2 text-left">
            <span className="grid h-7 w-7 place-items-center text-lg opacity-80" aria-hidden>
              🛠
            </span>
            {combo.format.action}
          </span>
        </div>

        {/* 만들 것 (§3.1-3) — MVP 체크 리스트 + ⏱ 빌드 기간 */}
        <div className="mt-3 border-t border-white/10 pt-3 text-left">
          <div className="flex items-center justify-between">
            <p className="text-[11px] tracking-[.14em] text-glow">만들 것</p>
            <span className="rounded-pill bg-white/10 px-2 py-0.5 text-[10px] text-mist">
              ⏱ {brief.buildDays}
            </span>
          </div>
          <ul className="mt-1.5 space-y-1">
            {brief.mvp.map((m) => (
              <li key={m} className="flex items-start gap-1.5 text-xs leading-snug text-mist">
                <span className="mt-px shrink-0 text-gold" aria-hidden>
                  ✓
                </span>
                {m}
              </li>
            ))}
          </ul>
        </div>

        {/* 첫 실험 (§3.1-4) — 검증 도구 자체가 첫 실험 */}
        <div className="mt-3 border-t border-white/10 pt-3 text-left">
          <p className="text-[11px] tracking-[.14em] text-glow">첫 실험</p>
          <p className="mt-1 text-xs leading-snug text-mist">{brief.firstExperiment}</p>
        </div>
      </div>

      <p className="mt-6 font-serif text-lg text-ink" style={{ animation: "fade-up .5s ease .15s both" }}>
        이제 뭐부터 할까요?
      </p>

      <div
        className="mb-auto mt-3 flex w-full max-w-[420px] flex-col gap-2"
        style={{ animation: "fade-up .5s ease .25s both" }}
      >
        <Button variant="aurora" size="lg" className="w-full flex-col gap-0 py-2" onClick={goVote}>
          <span>🗳 먼저 지인들에게 물어보기</span>
          <span className="text-[11px] font-normal opacity-80">3초 투표 · 로그인 없음</span>
        </Button>
        <Button variant="glass" size="lg" className="w-full flex-col gap-0 py-2" onClick={copyPrompt}>
          <span>{copied ? "복사됐어요 ✓" : "📋 만들 준비물 복사"}</span>
          <span className="text-[11px] font-normal opacity-70">
            만들 도구에 붙여넣으면 오늘 데모까지 — 무료
          </span>
        </Button>
        <button
          type="button"
          onClick={() => {
            track("confirm_later_click", { seed_tag: combo.seed.id });
            router.push("/dashboard");
          }}
          className="mt-1.5 text-sm text-caption transition-colors hover:text-mist"
        >
          나중에 할래요
        </button>
      </div>
    </div>
  );
}
