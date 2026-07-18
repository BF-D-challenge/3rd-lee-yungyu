"use client";

// [S3] 카드 발행 — ★로그인 유일 지점(가짜 문) + 공유 + 수요 리포트 선결제 예약 (PRD §5, §6.4③)
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { shareToKakao } from "@/lib/kakao-share";
import { duelUrl, encodeDuelSlug, encodeSlug, type CardPayload } from "@/lib/share";
import { addDuel, loadPublished, type PublishedCard } from "@/lib/storage";
import { authEnabled } from "@/lib/backend/auth";
import {
  beginAuth,
  checkAuthSession,
  consumeAuthPending,
  markAuthPending,
} from "@/lib/auth-session";
import { fetchPublished, publishCard } from "@/lib/backend/published";
import { prepareFeedbackAccess } from "@/lib/backend/secure-feedback";
import { writeAccessFrom } from "@/lib/feedback-access";
import { newRoundId } from "@/lib/growth";
import { fakeDoor, track, trackShare } from "@/lib/track";
import { cardTitle, PublishCard } from "./publish-card";
import { ShareRow } from "./share-row";

const CONFIRMED_KEY = "oneul:confirmed";

const cleanFromName = (value: string | undefined): string | undefined => {
  const firstWord = value?.trim().replace(/\s+/g, " ").split(" ")[0]?.replace(/님$/, "");
  return firstWord ? firstWord.slice(0, 16) : undefined;
};

const withFromName = (payload: CardPayload, fromName: string | undefined): CardPayload => {
  const clean = cleanFromName(fromName);
  if (!clean || payload.fromName === clean) return payload;
  return { ...payload, fromName: clean };
};

const rememberConfirmed = (payload: CardPayload) => {
  try {
    sessionStorage.setItem(CONFIRMED_KEY, JSON.stringify(payload));
  } catch {
    /* 세션 저장 실패는 발행/공유 흐름에 영향 없음 */
  }
};

