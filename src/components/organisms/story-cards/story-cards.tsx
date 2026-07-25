"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { trackStoryCardEvent } from "@/lib/story-card-analytics";
import { trackMvpDeepAction, trackMvpResultViewed } from "@/lib/mvp-experiment-analytics";
import { PostResultSignup } from "@/components/organisms/journey/post-result-signup";
import {
  isStoryEnding,
  type StoryCardId,
  type StoryCardRequest,
  type StoryCardResponse,
  type StoryChoice,
  type StoryChoiceId,
} from "@/lib/story-card-contract";
import styles from "./story-cards.module.css";

type View = "deck" | "story" | "ending";

const DAILY_DRAWS_KEY = "random-ending:daily-draws:v1";

async function requestStory(body: StoryCardRequest): Promise<StoryCardResponse> {
  const response = await fetch("/api/story-cards", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("story_request_failed");
  return response.json() as Promise<StoryCardResponse>;
}

function localDayKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function readTodayDraws(): number {
  try {
    const parsed = JSON.parse(localStorage.getItem(DAILY_DRAWS_KEY) ?? "{}") as {
      count?: unknown;
      day?: unknown;
    };
    return parsed.day === localDayKey() && Number.isInteger(parsed.count) && Number(parsed.count) >= 0
      ? Number(parsed.count)
      : 0;
  } catch {
    return 0;
  }
}

function writeTodayDraws(count: number): void {
  try {
    localStorage.setItem(DAILY_DRAWS_KEY, JSON.stringify({ day: localDayKey(), count }));
  } catch {
    // 저장소가 막혀도 현재 탭의 무료 뽑기와 완주 흐름은 계속 동작한다.
  }
}

const choiceName: Record<StoryChoiceId, string> = {
  observe: "단서를 살핀 선택",
  answer: "먼저 답한 선택",
  leave: "다른 길을 찾은 선택",
};

function choiceCounts(history: StoryChoiceId[]): Record<StoryChoiceId, number> {
  return history.reduce<Record<StoryChoiceId, number>>(
    (counts, choiceId) => ({ ...counts, [choiceId]: counts[choiceId] + 1 }),
    { observe: 0, answer: 0, leave: 0 },
  );
}

export function StoryCards() {
  const [view, setView] = useState<View>("deck");
  const [story, setStory] = useState<StoryCardResponse | null>(null);
  const [todayDraws, setTodayDraws] = useState(0);
  const [lastCardId, setLastCardId] = useState<StoryCardId | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const endingViewedRef = useRef(false);

  useEffect(() => {
    setTodayDraws(readTodayDraws());
    trackStoryCardEvent("viewed");
  }, []);

  useEffect(() => {
    if (view !== "deck") headingRef.current?.focus();
  }, [story, view]);

  useEffect(() => {
    if (view !== "ending") return;
    trackMvpResultViewed("random_ending");
    endingViewedRef.current = true;
  }, [view]);

  const draw = async () => {
    if (loading) return;
    if (endingViewedRef.current) {
      trackMvpDeepAction("random_ending");
      endingViewedRef.current = false;
    }
    const drawNumber = todayDraws + 1;
    setLoading(true);
    setError("");
    trackStoryCardEvent("draw_requested", { drawNumber });
    try {
      const next = await requestStory({ action: "draw", excludeCardId: lastCardId });
      const nextDraws = todayDraws + 1;
      setStory(next);
      setLastCardId(next.cardId);
      setTodayDraws(nextDraws);
      writeTodayDraws(nextDraws);
      setView("story");
      trackStoryCardEvent("draw_completed", {
        cardId: next.cardId,
        drawNumber: nextDraws,
        turn: 1,
      });
    } catch {
      setError("카드를 열지 못했어요. 잠시 후 다시 열어 주세요.");
      trackStoryCardEvent("request_failed", { drawNumber, stage: "draw" });
    } finally {
      setLoading(false);
    }
  };

  const choose = async (choiceId: StoryChoice["id"]) => {
    if (!story || isStoryEnding(story) || loading) return;
    setLoading(true);
    setError("");
    trackStoryCardEvent("choice_made", {
      cardId: story.cardId,
      choiceId,
      drawNumber: todayDraws,
      turn: story.turn,
    });
    try {
      const next = await requestStory({ action: "choose", session: story, choiceId });
      setStory(next);
      setView(isStoryEnding(next) ? "ending" : "story");
      if (isStoryEnding(next)) {
        trackStoryCardEvent("story_completed", {
          cardId: next.cardId,
          drawNumber: todayDraws,
          turn: 8,
        });
      }
    } catch {
      setError("다음 장면을 열지 못했어요. 같은 선택을 다시 눌러 주세요.");
      trackStoryCardEvent("request_failed", {
        cardId: story.cardId,
        drawNumber: todayDraws,
        stage: "choose",
        turn: story.turn,
      });
    } finally {
      setLoading(false);
    }
  };

  const returnToDeck = () => {
    if (story && !isStoryEnding(story)) {
      trackStoryCardEvent("story_abandoned", {
        cardId: story.cardId,
        drawNumber: todayDraws,
        turn: story.turn,
      });
    }
    setView("deck");
    setStory(null);
    setError("");
  };

  const endingCounts = story && isStoryEnding(story)
    ? choiceCounts(story.choiceHistory)
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={18} aria-hidden />
          실험 허브
        </Link>
        <span>랜덤 엔딩</span>
      </header>

      {view === "deck" ? (
        <section className={styles.deck} aria-labelledby="random-ending-title" aria-busy={loading}>
          <div className={styles.deckCopy}>
            <p className={styles.eyebrow}>독립 엔터테인먼트 실험 · 현재 미리보기</p>
            <h1 id="random-ending-title">
              랜덤 카드 한 장,
              <br />
              8번 고르면 끝.
            </h1>
            <p className={styles.lede}>
              네 개의 단편 카드 중 하나가 랜덤으로 열려요. 로그인이나 결제 없이 결말까지 볼 수 있어요.
            </p>
            <ul className={styles.facts} aria-label="랜덤 엔딩 이용 조건">
              <li>오늘 여러 장 무료</li>
              <li>선택 8번 뒤 바로 결말</li>
              <li>회원가입 없음</li>
            </ul>
          </div>

          <div className={styles.stack} aria-hidden>
            <span />
            <span />
            <span className={styles.front}>
              <Sparkles size={28} />
            </span>
          </div>

          <div className={styles.deckAction}>
            <button
              type="button"
              className={styles.primary}
              onClick={draw}
              disabled={loading}
            >
              {loading ? <LoaderCircle className={styles.spin} aria-hidden /> : <BookOpen aria-hidden />}
              {loading ? "랜덤 카드를 여는 중" : "랜덤 카드 무료로 열기"}
            </button>
            <p className={styles.note}>
              현재는 AI가 즉석 생성하지 않아요. 준비된 카드 4개와 분기 문장으로 작동하는 MVP예요.
            </p>
            {todayDraws > 0 ? (
              <p className={styles.opened} role="status">
                오늘 이 기기에서 {todayDraws}장 열었어요. 바로 또 열 수 있어요.
              </p>
            ) : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </div>
        </section>
      ) : null}

      {view === "story" && story && !isStoryEnding(story) ? (
        <section className={styles.story} aria-live="polite" aria-busy={loading}>
          <div className={styles.progress}>
            <span>{story.turn} / {story.totalTurns}번째 선택</span>
            <progress
              aria-label={`8번 중 ${story.turn}번째 선택`}
              value={story.turn}
              max={story.totalTurns}
            />
          </div>
          <p className={styles.eyebrow}>{story.cardTitle}</p>
          <h1 ref={headingRef} tabIndex={-1}>{story.character}</h1>
          <p className={styles.scene}>{story.scene}</p>
          <article className={styles.passage}>{story.passage}</article>
          <div className={styles.choices} aria-label={`${story.turn}번째 선택지`}>
            {story.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice.id)}
                disabled={loading}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {loading ? (
            <p className={styles.loading} role="status">
              <LoaderCircle className={styles.spin} aria-hidden />
              다음 장면을 여는 중
            </p>
          ) : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <p className={styles.unsaved}>진행 중인 이야기는 이 화면을 나가면 저장되지 않아요.</p>
          <button type="button" className={styles.textButton} onClick={returnToDeck}>
            이 이야기를 멈추고 덱으로
          </button>
        </section>
      ) : null}

      {view === "ending" && story && isStoryEnding(story) && endingCounts ? (
        <section className={styles.ending} aria-live="polite" aria-busy={loading}>
          <p className={styles.eyebrow}>8번의 선택으로 완성한 결말</p>
          <h1 ref={headingRef} tabIndex={-1}>{story.endingTitle}</h1>
          <p className={styles.scene}>{story.cardTitle} · {story.character}</p>
          <article className={styles.passage}>{story.ending}</article>
          <dl className={styles.choiceReceipt} aria-label="내 선택 기록">
            {(Object.entries(endingCounts) as Array<[StoryChoiceId, number]>).map(([choiceId, count]) => (
              <div key={choiceId}>
                <dt>{choiceName[choiceId]}</dt>
                <dd>{count}번</dd>
              </div>
            ))}
          </dl>
          <p className={styles.completeNote}>
            결말을 먼저 보여드렸어요. 로그인·결제·공유 조건은 없습니다.
          </p>
          <button
            type="button"
            className={styles.primary}
            onClick={draw}
            disabled={loading}
          >
            {loading ? <LoaderCircle className={styles.spin} aria-hidden /> : <RotateCcw aria-hidden />}
            {loading ? "다른 카드를 여는 중" : "다른 카드도 무료로 열기"}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <PostResultSignup experimentId="random_ending" label="다른 결말도 이어서 보려면 Google로 연결하기" />
          <button type="button" className={styles.textButton} onClick={returnToDeck}>
            카드 덱으로 돌아가기
          </button>
        </section>
      ) : null}
    </main>
  );
}
