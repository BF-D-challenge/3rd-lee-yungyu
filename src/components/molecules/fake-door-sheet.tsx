"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { track, type FakeDoorProduct } from "@/lib/track";
import { cn } from "@/lib/utils";

export interface FakeDoorSheetProps {
  open: boolean;
  onClose: () => void;
  product: FakeDoorProduct;
  /** 시트 상단 제목 (예: "수요 리포트") */
  title: string;
}

/**
 * 결제 3지점 공통 가짜 문 (PRD §6.4) — 결제 대신 "준비 중이에요" + 이메일 수집.
 * 클릭 계측은 CTA 쪽에서 fakeDoor()로 이미 기록된 뒤 이 시트가 열린다.
 */
export function FakeDoorSheet({ open, onClose, product, title }: FakeDoorSheetProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!email.includes("@")) return;
    track("fake_door_email", { product, email });
    setSent(true);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className={cn("glass-strong w-full max-w-narrow rounded-t-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
        {sent ? (
          <div className="py-4 text-center" data-anim style={{ animation: "fade-up .4s ease both" }}>
            <p className="text-lg">🌱 열리면 가장 먼저 알려드릴게요</p>
            <p className="mt-2 text-sm text-mist">그동안 투표 카드는 계속 무료예요.</p>
            <Button variant="glass" className="mt-6 w-full" onClick={onClose}>
              닫기
            </Button>
          </div>
        ) : (
          <>
            <h2 className="font-serif text-xl text-ink">{title}, 준비 중이에요</h2>
            <p className="mt-2 text-sm text-mist">열리면 알려드릴까요? 이메일만 남겨주세요.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              className="glass mt-5 h-12 w-full rounded-input bg-transparent px-4 text-ink placeholder:text-caption focus:border-gold focus:outline-none"
            />
            <Button variant="aurora" size="lg" className="mt-3 w-full" onClick={submit} disabled={!email.includes("@")}>
              알림 받기
            </Button>
            <Button variant="ghost" className="mt-1 w-full" onClick={onClose}>
              다음에 할래요
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
