import type { IdeaLabSharePayload } from "@/components/organisms/idea-lab";
import { decodeBinaryBase64Url, encodeBinaryBase64Url } from "./base64-url";

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
}
export interface SavedPraiseRequest {
  slug: string;
  card: PraiseRequestCard;
  prompt: string;
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
  return {
    v: 1,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`,
    title: payload.title,
    summary: payload.summary,
    smallestBuild: payload.selection.twist.smallestBuild,
    source: `${payload.selection.source.sourceName} — ${payload.selection.source.value}`,
    payer: payload.selection.payer.value,
    moment: payload.selection.moment.value,
    twist: payload.selection.twist.detail,
    flow: `${payload.selection.source.preservedFlow} → ${payload.selection.twist.resultTitle}`,
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
      typeof value.createdAt !== "number"
    ) return null;
    return value as PraiseRequestCard;
  } catch {
    return null;
  }
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
