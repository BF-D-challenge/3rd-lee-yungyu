// v4는 백엔드 없이 URL 자체가 데이터 캐리어다 (Supabase는 3주차, R21).
import type { Combo } from "./draw";
import { formatById, painById, type Track } from "./combos";

export interface CardPayload {
  seedId: string;
  seedLabel: string;
  track: Track;
  painId: number;
  formatId: string;
  title: string | null;
  oneliner: string | null;
  target: string;
  situation: string;
  psych: string;
}

export const toPayload = (c: Combo): CardPayload => ({
  seedId: c.seed.id,
  seedLabel: c.seed.label,
  track: c.seed.track,
  painId: c.pain.id,
  formatId: c.format.id,
  title: c.title,
  oneliner: c.oneliner,
  target: c.target,
  situation: c.situation,
  psych: c.psych,
});

export function encodeSlug(payload: CardPayload): string {
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeSlug(slug: string): CardPayload | null {
  try {
    const b64 = slug.replaceAll("-", "+").replaceAll("_", "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(decodeURIComponent(atob(padded))) as CardPayload;
    // 최소 무결성: 참조 데이터가 실제로 존재해야 렌더 가능
    if (!payload.seedLabel || !painById(payload.painId) || !formatById(payload.formatId)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const shareUrl = (payload: CardPayload): string => `${location.origin}/c/${encodeSlug(payload)}`;

// ── A/B 응원 대결 — 카드 2장을 한 URL에 실어 "어느 쪽을 응원할래?"를 묻는다 (긍정 전용) ──

export interface DuelPayload {
  a: CardPayload;
  b: CardPayload;
}

const DUEL_VERSION = 1;

/** decodeSlug와 같은 최소 무결성: 참조 데이터가 실제로 존재해야 렌더 가능 */
const isRenderable = (p: CardPayload | undefined): p is CardPayload =>
  Boolean(p && p.seedLabel && painById(p.painId) && formatById(p.formatId));

export function encodeDuelSlug(a: CardPayload, b: CardPayload): string {
  const json = JSON.stringify({ v: DUEL_VERSION, a, b });
  return btoa(encodeURIComponent(json)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeDuelSlug(slug: string): DuelPayload | null {
  try {
    const b64 = slug.replaceAll("-", "+").replaceAll("_", "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const parsed = JSON.parse(decodeURIComponent(atob(padded))) as {
      v?: number;
      a?: CardPayload;
      b?: CardPayload;
    };
    if (parsed.v !== DUEL_VERSION || !isRenderable(parsed.a) || !isRenderable(parsed.b)) return null;
    return { a: parsed.a, b: parsed.b };
  } catch {
    return null;
  }
}

export const duelUrl = (a: CardPayload, b: CardPayload): string => `${location.origin}/vs/${encodeDuelSlug(a, b)}`;

/** S5 "나도 뽑아보기": 방금 본 카드의 씨앗 프리필로 온보딩을 건너뛰고 슬롯 직행 (R9) */
export const prefillSpinUrl = (payload: CardPayload): string =>
  `/slot?seed=${encodeURIComponent(payload.seedId)}&label=${encodeURIComponent(payload.seedLabel)}&track=${payload.track}&via=vote`;
