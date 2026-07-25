"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowUp,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  FanDeck,
  type DeckCard,
  type FanDeckHandle,
} from "@/components/organisms/four-card/four-card-deck";
import { TarotArt } from "@/components/organisms/four-card/tarot-art";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import { trackStoryCardEvent } from "@/lib/story-card-analytics";
import {
  trackMvpDeepAction,
  trackMvpInputStarted,
  trackMvpLandingViewed,
  trackMvpResultViewed,
} from "@/lib/mvp-experiment-analytics";
import {
  type StoryCardRequest,
  type StoryChatMessage,
  type StoryChatSession,
  type StorySituation,
  type StorySituationListResponse,
} from "@/lib/story-card-contract";
import styles from "./story-cards.module.css";

type View = "deck" | "chat";

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

export function StoryCards() {
  const [view, setView] = useState<View>("deck");
  const [situations, setSituations] = useState<StorySituation[]>([]);
  const [session, setSession] = useState<StoryChatSession | null>(null);
  const [messages, setMessages] = useState<StoryChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [deckBusy, setDeckBusy] = useState(false);
  const [selectedSituationId, setSelectedSituationId] = useState<StorySituation["id"] | null>(null);
  const [error, setError] = useState("");
  const chatHeadingRef = useRef<HTMLHeadingElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const targetCardRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<FanDeckHandle>(null);
  const resultTrackedRef = useRef(false);
  const deepActionTrackedRef = useRef(false);

  const reloadSituations = useCallback(() => {
    setLoading(true);
    setError("");
    void loadSituations()
      .then(setSituations)
      .catch(() => {
        setError("상황 카드를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        trackStoryCardEvent("request_failed", { stage: "load" });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    trackMvpLandingViewed("story_cards");
    trackStoryCardEvent("viewed");
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
    trackMvpInputStarted("story_cards");
    trackStoryCardEvent("situation_selected", { cardId: situation.id });

    try {
      const next = await requestChat({ action: "start", situationId: situation.id });
      setSession(next);
      setMessages(next.messages);
      setView("chat");
      trackStoryCardEvent("chat_started", { cardId: situation.id });
      if (!resultTrackedRef.current) {
        resultTrackedRef.current = true;
        trackMvpResultViewed("story_cards");
      }
    } catch {
      setError("대화를 시작하지 못했어요. 같은 카드를 다시 눌러주세요.");
      trackStoryCardEvent("request_failed", { cardId: situation.id, stage: "start" });
    } finally {
      setLoading(false);
      setDeckBusy(false);
    }
  }, [loading]);

  const situationById = useMemo(
    () => new Map(situations.map((situation) => [situation.id, situation])),
    [situations],
  );
  const axisLabels = useMemo<Record<string, string>>(
    () => Object.fromEntries(situations.map((situation) => [situation.id, situation.title])),
    [situations],
  );
  const deckCards = useMemo<DeckCard[]>(
    () => situations.map((situation) => ({
      axis: situation.id,
      key: `story-situation:${situation.id}`,
      label: situation.title,
    })),
    [situations],
  );
  const getTargetRect = useCallback(
    () => targetCardRef.current?.getBoundingClientRect() ?? null,
    [],
  );
  const settleDeckPick = useCallback((_card: DeckCard, targetAxis: string) => {
    const situation = situationById.get(targetAxis as StorySituation["id"]);
    if (!situation) {
      setDeckBusy(false);
      setError("선택한 상황을 찾지 못했어요. 다른 상황을 골라주세요.");
      return;
    }
    setSelectedSituationId(situation.id);
    void startChat(situation);
  }, [situationById, startChat]);
  const chooseSituation = (situation: StorySituation) => {
    if (loading || deckBusy) return;
    setError("");
    setSelectedSituationId(situation.id);
    setDeckBusy(true);
    const started = deckRef.current?.drawTo(situation.id, () => undefined) ?? false;
    if (!started) void startChat(situation);
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
    trackStoryCardEvent("message_sent", {
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
      setMessages((current) => [...current, ...next.messages]);
      if (!deepActionTrackedRef.current) {
        deepActionTrackedRef.current = true;
        trackMvpDeepAction("story_cards");
      }
    } catch {
      setMessages(messages);
      setDraft(message);
      setError("답장을 받지 못했어요. 문장은 그대로 두었으니 다시 보내주세요.");
      trackStoryCardEvent("request_failed", {
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
      trackStoryCardEvent("chat_abandoned", {
        cardId: session.situation.id,
        messageCount: messages.filter((message) => message.role === "user").length,
      });
    }
    setView("deck");
    setSession(null);
    setMessages([]);
    setDraft("");
    setError("");
    setSelectedSituationId(null);
    setDeckBusy(false);
    deepActionTrackedRef.current = false;
  };

  const userMessageCount = messages.filter((message) => message.role === "user").length;
  const selectedSituation = selectedSituationId
    ? situationById.get(selectedSituationId) ?? null
    : null;

  return (
    <main className={styles.page} data-view={view}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={18} aria-hidden />
          오늘 해볼까
        </Link>
        <span>상황 카드</span>
      </header>

      {view === "deck" ? (
        <section className={styles.deck} aria-labelledby="situation-card-title" aria-busy={loading}>
          <div className={styles.deckCopy}>
            <p className={styles.eyebrow}>상황 카드 · 로그인 없이 바로 시작</p>
            <h1 id="situation-card-title">
              지금 마음에 가까운
              <br />
              상황을 골라보세요.
            </h1>
            <p className={styles.lede}>
              이름을 누르면 카드가 뽑히고, 장면 속 안내자와 바로 대화해요. 아무 카드나 직접 뽑아도 괜찮아요.
            </p>
          </div>

          {loading && situations.length === 0 ? (
            <p className={styles.loading} role="status">
              <LoaderCircle className={styles.spin} aria-hidden />
              상황 카드를 준비하는 중
            </p>
          ) : null}

          {situations.length > 0 ? (
            <div className={styles.deckJourney}>
              <div className={styles.situationList} role="group" aria-label="대화를 시작할 상황">
                {situations.map((situation, index) => (
                  <button
                    type="button"
                    className={styles.situationChoice}
                    data-selected={selectedSituationId === situation.id ? "true" : undefined}
                    key={situation.id}
                    onClick={() => chooseSituation(situation)}
                    disabled={loading || deckBusy}
                    aria-label={`${situation.title}: ${situation.kicker}. 선택하고 대화 시작`}
                    style={{ "--card-accent": situation.accent } as CSSProperties}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{situation.title}</strong>
                      <small>{situation.kicker}</small>
                    </span>
                    <span aria-hidden>→</span>
                  </button>
                ))}
              </div>

              <div className={styles.readingTable}>
                <div
                  ref={targetCardRef}
                  className={styles.targetCard}
                  data-armed={selectedSituation ? "true" : undefined}
                  style={selectedSituation
                    ? { "--card-accent": selectedSituation.accent } as CSSProperties
                    : undefined}
                  aria-hidden
                >
                  {selectedSituation ? (
                    <>
                      <TarotArt
                        axisIndex={selectedSituation.artIndex}
                        color={selectedSituation.accent}
                        className={styles.targetArt}
                      />
                      <span>{selectedSituation.title}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden />
                      <span>선택한 장면</span>
                    </>
                  )}
                </div>
                <div className={styles.deckStage}>
                  <FanDeck
                    ref={deckRef}
                    cards={deckCards}
                    variant="compact"
                    axisLabels={axisLabels}
                    disabled={loading}
                    entranceDurationMs={1_100}
                    entranceSweepDegrees={18}
                    aimAxis={null}
                    getTargetRect={getTargetRect}
                    onDragOver={() => undefined}
                    onPick={settleDeckPick}
                  />
                </div>
                <p className={styles.deckHint}>
                  {deckBusy && selectedSituation
                    ? `${selectedSituation.title} 카드를 여는 중`
                    : "상황 이름을 누르거나 덱에서 한 장을 뽑으세요"}
                </p>
              </div>
            </div>
          ) : null}

          <p className={styles.note}>
            지금은 미리 준비한 안전 문장으로 답해요. 입력한 이야기는 계정이나 DB에 저장하지 않아요.
          </p>
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
          <aside className={styles.contextCard} style={{ "--card-accent": session.situation.accent } as CSSProperties}>
            <TarotArt
              axisIndex={session.situation.artIndex}
              color={session.situation.accent}
              className={styles.contextArt}
            />
            <div>
              <p>{session.situation.kicker}</p>
              <h1 ref={chatHeadingRef} tabIndex={-1}>{session.situation.title}</h1>
              <span>{session.situation.guideName}과 대화 중</span>
            </div>
          </aside>

          <div className={styles.chatPanel}>
            <div className={styles.chatTopline}>
              <div>
                <p>지금 이 장면에서</p>
                <strong>{session.situation.guideName}</strong>
              </div>
              <button type="button" onClick={returnToDeck}>
                <RotateCcw size={16} aria-hidden />
                다른 상황
              </button>
            </div>

            <div className={styles.messages} aria-live="polite" aria-label="상황 카드 대화">
              {messages.map((message) => (
                <article
                  className={styles.message}
                  data-role={message.role}
                  key={message.id}
                >
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
              <p>이 대화는 현재 탭을 닫으면 사라져요.</p>
            </form>

            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {userMessageCount >= 3 ? (
              <div className={styles.optionalSignup}>
                <MessageCircle size={18} aria-hidden />
                <p>대화는 로그인 없이 계속할 수 있어요. 다른 기기에서도 이어보고 싶을 때만 연결하세요.</p>
                <PostResultSignup experimentId="story_cards" label="대화를 이어보도록 Google 연결하기" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
