"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { PageShell } from "@/components/layouts/page-shell";
import type { AuthSession } from "@/lib/auth-session";
import { trackGrowth, newRoundId } from "@/lib/growth";
import { drawIdeaCandidates, selectionEventParams, type IdeaCandidate } from "@/lib/idea";
import { legacyTasteFor, preferenceForId, type PreferenceId } from "@/lib/preferences";
import { buildDeck, type AxisId } from "@/lib/pools";
import { duelUrl, shareOrCopy, toPayload, type RoundMeta } from "@/lib/share";
import { IdeaCandidateCard } from "./idea-candidate-card";
import { FanDeck, type FanDeckHandle } from "./fan-deck";

export interface IdeaDrawBoardProps {
  session: AuthSession;
  preferences: PreferenceId[];
  sourceRoundId?: string | null;
  rootRoundId?: string | null;
  onEditPreferences: () => void;
}

type ShareState = { kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string; url: string };
export function IdeaDrawBoard({ session, preferences, sourceRoundId = null, rootRoundId = null, onEditPreferences }: IdeaDrawBoardProps) {
  const [candidates, setCandidates] = useState<[IdeaCandidate, IdeaCandidate] | null>(null);
  const [deckCards, setDeckCards] = useState<ReturnType<typeof buildDeck>>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [hotAxis, setHotAxis] = useState<AxisId | null>(null);
  const [shareState, setShareState] = useState<ShareState>({ kind: "idle" });
  const deckRef = useRef<FanDeckHandle>(null);
  const cardARef = useRef<HTMLButtonElement>(null);
  const cardBRef = useRef<HTMLButtonElement>(null);
  const roundIdRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const prepareRound = useCallback(() => {
    clearTimers();
    setCandidates(drawIdeaCandidates(preferences));
    setDeckCards(buildDeck(null, legacyTasteFor(preferences)));
    setRevealedCount(0);
    setBusy(false);
    setComplete(false);
    setHotAxis(null);
    setShareState({ kind: "idle" });
    roundIdRef.current = null;
  }, [preferences]);

  useEffect(() => {
    prepareRound();
    return clearTimers;
  }, [prepareRound]);

  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const later = (callback: () => void, ms: number) => {
    const timer = setTimeout(callback, reducedMotion() ? 100 : ms);
    timersRef.current.push(timer);
  };

  const targetRect = (axis: AxisId): DOMRect | null => {
    if (axis === "seed") return cardARef.current?.getBoundingClientRect() ?? null;
    if (axis === "pain") return cardBRef.current?.getBoundingClientRect() ?? null;
    return null;
  };

  const finishTwoCards = () => {
    const roundId = (roundIdRef.current ??= newRoundId());
    setComplete(true);
    setBusy(false);
    trackGrowth("two_cards_completed", {
      origin_round_id: sourceRoundId,
      root_round_id: rootRoundId ?? sourceRoundId ?? roundId,
      user_id: session.actorId,
      child_round_id: roundId,
      ...selectionEventParams(candidates ?? []),
    });
  };

  const settleReveal = () => {
    const index = revealedCount;
    if (index > 1) return;
    setHotAxis(null);
    setBusy(true);
    setRevealedCount(index + 1);
    if (index === 0) later(() => setBusy(false), 280);
    else later(finishTwoCards, 650);
  };

  const openCard = (index: 0 | 1) => {
    if (!candidates || busy || index !== revealedCount) return;
    setBusy(true);
    const axis: AxisId = index === 0 ? "seed" : "pain";
    const accepted = deckRef.current?.drawTo(axis, () => undefined);
    if (!accepted) setBusy(false);
  };

  const roundMeta = (roundId: string): RoundMeta => ({
    roundId,
    parentRoundId: sourceRoundId,
    rootRoundId: rootRoundId ?? sourceRoundId ?? roundId,
    preferenceIds: preferences,
  });

  const shareRound = async () => {
    if (!candidates || !complete) return;
    const roundId = (roundIdRef.current ??= newRoundId());
    const payloadA = toPayload(candidates[0].combo, session.displayName, candidates[0].preferenceId);
    const payloadB = toPayload(candidates[1].combo, session.displayName, candidates[1].preferenceId);
    const url = duelUrl(payloadA, payloadB, roundMeta(roundId));
    trackGrowth("share_sheet_opened", { round_id: roundId, origin_round_id: sourceRoundId, user_id: session.actorId });
    const result = await shareOrCopy(url, {
      title: "오늘 만들 후보 두 장",
      text: "오늘 만들 후보 두 장을 뽑았어. 하나만 골라주고 힘 좀 줘.",
    });
    if (!result.ok) {
      setShareState({ kind: "error", message: "공유나 복사를 완료하지 못했어요.", url });
      return;
    }
    trackGrowth("round_shared", {
      round_id: roundId,
      origin_round_id: sourceRoundId,
      root_round_id: rootRoundId ?? sourceRoundId ?? roundId,
      user_id: session.actorId,
      child_round_id: roundId,
      share_method: result.method,
    });
    setShareState({
      kind: "success",
      message: result.method === "native" ? "라운드 공유를 마쳤어요." : "라운드 링크를 복사했어요.",
    });
  };

  const redrawRound = () => {
    trackGrowth("two_cards_redrawn", {
      origin_round_id: sourceRoundId,
      root_round_id: rootRoundId ?? sourceRoundId,
      user_id: session.actorId,
      ...selectionEventParams(candidates ?? []),
    });
    prepareRound();
  };

  const preferenceLabels = useMemo(
    () => preferences.map((id) => preferenceForId(id).label),
    [preferences],
  );

  if (!candidates || deckCards.length === 0) {
    return <PageShell width="wide" className="grid place-items-center text-sm text-mist">카드를 준비하는 중</PageShell>;
  }

  return (
    <PageShell width="wide" className="px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 min-[600px]:pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <style>{`@keyframes candidate-reveal{0%{opacity:0;transform:rotateY(90deg) scale(.94)}60%{opacity:1;transform:rotateY(-4deg) scale(1.02)}100%{opacity:1;transform:rotateY(0) scale(1)}}`}</style>
      <header className="mx-auto flex w-full max-w-[760px] items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-glow">오늘 해볼까</p>
          <h1 className="mt-2 font-serif text-2xl leading-tight text-ink">취향에 맞는 구체적 후보 두 장</h1>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="선택한 취향">
            {preferenceLabels.map((label) => (
              <span key={label} className="rounded-pill border border-white/15 px-2.5 py-1 text-[11px] text-mist">
                {label}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="취향 다시 고르기"
          title="취향 다시 고르기"
          onClick={onEditPreferences}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-mist transition-colors hover:bg-white/10 hover:text-ink"
        >
          <Pencil aria-hidden className="h-5 w-5" />
        </button>
      </header>

      <div data-board-layout className="mx-auto mt-6 grid w-full max-w-[760px] gap-4 sm:gap-5 min-[840px]:mt-4 min-[840px]:gap-4">
        <section data-result-card-zone className="relative z-10 mx-auto w-full max-w-[600px] px-3 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <IdeaCandidateCard
              ref={cardARef}
              candidate={candidates[0]}
              index={0}
              active={!busy && revealedCount === 0}
              dragOver={hotAxis === "seed"}
              revealed={revealedCount >= 1}
              onOpen={() => openCard(0)}
            />
            <IdeaCandidateCard
              ref={cardBRef}
              candidate={candidates[1]}
              index={1}
              active={!busy && revealedCount === 1}
              dragOver={hotAxis === "pain"}
              revealed={revealedCount >= 2}
              onOpen={() => openCard(1)}
            />
          </div>

          <p className="mt-3 text-center text-xs text-caption" aria-live="polite">
            {revealedCount === 0 ? "카드 A를 탭해 열어보세요" : revealedCount === 1 ? "이제 카드 B를 열어보세요" : "두 후보가 준비됐어요"}
          </p>
        </section>

        <div
          data-card-deck-zone
          className="relative z-20 isolate mx-auto h-[230px] w-full max-w-[760px] overflow-hidden sm:h-[270px] min-[840px]:h-[210px]"
        >
          <FanDeck
            ref={deckRef}
            cards={deckCards}
            disabled={revealedCount >= 2}
            flightDurationMs={420}
            aimAxis={revealedCount === 0 ? "seed" : revealedCount === 1 ? "pain" : null}
            inactiveAxes={[]}
            getTargetRect={targetRect}
            onDragOver={setHotAxis}
            onPick={settleReveal}
          />
        </div>
      </div>

      <div data-primary-actions role="group" aria-label="라운드 주요 작업" className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[760px] -translate-x-1/2 gap-2 border-t border-white/10 bg-[#0a0a0b]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,.35)] backdrop-blur-xl sm:px-6 min-[600px]:grid-cols-[minmax(0,1fr)_auto] min-[840px]:grid-cols-[minmax(280px,420px)_minmax(160px,200px)] min-[840px]:justify-end">
        <Button type="button" variant="aurora" size="lg" disabled={!complete} onClick={shareRound} className="w-full px-4 text-sm sm:px-7 sm:text-base">
          <Users aria-hidden className="h-5 w-5" />
          BF.D에게 골라달라고 하기
        </Button>
        <Button type="button" variant="glass" size="lg" disabled={!complete} onClick={redrawRound} className="w-full px-4 text-sm sm:px-7 sm:text-base">
          <RefreshCw aria-hidden className="h-5 w-5" />
          다른 두 장
        </Button>
      </div>

      {shareState.kind !== "idle" ? (
        <div
          role="status"
          className={`mx-auto mt-3 w-full max-w-[760px] rounded-btn border px-4 py-3 text-sm ${
            shareState.kind === "error" ? "border-rose/40 text-rose" : "border-good/40 text-good"
          }`}
        >
          <p>{shareState.message}</p>
          {shareState.kind === "error" ? (
            <input
              aria-label="직접 복사할 라운드 주소"
              readOnly
              value={shareState.url}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-2 h-12 w-full rounded-input border border-white/15 bg-black/30 px-3 text-xs text-ink outline-none focus:border-glow"
            />
          ) : null}
        </div>
      ) : null}
    </PageShell>
  );
}
