// PRD §8 계측. v4 단계에선 GA4 미연결 — 콘솔+localStorage 적재로 실측을 대체한다.

import { authenticatedForTracking } from "./auth-session";

const EVENTS_KEY = "events";
const IDEA_EVENT_KEYS = "idea:event-keys:v1";

let memSid: string | null = null; // 스토리지 차단 환경 폴백

const sid = (): string => {
  try {
    const existing = sessionStorage.getItem("sid");
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem("sid", fresh);
    return fresh;
  } catch {
    return (memSid ??= crypto.randomUUID());
  }
};

export function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const entry = { event, session_id: sid(), is_logged_in: authenticatedForTracking(), ts: Date.now(), ...params };
  (window as { gtag?: (...args: unknown[]) => void }).gtag?.("event", event, entry);
  try {
    const log = JSON.parse(localStorage.getItem(EVENTS_KEY) ?? "[]") as unknown[];
    log.push(entry);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(log.slice(-500)));
  } catch {
    /* 스토리지 실패는 계측 손실로만 처리 */
  }
  console.debug("[track]", event, entry);
}

export type FakeDoorProduct = "plan" | "day_pass" | "demand_report";

/** 가짜 문 공통: 결제 CTA 클릭을 기록한다. 이후 UI는 "준비 중이에요" 시트를 띄운다. */
export const fakeDoor = (product: FakeDoorProduct, price: number, params: Record<string, unknown> = {}) =>
  track(`pay_${product}_click`, { product, price, ...params });

/** 공유 이벤트: 모든 발신 경로는 Kakao JavaScript SDK로 통일한다. */
export const trackShare = (event: string, method: "kakao", params: Record<string, unknown> = {}) =>
  track(event, { share_method: method, ...params });

export type IdeaFunnelEventName =
  | "idea_lab_viewed"
  | "idea_first_card_drawn"
  | "idea_four_cards_completed"
  | "idea_result_viewed";

/** 제작 퍼널에는 선택 카드의 문구를 넣지 않고 행동 단계와 시도 번호만 기록한다. */
export function trackIdeaFunnelEvent(
  event: IdeaFunnelEventName,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  track(event, {
    event_type: event,
    entry_path: window.location.pathname,
    ...params,
  });
}

export type IdeaEventName =
  | "idea_share_created"
  | "idea_share_opened"
  | "idea_feedback_sent"
  | "idea_revision_saved"
  | "idea_revision_shared"
  | "receiver_started_idea"
  | "received_feedback_reinvite";

/** 아이디어 루프 이벤트는 같은 로컬 이벤트 키를 한 번만 적재한다. 메시지 원문은 받지 않는다. */
export function trackIdeaEvent(event: IdeaEventName, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const requestId = typeof params.request_id === "string" ? params.request_id : "unknown";
  const originRequestId = typeof params.origin_request_id === "string" ? params.origin_request_id : requestId;
  const revisionId = typeof params.revision_id === "string" ? params.revision_id : "origin";
  const version = typeof params.version === "number" ? params.version : 0;
  const entryPath = typeof params.entry_path === "string" ? params.entry_path : window.location.pathname;
  const dedupeKey = [event, requestId, originRequestId, revisionId, version, entryPath].join(":");
  try {
    const keys = JSON.parse(localStorage.getItem(IDEA_EVENT_KEYS) ?? "[]") as unknown;
    const stored = Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : [];
    if (stored.includes(dedupeKey)) return;
    localStorage.setItem(IDEA_EVENT_KEYS, JSON.stringify([...stored, dedupeKey].slice(-1000)));
  } catch {
    // 이벤트 중복 방지 저장이 막혀도 핵심 UI는 계속 동작한다.
  }
  track(event, { event_type: event, ...params, entry_path: entryPath });
}
