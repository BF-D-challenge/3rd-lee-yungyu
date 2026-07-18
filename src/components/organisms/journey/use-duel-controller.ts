"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { checkAuthSession, consumeAuthPending, type AuthSession } from "@/lib/auth-session";
import { castDuelVote, type DuelPraiseId, type DuelSide, type DuelVoteResult } from "@/lib/backend/votes";
import { feedbackApiConfigured } from "@/lib/backend/feedback-api";
import { loadDuelDraft, saveDuelDraft } from "@/lib/duel-draft";
import { legacyRoundId, openerKey, trackGrowth, trackUniqueRoundOpened } from "@/lib/growth";
import { decodeDuelSlug, prefillSpinUrl, type DuelPayload } from "@/lib/share";

type ViewState = "loading" | "gone" | "ready";
type AuthState = "checking" | "anonymous" | "authenticated";
export type DuelSubmitState = "idle" | "submitting" | DuelVoteResult;

const HANDOFF_DELAY_MS = 560;

const trackAuthCompleted = (session: AuthSession, roundId: string, rootRoundId: string) => {
  trackGrowth("auth_completed", {
    context: "receiver",
    round_id: roundId,
    origin_round_id: roundId,
    root_round_id: rootRoundId,
    opener_key: openerKey(),
    user_id: session.actorId,
    is_logged_in: true,
  });
};

export function useDuelController(slug: string) {
  const router = useRouter();
  const [state, setState] = useState<ViewState>("loading");
  const [duel, setDuel] = useState<DuelPayload | null>(null);
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [chosen, setChosen] = useState<DuelSide | null>(null);
  const [rovingSide, setRovingSide] = useState<DuelSide>("a");
  const [praise, setPraise] = useState<DuelPraiseId | null>(null);
  const [submitState, setSubmitState] = useState<DuelSubmitState>("idle");
  const radioRefs = useRef<Record<DuelSide, HTMLButtonElement | null>>({ a: null, b: null });
  const submitLockRef = useRef(false);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const authEventRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    clearTimeout(handoffTimerRef.current);
    setState("loading");
    setDuel(null);
    setAuthState("checking");
    setSession(null);
    setChosen(null);
    setRovingSide("a");
    setPraise(null);
    setSubmitState("idle");
    submitLockRef.current = false;
    authEventRef.current = null;

    const decoded = decodeDuelSlug(slug);
    if (!decoded) {
      setState("gone");
      return () => {
        cancelled = true;
      };
    }

    const roundId = decoded.roundId ?? legacyRoundId(slug);
    const rootRoundId = decoded.rootRoundId ?? roundId;
    const draft = loadDuelDraft(slug);
    setDuel(decoded);
    setChosen(draft?.side ?? null);
    setRovingSide(draft?.side ?? "a");
    setPraise(draft?.praise ?? null);
    setState("ready");
    trackUniqueRoundOpened({
      roundId,
      rootRoundId,
      parentRoundId: decoded.parentRoundId ?? null,
    });

    void checkAuthSession()
      .then((currentSession) => {
        if (cancelled) return;
        if (!currentSession) {
          setAuthState("anonymous");
          return;
        }
        const eventKey = `${roundId}:${currentSession.actorId}`;
        if (consumeAuthPending("receiver") && authEventRef.current !== eventKey) {
          authEventRef.current = eventKey;
          trackAuthCompleted(currentSession, roundId, rootRoundId);
        }
        setSession(currentSession);
        setAuthState("authenticated");
      })
      .catch(() => {
        if (!cancelled) setAuthState("anonymous");
      });

    return () => {
      cancelled = true;
      clearTimeout(handoffTimerRef.current);
    };
  }, [slug]);

  const roundId = duel?.roundId ?? legacyRoundId(slug);
  const rootRoundId = duel?.rootRoundId ?? roundId;
  const legacyExpired = Boolean(duel && feedbackApiConfigured() && !duel.feedback);
  const canSelect = !legacyExpired && authState === "authenticated" && submitState === "idle";
  const activeRadio = chosen ?? rovingSide;

  const receiveAuthenticated = (nextSession: AuthSession) => {
    consumeAuthPending("receiver");
    const eventKey = `${roundId}:${nextSession.actorId}`;
    if (authEventRef.current !== eventKey) {
      authEventRef.current = eventKey;
      trackAuthCompleted(nextSession, roundId, rootRoundId);
    }
    setSession(nextSession);
    setAuthState("authenticated");
  };

  const choose = (side: DuelSide) => {
    if (!canSelect) return;
    setChosen(side);
    setRovingSide(side);
    saveDuelDraft(slug, side, praise);
  };

  const selectPraise = (nextPraise: DuelPraiseId) => {
    if (!canSelect || !chosen) return;
    setPraise(nextPraise);
    saveDuelDraft(slug, chosen, nextPraise);
  };

  const moveRadio = (event: KeyboardEvent<HTMLButtonElement>, side: DuelSide) => {
    if (!canSelect) return;
    let next: DuelSide | null = null;
    if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
      next = side === "a" ? "b" : "a";
    }
    if (event.key === "Home") next = "a";
    if (event.key === "End") next = "b";
    if (!next) return;
    event.preventDefault();
    choose(next);
    requestAnimationFrame(() => radioRefs.current[next]?.focus());
  };

  const submitPraise = async () => {
    if (!duel || !session || !chosen || !praise || submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitState("submitting");
    saveDuelDraft(slug, chosen, praise);

    const card = duel[chosen];
    const candidateId = `${roundId}:${chosen}`;
    const result = await castDuelVote({
      slug,
      side: chosen,
      roundId,
      userId: session.actorId,
      candidateId,
      praiseId: praise,
      idempotencyKey: `duel-v1:${roundId}:${session.actorId}`,
      access: duel.feedback,
    });

    setSubmitState(result);
    trackGrowth("praise_sent", {
      round_id: roundId,
      origin_round_id: roundId,
      root_round_id: rootRoundId,
      user_id: session.actorId,
      candidate_id: candidateId,
      praise_id: praise,
      sync_status: result,
    });

    handoffTimerRef.current = setTimeout(() => {
      trackGrowth("own_flow_started", {
        round_id: roundId,
        origin_round_id: roundId,
        root_round_id: rootRoundId,
        user_id: session.actorId,
        candidate_id: candidateId,
        seed_id: card.seedId,
      });
      router.push(
        prefillSpinUrl(card, {
          originRoundId: roundId,
          rootRoundId,
        }),
      );
    }, HANDOFF_DELAY_MS);
  };

  return {
    state,
    duel,
    authState,
    chosen,
    praise,
    submitState,
    canSelect,
    legacyExpired,
    activeRadio,
    radioRefs,
    receiveAuthenticated,
    choose,
    moveRadio,
    selectPraise,
    submitPraise,
  };
}
