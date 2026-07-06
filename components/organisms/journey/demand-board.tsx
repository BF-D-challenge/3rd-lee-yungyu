"use client";

// [S6] 수요 대시보드 — 무료는 "N명 도착"까지, 찬반 카운트 비공개(R5) + 무결성 문구(R7)
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlurVeil } from "@/components/atoms/blur-veil";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
import { PageShell } from "@/components/layouts/page-shell";
import { TopBar } from "@/components/layouts/top-bar";
import { shareUrl } from "@/lib/share";
import { loadPublished, loadVotes, type PublishedCard, type Vote } from "@/lib/storage";
import { fakeDoor, track } from "@/lib/track";
import { cardTitle } from "./publish-card";

const VOTE_EMOJI: Record<Vote["type"], string> = { try: "🔥", empathy: "💬", meh: "🤔" };
const VOTE_LABEL: Record<Vote["type"], string> = { try: "나도 써볼래", empathy: "문제 공감", meh: "글쎄" };
const REPORT_MIN_VOTES = 5;

interface Row {
  card: PublishedCard;
  votes: Vote[];
}

export function DemandBoard() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setRows(loadPublished().map((card) => ({ card, votes: loadVotes(card.slug) })));
    track("dashboard_view");
    return () => clearTimeout(timer.current);
  }, []);

  if (!rows) return null;

  const copyShare = async (row: Row) => {
    try {
      await navigator.clipboard.writeText(shareUrl(row.card.payload));
    } catch {
      /* 클립보드 실패 무시 */
    }
    track("card_share", { channel: "link", stage: "dashboard" });
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2000);
  };

  const openReport = (row: Row) => {
    fakeDoor("demand_report", 1900, { stage: "dashboard", votes: row.votes.length });
    setSheetOpen(true);
  };

  return (
    <PageShell>
      <TopBar />
      <div className="mx-auto mt-4 max-w-narrow">
        <h1 className="text-center font-serif text-2xl text-ink">내 카드</h1>

        {rows.length === 0 ? (
          <GlassCard className="mt-8 p-10 text-center" data-anim style={{ animation: "fade-up .4s ease both" }}>
            <p className="text-lg text-ink">아직 카드가 없어요</p>
            <Button variant="aurora" size="lg" className="mt-6" onClick={() => router.push("/start")}>
              🌱 첫 카드 만들기
            </Button>
          </GlassCard>
        ) : (
          <div className="mt-6 grid gap-5">
            {rows.map((row) => {
              const n = row.votes.length;
              const first = row.votes[0];
              const unlocked = n >= REPORT_MIN_VOTES;
              return (
                <GlassCard key={row.card.slug} className="p-5" data-anim style={{ animation: "fade-up .4s ease both" }}>
                  <h2 className="font-serif text-lg leading-snug text-ink">{cardTitle(row.card.payload)}</h2>
                  <p className="mt-2 text-sm text-gold">
                    📬 <b>{n}명</b> 도착
                  </p>
                  {first && (
                    <p className="mt-1 truncate text-sm text-mist">
                      첫 반응: {VOTE_EMOJI[first.type]}{" "}
                      {first.comment ? `"${first.comment}"` : VOTE_LABEL[first.type]}
                    </p>
                  )}

                  <BlurVeil
                    className="mt-4"
                    overlay={
                      <div className="text-center">
                        <Button variant="aurora" disabled={!unlocked} onClick={() => openReport(row)}>
                          📊 수요 리포트 열기 · 1,900원
                        </Button>
                        {!unlocked && <p className="mt-2 text-xs text-caption">5표가 모이면 열 수 있어요</p>}
                      </div>
                    }
                  >
                    <div className="p-5 text-sm leading-7 text-mist">
                      <p>🔥 써볼래 ●명 · 💬 공감 ●명 · 🤔 글쎄 ●명</p>
                      <p>누가: 20대 러닝 크루 · 직장인 ●●●</p>
                      <p>왜: &ldquo;기록이 귀찮아서 ●●●●●&rdquo;</p>
                      <p>판정: ●●● — 지금 만들어도 ●●●●</p>
                    </div>
                  </BlurVeil>
                  <p className="mt-2 text-xs text-caption">검증된 고유 투표자 {n}명 · 자가·중복 제외</p>
                  <div className="mt-3 text-center">
                    <Button variant="ghost" onClick={() => copyShare(row)}>
                      🔗 카드 다시 공유
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <div className="mt-8 pb-4 text-center">
          <Button variant="ghost" onClick={() => router.push("/start")}>
            🌱 새 씨앗으로 또 뽑기
          </Button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="glass-strong fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-pill px-4 py-2 text-sm text-ink"
          data-anim
          style={{ animation: "fade-up .25s ease both" }}
        >
          링크를 복사했어요
        </div>
      )}

      <FakeDoorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product="demand_report" title="수요 리포트" />
    </PageShell>
  );
}
