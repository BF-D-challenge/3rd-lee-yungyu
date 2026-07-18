import type { IdeaLabSharePayload } from "@/components/organisms/idea-lab";
import { decodeBinaryBase64Url, encodeBinaryBase64Url } from "./base64-url";
import {
  createFeedbackAccess,
  isFeedbackOwnerAccess,
  isFeedbackWriteAccess,
  writeAccessFrom,
  type FeedbackOwnerAccess,
  type FeedbackWriteAccess,
} from "./feedback-access";
import {
  normalizeIdeaBuild,
  normalizeIdeaDifference,
  normalizeIdeaFlow,
  normalizeIdeaSource,
} from "./idea-copy";

const PLATFORM_LABELS = {
  web: "웹",
  app: "앱",
  extension: "확장 프로그램",
  plugin: "플러그인",
} as const;

export interface PraiseRequestCard {
  v: 1;
  id: string;
  title: string;
  summary: string;
  smallestBuild: string;
  source: string;
  payer?: string;
  moment?: string;
  twist: string;
  flow?: string;
  createdAt: number;
  /** v1 링크에는 없을 수 있는 수정본 연결 정보 */
  originRequestId?: string;
  revisionId?: string;
  version?: number;
  parentRequestId?: string;
  /** 공유받은 사람에게 허용된 응원 쓰기 capability. */
  feedback?: FeedbackWriteAccess;
}
export interface SavedPraiseRequest {
  slug: string;
  card: PraiseRequestCard;
  prompt: string;
  /** 소유자만 로컬에 보관하며 공유 URL에는 포함하지 않는다. */
  feedbackReadToken?: string;
}

const LATEST_KEY = "oneul:latest-praise-request:v1";

const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return encodeBinaryBase64Url(binary);
};

const fromBase64Url = (value: string): string => {
  const binary = decodeBinaryBase64Url(value);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};

export function praiseRequestFromIdea(payload: IdeaLabSharePayload): PraiseRequestCard {
  const platform = PLATFORM_LABELS[payload.selection.twist.platform];
  const flow = normalizeIdeaFlow(payload.selection.source.preservedFlow);
  return {
    v: 1,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
    title: payload.title,
    summary: payload.summary,
    smallestBuild: normalizeIdeaBuild(payload.selection.twist.smallestBuild, platform),
    source: `${payload.selection.source.sourceName} — ${normalizeIdeaSource(payload.selection.source.value)}`,
    payer: payload.selection.payer.value,
    moment: payload.selection.moment.value,
    twist: normalizeIdeaDifference(payload.selection.twist.detail),
    flow: `${flow.join(" → ")} → ${payload.selection.twist.resultTitle}`,
    createdAt: Date.now(),
  };
}

export const encodePraiseRequest = (card: PraiseRequestCard): string => toBase64Url(JSON.stringify(card));

export function decodePraiseRequest(slug: string): PraiseRequestCard | null {
  try {
    const value = JSON.parse(fromBase64Url(slug)) as Partial<PraiseRequestCard>;
    if (
      value.v !== 1 ||
      typeof value.id !== "string" ||
      typeof value.title !== "string" ||
      typeof value.summary !== "string" ||
      typeof value.smallestBuild !== "string" ||
      typeof value.source !== "string" ||
      (value.payer !== undefined && typeof value.payer !== "string") ||
      (value.moment !== undefined && typeof value.moment !== "string") ||
      typeof value.twist !== "string" ||
      (value.flow !== undefined && typeof value.flow !== "string") ||
      (value.originRequestId !== undefined && typeof value.originRequestId !== "string") ||
      (value.revisionId !== undefined && typeof value.revisionId !== "string") ||
      (value.version !== undefined && (!Number.isInteger(value.version) || value.version < 1)) ||
      (value.parentRequestId !== undefined && typeof value.parentRequestId !== "string") ||
      (value.feedback !== undefined && !isFeedbackWriteAccess(value.feedback)) ||
      typeof value.createdAt !== "number"
    ) return null;
    return value as PraiseRequestCard;
  } catch {
    return null;
  }
}

export function secureSavedPraiseRequest(
  value: SavedPraiseRequest,
  access: FeedbackOwnerAccess = createFeedbackAccess(),
): SavedPraiseRequest {
  if (
    value.card.feedback
    && value.feedbackReadToken
    && isFeedbackOwnerAccess({ ...value.card.feedback, readToken: value.feedbackReadToken })
  ) return value;
  const card = { ...value.card, feedback: writeAccessFrom(access) };
  return {
    ...value,
    slug: encodePraiseRequest(card),
    card,
    feedbackReadToken: access.readToken,
  };
}

export function praiseOwnerAccess(
  value: Pick<SavedPraiseRequest, "card" | "feedbackReadToken">,
): FeedbackOwnerAccess | null {
  const access = value.card.feedback && value.feedbackReadToken
    ? { ...value.card.feedback, readToken: value.feedbackReadToken }
    : null;
  return isFeedbackOwnerAccess(access) ? access : null;
}

export function saveLatestPraiseRequest(value: SavedPraiseRequest): void {
  try { localStorage.setItem(LATEST_KEY, JSON.stringify(value)); } catch { /* optional storage */ }
}

export function loadLatestPraiseRequest(): SavedPraiseRequest | null {
  try {
    const value = JSON.parse(localStorage.getItem(LATEST_KEY) ?? "null") as SavedPraiseRequest | null;
    return value?.slug && value.card?.v === 1 ? value : null;
  } catch {
    return null;
  }
}

export const praiseRequestPath = (slug: string): string => `/praise/${slug}`;
