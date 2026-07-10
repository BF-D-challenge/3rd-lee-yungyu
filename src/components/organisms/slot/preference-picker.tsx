"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  MAX_PREFERENCES,
  MIN_PREFERENCES,
  PREFERENCE_OPTIONS,
  normalizePreferences,
  type PreferenceId,
} from "@/lib/preferences";
import { cn } from "@/lib/utils";

export interface PreferencePickerProps {
  initial: readonly PreferenceId[];
  mode: "first" | "edit";
  onSubmit: (selected: PreferenceId[]) => void;
  onCancel?: () => void;
}

export function PreferencePicker({ initial, mode, onSubmit, onCancel }: PreferencePickerProps) {
  const [selected, setSelected] = useState<PreferenceId[]>(() => normalizePreferences(initial));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelected(normalizePreferences(initial));
    setMessage("");
  }, [initial]);

  const toggle = (id: PreferenceId) => {
    const active = selected.includes(id);
    if (!active && selected.length >= MAX_PREFERENCES) {
      setMessage("최대 8개까지 고를 수 있어요.");
      return;
    }
    setMessage("");
    setSelected((current) => (active ? current.filter((value) => value !== id) : [...current, id]));
  };

  const ready = selected.length >= MIN_PREFERENCES;

  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col">
      <header className="flex min-h-12 items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-glow">취향 선택</p>
          <h1 className="mt-2 font-serif text-2xl leading-tight text-ink">어떤 아이디어가 끌리나요?</h1>
          <p className="mt-2 text-sm text-mist">최소 3개, 최대 8개까지 고르세요.</p>
        </div>
        {mode === "edit" && onCancel ? (
          <button
            type="button"
            aria-label="취향 편집 닫기"
            title="닫기"
            onClick={onCancel}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-ink"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="아이디어 취향 여러 개 선택">
        {PREFERENCE_OPTIONS.map((option) => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={cn(
                "flex min-h-12 items-center justify-between gap-2 rounded-btn border px-3 py-2 text-left text-sm transition-[border-color,background-color,color,transform] active:scale-[.98]",
                active
                  ? "border-glow/70 bg-glow/10 text-ink"
                  : "border-white/15 bg-white/[.035] text-mist hover:border-white/30 hover:text-ink",
              )}
            >
              <span>{option.label}</span>
              {active ? <Check aria-hidden className="h-4 w-4 shrink-0 text-glow" /> : null}
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-rose">
        {message}
      </p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <Button
          type="button"
          variant="aurora"
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => onSubmit(selected)}
        >
          {mode === "first" ? "카드 두 장 뽑기" : "취향 적용"} · {selected.length}/8
        </Button>
      </div>
    </section>
  );
}
