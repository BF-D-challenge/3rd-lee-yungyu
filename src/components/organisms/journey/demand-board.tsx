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
import { duelUrl, encodeDuelSlug, shareUrl } from "@/lib/share";
import { addDuel, type PublishedCard, type Vote } from "@/lib/storage";
import { fetchVotes } from "@/lib/backend/votes";
import { fetchPublished } from "@/lib/backend/published";
import { fakeDoor, track } from "@/lib/track";
import { DuelStatus } from "./duel-status";
import { cardTitle } from "./publish-card";
import { copyText } from "./share-row";

// 긍정 전용 4칩 — need>notify>watch>cheer 순 수요 강도 (부정칩 없음)
const VOTE_EMOJI: Record<Vote["type"], string> = { need: "🔥", notify: "🙌", watch: "👀", cheer: "💪" };
const VOTE_LABEL: Record<Vote["type"], string> = {
  need: "나도 이거 필요해",
  notify: "완성하면 알려줘",
  watch: "지켜볼게",
  cheer: "너라면 만들어",
};
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
  const [duelRev, setDuelRev] = useState(0); // 대결 생성 시 현황 목록 리렌더
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    track("dashboard_view");
    // ★핵심: 발행자가 자기 브라우저 표만 보던 블로커 해소 — 카드 목록도(fetchPublished) 응원도
    //   (fetchVotes) 서버(Supabase)에서 읽는다 — 로그인 상태면 기기가 바뀌어도 동일한 대시보드.
    let cancelled = false;
    void fetchPublished()
      .then((cards) => Promise.all(cards.map(async (card) => ({ card, votes: await fetchVotes(card.slug) }))))
      .then((loaded) => {
        if (!cancelled) setRows(loaded);
      });
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, []);

  if (!rows) return null;

  const showToast = () => {
    setToast(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 2000);
  };

  const copyShare = async (row: Row) => {
    await copyText(shareUrl(row.card.payload));
    track("card_share", { channel: "link", stage: "dashboard" });
    showToast();
  };

  const createDuel = async () => {
    const [first, second] = rows; // 최근 2장 고정 — 카드 선택 UI는 다음 단계
    if (!first || !second) return;
    const a = first.card.payload;
    const b = second.card.payload;
    addDuel({ slug: encodeDuelSlug(a, b), a, b, createdAt: Date.now() });
    await copyText(duelUrl(a, b));
    track("duel_created", { via: "dashboard" });
    setDuelRev((r) => r + 1);
    showToast();
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

        {rows.length >= 2 && (
          <div className="mt-4 text-center" data-anim style={{ animation: "fade-up .4s ease both" }}>
            <Button variant="glass" onClick={createDuel}>
              🆚 A/B 대결 만들기
            </Button>
            <p className="mt-1.5 text-xs text-caption">최근 카드 2장으로 만들고 링크를 복사해요</p>
          </div>
        )}

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
              const needN = row.votes.filter((v) => v.type === "need").length;
              const softHold = n > 0 && needN === 0; // 응원은 왔지만 🔥 '필요해'는 0 → 강한 보류
              const unlocked = n >= REPORT_MIN_VOTES;
              return (
                <GlassCard key={row.card.slug} className="p-5" data-anim style={{ animation: "fade-up .4s ease both" }}>
                  <h2 className="font-serif text-lg leading-snug text-ink">{cardTitle(row.card.payload)}</h2>
                  <p className="mt-2 text-sm text-gold">
                    📬 <b>{n}명</b> 도착 · 🔥 <b>{needN}명</b> 필요해
                  </p>
                  {softHold && (
                    <p className="mt-1 text-xs text-caption">
                      응원 {n}명인데 🔥 &lsquo;필요해&rsquo;는 0명 — 따뜻한 응원일 뿐 강한 수요 신호는 아직이에요 (표본 {n})
                    </p>
                  )}
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
                      <p>🔥 필요해 ●명 · 🙌 알려줘 ●명 · 👀 지켜봄 ●명 · 💪 응원 ●명</p>
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

        <DuelStatus key={duelRev} onCopied={showToast} />

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
