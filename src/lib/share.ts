// v4는 백엔드 없이 URL 자체가 데이터 캐리어다 (Supabase는 3주차, R21).
import type { Combo } from "./draw";
import { formatById, painById, type Track } from "./combos";
import { decodeBinaryBase64Url, encodeBinaryBase64Url } from "./base64-url";
import { isFeedbackWriteAccess, type FeedbackWriteAccess } from "./feedback-access";

const MAX_SHARE_SLUG_LENGTH = 16_384;
const MAX_SHORT_TEXT_LENGTH = 256;
const MAX_LONG_TEXT_LENGTH = 2_000;
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown, max = MAX_SHORT_TEXT_LENGTH): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
const isOptionalText = (value: unknown, max = MAX_SHORT_TEXT_LENGTH): value is string | undefined =>
  value === undefined || (typeof value === "string" && value.length <= max);
const isNullableText = (value: unknown, max = MAX_LONG_TEXT_LENGTH): value is string | null =>
  value === null || (typeof value === "string" && value.length <= max);

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
  /** 수신자는 이 쓰기 capability만 받는다. 소유자 읽기 토큰은 URL에 넣지 않는다. */
  feedback?: FeedbackWriteAccess;
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

const isCardPayload = (value: unknown): value is CardPayload => {
  if (!isObject(value)) return false;
  return (
    isText(value.seedId)
    && isText(value.seedLabel)
    && (value.track === "like" || value.track === "know")
    && Number.isInteger(value.painId)
    && typeof value.painId === "number"
    && Boolean(painById(value.painId))
    && isText(value.formatId)
    && Boolean(formatById(value.formatId))
    && isNullableText(value.title)
    && isNullableText(value.oneliner)
    && isText(value.target, MAX_LONG_TEXT_LENGTH)
    && isText(value.situation, MAX_LONG_TEXT_LENGTH)
    && isText(value.psych, MAX_LONG_TEXT_LENGTH)
    && isOptionalText(value.appName)
    && isOptionalText(value.evidence, MAX_LONG_TEXT_LENGTH)
    && isOptionalText(value.fromName)
    && isOptionalText(value.preferenceId)
    && (value.feedback === undefined || isFeedbackWriteAccess(value.feedback))
  );
};

export function encodeSlug(payload: CardPayload): string {
  const json = JSON.stringify(payload);
  return encodeBinaryBase64Url(encodeURIComponent(json));
}

export function decodeSlug(slug: string): CardPayload | null {
  try {
    if (!slug || slug.length > MAX_SHARE_SLUG_LENGTH) return null;
    const payload = JSON.parse(decodeURIComponent(decodeBinaryBase64Url(slug))) as unknown;
    if (!isCardPayload(payload)) return null;
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
  feedback?: FeedbackWriteAccess;
}

export interface RoundMeta {
  roundId: string;
  parentRoundId?: string | null;
  rootRoundId: string;
  preferenceIds?: string[];
  feedback?: FeedbackWriteAccess;
}

const DUEL_VERSION = 2;

/** decodeSlug와 같은 최소 무결성: 참조 데이터가 실제로 존재해야 렌더 가능 */
const isRenderable = (value: unknown): value is CardPayload => isCardPayload(value);

export function encodeDuelSlug(a: CardPayload, b: CardPayload, meta?: RoundMeta): string {
  // 대결 링크에는 대결용 쓰기 권한만 넣고, 원본 카드의 별도 쓰기 권한은 노출하지 않는다.
  const safeA = { ...a };
  const safeB = { ...b };
  delete safeA.feedback;
  delete safeB.feedback;
  const json = JSON.stringify(meta ? { v: DUEL_VERSION, a: safeA, b: safeB, ...meta } : { v: 1, a: safeA, b: safeB });
  return encodeBinaryBase64Url(encodeURIComponent(json));
}

export function decodeDuelSlug(slug: string): DuelPayload | null {
  try {
    if (!slug || slug.length > MAX_SHARE_SLUG_LENGTH) return null;
    const parsed = JSON.parse(decodeURIComponent(decodeBinaryBase64Url(slug))) as {
      v?: number;
      a?: CardPayload;
      b?: CardPayload;
      roundId?: string;
      parentRoundId?: string | null;
      rootRoundId?: string;
      preferenceIds?: string[];
      feedback?: FeedbackWriteAccess;
    };
    if ((parsed.v !== 1 && parsed.v !== DUEL_VERSION) || !isRenderable(parsed.a) || !isRenderable(parsed.b)) return null;
    if (
      parsed.v === DUEL_VERSION
      && (!isText(parsed.roundId) || !isText(parsed.rootRoundId))
    ) return null;
    if (!isOptionalText(parsed.parentRoundId ?? undefined)) return null;
    if (
      parsed.preferenceIds !== undefined
      && (
        !Array.isArray(parsed.preferenceIds)
        || parsed.preferenceIds.length > 32
        || !parsed.preferenceIds.every((value) => isText(value))
      )
    ) return null;
    if (parsed.feedback !== undefined && !isFeedbackWriteAccess(parsed.feedback)) return null;
    const safeA = { ...parsed.a };
    const safeB = { ...parsed.b };
    delete safeA.feedback;
    delete safeB.feedback;
    return {
      a: safeA,
      b: safeB,
      ...(parsed.roundId ? { roundId: parsed.roundId } : {}),
      ...(parsed.parentRoundId !== undefined ? { parentRoundId: parsed.parentRoundId } : {}),
      ...(parsed.rootRoundId ? { rootRoundId: parsed.rootRoundId } : {}),
      ...(Array.isArray(parsed.preferenceIds)
        ? { preferenceIds: parsed.preferenceIds }
        : {}),
      ...(parsed.feedback ? { feedback: parsed.feedback } : {}),
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
