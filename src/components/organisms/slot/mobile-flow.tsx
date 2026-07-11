"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchParams } from "next/navigation";
import { GoogleLoginButton } from "@/components/organisms/journey/google-login-button";
import { PageShell } from "@/components/layouts/page-shell";
import { checkAuthSession, consumeAuthPending, type AuthSession } from "@/lib/auth-session";
import { ensureGoldenLoaded } from "@/lib/golden-store";
import { openerKey, trackGrowth } from "@/lib/growth";
import {
  hasRequiredPreferenceGroups,
  loadPreferences,
  normalizePreferences,
  preferencesForSeed,
  savePreferences,
  type PreferenceId,
} from "@/lib/preferences";
import { track } from "@/lib/track";
import { backSvg } from "./card-back";
import { IdeaDrawBoard } from "./idea-draw-board";
import { PreferencePicker } from "./preference-picker";

type Stage = "loading" | "login" | "taste" | "draw";

const queryPreferences = (params: URLSearchParams): PreferenceId[] => {
  const values = [params.get("preference") ?? "", ...(params.get("preferences")?.split(",") ?? [])];
  const normalized = normalizePreferences(values);
  if (hasRequiredPreferenceGroups(normalized)) return normalized;
  const seedId = params.get("seed");
  return seedId ? preferencesForSeed(seedId, normalized[0]) : normalized;
};

export function MobileFlow() {
  const params = useSearchParams();
  const queryString = params.toString();
  const [stage, setStage] = useState<Stage>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [preferences, setPreferences] = useState<PreferenceId[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  const context = useMemo(() => {
    const search = new URLSearchParams(queryString);
    return {
      viaVote: search.get("via") === "vote",
      sourceRoundId: search.get("origin_round_id"),
      rootRoundId: search.get("root_round_id"),
      inherited: queryPreferences(search),
    };
  }, [queryString]);

  const resolveNextStage = (nextSession: AuthSession) => {
    const saved = loadPreferences(nextSession.actorId);
    const next = context.viaVote
      ? savePreferences(normalizePreferences([...context.inherited, ...saved]), nextSession.actorId)
      : saved;
    setSession(nextSession);
    setPreferences(next);
    setStage(hasRequiredPreferenceGroups(next) ? "draw" : "taste");
  };

  useEffect(() => {
    let cancelled = false;
    setStage("loading");
    void Promise.all([ensureGoldenLoaded(), checkAuthSession()]).then(([, currentSession]) => {
      if (cancelled) return;
      if (!currentSession) {
        setSession(null);
        setPreferences(context.inherited);
        setStage("login");
        track("view_login", { context: "creator" });
        return;
      }
      if (consumeAuthPending("creator")) {
        trackGrowth("auth_completed", {
          context: "creator",
          origin_round_id: context.sourceRoundId,
          root_round_id: context.rootRoundId,
          user_id: currentSession.actorId,
          opener_key: openerKey(),
          is_logged_in: true,
        });
      }
      resolveNextStage(currentSession);
    });
    return () => {
      cancelled = true;
    };
    // resolveNextStage intentionally derives from the current query context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.inherited, context.viaVote]);

  const authenticated = (nextSession: AuthSession) => {
    consumeAuthPending("creator");
    trackGrowth("auth_completed", {
      context: "creator",
      origin_round_id: context.sourceRoundId,
      root_round_id: context.rootRoundId,
      user_id: nextSession.actorId,
      opener_key: openerKey(),
      is_logged_in: true,
    });
    resolveNextStage(nextSession);
  };

  const submitFirstTaste = (selected: PreferenceId[]) => {
    if (!session) return;
    const next = savePreferences(selected, session.actorId);
    setPreferences(next);
    track("taste_submitted", { preference_ids: next, count: next.length, mode: "first" });
    setStage("draw");
  };

  const submitEditTaste = (selected: PreferenceId[]) => {
    if (!session) return;
    const next = savePreferences(selected, session.actorId);
    setPreferences(next);
    track("taste_submitted", { preference_ids: next, count: next.length, mode: "edit" });
    setEditOpen(false);
  };

  if (stage === "loading") {
    return <PageShell className="grid place-items-center text-sm text-mist">카드를 불러오는 중</PageShell>;
  }

  if (stage === "login") {
    return (
      <PageShell className="grid place-items-center pb-12">
        <section className="mx-auto flex w-full max-w-[360px] flex-col items-center text-center">
          <div
            aria-hidden
            className="h-[122px] w-[76px] rotate-[-4deg] [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: backSvg() }}
          />
          <p className="mt-6 text-sm font-bold text-glow">오늘 해볼까</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ink">오늘 만들 아이디어를 찾아볼까요?</h1>
          <p className="mt-4 text-sm leading-relaxed text-mist">내 취향에서 시작해 친구의 선택과 칭찬으로 한 장을 정해요.</p>
          <div className="mt-8 w-full">
            <GoogleLoginButton context="creator" onAuthenticated={authenticated} />
          </div>
          <p className="mt-2 text-xs text-caption">로그인 필수 · 건너뛰기 없음</p>
        </section>
      </PageShell>
    );
  }

  if (stage === "taste") {
    return (
      <PageShell className="pt-8 sm:pt-14">
        <PreferencePicker initial={preferences} mode="first" onSubmit={submitFirstTaste} />
      </PageShell>
    );
  }

  if (!session) return null;

  return (
    <>
      <IdeaDrawBoard
        session={session}
        preferences={preferences}
        sourceRoundId={context.sourceRoundId}
        rootRoundId={context.rootRoundId}
        onEditPreferences={() => setEditOpen(true)}
      />

      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
          <Dialog.Content
            data-anim
            className="glass-strong fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-t-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none"
            style={{ animation: "fade-up 300ms ease both" }}
          >
            <Dialog.Title className="sr-only">취향 다시 고르기</Dialog.Title>
            <PreferencePicker
              initial={preferences}
              mode="edit"
              onSubmit={submitEditTaste}
              onCancel={() => setEditOpen(false)}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
