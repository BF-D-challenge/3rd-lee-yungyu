import { encodePraiseRequest, type PraiseRequestCard } from "./praise-share";
import {
  createFeedbackAccess,
  isFeedbackOwnerAccess,
  writeAccessFrom,
  type FeedbackOwnerAccess,
} from "./feedback-access";

const STORAGE_PREFIX = "oneul:idea-revisions:v1:";
const MAX_TEXT_LENGTH = 600;

export interface IdeaRevision {
  id: string;
  requestId: string;
  slug: string;
  originRequestId: string;
  parentRequestId: string;
  version: number;
  uvp: string;
  difference: string;
  createdAt: number;
  feedback?: FeedbackOwnerAccess;
}

export interface IdeaRevisionHistory {
  v: 1;
  originRequestId: string;
  originSlug: string;
  originCard: PraiseRequestCard;
  originReadToken?: string;
  revisions: IdeaRevision[];
}

const keyFor = (originRequestId: string) => `${STORAGE_PREFIX}${originRequestId}`;
const clean = (value: string) => value.trim().slice(0, MAX_TEXT_LENGTH);
const newId = () => (
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `revision-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const withoutRevisionMeta = (card: PraiseRequestCard): PraiseRequestCard => {
  return {
    v: card.v,
    id: card.id,
    title: card.title,
    summary: card.summary,
    smallestBuild: card.smallestBuild,
    source: card.source,
    payer: card.payer,
    moment: card.moment,
    twist: card.twist,
    flow: card.flow,
    feedback: card.feedback,
    createdAt: card.createdAt,
  };
};

const isCard = (value: unknown): value is PraiseRequestCard => {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<PraiseRequestCard>;
  return card.v === 1
    && typeof card.id === "string"
    && typeof card.title === "string"
    && typeof card.summary === "string"
    && typeof card.smallestBuild === "string"
    && typeof card.source === "string"
    && typeof card.twist === "string"
    && typeof card.createdAt === "number";
};

const isRevision = (value: unknown): value is IdeaRevision => {
  if (!value || typeof value !== "object") return false;
  const revision = value as Partial<IdeaRevision>;
  return typeof revision.id === "string"
    && typeof revision.requestId === "string"
    && typeof revision.slug === "string"
    && typeof revision.originRequestId === "string"
    && typeof revision.parentRequestId === "string"
    && typeof revision.version === "number"
    && Number.isInteger(revision.version)
    && revision.version > 0
    && typeof revision.uvp === "string"
    && typeof revision.difference === "string"
    && (revision.feedback === undefined || isFeedbackOwnerAccess(revision.feedback))
    && typeof revision.createdAt === "number";
};

export function loadIdeaRevisionHistory(originRequestId: string): IdeaRevisionHistory | null {
  if (typeof window === "undefined" || !originRequestId) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(originRequestId)) ?? "null") as Partial<IdeaRevisionHistory>;
    if (
      parsed?.v !== 1
      || parsed.originRequestId !== originRequestId
      || typeof parsed.originSlug !== "string"
      || !isCard(parsed.originCard)
      || !Array.isArray(parsed.revisions)
    ) return null;
    return {
      v: 1,
      originRequestId,
      originSlug: parsed.originSlug,
      originCard: parsed.originCard,
      ...(typeof parsed.originReadToken === "string" ? { originReadToken: parsed.originReadToken } : {}),
      revisions: parsed.revisions.filter(isRevision),
    };
  } catch {
    return null;
  }
}

const saveHistory = (history: IdeaRevisionHistory) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(keyFor(history.originRequestId), JSON.stringify(history)); } catch { /* optional storage */ }
};

export function revisionCardFrom(baseCard: PraiseRequestCard, revision: IdeaRevision): PraiseRequestCard {
  return {
    ...baseCard,
    id: revision.requestId,
    summary: revision.uvp,
    smallestBuild: revision.uvp,
    twist: revision.difference,
    createdAt: revision.createdAt,
    originRequestId: revision.originRequestId,
    revisionId: revision.id,
    version: revision.version,
    parentRequestId: revision.parentRequestId,
    ...(revision.feedback ? { feedback: writeAccessFrom(revision.feedback) } : {}),
  };
}

export function saveIdeaRevision(
  baseCard: PraiseRequestCard,
  values: { uvp: string; difference: string },
  now = Date.now(),
  baseReadToken?: string,
): { revision: IdeaRevision; card: PraiseRequestCard; history: IdeaRevisionHistory } {
  const originRequestId = baseCard.originRequestId ?? baseCard.id;
  const existing = loadIdeaRevisionHistory(originRequestId);
  const originCard = existing?.originCard ?? withoutRevisionMeta(baseCard);
  const history: IdeaRevisionHistory = existing ?? {
    v: 1,
    originRequestId,
    originSlug: encodePraiseRequest(originCard),
    originCard,
    ...(baseReadToken ? { originReadToken: baseReadToken } : {}),
    revisions: [],
  };
  const feedback = createFeedbackAccess();
  const revision: IdeaRevision = {
    id: newId(),
    requestId: newId(),
    slug: "",
    originRequestId,
    parentRequestId: baseCard.id,
    version: Math.max(0, ...history.revisions.map((item) => item.version)) + 1,
    uvp: clean(values.uvp),
    difference: clean(values.difference),
    createdAt: now,
    feedback,
  };
  const card = revisionCardFrom(originCard, revision);
  revision.slug = encodePraiseRequest(card);
  history.revisions = [...history.revisions, revision];
  saveHistory(history);
  return { revision, card, history };
}

export function clearIdeaRevisionHistory(originRequestId: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(keyFor(originRequestId)); } catch { /* optional storage */ }
}
