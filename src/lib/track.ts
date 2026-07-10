// PRD §8 계측. v4 단계에선 GA4 미연결 — 콘솔+localStorage 적재로 실측을 대체한다.

import { authenticatedForTracking } from "./auth-session";

const EVENTS_KEY = "events";

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

/** 공유 이벤트: native(공유시트)/clipboard(복사)를 구분해 계측한다 (shareOrCopy와 짝) */
export const trackShare = (event: string, method: "native" | "clipboard", params: Record<string, unknown> = {}) =>
  track(event, { share_method: method, ...params });
