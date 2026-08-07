"use client";

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  FanDeck,
  type DeckCard,
  type FanDeckHandle,
} from "@/components/organisms/four-card";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import { MvpAppHeader } from "@/components/organisms/mvp-shared/mvp-app-header";
import { backSvg } from "@/components/organisms/slot/card-back";
import { trackStoryCardEvent } from "@/lib/story-card-analytics";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import {
  clearStoryConversation,
  loadStoryConversation,
  saveStoryConversation,
  type SavedStoryConversation,
} from "@/lib/mvp-resume-state";
import {
  type StoryCardRequest,
  type StoryChatMessage,
  type StoryChatSession,
  type StorySituation,
  type StorySituationListResponse,
} from "@/lib/story-card-contract";
import styles from "./story-cards.module.css";

type View = "deck" | "restore" | "chat";

const STORY_DECK_AXIS = "story";
const STORY_DECK_CARDS: DeckCard[] = Array.from({ length: 24 }, (_, index) => ({
  axis: STORY_DECK_AXIS,
  key: `story-card-${index}`,
  label: "랜덤 타로",
}));
const STORY_DECK_AXIS_LABELS = { [STORY_DECK_AXIS]: "랜덤 타로" };

const characterProfileByCard = {
  "rain-station": {
    label: "냉정한 제복 연상",
    tags: "30대 · 직업남 · 보호자",
    hook: "마지막 열차입니다. 타실 거면, 이번엔 내가 같이 갑니다.",
  },
  "glass-greenhouse": {
    label: "햇살 같은 다정남",
    tags: "순애 · 편지 · 직진",
    hook: "보내지 못한 편지, 내가 받아도 될까요?",
  },
  "moon-shop": {
    label: "위험한 은발 연하",
    tags: "연하 · 계약 · 집착",
    hook: "미련의 값은 받았어요. 이제 당신만 남았네요.",
  },
  "wave-archive": {
    label: "동양풍 장발 무사",
    tags: "무림 · 보호자 · 쌍방구원",
    hook: "당신의 목소리는 내가 먼저 찾았습니다.",
  },
} as const satisfies Record<StorySituation["id"], {
  label: string;
  tags: string;
  hook: string;
}>;

async function loadSituations(): Promise<StorySituation[]> {
  const response = await fetch("/api/story-cards", { cache: "no-store" });
  if (!response.ok) throw new Error("situation_load_failed");
  const body = await response.json() as StorySituationListResponse;
  return body.situations;
}

