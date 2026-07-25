// 발행 카드 데이터층 — 로그인 시 Supabase(published_cards)에 동기화, 비로그인/오프라인은 localStorage만.
//   구글 로그인의 실질 가치(카드 보관 = 기기 간 동일 대시보드)를 완성하는 지점.
//   votes.ts와 동일 패턴: Supabase 미설정·비로그인이면 전 함수가 자동으로 localStorage로 폴백한다.
import { getSupabase } from "./client";
import { getUser } from "./auth";
import { addPublished as localAddPublished, loadPublished as localLoadPublished, type PublishedCard } from "../storage";

export type { PublishedCard };

export type PublishedCardsSyncResult =
  | { status: "unavailable" | "anonymous" | "failed"; count: 0 }
  | { status: "synced"; count: number };

const toDatabaseRow = (card: PublishedCard, userId: string) => ({
  user_id: userId,
  slug: card.slug,
  payload: card.payload,
  feedback_read_token: card.feedbackReadToken ?? null,
  published_at: new Date(card.publishedAt).toISOString(),
});

/**
 * 로그인 전에 이 기기에 발행한 기존 CardPayload만 검증된 auth.uid() 소유 행으로 옮긴다.
 * 새 Idea Lab 결과는 payload 계약이 다르므로 이 경로에 섞지 않는다.
 */
export async function syncLocalPublishedCardsToAccount(): Promise<PublishedCardsSyncResult> {
  const cards = localLoadPublished();
  const sb = getSupabase();
  if (!sb) return { status: "unavailable", count: 0 };
  const user = await getUser();
  if (!user) return { status: "anonymous", count: 0 };
  if (cards.length === 0) return { status: "synced", count: 0 };
  try {
    const { error } = await sb
      .from("published_cards")
      .upsert(cards.map((card) => toDatabaseRow(card, user.id)), {
        onConflict: "user_id,slug",
      });
    return error
      ? { status: "failed", count: 0 }
      : { status: "synced", count: cards.length };
  } catch {
    return { status: "failed", count: 0 };
  }
}

/** 발행 저장 — localStorage에 낙관적으로 남기고, 로그인 상태면 Supabase에도 upsert(user_id, slug). */
export async function publishCard(card: PublishedCard): Promise<void> {
  localAddPublished(card);
  const sb = getSupabase();
  if (!sb) return;
  const user = await getUser();
  if (!user) return; // 비로그인 — localStorage만(기존 데모 동작 그대로)
  try {
    await sb.from("published_cards").upsert(
      toDatabaseRow(card, user.id),
      { onConflict: "user_id,slug" },
    );
  } catch {
    /* 네트워크 실패는 localStorage에 이미 반영됨 */
  }
}

/** 대시보드용 — 로그인 상태면 Supabase(기기 간 동일 목록), 아니면 localStorage. */
export async function fetchPublished(): Promise<PublishedCard[]> {
  const local = localLoadPublished();
  const sb = getSupabase();
  if (!sb) return local;
  const user = await getUser();
  if (!user) return local;
  try {
    const { data, error } = await sb
      .from("published_cards")
      .select("slug,payload,feedback_read_token,published_at")
      .eq("user_id", user.id)
      .order("published_at", { ascending: false });
    if (error || !data) return local;
    const remote = data.map((r) => ({
      slug: r.slug as string,
      payload: r.payload as PublishedCard["payload"],
      ...(typeof r.feedback_read_token === "string"
        ? { feedbackReadToken: r.feedback_read_token }
        : {}),
      publishedAt: new Date(r.published_at as string).getTime(),
    }));
    const merged = new Map(remote.map((card) => [card.slug, card]));
    local.forEach((card) => {
      const remoteCard = merged.get(card.slug);
      merged.set(card.slug, remoteCard
        ? {
            ...remoteCard,
            ...card,
            feedbackReadToken: card.feedbackReadToken ?? remoteCard.feedbackReadToken,
          }
        : card);
    });
    return [...merged.values()].sort((a, b) => b.publishedAt - a.publishedAt);
  } catch {
    return local;
  }
}
