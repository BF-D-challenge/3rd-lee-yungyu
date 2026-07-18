"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
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
 * 레거시 유료 기능 관심 확인 시트 — 연락처 없이 제품 관심 이벤트만 기록한다.
 * 클릭 계측은 CTA 쪽에서 fakeDoor()로 이미 기록된 뒤 이 시트가 열린다.
 */
export function FakeDoorSheet({ open, onClose, product, title }: FakeDoorSheetProps) {
  const [sent, setSent] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) setSent(false);
  }, [open]);

  const submit = () => {
    // 실제 알림 저장소가 생기기 전에는 연락처를 받거나 브라우저 로그에 남기지 않는다.
    track("fake_door_interest", { product });
    setSent(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/60"
          style={{ animation: "bloom 160ms ease-out both" }}
        />
        <Dialog.Content
          className={cn(
            "glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-narrow rounded-t-card p-6",
            "pb-[max(1.5rem,env(safe-area-inset-bottom))] outline-none",
          )}
          style={{ animation: "fade-up 240ms var(--ease-drawer) both" }}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          }}
          onCloseAutoFocus={(event) => {
            if (!returnFocusRef.current) return;
            event.preventDefault();
            returnFocusRef.current.focus();
            returnFocusRef.current = null;
          }}
        >
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" aria-hidden />
          {sent ? (
            <div className="py-4 text-center">
              <Dialog.Title className="text-lg font-semibold text-ink">🌱 관심을 남겼어요</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-mist">
                정식 알림 기능이 생기기 전에는 연락처를 받지 않아요.
              </Dialog.Description>
              <Dialog.Close asChild>
                <Button variant="glass" className="mt-6 w-full">닫기</Button>
              </Dialog.Close>
            </div>
          ) : (
            <>
              <Dialog.Title className="text-xl font-semibold text-ink">{title}, 준비 중이에요</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-mist">
                연락처 없이 관심 신호만 남길 수 있어요.
              </Dialog.Description>
              <Button variant="aurora" size="lg" className="mt-5 w-full" onClick={submit}>
                관심 남기기
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" className="mt-1 w-full">다음에 할래요</Button>
              </Dialog.Close>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
