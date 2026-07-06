"use client";

// 공유 행 — 카톡/링크/스토리 전부 링크 복사로 동작 (v4 1주차: URL이 데이터 캐리어)
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { shareUrl, type CardPayload } from "@/lib/share";
import { track } from "@/lib/track";

const CHANNELS = [
  { id: "kakao", label: "💬 카톡" },
  { id: "link", label: "🔗 링크" },
  { id: "story", label: "📸 스토리" },
] as const;

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 클립보드 API 실패(비HTTPS 등) 폴백
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function ShareRow({ payload }: { payload: CardPayload }) {
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async (channel: (typeof CHANNELS)[number]["id"]) => {
    await copyText(shareUrl(payload));
    track("card_share", { channel });
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2000);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2">
        {CHANNELS.map((c) => (
          <Button key={c.id} variant="glass" onClick={() => share(c.id)}>
            {c.label}
          </Button>
        ))}
      </div>
      {toast && (
        <div
          role="status"
          className="glass-strong absolute inset-x-0 -top-12 mx-auto w-fit rounded-pill px-4 py-2 text-sm text-ink"
          data-anim
          style={{ animation: "fade-up .25s ease both" }}
        >
          링크를 복사했어요
        </div>
      )}
    </div>
  );
}
