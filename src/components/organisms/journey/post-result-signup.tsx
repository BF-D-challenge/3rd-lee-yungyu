"use client";

import { useEffect, useState } from "react";
import { GoogleLoginButton } from "./google-login-button";
import { authEnabled } from "@/lib/backend/auth";
import { checkAuthSession } from "@/lib/auth-session";
import {
  markMvpSignupPending,
  trackMvpSignupCompleted,
  type MvpExperimentId,
} from "@/lib/mvp-experiment-analytics";

export function PostResultSignup({
  experimentId,
  label,
  description = "결과는 로그인 없이 먼저 봤어요. 지금은 계정 연결만 되며, 결과 저장·동기화는 아직 제공하지 않아요.",
}: {
  experimentId: MvpExperimentId;
  label: string;
  description?: string;
}) {
  const [state, setState] = useState<"checking" | "anonymous" | "connected">("checking");

  useEffect(() => {
    if (!authEnabled) {
      setState("anonymous");
      return;
    }
    let active = true;
    void checkAuthSession().then((session) => {
      if (!active) return;
      if (!session) {
        setState("anonymous");
        return;
      }
      trackMvpSignupCompleted(experimentId, session);
      setState("connected");
    });
    return () => { active = false; };
  }, [experimentId]);

  if (!authEnabled) return null;
  if (state === "checking") return null;
  if (state === "connected") {
    return <p className="mt-5 text-center text-sm text-muted">계정이 연결됐어요.</p>;
  }

  return (
    <section className="mt-5 border-t border-white/10 pt-5" aria-label="결과 뒤 선택적 계정 연결">
      <p className="mb-3 text-center text-sm leading-6 text-muted">
        {description}
      </p>
      <GoogleLoginButton
        context="creator"
        label={label}
        returnTo={typeof window === "undefined" ? undefined : window.location.href}
        onBeforeAuth={() => markMvpSignupPending(experimentId)}
        onAuthenticated={(session) => {
          trackMvpSignupCompleted(experimentId, session);
          setState("connected");
        }}
      />
    </section>
  );
}
