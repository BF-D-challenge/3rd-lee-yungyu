"use client";

// [S3] 카드 발행 — ★로그인 유일 지점(가짜 문) + 공유 + 수요 리포트 선결제 예약 (PRD §5, §6.4③)
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/button";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { encodeSlug, type CardPayload } from "@/lib/share";
import { addPublished, loadPublished } from "@/lib/storage";
import { fakeDoor, track } from "@/lib/track";
import { PublishCard } from "./publish-card";
import { ShareRow } from "./share-row";

const CONFIRMED_KEY = "oneul:confirmed";

export function PublishFlow() {
  const router = useRouter();
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [authed, setAuthed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const published = useRef(false);

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

  const signIn = () => {
    track("auth_done", { method: "google" });
    if (!published.current) {
      published.current = true;
      addPublished({ slug: encodeSlug(payload), payload, publishedAt: Date.now() });
    }
    setAuthed(true);
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

      <FakeDoorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product="demand_report" title="수요 리포트" />
    </PageShell>
  );
}
