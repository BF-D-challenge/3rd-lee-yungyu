"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FakeDoorSheet } from "@/components/molecules/fake-door-sheet";
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
import { fakeDoor, track, trackShare } from "@/lib/track";

type View = "idea" | "praise";
type Door = "sender" | "next" | null;

const requestUrl = (slug: string) => `${window.location.origin}${praiseRequestPath(slug)}`;
const formatDate = (timestamp: number) => new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(timestamp);

export function TodayApp() {
  const [view, setView] = useState<View>("idea");
  const [request, setRequest] = useState<SavedPraiseRequest | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [door, setDoor] = useState<Door>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async (slug: string) => {
    setVotes(await fetchVotes(slug));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const latest = loadLatestPraiseRequest();
    if (!latest) return;
    setRequest(latest);
    void refresh(latest.slug);
  }, [refresh]);

  useEffect(() => {
    if (view !== "praise" || !request) return;
    const update = () => { void refresh(request.slug); };
    update();
    window.addEventListener("focus", update);
    const timer = window.setInterval(update, 15000);
    return () => {
      window.removeEventListener("focus", update);
      window.clearInterval(timer);
    };
  }, [refresh, request, view]);

  const records = useMemo(
    () => votes
      .map((vote, index) => praiseRecordFromVote(vote, {
        id: vote.id ?? `${request?.card.id ?? "praise"}:${vote.at}:${index}`,
      }))
      .filter((record) => record !== null),
    [request?.card.id, votes],
  );
  const praiseState = useMemo(() => getPraiseCardsState(records, now), [now, records]);
  const todayCard: PraiseCard | null = praiseState.today
    ? {
        id: praiseState.today.id,
        message: praiseState.today.message,
        arrivedAt: formatDate(praiseState.today.receivedAt),
        anonymousLabel: praiseState.today.sender.status === "revealed"
          ? `보낸 사람 · ${praiseState.today.sender.displayName}`
          : "익명의 칭찬",
        emblem: "spark",
      }
    : null;

  const shareIdea = async (payload: IdeaLabSharePayload) => {
    const storedDraft = request?.prompt === payload.prompt
      ? request
      : loadLatestPraiseRequest()?.prompt === payload.prompt
        ? loadLatestPraiseRequest()
        : null;
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
      text: `${saved.card.summary}\n익명 칭찬 카드 한 장을 남겨주세요.`,
    });
    trackShare(result.ok ? "praise_request_share_completed" : "praise_request_share_cancelled", result.method, {
      request_id: saved.card.id,
    });
    if (!result.ok) return false;
    return true;
  };

  const requestPraise = async () => {
    if (!request) {
      setView("idea");
      return;
    }
    const result = await shareOrCopy(requestUrl(request.slug), {
      title: request.card.title,
      text: `${request.card.summary}\n익명 칭찬 카드 한 장을 남겨주세요.`,
    });
    trackShare(result.ok ? "praise_request_reshare_completed" : "praise_request_reshare_cancelled", result.method, {
      request_id: request.card.id,
    });
  };

  const openDoor = (nextDoor: Exclude<Door, null>) => {
    fakeDoor("demand_report", 990, { feature: nextDoor === "sender" ? "sender_identity" : "next_praise_preview" });
    setDoor(nextDoor);
  };

  return (
    <main className="min-h-dvh bg-bg text-ink">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-bg/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <button type="button" onClick={() => setView("idea")} className="text-sm font-black text-primary">오늘 해볼까</button>
          <div className="flex rounded-full border border-white/10 bg-white/[.035] p-1 text-xs font-bold">
            <button type="button" onClick={() => setView("idea")} className={`rounded-full px-4 py-2 ${view === "idea" ? "bg-primary text-white" : "text-mist"}`}>아이디어 뽑기</button>
            <button type="button" onClick={() => setView("praise")} className={`rounded-full px-4 py-2 ${view === "praise" ? "bg-primary text-white" : "text-mist"}`}>오늘의 칭찬{records.length ? ` ${records.length}` : ""}</button>
          </div>
        </div>
      </nav>

      {view === "idea" ? (
        <div className="sm:px-5 sm:py-6"><IdeaLab onShare={shareIdea} /></div>
      ) : (
        <section className="px-4 py-7 sm:px-6 sm:py-10">
          <div className="mx-auto mb-5 max-w-[720px]">
            <p className="text-xs font-black tracking-[.14em] text-primary">DAILY ONE CARD</p>
            <h1 className="mt-2 text-3xl font-bold">매일 익명의 칭찬 한 장</h1>
            <p className="mt-2 text-sm leading-6 text-mist">
              오늘 카드는 무료로 뒤집을 수 있어요. 다음 카드는 내일 열리고, 기다리기 어렵다면 미리 보기를 선택할 수 있어요.
            </p>
          </div>
          <PraiseCardDeck
            card={todayCard}
            hasNextCard={Boolean(praiseState.next)}
            nextCardLabel={praiseState.next ? `다음 칭찬은 ${formatDate(praiseState.next.availableAt)}에 열려요` : "잠긴 다음 칭찬이 없어요"}
            onRequestPraise={requestPraise}
            onRevealSender={praiseState.senderIdentityFakeDoor.status === "available" ? () => openDoor("sender") : undefined}
            onPreviewNext={praiseState.nextPreviewFakeDoor.status === "available" ? () => openDoor("next") : undefined}
            palette={{ accent: "#ff4458", cardBack: "#3a1830", cardBackLine: "#ff9cab" }}
          />
          {!request && !todayCard ? <p className="mx-auto mt-4 max-w-[720px] text-center text-xs text-caption">먼저 네 장을 뽑아 결과를 공유하면 칭찬을 받을 수 있어요.</p> : null}
        </section>
      )}

      <FakeDoorSheet
        open={door !== null}
        onClose={() => setDoor(null)}
        product="demand_report"
        title={door === "sender" ? "이 칭찬을 보낸 사람 확인" : "다음 칭찬 카드 미리 보기"}
      />
    </main>
  );
}
