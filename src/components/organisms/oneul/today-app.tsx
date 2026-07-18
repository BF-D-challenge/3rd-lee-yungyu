"use client";

import { useEffect, useMemo, useState } from "react";
import { IdeaLab, type IdeaLabSharePayload } from "@/components/organisms/idea-lab";
import { PraiseCardDeck, type PraiseCard } from "@/components/organisms/praise-cards";
import { registerFeedbackRequest } from "@/lib/backend/feedback-api";
import { fetchVotes, type Vote } from "@/lib/backend/votes";
import { IDEA_FEEDBACK_MESSAGES, nextIdeaFeedbackActions, summarizeIdeaFeedback } from "@/lib/idea-feedback";
import {
  loadIdeaRevisionHistory,
  revisionCardFrom,
  saveIdeaRevision,
  type IdeaRevision,
  type IdeaRevisionHistory,
} from "@/lib/idea-revisions";
import { getPraiseCardsState, praiseRecordFromVote } from "@/lib/praise-cards";
import {
  encodePraiseRequest,
  loadLatestPraiseRequest,
  praiseOwnerAccess,
  praiseRequestFromIdea,
  praiseRequestPath,
  saveLatestPraiseRequest,
  secureSavedPraiseRequest,
  type SavedPraiseRequest,
} from "@/lib/praise-share";
import { shareToKakao } from "@/lib/kakao-share";
import { track, trackIdeaEvent, trackShare } from "@/lib/track";
import { AuthAccountMenu } from "./auth-account-menu";

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

interface FeedbackSnapshot {
  currentVotes: Vote[];
  voteCounts: Record<string, number>;
}

const loadFeedbackSnapshot = async (
  current: SavedPraiseRequest,
  includeVersionCounts: boolean,
): Promise<FeedbackSnapshot> => {
  if (!includeVersionCounts) {
    const currentVotes = await fetchVotes(current.slug, praiseOwnerAccess(current) ?? undefined);
    return {
      currentVotes,
      voteCounts: { [current.card.id]: currentVotes.length },
    };
  }

  const originRequestId = current.card.originRequestId ?? current.card.id;
  const history = loadIdeaRevisionHistory(originRequestId);
  const versionSlugs = [
    ...(history ? [{
      requestId: history.originCard.id,
      slug: history.originSlug,
      access: history.originCard.feedback && history.originReadToken
        ? { requestId: history.originCard.feedback.requestId, readToken: history.originReadToken }
        : undefined,
    }] : []),
    ...(history?.revisions ?? []).map((revision) => ({
      requestId: revision.requestId,
      slug: revision.slug,
      access: revision.feedback
        ? { requestId: revision.feedback.requestId, readToken: revision.feedback.readToken }
        : undefined,
    })),
    {
      requestId: current.card.id,
      slug: current.slug,
      access: praiseOwnerAccess(current) ?? undefined,
    },
  ].filter((item, index, all) => all.findIndex((candidate) => candidate.slug === item.slug) === index);
  const fetched = await Promise.all(versionSlugs.map(async (item) => ({
    ...item,
    votes: await fetchVotes(item.slug, item.access),
  })));
  const currentVotes = fetched.find((item) => item.slug === current.slug)?.votes ?? [];
  return {
    currentVotes,
    voteCounts: Object.fromEntries(fetched.map((item) => [item.requestId, item.votes.length])),
  };
};

