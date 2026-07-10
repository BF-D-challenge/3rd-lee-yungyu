"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import type { AuthSession } from "@/lib/auth-session";

interface DuelLoginSheetProps {
  open: boolean;
  onAuthenticated: (session: AuthSession) => void;
  onReturnFocus: () => void;
}

export function DuelLoginSheet({ open, onAuthenticated, onReturnFocus }: DuelLoginSheetProps) {
  return (
    <Dialog.Root open={open} modal>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/55" data-duel-motion />
        <Dialog.Content
          data-duel-login
          data-duel-motion
          aria-modal="true"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(onReturnFocus);
          }}
          className="glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-card px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 outline-none"
          style={{ animation: "fade-up 300ms ease both" }}
        >
          <Dialog.Title className="font-serif text-2xl leading-tight text-ink">친구의 후보를 응원해 주세요</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-mist">
            로그인하면 한 장을 고르고 칭찬을 전할 수 있어요.
          </Dialog.Description>
          <div className="mt-6">
            <GoogleLoginButton context="receiver" onAuthenticated={onAuthenticated} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
