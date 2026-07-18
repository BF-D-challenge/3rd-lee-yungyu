// 발행 카드 데이터층 — 로그인 시 Supabase(published_cards)에 동기화, 비로그인/오프라인은 localStorage만.
//   구글 로그인의 실질 가치(카드 보관 = 기기 간 동일 대시보드)를 완성하는 지점.
//   votes.ts와 동일 패턴: Supabase 미설정·비로그인이면 전 함수가 자동으로 localStorage로 폴백한다.
import { getSupabase } from "./client";
import { getUser } from "./auth";
import { addPublished as localAddPublished, loadPublished as localLoadPublished, type PublishedCard } from "../storage";

export type { PublishedCard };

/** 발행 저장 — localStorage에 낙관적으로 남기고, 로그인 상태면 Supabase에도 upsert(user_id, slug). */
export async function publishCard(card: PublishedCard): Promise<void> {
  localAddPublished(card);
  const sb = getSupabase();
  if (!sb) return;
  const user = await getUser();
  if (!user) return; // 비로그인 — localStorage만(기존 데모 동작 그대로)
  try {
    await sb.from("published_cards").upsert(
      {
        user_id: user.id,
        slug: card.slug,
        payload: card.payload,
        feedback_read_token: card.feedbackReadToken ?? null,
        published_at: new Date(card.publishedAt).toISOString(),
      },
      { onConflict: "user_id,slug" },
    );
  } catch {
    /* 네트워크 실패는 localStorage에 이미 반영됨 */
  }
}

/** 대시보드용 — 로그인 상태면 Supabase(기기 간 동일 목록), 아니면 localStorage. */
export async function fetchPublished(): Promise<PublishedCard[]> {
  const sb = getSupabase();
  if (!sb) return localLoadPublished();
  const user = await getUser();
  if (!user) return localLoadPublished();
  try {
    const { data, error } = await sb
      .from("published_cards")
      .select("slug,payload,feedback_read_token,published_at")
      .eq("user_id", user.id)
      .order("published_at", { ascending: false });
    if (error || !data) return localLoadPublished();
    return data.map((r) => ({
      slug: r.slug as string,
      payload: r.payload as PublishedCard["payload"],
      ...(typeof r.feedback_read_token === "string"
        ? { feedbackReadToken: r.feedback_read_token }
        : {}),
      publishedAt: new Date(r.published_at as string).getTime(),
    }));
  } catch {
    return localLoadPublished();
  }
}