export function TodayApp() {
  const [view, setView] = useState<View>("idea");
  const [request, setRequest] = useState<SavedPraiseRequest | null>(null);
  const [ideaDraft, setIdeaDraft] = useState<IdeaLabSharePayload | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [revisionHistory, setRevisionHistory] = useState<IdeaRevisionHistory | null>(null);
  const [activeRevision, setActiveRevision] = useState<IdeaRevision | null>(null);
  const [revisionVoteCounts, setRevisionVoteCounts] = useState<Record<string, number>>({});
  const [readPraiseIds, setReadPraiseIds] = useState<string[]>([]);
  const [praiseShareNotice, setPraiseShareNotice] = useState("");
  const [revisionNotice, setRevisionNotice] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editUvp, setEditUvp] = useState("");
  const [editDifference, setEditDifference] = useState("");
  const [showDirectFeedback, setShowDirectFeedback] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const latest = loadLatestPraiseRequest();
    if (!latest) return;
    setRequest(latest);
  }, []);

  useEffect(() => {
    if (!request) {
      setRevisionHistory(null);
      setActiveRevision(null);
      return;
    }
    const originRequestId = request.card.originRequestId ?? request.card.id;
    const history = loadIdeaRevisionHistory(originRequestId);
    setRevisionHistory(history);
    setActiveRevision((current) => (
      current?.originRequestId === originRequestId
        ? current
        : history?.revisions.at(-1) ?? null
    ));
  }, [request]);

  useEffect(() => {
    if (!request) return;
    setReadPraiseIds(loadReadPraiseIds(request.card.id));
  }, [request]);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    let running = false;
    let timer: number | null = null;

    const update = async (includeVersionCounts: boolean) => {
      if (cancelled || running || document.visibilityState === "hidden") return;
      running = true;
      try {
        const snapshot = await loadFeedbackSnapshot(request, includeVersionCounts);
        if (cancelled) return;
        setVotes(snapshot.currentVotes);
        setRevisionVoteCounts((current) => (
          includeVersionCounts
            ? snapshot.voteCounts
            : { ...current, ...snapshot.voteCounts }
        ));
        setNow(Date.now());
      } finally {
        running = false;
      }
    };

    const schedule = () => {
      timer = window.setTimeout(async () => {
        await update(false);
        if (!cancelled) schedule();
      }, 15000);
    };
    const refreshAll = () => { void update(true); };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshAll();
    };

    void update(true).finally(schedule);
    window.addEventListener("focus", refreshAll);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshAll);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [request]);

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
  const feedbackSummary = useMemo(
    () => summarizeIdeaFeedback(records.map((record) => record.message)),
    [records],
  );
  const feedbackActions = useMemo(() => nextIdeaFeedbackActions(feedbackSummary), [feedbackSummary]);
  const customFeedback = useMemo(
    () => records.filter((record) => !Object.values(IDEA_FEEDBACK_MESSAGES).includes(record.message as never)),
    [records],
  );
  const editableCard = useMemo(() => {
    if (activeRevision && revisionHistory) return revisionCardFrom(revisionHistory.originCard, activeRevision);
    return request?.card ?? null;
  }, [activeRevision, request?.card, revisionHistory]);
  const currentVersion = request?.card.version ?? 0;
  const versionItems = useMemo(() => {
    if (!revisionHistory) return [];
    return [
      {
        id: revisionHistory.originCard.id,
        label: "원본",
        version: 0,
        count: revisionVoteCounts[revisionHistory.originCard.id] ?? 0,
      },
      ...revisionHistory.revisions.map((revision) => ({
        id: revision.requestId,
        label: `수정본 ${revision.version}`,
        version: revision.version,
        count: revisionVoteCounts[revision.requestId] ?? 0,
      })),
    ];
  }, [revisionHistory, revisionVoteCounts]);
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
    const draft = storedDraft ?? (() => {
      const card = praiseRequestFromIdea(payload);
      const slug = encodePraiseRequest(card);
      return { slug, card, prompt: payload.prompt } satisfies SavedPraiseRequest;
    })();
    const saved = secureSavedPraiseRequest(draft);
    // 카카오톡 공유 화면을 열지 못해도 같은 결과 링크로 다시 요청할 수 있게 초안은 먼저 보존한다.
    // 제작 문구 해제는 아래 shareToKakao가 공유 화면을 연 경우에만 IdeaLab이 처리한다.
    saveLatestPraiseRequest(saved);
    setRequest(saved);
    setVotes([]);
    const access = praiseOwnerAccess(saved);
    const registration = access ? await registerFeedbackRequest("card", access) : "failed";
    if (registration === "failed") {
      trackShare("praise_request_share_cancelled", "kakao", {
        request_id: saved.card.id,
        reason: "secure_registration_failed",
      });
      return { ok: false, method: "kakao" as const, reason: "launch_failed" as const };
    }
    if (!storedDraft) {
      track("praise_request_created", { request_id: saved.card.id });
      trackIdeaEvent("idea_share_created", {
        request_id: saved.card.id,
        origin_request_id: saved.card.originRequestId ?? saved.card.id,
        version: saved.card.version ?? 0,
        entry_path: window.location.pathname,
      });
    }
    const result = await shareToKakao(requestUrl(saved.slug), {
      title: saved.card.title,
      text: `${saved.card.summary}\n짧은 응원이나 의견을 남겨주세요.`,
      buttonTitle: "친구 반응 남기기",
      serverCallbackArgs: { request_id: saved.card.id },
    });
    trackShare(result.ok ? "praise_request_share_completed" : "praise_request_share_cancelled", result.method, {
      request_id: saved.card.id,
      completion_signal: result.ok ? "picker_opened" : "launch_failed",
    });
    return result;
  };

  const requestPraise = async () => {
    setPraiseShareNotice("");
    if (ideaDraft && ideaDraft.prompt !== request?.prompt) {
      const result = await shareIdea(ideaDraft);
      setPraiseShareNotice(result.ok
        ? "카카오톡 공유 화면을 열었어요."
        : "카카오톡 공유 화면을 열지 못했어요. 다시 시도해 주세요.");
      return;
    }
    if (!request) {
      setView("idea");
      return;
    }
    const secured = secureSavedPraiseRequest(request);
    const access = praiseOwnerAccess(secured);
    const registration = access ? await registerFeedbackRequest("card", access) : "failed";
    if (registration === "failed") {
      setPraiseShareNotice("안전한 공유 링크를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (secured !== request) {
      saveLatestPraiseRequest(secured);
      setRequest(secured);
    }
    const result = await shareToKakao(requestUrl(secured.slug), {
      title: secured.card.title,
      text: `${secured.card.summary}\n짧은 응원이나 의견을 남겨주세요.`,
      buttonTitle: "친구 반응 남기기",
      serverCallbackArgs: { request_id: secured.card.id },
    });
    trackShare(result.ok ? "praise_request_reshare_completed" : "praise_request_reshare_cancelled", result.method, {
      request_id: secured.card.id,
      completion_signal: result.ok ? "picker_opened" : "launch_failed",
    });
    if (feedbackSummary.total > 0) {
      trackIdeaEvent("received_feedback_reinvite", {
        request_id: secured.card.id,
        origin_request_id: secured.card.originRequestId ?? secured.card.id,
        revision_id: secured.card.revisionId,
        version: secured.card.version ?? 0,
        entry_path: window.location.pathname,
      });
    }
    setPraiseShareNotice(result.ok
      ? "카카오톡 공유 화면을 열었어요."
      : "카카오톡 공유 화면을 열지 못했어요. 다시 시도해 주세요.");
  };

  const startEdit = () => {
    if (!editableCard) return;
    setEditUvp(editableCard.summary);
    setEditDifference(editableCard.twist);
    setRevisionNotice("");
    setEditMode(true);
  };

  const resetEditToOriginal = () => {
    const original = revisionHistory?.originCard ?? request?.card;
    if (!original) return;
    setEditUvp(original.summary);
    setEditDifference(original.twist);
  };

  const saveRevision = () => {
    if (!editableCard || !editUvp.trim() || !editDifference.trim()) return;
    const originReadToken = revisionHistory?.originReadToken
      ?? (!editableCard.originRequestId && request?.card.id === editableCard.id
        ? request.feedbackReadToken
        : undefined);
    const saved = saveIdeaRevision(
      editableCard,
      { uvp: editUvp, difference: editDifference },
      Date.now(),
      originReadToken,
    );
    setRevisionHistory(saved.history);
    setActiveRevision(saved.revision);
    setEditMode(false);
    setRevisionNotice(`수정본 ${saved.revision.version}을 저장했어요.`);
    trackIdeaEvent("idea_revision_saved", {
      request_id: editableCard.id,
      origin_request_id: saved.revision.originRequestId,
      revision_id: saved.revision.id,
      version: saved.revision.version,
      entry_path: window.location.pathname,
    });
  };

  const shareRevision = async () => {
    if (!activeRevision || !revisionHistory || !request) return;
    const card = revisionCardFrom(revisionHistory.originCard, activeRevision);
    const draft = {
      slug: activeRevision.slug,
      card,
      prompt: request.prompt,
      ...(activeRevision.feedback ? { feedbackReadToken: activeRevision.feedback.readToken } : {}),
    } satisfies SavedPraiseRequest;
    const saved = secureSavedPraiseRequest(draft);
    const access = praiseOwnerAccess(saved);
    const registration = access ? await registerFeedbackRequest("card", access) : "failed";
    if (registration === "failed") {
      setRevisionNotice("안전한 공유 링크를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    saveLatestPraiseRequest(saved);
    setRequest(saved);
    setVotes([]);
    const result = await shareToKakao(requestUrl(saved.slug), {
      title: saved.card.title,
      text: `${saved.card.summary}\n짧은 응원이나 의견을 남겨주세요.`,
      buttonTitle: "친구 반응 남기기",
      serverCallbackArgs: { request_id: saved.card.id },
    });
    trackShare(result.ok ? "praise_request_share_completed" : "praise_request_share_cancelled", result.method, {
      request_id: saved.card.id,
      origin_request_id: saved.card.originRequestId,
      revision_id: saved.card.revisionId,
      version: saved.card.version,
      completion_signal: result.ok ? "picker_opened" : "launch_failed",
    });
    if (result.ok) {
      trackIdeaEvent("idea_revision_shared", {
        request_id: saved.card.id,
        origin_request_id: saved.card.originRequestId,
        revision_id: saved.card.revisionId,
        version: saved.card.version,
        entry_path: window.location.pathname,
      });
      setRevisionNotice(`수정본 ${activeRevision.version}의 카카오톡 공유 화면을 열었어요.`);
    }
  };

  const openDirectFeedback = () => {
    setShowDirectFeedback(true);
    window.setTimeout(() => document.getElementById("direct-feedback-list")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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
        className={`today-app-shell relative w-full max-w-[440px] bg-bg shadow-[0_0_0_1px_rgba(255,255,255,.05),0_40px_120px_rgba(0,0,0,.5)] ${
          isIdea ? "flex h-dvh flex-col overflow-hidden" : "min-h-dvh"
        }`}
      >
        <nav className="sticky top-0 z-50 flex-none overflow-x-auto border-b border-white/10 bg-bg/90 px-4 py-1 backdrop-blur-xl">
          <div className="flex min-w-max items-center justify-between gap-3">
            <button
              type="button"
              aria-label="오늘 해볼까"
              onClick={() => setView("idea")}
              className="min-h-12 shrink-0 whitespace-nowrap rounded-lg px-1 text-sm font-black text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="min-[370px]:hidden">오늘</span>
              <span className="hidden min-[370px]:inline">오늘 해볼까</span>
            </button>
            <div className="flex shrink-0 rounded-full border border-white/10 bg-white/[.035] p-1 text-[11px] font-bold" role="group" aria-label="화면 전환">
              <button
                type="button"
                aria-label="아이디어 만들기"
                aria-pressed={view === "idea"}
                onClick={() => setView("idea")}
                className={`min-h-12 whitespace-nowrap rounded-full px-2.5 transition-colors min-[370px]:px-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${view === "idea" ? "bg-white/[.12] text-ink" : "text-mist hover:text-ink"}`}
              >
                <span className="min-[370px]:hidden">아이디어</span>
                <span className="hidden min-[370px]:inline">아이디어 만들기</span>
              </button>
              <button
                type="button"
                aria-label={unreadPraiseCount ? `받은 응원, 새 응원 ${unreadPraiseCount}개` : "받은 응원"}
                aria-pressed={view === "praise"}
                onClick={() => setView("praise")}
                className={`flex min-h-12 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 transition-colors min-[370px]:px-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${view === "praise" ? "bg-white/[.12] text-ink" : "text-mist hover:text-ink"}`}
              >
                <span className="min-[370px]:hidden">응원</span>
                <span className="hidden min-[370px]:inline">받은 응원</span>
                {unreadPraiseCount ? (
                  <span aria-hidden="true" className="inline-grid min-h-5 min-w-5 place-items-center rounded-full bg-action px-1 text-[10px] leading-none text-white">
                    {unreadPraiseCount}
                  </span>
                ) : null}
              </button>
              <AuthAccountMenu />
            </div>
          </div>
        </nav>

      {isIdea ? (
        <div className="min-h-0 flex-1"><IdeaLab onShare={shareIdea} onDraftReady={setIdeaDraft} onViewPraise={() => setView("praise")} /></div>
      ) : (
        <section className="px-4 py-6">
          {versionItems.length > 1 ? (
            <section className="mb-4 rounded-xl border border-white/10 bg-white/[.035] p-4" aria-labelledby="idea-version-title">
              <p className="text-[11px] font-black text-primary">아이디어 버전</p>
              <h2 id="idea-version-title" className="mt-1 text-lg font-black text-ink">원본 → 수정본 {versionItems.length - 1}</h2>
              <p className="mt-2 text-xs text-mist">현재 공유 중인 버전 · {currentVersion === 0 ? "원본" : `수정본 ${currentVersion}`}</p>
              <div className="mt-3 grid gap-2" role="list" aria-label="버전별 반응 수">
                {versionItems.map((item) => (
                  <div
                    key={item.id}
                    role="listitem"
                    aria-label={`${item.label} 반응 ${item.count}개`}
                    className={`flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 ${item.version === currentVersion ? "border-primary/50 bg-primary/10" : "border-white/[.08] bg-black/20"}`}
                  >
                    <span className="text-sm font-bold text-ink">{item.label}</span>
                    <span className="text-xs font-black text-mist">반응 {item.count}개</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {feedbackSummary.total > 0 ? (
            <section
              className="mb-4 rounded-xl border border-white/10 bg-white/[.035] p-4"
              aria-labelledby="friend-feedback-title"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black text-primary">실제 사용자 신호</p>
                  <h2 id="friend-feedback-title" className="mt-1 text-lg font-black text-ink">
                    친구 반응 {feedbackSummary.total}개
                  </h2>
                </div>
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-black text-primary">
                  {feedbackSummary.total}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2" role="list" aria-label="친구 반응 요약">
                {[
                  ["바로 이해", feedbackSummary.understood],
                  ["써보고 싶음", feedbackSummary.wantToUse],
                  ["차별점 보완", feedbackSummary.needsDifference],
                  ["직접 쓴 의견", feedbackSummary.custom],
                ].map(([label, count]) => (
                  <div
                    key={label}
                    role="listitem"
                    aria-label={`${label} ${count}개`}
                    className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-2.5"
                  >
                    <strong className="block text-xl font-black text-ink">{count}</strong>
                    <span className="mt-0.5 block text-[11px] font-bold text-mist">{label}</span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs leading-5 text-mist">
                실제로 도착한 반응만 세었어요. 직접 쓴 의견은 원문 그대로 확인하세요.
              </p>
            </section>
          ) : null}

          {feedbackActions.length > 0 ? (
            <section className="mb-4 rounded-xl border border-primary/30 bg-primary/[.06] p-4" aria-labelledby="next-feedback-action-title">
              <p className="text-[11px] font-black text-primary">친구 반응 다음 단계</p>
              <h2 id="next-feedback-action-title" className="mt-1 text-lg font-black text-ink">다음에 무엇을 고칠까요?</h2>
              <div className="mt-3 grid gap-2">
                {feedbackActions.map((action, index) => (
                  <button
                    key={action.kind}
                    type="button"
                    className={`min-h-12 w-full rounded-lg px-4 text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${index === 0 ? "bg-action text-white hover:bg-action-hover" : "border border-white/15 bg-white/[.04] text-ink hover:bg-white/[.08]"}`}
                    onClick={() => {
                      if (action.kind === "edit-difference") startEdit();
                      if (action.kind === "read-custom") openDirectFeedback();
                      if (action.kind === "reinvite") void requestPraise();
                    }}
                  >
                    {action.label}
                  </button>
                ))}
                {!feedbackActions.some((action) => action.kind === "reinvite") ? (
                  <button
                    type="button"
                    className="min-h-12 w-full rounded-lg border border-white/15 bg-white/[.04] px-4 text-sm font-black text-ink hover:bg-white/[.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    onClick={() => { void requestPraise(); }}
                  >
                    친구 한 명 더 초대하기
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeRevision && revisionHistory ? (
            <section className="mb-4 rounded-xl border border-white/10 bg-white/[.035] p-4" aria-labelledby="saved-revision-title">
              <p className="text-[11px] font-black text-primary">수정본 {activeRevision.version}</p>
              <h2 id="saved-revision-title" className="mt-1 text-lg font-black text-ink">수정 전과 수정 후</h2>
              <dl className="mt-3 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-mist">수정 전 · UVP</dt>
                  <dd className="mt-1 break-words leading-6 text-ink">{revisionHistory.originCard.summary}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-mist">수정 후 · UVP</dt>
                  <dd className="mt-1 break-words leading-6 text-ink">{activeRevision.uvp}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-mist">수정 후 · 차별점</dt>
                  <dd className="mt-1 break-words leading-6 text-ink">{activeRevision.difference}</dd>
                </div>
              </dl>
              <div className="mt-3 grid gap-2">
                <button type="button" className="min-h-12 w-full rounded-lg bg-action px-4 text-sm font-black text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => { void shareRevision(); }}>
                  수정한 아이디어 다시 물어보기
                </button>
                <button type="button" className="min-h-12 w-full rounded-lg border border-white/15 bg-white/[.04] px-4 text-sm font-black text-ink hover:bg-white/[.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={startEdit}>
                  수정본 다시 고치기
                </button>
              </div>
              {revisionNotice ? <p role="status" className="mt-3 text-xs leading-5 text-primary">{revisionNotice}</p> : null}
            </section>
          ) : null}

          {editMode && editableCard ? (
            <section className="mb-4 rounded-xl border border-primary/35 bg-white/[.035] p-4" aria-labelledby="edit-idea-title">
              <p className="text-[11px] font-black text-primary">친구 반응 반영하기</p>
              <h2 id="edit-idea-title" className="mt-1 text-lg font-black text-ink">UVP와 차별점만 직접 고쳐보세요</h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-ink" htmlFor="edit-idea-uvp">
                  한 문장 UVP
                  <textarea id="edit-idea-uvp" value={editUvp} onChange={(event) => setEditUvp(event.target.value)} rows={3} maxLength={600} className="w-full resize-y rounded-lg border border-white/15 bg-black/20 px-3 py-3 text-sm font-normal leading-6 text-ink outline-none focus:border-primary" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-ink" htmlFor="edit-idea-difference">
                  차별점
                  <textarea id="edit-idea-difference" value={editDifference} onChange={(event) => setEditDifference(event.target.value)} rows={3} maxLength={600} className="w-full resize-y rounded-lg border border-white/15 bg-black/20 px-3 py-3 text-sm font-normal leading-6 text-ink outline-none focus:border-primary" />
                </label>
              </div>
              <div className="mt-3 grid gap-2">
                <button type="button" className="min-h-12 w-full rounded-lg bg-action px-4 text-sm font-black text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={saveRevision} disabled={!editUvp.trim() || !editDifference.trim()}>
                  수정본 저장
                </button>
                <button type="button" className="min-h-12 w-full rounded-lg border border-white/15 bg-white/[.04] px-4 text-sm font-black text-ink hover:bg-white/[.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={resetEditToOriginal}>
                  원본으로 되돌리기
                </button>
              </div>
            </section>
          ) : null}

          {showDirectFeedback ? (
            <section id="direct-feedback-list" className="mb-4 rounded-xl border border-white/10 bg-white/[.035] p-4" aria-labelledby="direct-feedback-title">
              <p className="text-[11px] font-black text-primary">직접 쓴 의견</p>
              <h2 id="direct-feedback-title" className="mt-1 text-lg font-black text-ink">친구가 남긴 원문</h2>
              <ul className="mt-3 grid gap-2">
                {customFeedback.map((record) => <li key={record.id} className="rounded-lg border border-white/[.08] bg-black/20 px-3 py-3 text-sm leading-6 text-ink">{record.message}</li>)}
              </ul>
            </section>
          ) : null}

          <PraiseCardDeck
            id="received-praise-deck"
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
