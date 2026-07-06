"use client";

/**
 * [S1] 중간 취향 질문 바텀시트 — 씨앗 고정 대체.
 * 취향 미설정 상태로 두 번째 칸이 채워지는 순간(또는 첫 전체 뽑기 직후) 1회 자동 오픈.
 * 2단계 객관식: [❤️ 좋아하는 걸로 / 🧠 잘 아는 걸로] → 대분류 칩 → 완료.
 * 탈출구 "아무거나 볼래요"(ghost) — 닫고 다시 안 물음.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { combos, type Track } from "@/lib/combos";
import type { Taste } from "@/lib/pools";
import { track as trackEvent } from "@/lib/track";

export interface TasteSheetProps {
  open: boolean;
  /** 완료 — 스토어 setTaste (저장·계측은 스토어가) */
  onSubmit: (taste: Taste) => void;
  /** 탈출구 — 스토어 skipTaste */
  onSkip: () => void;
}

export function TasteSheet({ open, onSubmit, onSkip }: TasteSheetProps) {
  const [tr, setTr] = useState<Track | null>(null);

  useEffect(() => {
    if (open) {
      setTr(null);
      trackEvent("taste_sheet_view", {});
    }
  }, [open]);

  if (!open) return null;

  const categories = tr ? combos.tracks[tr].categories.slice(0, 4) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onSkip}>
      <div
        className="glass-strong w-full max-w-narrow rounded-t-card p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="어느 쪽이에요?"
        style={{ animation: "fade-up .35s ease both" }}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />

        {tr === null ? (
          <>
            <h2 className="font-serif text-xl text-ink">어느 쪽이에요?</h2>
            <p className="mt-1.5 text-sm text-mist">골라주시면 카드가 그쪽 위주로 나와요.</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="glass" size="lg" className="w-full justify-start px-5" onClick={() => setTr("like")}>
                ❤️ 좋아하는 걸로
              </Button>
              <Button variant="glass" size="lg" className="w-full justify-start px-5" onClick={() => setTr("know")}>
                🧠 잘 아는 걸로
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-xl text-ink">
              {tr === "like" ? "❤️ 어떤 걸 좋아해요?" : "🧠 어떤 일을 잘 알아요?"}
            </h2>
            <p className="mt-1.5 text-sm text-mist">하나만 골라요 — 나중에 언제든 바꿀 수 있어요.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant="glass"
                  size="md"
                  className="w-full"
                  onClick={() => onSubmit({ track: tr, categoryId: c.id })}
                >
                  {c.emoji} {c.label}
                </Button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTr(null)}
              className="mt-3 text-xs text-caption transition-colors hover:text-mist"
            >
              ← 뒤로
            </button>
          </>
        )}

        <div className="mt-4 text-center">
          <Button variant="ghost" size="md" onClick={onSkip}>
            아무거나 볼래요
          </Button>
        </div>
      </div>
    </div>
  );
}
