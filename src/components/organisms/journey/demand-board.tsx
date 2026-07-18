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
import { duelUrl, encodeDuelSlug, shareOrCopy, shareUrl } from "@/lib/share";
import { addDuel, type PublishedCard, type Vote } from "@/lib/storage";
import { fetchVotes } from "@/lib/backend/votes";
import { fetchPublished } from "@/lib/backend/published";
import { publishCard } from "@/lib/backend/published";
import { prepareFeedbackAccess } from "@/lib/backend/secure-feedback";
import { writeAccessFrom } from "@/lib/feedback-access";
import { newRoundId } from "@/lib/growth";
import { fakeDoor, track, trackShare } from "@/lib/track";
import { DuelStatus } from "./duel-status";
import { cardTitle } from "./publish-card";

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
  const [toast, setToast] = useState<string | null>(null);
  const [duelRev, setDuelRev] = useState(0); // 대결 생성 시 현황 목록 리렌더
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    track("dashboard_view");
    // ★핵심: 발행자가 자기 브라우저 표만 보던 블로커 해소 — 카드 목록도(fetchPublished) 응원도
    //   (fetchVotes) 서버(Supabase)에서 읽는다 — 로그인 상태면 기기가 바뀌어도 동일한 대시보드.
    let cancelled = false;
    void fetchPublished()
      .then((cards) => Promise.all(cards.map(async (card) => ({
        card,
        votes: await fetchVotes(
          card.slug,
          card.payload.feedback && card.feedbackReadToken
            ? { requestId: card.payload.feedback.requestId, readToken: card.feedbackReadToken }
            : undefined,
        ),
      }))))
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
    setToast("링크를 복사했어요");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  const copyShare = async (row: Row) => {
    const access = await prepareFeedbackAccess(
      "card",
      row.card.payload.feedback,
      row.card.feedbackReadToken,
    );
    if (!access) {
      setToast("안전한 링크를 준비하지 못했어요.");
      return;
    }
    const payload = { ...row.card.payload, feedback: writeAccessFrom(access) };
    const card = { ...row.card, payload, feedbackReadToken: access.readToken };
    await publishCard(card);
    setRows((current) => current?.map((item) => (
      item.card.slug === row.card.slug ? { ...item, card } : item
    )) ?? current);
    const result = await shareOrCopy(shareUrl(payload), {
      title: cardTitle(payload),
      text: `${cardTitle(payload)} — 오늘 해볼까에서 뽑았어. 어때?`,
    });
    if (!result.ok) return;
    trackShare("card_share", result.method, { channel: "link", stage: "dashboard" });
    setToast(result.method === "native" ? "공유했어요" : "링크를 복사했어요");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  const createDuel = async () => {
    const [first, second] = rows; // 최근 2장 고정 — 카드 선택 UI는 다음 단계
    if (!first || !second) return;
    const a = first.card.payload;
    const b = second.card.payload;
    const access = await prepareFeedbackAccess("duel");
    if (!access) {
      setToast("안전한 대결 링크를 준비하지 못했어요.");
      return;
    }
    const roundId = newRoundId();
    const meta = {
      roundId,
      rootRoundId: roundId,
      feedback: writeAccessFrom(access),
    };
    const slug = encodeDuelSlug(a, b, meta);
    const result = await shareOrCopy(duelUrl(a, b, meta), {
      title: "오늘 해볼까 A/B 대결",
      text: `${cardTitle(a)} vs ${cardTitle(b)} — 오늘 해볼까에서 뽑았어. 뭐가 나아?`,
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
    trackShare("duel_created", result.method, { via: "dashboard" });
    setDuelRev((r) => r + 1);
    setToast(result.method === "native" ? "공유했어요" : "대결 링크를 복사했어요");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2000);
  };

  const openReport = (row: Row) => {
    fakeDoor("demand_report", 1900, { stage: "dashboard", votes: row.votes.length });
    setSheetOpen(true);
  };

  return (
    <PageShell>
      <TopBar />
      <div className="mx-auto mt-4 max-w-narrow">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">내 카드</h1>

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
                  <h2 className="text-lg font-semibold leading-snug text-ink">{cardTitle(row.card.payload)}</h2>
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
                      <p>반응 데이터가 쌓이면 수요 신호와 다음 행동을 보여드려요.</p>
                    </div>
                  </BlurVeil>
                  <p className="mt-2 text-xs text-caption">도착한 응원 {n}개 · 자가·중복 제외</p>
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

        {rows.length > 0 ? (
          <div className="mt-8 pb-4 text-center">
            <Button variant="ghost" onClick={() => router.push("/start")}>
              🌱 새 씨앗으로 또 뽑기
            </Button>
          </div>
        ) : null}
      </div>

      {toast && (
        <div
          role="status"
          className="glass-strong fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-pill px-4 py-2 text-sm text-ink"
          data-anim
          style={{ animation: "fade-up .25s ease both" }}
        >
          {toast}
        </div>
      )}

      <FakeDoorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} product="demand_report" title="수요 리포트" />
    </PageShell>
  );
}
