"use client";

/**
 * [S1b] 페이월① 바텀시트 — 스핀 캡 소진 (PRD §6.4-①, R3·R6·R11).
 * 옵션A(공유로 +3회)를 강조, 옵션B(실행 패스 1,900)는 가짜 문.
 * "무제한 스핀" 문구 금지(R3) — 결과물로 판다.
 */

import { useEffect } from "react";
import { Button } from "@/components/atoms/button";
import { track } from "@/lib/track";

export interface PaywallSheetProps {
  open: boolean;
  onClose: () => void;
  /** 옵션A: 친구 투표 요청으로 +3회 (목업 — 스핀 카운트 로컬 되감기) */
  onShareBoost: () => void;
  /** 옵션B: 실행 패스 1,900 가짜 문 → FakeDoorSheet */
  onDayPass: () => void;
}

export function PaywallSheet({ open, onClose, onShareBoost, onDayPass }: PaywallSheetProps) {
  useEffect(() => {
    if (open) track("paywall_view", { paywall: "spin_cap" });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-narrow rounded-t-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="오늘 스핀 다 썼어요"
        style={{ animation: "fade-up .35s ease both" }}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
        <h2 className="font-serif text-xl text-ink">🔒 오늘 스핀 다 썼어요</h2>
        <p className="mt-1.5 text-sm text-mist">여기서 멈추기 아까운 조합이었다면 —</p>

        <Button
          variant="aurora"
          size="lg"
          className="mt-5 w-full justify-start px-5 text-left"
          onClick={() => {
            track("paywall_share_choose", { paywall: "spin_cap" });
            onShareBoost();
          }}
        >
          <span aria-hidden>💌</span>
          <span className="flex-1">
            친구에게 &ldquo;뭐가 나아?&rdquo; 물어보고 <b>+3회</b>
          </span>
        </Button>
        <Button
          variant="glass"
          size="lg"
          className="mt-2 w-full justify-start px-5 text-left"
          onClick={onDayPass}
        >
          <span aria-hidden>⚡</span>
          <span className="flex-1">
            오늘 안에 확정→플랜→발행까지, 실행 패스{" "}
            <b className="text-glow">1,900</b>
          </span>
        </Button>

        <p className="mt-4 text-center text-xs text-caption">내일이면 5회 다시 채워져요</p>
      </div>
    </div>
  );
}
