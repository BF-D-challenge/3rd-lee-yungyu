"use client";

// 공유 행 — 모든 발신 경로를 카카오톡으로 통일한다.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/atoms/button";
import { shareToKakao } from "@/lib/kakao-share";
import { shareUrl, type CardPayload } from "@/lib/share";
import { trackShare } from "@/lib/track";
import { cardTitle } from "./publish-card";

export function ShareRow({ payload }: { payload: CardPayload }) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const share = async () => {
    const result = await shareToKakao(shareUrl(payload), {
      title: cardTitle(payload),
      text: `${cardTitle(payload)} — 오늘 해볼까에서 뽑았어. 어때?`,
      buttonTitle: "카드 봐주기",
    });
    if (!result.ok) {
      setToast("카카오톡 공유 화면을 열지 못했어요");
      return;
    }
    trackShare("card_share", result.method, { channel: "kakao" });
    setToast("카카오톡 공유 화면을 열었어요");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="relative">
      <Button variant="glass" className="w-full" onClick={share}>
        💬 카카오톡으로 공유
      </Button>
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
