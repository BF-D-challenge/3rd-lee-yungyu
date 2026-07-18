"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleUserRound, LogOut, X } from "lucide-react";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import {
  checkAuthSession,
  consumeAuthPending,
  endAuthSession,
  type AuthSession,
} from "@/lib/auth-session";
import { track } from "@/lib/track";

type AuthState =
  | { status: "checking"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: AuthSession };

export function AuthAccountMenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<AuthState>({ status: "checking", session: null });
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;
    void checkAuthSession().then((session) => {
      if (!active) return;
      if (!session) {
        setState({ status: "anonymous", session: null });
        return;
      }
      if (consumeAuthPending("creator")) {
        track("auth_done", {
          context: "creator",
          method: session.demo ? "demo" : "google",
          entry: "header",
        });
      }
      setState({ status: "authenticated", session });
    });
    return () => {
      active = false;
    };
  }, []);

  const authenticated = (session: AuthSession) => {
    setState({ status: "authenticated", session });
    setOpen(false);
  };

  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      await endAuthSession();
      window.location.reload();
    } catch {
      setSigningOut(false);
      setSignOutError("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const authenticatedLabel = state.status === "authenticated"
    ? state.session.displayName
      ? `${state.session.displayName}님 계정`
      : "내 계정"
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={authenticatedLabel ?? (state.status === "checking" ? "계정 확인 중" : "로그인")}
          disabled={state.status === "checking"}
          className="flex min-h-12 items-center gap-1.5 rounded-full px-2.5 text-mist transition-colors hover:text-ink disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <CircleUserRound aria-hidden className="h-4 w-4" />
          <span>{state.status === "authenticated" ? "계정" : "로그인"}</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px]"
        />
        <Dialog.Content
          aria-describedby="account-sheet-description"
          className="glass-strong fixed inset-x-0 bottom-0 z-[70] mx-auto max-h-[92dvh] w-full max-w-[440px] overflow-y-auto rounded-t-card px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 outline-none"
          data-anim
          style={{ animation: "fade-up 260ms ease both" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black text-primary">
                {state.status === "authenticated" ? "내 계정" : "로그인 필요"}
              </p>
              <Dialog.Title className="mt-1 text-xl font-black text-ink">
                {state.status === "authenticated"
                  ? state.session.displayName
                    ? `${state.session.displayName}님으로 로그인했어요`
                    : "로그인되어 있어요"
                  : "카드를 뽑으려면 로그인해 주세요"}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="계정 창 닫기"
                className="grid min-h-12 min-w-12 place-items-center rounded-full text-mist transition-colors hover:bg-white/[.08] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description
            id="account-sheet-description"
            className="mt-3 text-sm leading-6 text-mist"
          >
            {state.status === "authenticated"
              ? "다시 뽑기에서 고른 취향을 이 계정에 기억하고 추천에 반영해요."
              : "Google 로그인 후 카드 뽑기와 누적 취향 추천을 다시 이용할 수 있어요."}
          </Dialog.Description>

          {state.status === "anonymous" ? (
            <div className="mt-6">
              <GoogleLoginButton
                context="creator"
                returnTo={typeof window === "undefined" ? "/" : window.location.href}
                onAuthenticated={authenticated}
              />
            </div>
          ) : null}

          {state.status === "authenticated" ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={logout}
                disabled={signingOut}
                aria-busy={signingOut}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.04] px-4 text-sm font-black text-ink transition-colors hover:bg-white/[.08] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <LogOut aria-hidden className="h-4 w-4" />
                {signingOut ? "로그아웃하는 중" : "로그아웃"}
              </button>
              <p role="alert" className="mt-2 min-h-5 text-center text-xs text-rose">
                {signOutError}
              </p>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
