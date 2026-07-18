"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import {
  checkAuthSession,
  consumeAuthReturnTo,
  peekAuthReturnTo,
} from "@/lib/auth-session";

export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const providerError = new URLSearchParams(window.location.search).has("error");

    if (providerError) {
      setError(true);
      return () => {
        cancelled = true;
      };
    }

    void checkAuthSession()
      .then((session) => {
        if (cancelled) return;
        if (!session) {
          setError(true);
          return;
        }
        const returnTo = consumeAuthReturnTo();
        router.replace(returnTo);
        router.refresh();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const returnToApp = () => {
    router.replace(peekAuthReturnTo());
  };

  return (
    <PageShell>
      <TopBar />
      <section className="mx-auto flex min-h-[60dvh] max-w-narrow items-center justify-center px-4">
        <div className="glass-strong w-full rounded-card px-6 py-8 text-center">
          {error ? (
            <>
              <h1 className="font-serif text-2xl text-ink">로그인을 마치지 못했어요</h1>
              <p role="alert" className="mt-3 text-sm leading-relaxed text-mist">
                Google 로그인을 다시 시도해 주세요. 고르던 카드와 응원 내용은 이 탭에 남아 있어요.
              </p>
              <Button className="mt-6 w-full" onClick={returnToApp}>
                이전 화면으로 돌아가기
              </Button>
            </>
          ) : (
            <>
              <LoaderCircle aria-hidden data-anim className="mx-auto h-7 w-7 animate-spin text-ink" />
              <h1 className="mt-4 font-serif text-xl text-ink">Google 계정을 확인하고 있어요</h1>
              <p role="status" className="mt-2 text-sm text-mist">잠시만 기다려 주세요.</p>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
