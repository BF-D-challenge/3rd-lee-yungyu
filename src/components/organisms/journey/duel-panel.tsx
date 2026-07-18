"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PageShell } from "@/components/layouts/page-shell";
import { DuelCard } from "./duel-card";
import { DuelLoginSheet } from "./duel-login-sheet";
import { DuelPraisePanel } from "./duel-praise-panel";
import { useDuelController } from "./use-duel-controller";

export function DuelPanel({ slug }: { slug: string }) {
  const controller = useDuelController(slug);
  const [loginDismissed, setLoginDismissed] = useState(false);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  if (controller.state === "loading") return null;

  if (controller.state === "gone" || !controller.duel) {
    return (
      <PageShell width="narrow" className="grid place-items-center text-center">
        <div>
          <p className="font-serif text-2xl text-ink">이 대결은 사라졌어요</p>
          <p className="mt-3 text-sm text-mist">링크가 잘못됐거나 만료됐을 수 있어요.</p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[48px] items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            오늘 해볼까 구경하기 →
          </Link>
        </div>
      </PageShell>
    );
  }

  const { duel, chosen, canSelect, activeRadio, radioRefs } = controller;

  return (
    <>
      <style>{`
        @keyframes duel-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          [data-duel-panel] *, [data-duel-login], [data-duel-login] * {
            transform: none !important;
            transition-duration: 100ms !important;
            transition-property: opacity, color, background-color, border-color, box-shadow !important;
          }
          [data-duel-motion] { animation: duel-fade-in 100ms ease both !important; }
        }
      `}</style>
      <PageShell width="narrow" className="pb-20 pt-8 sm:pt-12" data-duel-panel>
        <header className="text-center" data-duel-motion style={{ animation: "fade-up 400ms ease both" }}>
          <p className="text-xs font-bold text-glow">오늘 해볼까</p>
          <h1 className="mt-2 font-serif text-2xl leading-tight text-ink">친구의 오늘 만들 후보</h1>
          <p className="mt-2 text-sm text-mist">더 마음 가는 한 장에 힘을 실어주세요.</p>
        </header>

        <div
          role="radiogroup"
          aria-label="응원할 후보"
          aria-orientation="horizontal"
          aria-disabled={!canSelect}
          inert={canSelect ? undefined : true}
          className="mt-6 grid grid-cols-2 gap-3 sm:gap-4"
          data-duel-motion
          style={{ animation: "fade-up 400ms ease 50ms both" }}
        >
          <DuelCard
            ref={(node) => {
              radioRefs.current.a = node;
            }}
            side="a"
            payload={duel.a}
            chosen={chosen}
            disabled={!canSelect}
            tabIndex={canSelect && activeRadio === "a" ? 0 : -1}
            onPick={controller.choose}
            onKeyDown={controller.moveRadio}
          />
          <DuelCard
            ref={(node) => {
              radioRefs.current.b = node;
            }}
            side="b"
            payload={duel.b}
            chosen={chosen}
            disabled={!canSelect}
            tabIndex={canSelect && activeRadio === "b" ? 0 : -1}
            onPick={controller.choose}
            onKeyDown={controller.moveRadio}
          />
        </div>

        {controller.authState === "anonymous" && loginDismissed && !controller.legacyExpired ? (
          <button
            ref={loginButtonRef}
            type="button"
            className="mt-5 min-h-12 w-full rounded-lg bg-action px-4 text-sm font-black text-white transition-colors hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => setLoginDismissed(false)}
          >
            로그인하고 응원하기
          </button>
        ) : null}

        <DuelPraisePanel
          chosen={chosen}
          praise={controller.praise}
          submitState={controller.submitState}
          canSelect={canSelect}
          onSelect={controller.selectPraise}
          onSubmit={controller.submitPraise}
        />
        {controller.legacyExpired ? (
          <p role="alert" className="mt-5 text-center text-sm text-amber-200">
            이 대결은 예전 링크라 응원을 안전하게 보낼 수 없어요. 만든 친구에게 새 링크를 부탁해 주세요.
          </p>
        ) : null}
      </PageShell>

      <DuelLoginSheet
        open={controller.authState === "anonymous" && !controller.legacyExpired && !loginDismissed}
        onAuthenticated={controller.receiveAuthenticated}
        onDismiss={() => setLoginDismissed(true)}
        onReturnFocus={() => {
          if (controller.authState === "authenticated") {
            radioRefs.current[activeRadio]?.focus();
            return;
          }
          loginButtonRef.current?.focus();
        }}
      />
    </>
  );
}