export function PublishFlow() {
  const router = useRouter();
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [authed, setAuthed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prevCard, setPrevCard] = useState<PublishedCard | null>(null);
  const [duelToast, setDuelToast] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const published = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 발행 확정 + 공유 화면 진입 (가짜 통과·OAuth 복귀 공용)
  // 로그인 상태면 Supabase(published_cards)에도 동기화 — 기기 간 동일 대시보드의 실질 가치.
  const finishAuth = async (p: CardPayload, displayName?: string) => {
    const namedPayload = withFromName(p, displayName ?? p.fromName);
    const existing = loadPublished().find(
      (card) => card.payload.feedback?.requestId === namedPayload.feedback?.requestId,
    );
    const access = await prepareFeedbackAccess(
      "card",
      namedPayload.feedback,
      existing?.feedbackReadToken,
    );
    if (!access) {
      setSecurityNotice("안전한 공유 링크를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const nextPayload = { ...namedPayload, feedback: writeAccessFrom(access) };
    setSecurityNotice(null);
    setPayload(nextPayload);
    rememberConfirmed(nextPayload);
    if (!published.current) {
      published.current = true;
      await publishCard({
        slug: encodeSlug(nextPayload),
        payload: nextPayload,
        feedbackReadToken: access.readToken,
        publishedAt: Date.now(),
      });
    }
    const list = await fetchPublished();
    setPrevCard(list[1] ?? null); // 직전 발행 카드 — 있으면 A/B 대결 진입점
    setAuthed(true);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // OAuth 리다이렉트 복귀 감지 — Supabase 세션이 있으면 발행 완료 상태로 (env 미설정이면 no-op)
  useEffect(() => {
    if (!authEnabled || !payload || authed) return;
    const p = payload;
    let cancelled = false;
    void checkAuthSession().then((session) => {
      if (!cancelled && session) {
        setAuthPending(false);
        if (consumeAuthPending("creator")) {
          track("auth_done", { context: "creator", method: session.demo ? "demo" : "google" });
        }
        void finishAuth(p, session.displayName);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, payload]);

  useEffect(() => {
    let next: CardPayload | null = null;
    try {
      const raw = sessionStorage.getItem(CONFIRMED_KEY);
      if (raw) next = JSON.parse(raw) as CardPayload;
    } catch {
      /* 파싱 실패 → 폴백 */
    }
    next ??= loadPublished()[0]?.payload ?? null;
    if (!next) {
      router.replace("/start");
      return;
    }
    setPayload(next);
    track("view_publish");
  }, [router]);

  if (!payload) return null;

  const signIn = async () => {
    if (authPending) return;
    setAuthPending(true);
    setSecurityNotice(null);
    track("auth_prompt", { context: "creator" });
    markAuthPending("creator");
    const result = await beginAuth(window.location.href);
    if (result.status === "redirecting") return;

    setAuthPending(false);
    if (result.status === "error") {
      consumeAuthPending("creator");
      setSecurityNotice("Google 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    consumeAuthPending("creator");
    track("auth_done", { context: "creator", method: result.session.demo ? "demo" : "google" });
    void finishAuth(payload, result.session.displayName);
  };

  const askDuel = async () => {
    if (!prevCard) return;
    const a = payload;
    const b = prevCard.payload;
    const access = await prepareFeedbackAccess("duel");
    if (!access) {
      setDuelToast("안전한 대결 링크를 준비하지 못했어요.");
      return;
    }
    const roundId = newRoundId();
    const meta = {
      roundId,
      rootRoundId: roundId,
      feedback: writeAccessFrom(access),
    };
    const slug = encodeDuelSlug(a, b, meta);
    const result = await shareToKakao(duelUrl(a, b, meta), {
      title: "오늘 해볼까 A/B 대결",
      text: `${cardTitle(a)} vs ${cardTitle(b)} — 오늘 해볼까에서 뽑았어. 뭐가 나아?`,
      buttonTitle: "둘 중 골라주기",
    });
    if (!result.ok) return;
    addDuel({
      slug,
      a,
      b,
      feedback: meta.feedback,
      feedbackReadToken: access.readToken,
      createdAt: Date.now(),
    });
    trackShare("duel_created", result.method, { via: "publish" });
    setDuelToast("카카오톡 공유 화면을 열었어요");
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setDuelToast(null), 2000);
  };

  const openReportDoor = () => {
    fakeDoor("demand_report", 1900, { stage: "publish" });
    setSheetOpen(true);
  };

  return (
    <PageShell>
      <TopBar />
      <div className="mx-auto mt-6 max-w-narrow">
        <div data-anim style={{ animation: "fade-up .4s ease both" }}>
          <h1 className="text-center font-serif text-2xl leading-snug text-ink">친구들에게 물어봐 드릴게요</h1>
          <PublishCard payload={payload} className="mt-8" />
        </div>

        <div className="mt-10" data-anim style={{ animation: "fade-up .4s ease .15s both" }}>
          {!authed ? (
            <>
              <Button
                variant="aurora"
                size="lg"
                className="w-full"
                disabled={authPending}
                aria-busy={authPending}
                onClick={signIn}
              >
                <span className="font-serif font-bold">G</span> 구글로 3초 만에 시작
              </Button>
              <p className="mt-2 text-center text-xs text-caption">카드 보관·투표 결과 확인용</p>
              {securityNotice ? (
                <p role="alert" className="mt-3 text-center text-sm text-amber-200">{securityNotice}</p>
              ) : null}
            </>
          ) : (
            <div data-anim style={{ animation: "fade-up .35s ease both" }}>
              <ShareRow payload={payload} />
              <div className="mt-4 text-center">
                {prevCard ? (
                  <Button variant="glass" className="w-full" onClick={askDuel}>
                    🆚 둘 중 뭐가 나은지 물어보기
                  </Button>
                ) : (
                  <p className="text-xs text-caption">카드가 2장 모이면 A/B로 물어볼 수 있어요</p>
                )}
              </div>
            </div>
          )}

          <p className="mt-8 text-center">
            <button
              onClick={openReportDoor}
              className="text-sm text-mist underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              📊 투표 모이면 수요 리포트 받기 · 1,900~
            </button>
          </p>

          <p className="mt-4 text-center">
            <Link href="/dashboard" className="text-sm text-mist underline-offset-4 transition-colors hover:text-ink hover:underline">
              내 대시보드 →
            </Link>
          </p>
        </div>
      </div>

      {duelToast && (
        <div
          role="status"
          className="glass-strong fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-pill px-4 py-2 text-sm text-ink"
          data-anim
          style={{ animation: "fade-up .25s ease both" }}
        >
          {duelToast}
        </div>
      )}

      <FakeDoorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product="demand_report" title="수요 리포트" />
    </PageShell>
  );
}
