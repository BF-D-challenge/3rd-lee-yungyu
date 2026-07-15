"use client";

// 공유 행 — 네이티브 공유시트 우선, 미지원 시 링크 복사 (v4 1주차: URL이 데이터 캐리어)
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { shareOrCopy, shareUrl, type CardPayload } from "@/lib/share";
import { trackShare } from "@/lib/track";
import { cardTitle } from "./publish-card";

const CHANNELS = [
  { id: "kakao", label: "💬 카톡" },
  { id: "link", label: "🔗 링크" },
  { id: "story", label: "📸 스토리" },
] as const;

export function ShareRow({ payload }: { payload: CardPayload }) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async (channel: (typeof CHANNELS)[number]["id"]) => {
    const result = await shareOrCopy(shareUrl(payload), {
      title: cardTitle(payload),
      text: `${cardTitle(payload)} — 오늘 해볼까에서 뽑았어. 어때?`,
    });
    if (!result.ok) return;
    trackShare("card_share", result.method, { channel });
    setToast(result.method === "native" ? "공유했어요" : "링크를 복사했어요");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
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
          {toast}
        </div>
      )}
    </div>
  );
}
