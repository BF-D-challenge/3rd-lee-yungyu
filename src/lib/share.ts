// v4는 백엔드 없이 URL 자체가 데이터 캐리어다 (Supabase는 3주차, R21).
import type { Combo } from "./draw";
import { formatById, painById, type Track } from "./combos";
import { decodeBinaryBase64Url, encodeBinaryBase64Url } from "./base64-url";

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
  /** v7 필드 — 수신자 카드에 전파. 투표자 설득용(브랜드명·근거)만; mvp/buildPrompt는 빌더 전용이라 제외(URL 길이도 절약) */
  appName?: string | null;
  evidence?: string | null;
  fromName?: string;
  /** 이 카드를 만든 다중 취향 중 직접 사용한 항목. 응원 후 같은 방향으로 이어갈 때 사용한다. */
  preferenceId?: string;
}

export const toPayload = (c: Combo, fromName?: string, preferenceId?: string): CardPayload => ({
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
  appName: c.appName,
  evidence: c.evidence,
  ...(fromName ? { fromName } : {}),
  ...(preferenceId ? { preferenceId } : {}),
});

export function encodeSlug(payload: CardPayload): string {
  const json = JSON.stringify(payload);
  return encodeBinaryBase64Url(encodeURIComponent(json));
}

export function decodeSlug(slug: string): CardPayload | null {
  try {
    const payload = JSON.parse(decodeURIComponent(decodeBinaryBase64Url(slug))) as CardPayload;
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
  roundId?: string;
  parentRoundId?: string | null;
  rootRoundId?: string;
  preferenceIds?: string[];
}

export interface RoundMeta {
  roundId: string;
  parentRoundId?: string | null;
  rootRoundId: string;
  preferenceIds?: string[];
}

const DUEL_VERSION = 2;

/** decodeSlug와 같은 최소 무결성: 참조 데이터가 실제로 존재해야 렌더 가능 */
const isRenderable = (p: CardPayload | undefined): p is CardPayload =>
  Boolean(p && p.seedLabel && painById(p.painId) && formatById(p.formatId));

export function encodeDuelSlug(a: CardPayload, b: CardPayload, meta?: RoundMeta): string {
  const json = JSON.stringify(meta ? { v: DUEL_VERSION, a, b, ...meta } : { v: 1, a, b });
  return encodeBinaryBase64Url(encodeURIComponent(json));
}

export function decodeDuelSlug(slug: string): DuelPayload | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(decodeBinaryBase64Url(slug))) as {
      v?: number;
      a?: CardPayload;
      b?: CardPayload;
      roundId?: string;
      parentRoundId?: string | null;
      rootRoundId?: string;
      preferenceIds?: string[];
    };
    if ((parsed.v !== 1 && parsed.v !== DUEL_VERSION) || !isRenderable(parsed.a) || !isRenderable(parsed.b)) return null;
    if (parsed.v === DUEL_VERSION && (!parsed.roundId || !parsed.rootRoundId)) return null;
    return {
      a: parsed.a,
      b: parsed.b,
      ...(parsed.roundId ? { roundId: parsed.roundId } : {}),
      ...(parsed.parentRoundId !== undefined ? { parentRoundId: parsed.parentRoundId } : {}),
      ...(parsed.rootRoundId ? { rootRoundId: parsed.rootRoundId } : {}),
      ...(Array.isArray(parsed.preferenceIds)
        ? { preferenceIds: parsed.preferenceIds.filter((value): value is string => typeof value === "string") }
        : {}),
    };
  } catch {
    return null;
  }
}

export const duelUrl = (a: CardPayload, b: CardPayload, meta?: RoundMeta): string =>
  `${location.origin}/vs/${encodeDuelSlug(a, b, meta)}`;

/** S5 "나도 뽑아보기": 방금 본 카드의 씨앗 프리필로 온보딩을 건너뛰고 슬롯 직행 (R9) */
export const prefillSpinUrl = (
  payload: CardPayload,
  context?: { originRoundId?: string; rootRoundId?: string; preferenceIds?: string[] },
): string => {
  const params = new URLSearchParams({
    seed: payload.seedId,
    label: payload.seedLabel,
    track: payload.track,
    via: "vote",
  });
  if (payload.preferenceId) params.set("preference", payload.preferenceId);
  if (context?.originRoundId) params.set("origin_round_id", context.originRoundId);
  if (context?.rootRoundId) params.set("root_round_id", context.rootRoundId);
  if (context?.preferenceIds?.length) params.set("preferences", context.preferenceIds.join(","));
  return `/?${params.toString()}`;
};

// ── 네이티브 공유시트 (Web Share API) — 카톡/문자/에어드롭 등 선택 가능, 미지원 시 클립보드 폴백 ──
// K(바이럴 계수) 측정 정의:
//   실전달률 = public_card_view ÷ confirm_share_click (native 방식일 때만 신뢰 — clipboard는 실제 전달 불확실)
//   응원율   = card_vote ÷ public_card_view
//   재뽑기전환 = vote_to_spin ÷ card_vote

export async function shareOrCopy(
  url: string,
  opts?: { title?: string; text?: string },
): Promise<{ ok: boolean; method: "native" | "clipboard" }> {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ url, title: opts?.title, text: opts?.text });
      return { ok: true, method: "native" };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return { ok: false, method: "native" };
      // 다른 에러(권한 없음 등)는 클립보드 폴백으로 넘어간다
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return { ok: true, method: "clipboard" };
  } catch {
    return { ok: false, method: "clipboard" };
  }
}
