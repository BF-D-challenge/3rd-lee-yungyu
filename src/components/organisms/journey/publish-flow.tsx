"use client";

// [S3] 카드 발행 — ★로그인 유일 지점(가짜 문) + 공유 + 수요 리포트 선결제 예약 (PRD §5, §6.4③)
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { duelUrl, encodeDuelSlug, encodeSlug, type CardPayload } from "@/lib/share";
import { addDuel, loadPublished, type PublishedCard } from "@/lib/storage";
import { authEnabled, getUser, signInWithGoogle } from "@/lib/backend/auth";
import { fetchPublished, publishCard } from "@/lib/backend/published";
import { fakeDoor, track } from "@/lib/track";
import { PublishCard } from "./publish-card";
import { copyText, ShareRow } from "./share-row";

const CONFIRMED_KEY = "oneul:confirmed";

export function PublishFlow() {
  const router = useRouter();
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [authed, setAuthed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [prevCard, setPrevCard] = useState<PublishedCard | null>(null);
  const [duelToast, setDuelToast] = useState(false);
  const published = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 발행 확정 + 공유 화면 진입 (가짜 통과·OAuth 복귀 공용)
  // 로그인 상태면 Supabase(published_cards)에도 동기화 — 기기 간 동일 대시보드의 실질 가치.
  const finishAuth = async (p: CardPayload) => {
    if (!published.current) {
      published.current = true;
      await publishCard({ slug: encodeSlug(p), payload: p, publishedAt: Date.now() });
    }
    const list = await fetchPublished();
    setPrevCard(list[1] ?? null); // 직전 발행 카드 — 있으면 A/B 대결 진입점
    setAuthed(true);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // OAuth 리다이렉트 복귀 감지 — Supabase 세션이 있으면 발행 완료 상태로 (env 미설정이면 no-op)
  useEffect(() => {
    if (!authEnabled || !payload) return;
    const p = payload;
    let cancelled = false;
    void getUser().then((user) => {
      if (!cancelled && user) void finishAuth(p);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

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
    track("auth_prompt");
  }, [router]);

  if (!payload) return null;

  const signIn = async () => {
    track("auth_done", { method: "google" });
    if (authEnabled) {
      const { error } = await signInWithGoogle(window.location.href);
      if (!error) return; // OAuth 리다이렉트 진행 — 복귀 시 위 useEffect가 발행 완료
      // OAuth 시작 실패 시 데모처럼 통과(graceful)
    }
    void finishAuth(payload); // env 미설정 → 기존 가짜 통과 유지
  };

  const askDuel = async () => {
    if (!prevCard) return;
    const a = payload;
    const b = prevCard.payload;
    addDuel({ slug: encodeDuelSlug(a, b), a, b, createdAt: Date.now() });
    await copyText(duelUrl(a, b));
    track("duel_created", { via: "publish" });
    setDuelToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setDuelToast(false), 2000);
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
              <Button variant="aurora" size="lg" className="w-full" onClick={signIn}>
                <span className="font-serif font-bold">G</span> 구글로 3초 만에 시작
              </Button>
              <p className="mt-2 text-center text-xs text-caption">카드 보관·투표 결과 확인용</p>
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
          대결 링크를 복사했어요
        </div>
      )}

      <FakeDoorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product="demand_report" title="수요 리포트" />
    </PageShell>
  );
}
