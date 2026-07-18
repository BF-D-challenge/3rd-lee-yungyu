"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { beginAuth, consumeAuthPending, markAuthPending, type AuthSession } from "@/lib/auth-session";
import { track } from "@/lib/track";

export interface GoogleLoginButtonProps {
  context: "creator" | "receiver";
  onAuthenticated: (session: AuthSession) => void;
  returnTo?: string;
  label?: string;
}

export function GoogleLoginButton({
  context,
  onAuthenticated,
  returnTo,
  label = "Google로 시작하기",
}: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const delayTimer = useRef<ReturnType<typeof setTimeout>>();
  const [pending, setPending] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => clearTimeout(delayTimer.current), []);

  const login = async () => {
    if (pending) return;
    setPending(true);
    setShowLoader(false);
    setError(null);
    track("auth_prompt", { context });
    markAuthPending(context);
    delayTimer.current = setTimeout(() => setShowLoader(true), 800);

    const result = await beginAuth(returnTo ?? window.location.href);
    clearTimeout(delayTimer.current);
    if (result.status === "redirecting") return;
    setPending(false);
    setShowLoader(false);
    if (result.status === "error") {
      consumeAuthPending(context);
      setError("로그인을 완료하지 못했어요. 다시 시도해주세요.");
      requestAnimationFrame(() => buttonRef.current?.focus());
      return;
    }
    consumeAuthPending(context);
    track("auth_done", { context, method: result.session.demo ? "demo" : "google" });
    onAuthenticated(result.session);
  };

  return (
    <div className="w-full">
      <Button
        ref={buttonRef}
        type="button"
        variant="aurora"
        size="lg"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={login}
      >
        {showLoader ? <LoaderCircle aria-hidden data-anim className="h-5 w-5 animate-spin" /> : <LogIn aria-hidden className="h-5 w-5" />}
        {showLoader ? "연결하는 중" : label}
      </Button>
      <p role="alert" className="mt-2 min-h-5 text-center text-xs text-rose">
        {error}
      </p>
    </div>
  );
}
