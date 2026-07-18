"use client";

// [S6] A/B 응원 대결 현황 — 어느 쪽이 응원을 더 받는지 한눈에 (응원은 수신자 기기에 쌓이는 로컬 원칙)
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { encodeDuelSlug, type RoundMeta } from "@/lib/share";
import { fetchDuelVotes, type DuelSide, type DuelVotes } from "@/lib/backend/votes";
import { addDuel, loadDuels, type Duel } from "@/lib/storage";
import { prepareFeedbackAccess } from "@/lib/backend/secure-feedback";
import { writeAccessFrom } from "@/lib/feedback-access";
import { newRoundId } from "@/lib/growth";
import { track } from "@/lib/track";
import { copyText } from "@/lib/copy-text";
import { cn } from "@/lib/utils";
import { cardTitle } from "./publish-card";

interface DuelRow {
  duel: Duel;
  votes: DuelVotes;
}

export function DuelStatus({ onCopied }: { onCopied?: () => void }) {
  const [rows, setRows] = useState<DuelRow[]>([]);

  useEffect(() => {
    // 대결 현황도 서버 집계로 — fetchDuelVotes로 모든 수신자의 A/B 응원을 읽는다.
    let cancelled = false;
    void Promise.all(
      loadDuels().map(async (duel) => ({
        duel,
        votes: await fetchDuelVotes(
          duel.slug,
          duel.feedback && duel.feedbackReadToken
            ? { requestId: duel.feedback.requestId, readToken: duel.feedbackReadToken }
            : undefined,
        ),
      })),
    ).then((loaded) => {
      if (!cancelled) setRows(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return null;

  const copy = async (row: DuelRow) => {
    const access = await prepareFeedbackAccess(
      "duel",
      row.duel.feedback,
      row.duel.feedbackReadToken,
    );
    if (!access) return;
    const roundId = newRoundId();
    const meta: RoundMeta = {
      roundId,
      rootRoundId: roundId,
      feedback: writeAccessFrom(access),
    };
    const secured = row.duel.feedback?.requestId === access.requestId
      ? row.duel
      : {
          ...row.duel,
          slug: encodeDuelSlug(row.duel.a, row.duel.b, meta),
          feedback: meta.feedback,
          feedbackReadToken: access.readToken,
        };
    addDuel(secured);
    setRows((current) => current.map((item) => (
      item.duel.slug === row.duel.slug ? { ...item, duel: secured } : item
    )));
    await copyText(`${location.origin}/vs/${secured.slug}`);
    track("card_share", { channel: "link", stage: "dashboard", kind: "duel" });
    onCopied?.();
  };

  return (
    <div className="mt-6 grid gap-5">
      {rows.map((row) => {
        const { a, b } = row.votes;
        const total = a + b;
        const lead: DuelSide | null = a === b ? null : a > b ? "a" : "b";
        return (
          <GlassCard key={row.duel.slug} className="p-5" data-anim style={{ animation: "fade-up .4s ease both" }}>
            <p className="text-xs text-caption">🆚 응원 대결</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-ink">
              {cardTitle(row.duel.a)} <span className="text-mist">vs</span> {cardTitle(row.duel.b)}
            </h2>
            <p className="mt-2 text-sm text-gold">{total > 0 ? <>📣 <b>{total}명</b> 응원 도착</> : "아직 응원 대기 중"}</p>
            <div className="mt-3 grid gap-2">
              <CheerBar label="A" count={a} total={total} leading={lead === "a"} />
              <CheerBar label="B" count={b} total={total} leading={lead === "b"} />
            </div>
            <div className="mt-3 text-center">
              <Button variant="ghost" onClick={() => copy(row)}>
                🔗 대결 링크 다시 복사
              </Button>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

function CheerBar({ label, count, total, leading }: { label: string; count: number; total: number; leading: boolean }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-xs text-caption">{label}</span>
      <div className="glass h-2.5 flex-1 overflow-hidden rounded-pill">
        <div
          className={cn("h-full rounded-pill", leading ? "aurora" : count > 0 ? "bg-white/25" : "bg-transparent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-mist">{count}</span>
    </div>
  );
}
