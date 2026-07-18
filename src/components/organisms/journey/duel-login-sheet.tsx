"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import type { AuthSession } from "@/lib/auth-session";

interface DuelLoginSheetProps {
  open: boolean;
  onAuthenticated: (session: AuthSession) => void;
  onDismiss: () => void;
  onReturnFocus: () => void;
}

export function DuelLoginSheet({
  open,
  onAuthenticated,
  onDismiss,
  onReturnFocus,
}: DuelLoginSheetProps) {
  return (
    <Dialog.Root open={open} modal onOpenChange={(nextOpen) => { if (!nextOpen) onDismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55" data-duel-motion />
        <Dialog.Content
          data-duel-login
          data-duel-motion
          aria-modal="true"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(onReturnFocus);
          }}
          className="glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-narrow overflow-y-auto rounded-t-card px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 outline-none"
          style={{ animation: "fade-up 300ms ease both" }}
        >
          <Dialog.Title className="font-serif text-2xl leading-tight text-ink">친구의 후보를 응원해 주세요</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-mist">
            로그인하면 한 장을 고르고 칭찬을 전할 수 있어요.
          </Dialog.Description>
          <div className="mt-6">
            <GoogleLoginButton context="receiver" onAuthenticated={onAuthenticated} />
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              className="mt-1 min-h-12 w-full rounded-lg px-4 text-sm font-bold text-mist transition-colors hover:bg-white/[.08] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              후보를 먼저 볼게요
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
