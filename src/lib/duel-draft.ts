import type { DuelPraiseId, DuelSide } from "./storage";

const keyFor = (slug: string) => `oneul:duel-draft:v1:${slug}`;

export interface DuelDraft {
  side: DuelSide;
  praise: DuelPraiseId | null;
  updatedAt: number;
}

export function loadDuelDraft(slug: string): DuelDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(slug)) ?? "null") as Partial<DuelDraft> | null;
    if (!value || (value.side !== "a" && value.side !== "b")) return null;
    if (value.praise !== null && value.praise !== "need" && value.praise !== "notify" && value.praise !== "cheer") {
      return null;
    }
    return {
      side: value.side,
      praise: value.praise ?? null,
      updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export function saveDuelDraft(slug: string, side: DuelSide, praise: DuelPraiseId | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(slug), JSON.stringify({ side, praise, updatedAt: Date.now() } satisfies DuelDraft));
  } catch {
    // Voting still works when browser storage is unavailable; only reload restoration is lost.
  }
}