async function requestChat(body: StoryCardRequest): Promise<StoryChatSession> {
  const response = await fetch("/api/story-cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("chat_request_failed");
  return response.json() as Promise<StoryChatSession>;
}

function pickRandomSituation(
  situations: StorySituation[],
  previousId?: StorySituation["id"],
): StorySituation | null {
  const candidates = situations.length > 1 && previousId
    ? situations.filter((situation) => situation.id !== previousId)
    : situations;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? candidates[0];
}

function CharacterPortrait({
  cardId,
  className,
  label,
}: {
  cardId: StorySituation["id"];
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={[styles.characterPortrait, className].filter(Boolean).join(" ")}
      data-card={cardId}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

export function StoryCards() {
  const [view, setView] = useState<View>("deck");
  const [situations, setSituations] = useState<StorySituation[]>([]);
  const [session, setSession] = useState<StoryChatSession | null>(null);
  const [messages, setMessages] = useState<StoryChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawnSituation, setDrawnSituation] = useState<StorySituation | null>(null);
  const [drawBusy, setDrawBusy] = useState(false);
  const [drawHot, setDrawHot] = useState(false);
  const [savedConversation, setSavedConversation] = useState<SavedStoryConversation | null>(null);
  const [error, setError] = useState("");
  const chatHeadingRef = useRef<HTMLHeadingElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const deckRef = useRef<FanDeckHandle>(null);
  const drawTargetRef = useRef<HTMLButtonElement>(null);
  const resultTrackedRef = useRef(false);
  const deepActionTrackedRef = useRef(false);

  const reloadSituations = useCallback(() => {
    setLoading(true);
    setError("");
    void loadSituations()
      .then(setSituations)
      .catch(() => {
        setError("타로 카드를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        trackStoryCardEvent("story_card_request_failed", { stage: "load" });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    trackStoryCardEvent("story_cards_landing_viewed");
    trackMvpLandingViewed("story-cards");
    const params = new URLSearchParams(window.location.search);
    const saved = loadStoryConversation();
    if (params.get("new") === "1") {
      clearStoryConversation();
      window.history.replaceState(null, "", "/story-cards");
    } else if (saved && params.get("resume") === "1") {
      setSavedConversation(saved);
      setSession(saved.session);
      setMessages(saved.messages);
      setView("chat");
      trackStoryCardEvent("story_card_chat_resumed", { cardId: saved.session.situation.id });
      window.history.replaceState(null, "", "/story-cards");
    } else if (saved) {
      setSavedConversation(saved);
      setView("restore");
    }
    reloadSituations();
  }, [reloadSituations]);

  useEffect(() => {
    if (view !== "chat") return;
    chatHeadingRef.current?.focus();
  }, [view]);

  const startChat = useCallback(async (situation: StorySituation) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const next = await requestChat({ action: "start", situationId: situation.id });
      setSession(next);
      setMessages(next.messages);
      saveStoryConversation(next, next.messages);
      setView("chat");
      trackStoryCardEvent("story_chat_started", { cardId: situation.id });
      if (!resultTrackedRef.current) {
        resultTrackedRef.current = true;
        trackMvpResultViewed("story_cards");
      }
    } catch {
      setError("대화를 시작하지 못했어요. 잠시 후 다시 시작해주세요.");
      trackStoryCardEvent("story_card_request_failed", {
        cardId: situation.id,
        stage: "start",
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const revealRandomSituation = useCallback(() => {
    const next = pickRandomSituation(situations, drawnSituation?.id);
    setDrawBusy(false);
    setDrawHot(false);
    if (!next) {
      setError("랜덤 장면을 열지 못했어요. 카드를 다시 불러와주세요.");
      return;
    }
    setDrawnSituation(next);
    trackMvpInputStarted("story_cards");
    trackStoryCardEvent("story_card_selected", { cardId: next.id });
  }, [drawnSituation?.id, situations]);

  const drawRandomCard = useCallback((skipMotion = false) => {
    if (loading || drawBusy || drawnSituation || situations.length === 0) return;
    setDrawBusy(true);
    setDrawHot(false);
    setError("");
    const started = deckRef.current?.drawTo(
      STORY_DECK_AXIS,
      () => undefined,
      skipMotion,
    );
    if (!started) revealRandomSituation();
  }, [drawBusy, drawnSituation, loading, revealRandomSituation, situations.length]);

  const handleDeckPick = useCallback((_card: DeckCard, targetAxis: string) => {
    if (targetAxis !== STORY_DECK_AXIS || drawnSituation) return;
    revealRandomSituation();
  }, [drawnSituation, revealRandomSituation]);

  const resetDraw = () => {
    setDrawnSituation(null);
    setDrawBusy(false);
    setDrawHot(false);
    setError("");
  };

  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!session || !message || loading || message.length > 500) return;

    const messageCount = messages.filter((entry) => entry.role === "user").length + 1;
    const userMessage: StoryChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: message,
    };
    const optimisticMessages = [...messages, userMessage];
    setMessages(optimisticMessages);
    setDraft("");
    setLoading(true);
    setError("");
    trackStoryCardEvent("story_card_message_sent", {
      cardId: session.situation.id,
      messageCount,
    });

    try {
      const next = await requestChat({
        action: "reply",
        sessionId: session.sessionId,
        situationId: session.situation.id,
        message,
        messageCount,
      });
      setSession(next);
      const finalMessages = [...optimisticMessages, ...next.messages];
      setMessages(finalMessages);
      saveStoryConversation(next, finalMessages);
      if (!deepActionTrackedRef.current) {
        deepActionTrackedRef.current = true;
        trackMvpDeepAction("story_cards");
      }
    } catch {
      setMessages(messages);
      setDraft(message);
      setError("답장을 받지 못했어요. 문장은 그대로 두었으니 다시 보내주세요.");
      trackStoryCardEvent("story_card_request_failed", {
        cardId: session.situation.id,
        stage: "reply",
      });
    } finally {
      setLoading(false);
      window.setTimeout(() => composerRef.current?.focus(), 0);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  const returnToDeck = () => {
    if (session) {
      trackStoryCardEvent("story_card_chat_abandoned", {
        cardId: session.situation.id,
        messageCount: messages.filter((message) => message.role === "user").length,
      });
    }
    setView("deck");
    clearStoryConversation();
    setSavedConversation(null);
    setSession(null);
    setMessages([]);
    setDraft("");
    setError("");
    setDrawnSituation(null);
    setDrawBusy(false);
    setDrawHot(false);
    deepActionTrackedRef.current = false;
  };

  const resumeConversation = () => {
    if (!savedConversation) return;
    setSession(savedConversation.session);
    setMessages(savedConversation.messages);
    setView("chat");
    trackStoryCardEvent("story_card_chat_resumed", {
      cardId: savedConversation.session.situation.id,
    });
  };

  const startNewConversation = () => {
    clearStoryConversation();
    setSavedConversation(null);
    setSession(null);
    setMessages([]);
    setDrawnSituation(null);
    setDrawBusy(false);
    setDrawHot(false);
    setView("deck");
  };

  const trackReservation = () => {
    trackStoryCardEvent("story_cards_reservation_clicked", {
      cardId: session?.situation.id,
      messageCount: messages.filter((message) => message.role === "user").length || undefined,
    });
  };

  const userMessageCount = messages.filter((message) => message.role === "user").length;

  return (
    <main className={styles.page} data-view={view}>
      <MvpAppHeader
        backClassName={styles.back}
        backLabel="오늘 해볼까"
        className={styles.header}
        meta="카드너머"
      />

      {view === "restore" && savedConversation ? (
        <section className={styles.restore} aria-labelledby="story-restore-title">
          <div
            className={styles.restoreCard}
            style={{ "--card-accent": savedConversation.session.situation.accent } as CSSProperties}
          >
            <CharacterPortrait
              cardId={savedConversation.session.situation.id}
              className={styles.restoreArt}
              label={`${savedConversation.session.situation.guideName}의 타로 카드`}
            />
            <div className={styles.restoreCopy}>
              <p>카드너머에 남은 장면</p>
              <h1 id="story-restore-title">{savedConversation.session.situation.title}</h1>
              <strong>
                {characterProfileByCard[savedConversation.session.situation.id].label}
                {" · "}
                {savedConversation.session.situation.guideName}
              </strong>
              <span>
                {savedConversation.messages.some((message) => message.role === "user")
                  ? "이 브라우저에 남은 대화를 이어갈 수 있어요."
                  : "그가 먼저 건넨 말에서 다시 시작해요."}
              </span>
            </div>
          </div>
          <div className={styles.restoreActions}>
            <button type="button" className={styles.restorePrimary} onClick={resumeConversation}>
              이어서 대화하기
              <ArrowUp aria-hidden />
            </button>
            <button type="button" className={styles.restoreSecondary} onClick={startNewConversation}>
              <RotateCcw aria-hidden />
              새 카드 고르기
            </button>
          </div>
          <p className={styles.restoreNotice}>대화는 이 브라우저에만 저장돼요.</p>
        </section>
      ) : null}

      {view === "deck" ? (
        <section
          className={styles.deck}
          aria-labelledby="card-beyond-title"
          aria-busy={loading || drawBusy}
        >
          <header className={styles.intro}>
            <p className={styles.eyebrow}>여성향 판타지 대화 · 카드너머</p>
            <h1 id="card-beyond-title">
              한 장을 뽑아,
              <br />
              <em>그의 장면을 열어보세요.</em>
            </h1>
            <p className={styles.lede}>어떤 장면이 나올지는 카드를 뒤집기 전까지 몰라요.</p>
          </header>

          <ol className={styles.uspList} aria-label="카드너머 특징">
            <li><span>01</span>익명의 카드 한 장</li>
            <li><span>02</span>랜덤으로 열리는 장면</li>
            <li><span>03</span>그가 먼저 건네는 말</li>
          </ol>

          <div className={styles.cardSelection}>
            <div className={styles.selectionHeading}>
              <p>{drawnSituation ? "오늘 열린 장면" : "오늘의 카드 한 장"}</p>
              <span>
                {drawnSituation
                  ? "카드를 열기 전에는 알 수 없던 장면이에요."
                  : "카드를 누르거나 빈칸에 끌어 놓으세요."}
              </span>
            </div>

            {loading && situations.length === 0 ? (
              <p className={styles.loading} role="status">
                <LoaderCircle className={styles.spin} aria-hidden />
                타로 카드를 펼치는 중
              </p>
            ) : null}

            {situations.length > 0 ? (
              <div
                className={styles.drawStage}
                data-revealed={drawnSituation ? "true" : undefined}
                role="group"
                aria-label="카드너머 랜덤 타로 카드 뽑기"
              >
                <div className={styles.drawTargetWrap}>
                  {drawnSituation ? (
                    <div
                      className={styles.revealedCard}
                      data-testid="story-revealed-card"
                      style={{ "--card-accent": drawnSituation.accent } as CSSProperties}
                      role="img"
                      aria-label={`${drawnSituation.title}, ${drawnSituation.guideName}`}
                    >
                      <div className={styles.revealedCardInner}>
                        <div
                          className={styles.revealedCardBack}
                          aria-hidden
                          dangerouslySetInnerHTML={{ __html: backSvg(18) }}
                        />
                        <div className={styles.revealedCardFront}>
                          <CharacterPortrait cardId={drawnSituation.id} />
                          <span className={styles.revealedVeil} aria-hidden />
                          <div className={styles.revealedCopy}>
                            <span>랜덤으로 열린 장면</span>
                            <h2>{drawnSituation.title}</h2>
                            <strong>{drawnSituation.guideName}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      ref={drawTargetRef}
                      type="button"
                      className={styles.drawTarget}
                      data-hot={drawHot ? "true" : undefined}
                      onClick={() => drawRandomCard()}
                      disabled={loading || drawBusy}
                      aria-label="랜덤 카드 뽑기"
                    >
                      <span className={styles.drawTargetMark} aria-hidden>✦</span>
                      <strong>{drawBusy ? "카드가 이동 중" : "뽑은 카드"}</strong>
                      <small>누르거나 아래 덱에서 끌어 놓으세요</small>
                    </button>
                  )}
                </div>

                {!drawnSituation ? (
                  <div className={styles.fanDeckStage} data-testid="story-fan-deck">
                    <FanDeck
                      ref={deckRef}
                      cards={STORY_DECK_CARDS}
                      axisLabels={STORY_DECK_AXIS_LABELS}
                      aimAxis={STORY_DECK_AXIS}
                      inactiveAxes={[]}
                      interactive={!loading}
                      disabled={loading}
                      flightDurationMs={260}
                      getTargetRect={() => drawTargetRef.current?.getBoundingClientRect() ?? null}
                      onDragOver={(axis) => setDrawHot(axis === STORY_DECK_AXIS)}
                      onPick={handleDeckPick}
                    />
                  </div>
                ) : null}

                <p className={styles.drawStatus} aria-live="polite">
                  {drawnSituation
                    ? `${characterProfileByCard[drawnSituation.id].label} · ${characterProfileByCard[drawnSituation.id].tags}`
                    : drawBusy
                      ? "선택한 카드가 슬롯으로 이동하고 있어요."
                      : "모든 카드는 같은 뒷면이에요. 결과는 도착한 뒤 공개돼요."}
                </p>

                <div className={styles.drawActions}>
                  {drawnSituation ? (
                    <>
                      <button
                        type="button"
                        className={styles.drawPrimary}
                        onClick={() => void startChat(drawnSituation)}
                        disabled={loading}
                      >
                        {loading ? (
                          <LoaderCircle className={styles.spin} aria-hidden />
                        ) : (
                          <ArrowUp aria-hidden />
                        )}
                        이 장면에서 대화 시작
                      </button>
                      <button
                        type="button"
                        className={styles.drawSecondary}
                        onClick={resetDraw}
                        disabled={loading}
                      >
                        <RotateCcw aria-hidden />
                        다른 카드 뽑기
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={styles.drawPrimary}
                      onClick={() => drawRandomCard()}
                      disabled={loading || drawBusy}
                    >
                      {drawBusy ? (
                        <LoaderCircle className={styles.spin} aria-hidden />
                      ) : (
                        <span aria-hidden>✦</span>
                      )}
                      {drawBusy ? "카드가 이동 중" : "랜덤 카드 한 장 뽑기"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <p className={styles.note}>대화는 이 브라우저에만 저장돼요.</p>
          {error ? (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              {situations.length === 0 ? (
                <button type="button" onClick={reloadSituations} disabled={loading}>
                  다시 불러오기
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {view === "chat" && session ? (
        <section className={styles.chat} aria-busy={loading}>
          <aside
            className={styles.contextCard}
            style={{ "--card-accent": session.situation.accent } as CSSProperties}
          >
            <CharacterPortrait
              cardId={session.situation.id}
              className={styles.contextArt}
              label={`${session.situation.guideName}, ${session.situation.title}`}
            />
            <div className={styles.contextCopy}>
              <p>{characterProfileByCard[session.situation.id].label}</p>
              <h1 ref={chatHeadingRef} tabIndex={-1}>{session.situation.title}</h1>
              <strong>{session.situation.guideName}</strong>
              <span>“{characterProfileByCard[session.situation.id].hook}”</span>
            </div>
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.chatTopline}>
              <div>
                <p>그가 먼저 말을 걸었어요</p>
                <strong>{session.situation.guideName}</strong>
              </div>
              <button type="button" onClick={returnToDeck}>
                <RotateCcw size={16} aria-hidden />
                다른 카드
              </button>
            </div>

            <div className={styles.messages} aria-live="polite" aria-label="카드너머 대화">
              {messages.map((message) => (
                <article className={styles.message} data-role={message.role} key={message.id}>
                  <span>{message.role === "guide" ? session.situation.guideName : "나"}</span>
                  <p>{message.text}</p>
                </article>
              ))}
              {loading ? (
                <p className={styles.typing} role="status">
                  <span aria-hidden />
                  <span aria-hidden />
                  <span aria-hidden />
                  답장을 생각하는 중
                </p>
              ) : null}
            </div>

            {session.suggestedReplies.length > 0 && !loading ? (
              <div className={styles.suggestions} aria-label="빠른 답장">
                {session.suggestedReplies.map((suggestion) => (
                  <button type="button" onClick={() => void sendMessage(suggestion)} key={suggestion}>
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            <form className={styles.composer} onSubmit={submit}>
              <label htmlFor="story-chat-message">내 이야기</label>
              <div>
                <input
                  ref={composerRef}
                  id="story-chat-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                  placeholder="지금 떠오르는 말을 적어보세요"
                  autoComplete="off"
                  disabled={loading}
                />
                <button type="submit" disabled={!draft.trim() || loading} aria-label="메시지 보내기">
                  {loading ? <LoaderCircle className={styles.spin} aria-hidden /> : <ArrowUp aria-hidden />}
                </button>
              </div>
              <p>새 카드를 고르면 이 대화는 지워져요.</p>
            </form>

            {error ? <p className={styles.error} role="alert">{error}</p> : null}

            <div className={styles.reservationInvite}>
              <div>
                <strong>그와 다음 장면도 이어가고 싶나요?</strong>
                <span>정식판에서는 관계와 기억이 장면마다 이어져요.</span>
              </div>
              <Link
                className={styles.reserveButton}
                href="/reserve/story-cards"
                onClick={trackReservation}
              >
                카드너머 출시 알림 예약하기
              </Link>
            </div>

            {userMessageCount >= 3 ? (
              <div className={styles.optionalSignup}>
                <MessageCircle size={18} aria-hidden />
                <p>계정 연결은 선택이에요. 대화 동기화는 아직 제공하지 않아요.</p>
                <PostResultSignup experimentId="story_cards" label="Google 계정만 연결하기" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
