import { track } from "./track";

const OPENER_KEY = "oneul:opener-key";
const OPENED_PREFIX = "oneul:round-opened:";

export type GrowthEvent =
  | "share_sheet_opened"
  | "round_opened"
  | "auth_completed"
  | "praise_sent"
  | "own_flow_started"
  | "two_cards_completed"
  | "two_cards_redrawn"
  | "round_shared";

export const newRoundId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `round-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function openerKey(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = localStorage.getItem(OPENER_KEY);
    if (existing) return existing;
    const value = newRoundId();
    localStorage.setItem(OPENER_KEY, value);
    return value;
  } catch {
    return "anonymous";
  }
}

export function legacyRoundId(slug: string): string {
  let hash = 2166136261;
  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `legacy-${(hash >>> 0).toString(36)}`;
}

export const trackGrowth = (event: GrowthEvent, params: Record<string, unknown> = {}) =>
  track(event, { occurred_at: new Date().toISOString(), ...params });

export function trackUniqueRoundOpened(params: {
  roundId: string;
  rootRoundId: string;
  parentRoundId?: string | null;
}): boolean {
  const opener = openerKey();
  const key = `${OPENED_PREFIX}${params.roundId}:${opener}`;
  try {
    if (localStorage.getItem(key) === "1") return false;
    localStorage.setItem(key, "1");
  } catch {
    // Storage-blocked sessions may be over-counted locally; backend dedupe remains authoritative.
  }
  trackGrowth("round_opened", {
    round_id: params.roundId,
    origin_round_id: params.roundId,
    parent_round_id: params.parentRoundId ?? null,
    root_round_id: params.rootRoundId,
    opener_key: opener,
  });
  return true;
}
