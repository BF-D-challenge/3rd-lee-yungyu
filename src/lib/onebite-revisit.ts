export const ONEBITE_COMMIT_KEY = "onebite:next-meal-commit:v1";
export const ONEBITE_HISTORY_KEY = "onebite:action-history:v1";

export type OnebiteSavedCommit = {
  actionCode: string;
  actionLine: string;
  savedAt: string;
};

export type OnebiteExecutionStatus = "done" | "not_done";

export type OnebiteExecutionRecord = {
  id: string;
  actionCode: string;
  actionLine: string;
  status: OnebiteExecutionStatus;
  recordedAt: string;
  nextMealSubmittedAt: string;
};

const isString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export function parseOnebiteSavedCommit(raw: string | null): OnebiteSavedCommit | null {
  try {
    const saved = JSON.parse(raw ?? "null") as Partial<OnebiteSavedCommit> | null;
    if (
      !isString(saved?.actionCode)
      || !isString(saved.actionLine)
      || !isString(saved.savedAt)
    ) return null;
    return {
      actionCode: saved.actionCode,
      actionLine: saved.actionLine,
      savedAt: saved.savedAt,
    };
  } catch {
    return null;
  }
}

function isExecutionRecord(value: unknown): value is OnebiteExecutionRecord {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<OnebiteExecutionRecord>;
  return (
    isString(item.id)
    && isString(item.actionCode)
    && isString(item.actionLine)
    && (item.status === "done" || item.status === "not_done")
    && isString(item.recordedAt)
    && isString(item.nextMealSubmittedAt)
  );
}

export function parseOnebiteExecutionHistory(
  raw: string | null,
): OnebiteExecutionRecord[] {
  try {
    const parsed = JSON.parse(raw ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isExecutionRecord)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function upsertOnebiteExecutionRecord(
  history: OnebiteExecutionRecord[],
  record: OnebiteExecutionRecord,
): { history: OnebiteExecutionRecord[]; inserted: boolean } {
  const inserted = !history.some((item) => item.id === record.id);
  const next = [
    record,
    ...history.filter((item) => item.id !== record.id),
  ]
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 20);
  return { history: next, inserted };
}

export function loadOnebiteSavedCommit(): OnebiteSavedCommit | null {
  if (typeof window === "undefined") return null;
  try {
    return parseOnebiteSavedCommit(localStorage.getItem(ONEBITE_COMMIT_KEY));
  } catch {
    return null;
  }
}

export function saveOnebiteSavedCommit(commit: OnebiteSavedCommit): void {
  localStorage.setItem(ONEBITE_COMMIT_KEY, JSON.stringify(commit));
}

export function loadOnebiteExecutionHistory(): OnebiteExecutionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return parseOnebiteExecutionHistory(localStorage.getItem(ONEBITE_HISTORY_KEY));
  } catch {
    return [];
  }
}

export function saveOnebiteExecutionRecord(
  record: OnebiteExecutionRecord,
): { history: OnebiteExecutionRecord[]; inserted: boolean } {
  const previous = loadOnebiteExecutionHistory();
  const next = upsertOnebiteExecutionRecord(previous, record);
  localStorage.setItem(ONEBITE_HISTORY_KEY, JSON.stringify(next.history));
  return next;
}
