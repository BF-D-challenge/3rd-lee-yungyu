"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IdeaLab, type IdeaLabSharePayload } from "@/components/organisms/idea-lab";
import { PraiseCardDeck, type PraiseCard } from "@/components/organisms/praise-cards";
import { fetchVotes, type Vote } from "@/lib/backend/votes";
import { getPraiseCardsState, praiseRecordFromVote } from "@/lib/praise-cards";
import {
  encodePraiseRequest,
  loadLatestPraiseRequest,
  praiseRequestFromIdea,
  praiseRequestPath,
  saveLatestPraiseRequest,
  type SavedPraiseRequest,
} from "@/lib/praise-share";
import { shareOrCopy } from "@/lib/share";
import { track, trackShare } from "@/lib/track";

type View = "idea" | "praise";

const requestUrl = (slug: string) => `${window.location.origin}${praiseRequestPath(slug)}`;
const formatDate = (timestamp: number) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(timestamp);
const readPraiseKey = (requestId: string) => `oneul:read-praise:${requestId}`;

const loadReadPraiseIds = (requestId: string): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(readPraiseKey(requestId)) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export function TodayApp() {
  const [view, setView] = useState<View>("idea");
  const [request, setRequest] = useState<SavedPraiseRequest | null>(null);
  const [ideaDraft, setIdeaDraft] = useState<IdeaLabSharePayload | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [readPraiseIds, setReadPraiseIds] = useState<string[]>([]);
  const [praiseShareNotice, setPraiseShareNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (slug: string) => {
    setVotes(await fetchVotes(slug));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const latest = loadLatestPraiseRequest();
    if (!latest) return;
    setRequest(latest);
  }, []);

  useEffect(() => {
    if (!request) return;
    setReadPraiseIds(loadReadPraiseIds(request.card.id));
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const update = () => { void refresh(request.slug); };
    update();
    window.addEventListener("focus", update);
    const timer = window.setInterval(update, 15000);
    return () => {
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
  }, [refresh, request]);

  const records = useMemo(
    () => votes
      .map((vote, index) => praiseRecordFromVote(vote, {
        id: vote.id ?? `${request?.card.id ?? "praise"}:${vote.at}:${index}`,
        ideaTitle: request?.card.title,
      }))
      .filter((record) => record !== null),
    [request?.card.id, request?.card.title, votes],
  );
  const praiseState = useMemo(() => getPraiseCardsState(records, now), [now, records]);
  const unreadPraiseCount = useMemo(() => {
    const read = new Set(readPraiseIds);
    return records.filter((record) => !read.has(record.id)).length;
  }, [readPraiseIds, records]);
  const todayCard: PraiseCard | null = praiseState.today
    ? {
        id: praiseState.today.id,
        message: praiseState.today.message,
        arrivedAt: formatDate(praiseState.today.receivedAt),
        ...(praiseState.today.ideaTitle ? { ideaTitle: praiseState.today.ideaTitle } : {}),
        ...(praiseState.today.sender.status === "revealed"
          ? { anonymousLabel: `보낸 사람 · ${praiseState.today.sender.displayName}` }
          : {}),
        emblem: "spark",
      }
    : null;

  const shareIdea = async (payload: IdeaLabSharePayload) => {
    const latestDraft = request?.prompt === payload.prompt ? request : loadLatestPraiseRequest();
    const storedDraft = latestDraft?.prompt === payload.prompt ? latestDraft : null;
    const saved = storedDraft ?? (() => {
      const card = praiseRequestFromIdea(payload);
      const slug = encodePraiseRequest(card);
      return { slug, card, prompt: payload.prompt } satisfies SavedPraiseRequest;
    })();
    // 공유가 취소돼도 같은 결과 링크로 다시 요청할 수 있게 초안은 먼저 보존한다.
    // 제작 문구 해제는 아래 shareOrCopy가 성공한 경우에만 IdeaLab이 처리한다.
    saveLatestPraiseRequest(saved);
    setRequest(saved);
    setVotes([]);
    if (!storedDraft) track("praise_request_created", { request_id: saved.card.id });
    const result = await shareOrCopy(requestUrl(saved.slug), {
      title: saved.card.title,
      text: `${saved.card.summary}\n짧은 응원이나 의견을 남겨주세요.`,
    });
    trackShare(result.ok ? "praise_request_share_completed" : "praise_request_share_cancelled", result.method, {
      request_id: saved.card.id,
    });
    return result;
  };

  const requestPraise = async () => {
    setPraiseShareNotice("");
    if (ideaDraft && ideaDraft.prompt !== request?.prompt) {
      const result = await shareIdea(ideaDraft);
      setPraiseShareNotice(result.ok
        ? result.method === "clipboard" ? "링크를 복사했어요." : "공유했어요."
        : "공유를 마치지 않았어요. 다시 시도해 주세요.");
      return;
    }
    if (!request) {
      setView("idea");
      return;
    }
    const result = await shareOrCopy(requestUrl(request.slug), {
      title: request.card.title,
      text: `${request.card.summary}\n짧은 응원이나 의견을 남겨주세요.`,
    });
    trackShare(result.ok ? "praise_request_reshare_completed" : "praise_request_reshare_cancelled", result.method, {
      request_id: request.card.id,
    });
    setPraiseShareNotice(result.ok
      ? result.method === "clipboard" ? "링크를 복사했어요." : "공유했어요."
      : "공유를 마치지 않았어요. 다시 시도해 주세요.");
  };

  const markPraiseRead = (card: PraiseCard) => {
    if (!request) return;
    setReadPraiseIds((current) => {
      if (current.includes(card.id)) return current;
      const next = [...current, card.id];
      try { localStorage.setItem(readPraiseKey(request.card.id), JSON.stringify(next)); } catch { /* optional storage */ }
      return next;
    });
  };

  const isIdea = view === "idea";
  const hasShareableIdea = Boolean(request || ideaDraft);
  const praiseEmptyDescription = hasShareableIdea
    ? "완성한 아이디어를 공유하고 친구의 응원을 받아보세요."
    : "먼저 아이디어를 만들고 친구에게 공유해보세요.";

  return (
    <div className="flex min-h-dvh justify-center text-ink">
      <main
        className={`relative w-full max-w-[440px] bg-bg shadow-[0_0_0_1px_rgba(255,255,255,.05),0_40px_120px_rgba(0,0,0,.5)] ${
          isIdea ? "flex h-dvh flex-col overflow-hidden" : "min-h-dvh"
        }`}
      >
        <nav className="sticky top-0 z-50 flex-none border-b border-white/10 bg-bg/90 px-4 py-1 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setView("idea")} className="min-h-12 rounded-lg px-1 text-sm font-black text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">오늘 해볼까</button>
            <div className="flex rounded-full border border-white/10 bg-white/[.035] p-1 text-[11px] font-bold" role="group" aria-label="화면 전환">
              <button type="button" aria-pressed={view === "idea"} onClick={() => setView("idea")} className={`min-h-12 rounded-full px-3.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${view === "idea" ? "bg-white/[.12] text-ink" : "text-mist hover:text-ink"}`}>아이디어 만들기</button>
              <button
                type="button"
                aria-label={unreadPraiseCount ? `받은 응원, 새 응원 ${unreadPraiseCount}개` : "받은 응원"}
                aria-pressed={view === "praise"}
                onClick={() => setView("praise")}
                className={`flex min-h-12 items-center gap-1.5 rounded-full px-3.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${view === "praise" ? "bg-white/[.12] text-ink" : "text-mist hover:text-ink"}`}
              >
                받은 응원
                {unreadPraiseCount ? (
                  <span aria-hidden="true" className="inline-grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none text-white">
                    {unreadPraiseCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </nav>

      {isIdea ? (
        <div className="min-h-0 flex-1"><IdeaLab onShare={shareIdea} onDraftReady={setIdeaDraft} onViewPraise={() => setView("praise")} /></div>
      ) : (
        <section className="px-4 py-6">
          <PraiseCardDeck
            card={todayCard}
            initiallyFaceUp={Boolean(todayCard && readPraiseIds.includes(todayCard.id))}
            hasNextCard={Boolean(praiseState.next)}
            nextCardLabel={praiseState.next ? `다음 응원은 ${formatDate(praiseState.next.availableAt)}에 열려요.` : undefined}
            emptyDescription={praiseEmptyDescription}
            shareActionLabel={hasShareableIdea ? "내 아이디어 공유하기" : "먼저 아이디어 만들기"}
            onRequestPraise={requestPraise}
            onReveal={markPraiseRead}
            onStartIdea={() => setView("idea")}
            palette={{ accent: "#ff4458", cardBack: "#3a1830", cardBackLine: "#ff9cab" }}
          />
          {praiseShareNotice ? <p role="status" className="mt-3 text-center text-sm text-mist">{praiseShareNotice}</p> : null}
        </section>
      )}
      </main>
    </div>
  );
}
