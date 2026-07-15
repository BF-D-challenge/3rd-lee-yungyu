/**
 * 실제로 받은 익명 칭찬을 하루 한 장씩 보여주기 위한 순수 데이터 모델.
 *
 * 이 모듈은 저장소를 소유하지 않는다. localStorage, 네트워크, Date.now(), 데모 시드에
 * 접근하지 않으며 호출자가 전달한 실제 record만 계산한다.
 */

export type PraiseTimestamp = number | Date;
export type SenderRevealConsent = "named" | "forever-anonymous" | "after-30d";

export interface PraiseCardRecord {
  id: string;
  message: string;
  senderRevealConsent: SenderRevealConsent;
  senderName?: string;
  ideaTitle?: string;
  receivedAt: number;
  /** 이 카드가 배정된 현지 날짜의 시작 시각. buildDailyPraiseSchedule이 충돌을 정리한다. */
  availableAt: number;
}

export type SenderIdentityState =
  | { status: "forever-anonymous"; displayName: null; revealAt: null }
  | { status: "name-not-provided"; displayName: null; revealAt: null }
  | { status: "locked"; displayName: null; revealAt: number }
  | { status: "revealed"; displayName: string; revealAt: number };

export interface TodayPraiseCard {
  id: string;
  message: string;
  ideaTitle?: string;
  receivedAt: number;
  availableAt: number;
  sender: SenderIdentityState;
}

/** 잠금 카드에는 칭찬 문구와 보낸 사람 정보를 절대 포함하지 않는다. */
export interface LockedPraiseCard {
  id: string;
  availableAt: number;
  queuePosition: number;
}

export type PraiseCardsStateKind = "empty" | "today" | "waiting" | "caught-up";

export interface PraiseCardsState {
  kind: PraiseCardsStateKind;
  localDateKey: string;
  today: TodayPraiseCard | null;
  next: LockedPraiseCard | null;
  queue: LockedPraiseCard[];
  historyCount: number;
  totalCount: number;
}

export interface VoteToPraiseOptions {
  /** DB 행 ID처럼 실제 저장층에서 온 안정적인 ID를 전달한다. */
  id: string;
  /** 생략하면 응원을 받은 현지 날짜에 먼저 배정하고, 일별 스케줄 함수가 충돌을 뒤로 민다. */
  availableAt?: PraiseTimestamp;
  /** 이전 응원 payload에 아이디어 제목이 없을 때 공유 요청 제목을 보완한다. */
  ideaTitle?: string;
}

const SUPPORT_PREFIX = "support:v1:";
const MAX_ID_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 280;
const MAX_SENDER_NAME_LENGTH = 40;
const MAX_IDEA_TITLE_LENGTH = 120;
const REVEAL_AFTER_DAYS = 30;

const asTimestamp = (value: PraiseTimestamp): number => value instanceof Date ? value.getTime() : value;
const finiteTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const plainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cleanText = (value: string, maxLength: number): string =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, maxLength);

/** 런타임의 현지 달력 기준 YYYY-MM-DD 키. */
export function localDateKey(value: PraiseTimestamp): string {
  const date = new Date(asTimestamp(value));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 런타임의 현지 시간대에서 해당 날짜 00:00의 timestamp. DST가 있어도 달력 날짜를 보존한다. */
export function startOfLocalDay(value: PraiseTimestamp): number {
  const date = new Date(asTimestamp(value));
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** 밀리초를 더하지 않고 현지 달력의 날짜를 이동한다. */
export function addLocalDays(value: PraiseTimestamp, days: number): number {
  const date = new Date(startOfLocalDay(value));
  date.setDate(date.getDate() + Math.trunc(days));
  return date.getTime();
}

export function isSameLocalDay(a: PraiseTimestamp, b: PraiseTimestamp): boolean {
  return localDateKey(a) === localDateKey(b);
}

export function isPraiseCardRecord(value: unknown): value is PraiseCardRecord {
  if (!plainObject(value)) return false;
  if (typeof value.id !== "string" || cleanText(value.id, MAX_ID_LENGTH).length === 0) return false;
  if (typeof value.message !== "string" || cleanText(value.message, MAX_MESSAGE_LENGTH).length === 0) return false;
  if (
    value.senderRevealConsent !== "named" &&
    value.senderRevealConsent !== "after-30d" &&
    value.senderRevealConsent !== "forever-anonymous"
  ) return false;
  if (value.senderName !== undefined && typeof value.senderName !== "string") return false;
  if (value.ideaTitle !== undefined && typeof value.ideaTitle !== "string") return false;
  return finiteTimestamp(value.receivedAt) && finiteTimestamp(value.availableAt);
}

const sanitizeRecord = (record: PraiseCardRecord): PraiseCardRecord => {
  const senderName = record.senderName ? cleanText(record.senderName, MAX_SENDER_NAME_LENGTH) : "";
  const ideaTitle = record.ideaTitle ? cleanText(record.ideaTitle, MAX_IDEA_TITLE_LENGTH) : "";
  return {
    id: cleanText(record.id, MAX_ID_LENGTH),
    message: cleanText(record.message, MAX_MESSAGE_LENGTH),
    senderRevealConsent: record.senderRevealConsent,
    ...(record.senderRevealConsent !== "forever-anonymous" && senderName ? { senderName } : {}),
    ...(ideaTitle ? { ideaTitle } : {}),
    receivedAt: record.receivedAt,
    availableAt: record.availableAt,
  };
};

/**
 * 실제 record만 남기고 중복 ID는 첫 record 하나만 보존한다.
 * 잘못된 입력을 가짜 빈 카드로 대체하지 않는다.
 */
export function sanitizePraiseRecords(values: readonly unknown[]): PraiseCardRecord[] {
  const seen = new Set<string>();
  const result: PraiseCardRecord[] = [];
  values.forEach((value) => {
    if (!isPraiseCardRecord(value)) return;
    const record = sanitizeRecord(value);
    if (seen.has(record.id)) return;
    seen.add(record.id);
    result.push(record);
  });
  return result;
}

/**
 * 받은 순서대로 현지 날짜를 하루씩 배정한다. 여러 record의 availableAt이 같은 날짜여도
 * 두 번째 이후 카드는 다음 현지 날짜로 밀려 하루 한 장 규칙을 지킨다.
 */
export function buildDailyPraiseSchedule(values: readonly unknown[]): PraiseCardRecord[] {
  const records = sanitizePraiseRecords(values).sort(
    (a, b) => a.receivedAt - b.receivedAt || a.availableAt - b.availableAt || a.id.localeCompare(b.id),
  );
  let previousDay: number | null = null;
  return records.map((record) => {
    const earliestDay = Math.max(startOfLocalDay(record.receivedAt), startOfLocalDay(record.availableAt));
    const availableAt = previousDay === null ? earliestDay : Math.max(earliestDay, addLocalDays(previousDay, 1));
    previousDay = availableAt;
    return { ...record, availableAt };
  });
}

export function getSenderIdentityState(record: PraiseCardRecord, now: PraiseTimestamp): SenderIdentityState {
  if (record.senderRevealConsent === "forever-anonymous") {
    return { status: "forever-anonymous", displayName: null, revealAt: null };
  }
  const senderName = record.senderName ? cleanText(record.senderName, MAX_SENDER_NAME_LENGTH) : "";
  if (!senderName) return { status: "name-not-provided", displayName: null, revealAt: null };
  if (record.senderRevealConsent === "named") {
    return { status: "revealed", displayName: senderName, revealAt: record.receivedAt };
  }
  const revealAt = addLocalDays(record.receivedAt, REVEAL_AFTER_DAYS);
  if (asTimestamp(now) < revealAt) return { status: "locked", displayName: null, revealAt };
  return { status: "revealed", displayName: senderName, revealAt };
}

const toTodayCard = (record: PraiseCardRecord, now: PraiseTimestamp): TodayPraiseCard => ({
  id: record.id,
  message: record.message,
  ...(record.ideaTitle ? { ideaTitle: record.ideaTitle } : {}),
  receivedAt: record.receivedAt,
  availableAt: record.availableAt,
  sender: getSenderIdentityState(record, now),
});

export function getTodayPraiseCard(values: readonly unknown[], now: PraiseTimestamp): TodayPraiseCard | null {
  const todayStart = startOfLocalDay(now);
  const record = buildDailyPraiseSchedule(values)
    .filter((item) => item.availableAt <= todayStart)
    .at(-1);
  return record ? toTodayCard(record, now) : null;
}

export function getPraiseQueue(values: readonly unknown[], now: PraiseTimestamp): LockedPraiseCard[] {
  const todayStart = startOfLocalDay(now);
  return buildDailyPraiseSchedule(values)
    .filter((record) => record.availableAt > todayStart)
    .map((record, index) => ({ id: record.id, availableAt: record.availableAt, queuePosition: index + 1 }));
}

export function getNextLockedPraiseCard(values: readonly unknown[], now: PraiseTimestamp): LockedPraiseCard | null {
  return getPraiseQueue(values, now)[0] ?? null;
}

export function getPraiseCardsState(values: readonly unknown[], now: PraiseTimestamp): PraiseCardsState {
  const scheduled = buildDailyPraiseSchedule(values);
  const todayStart = startOfLocalDay(now);
  // 한 번 무료로 열린 카드는 다음 카드가 열릴 때까지 현재 카드로 남긴다.
  // 그래야 큐가 비어도 마지막으로 도착한 응원이 사라지지 않는다.
  const todayRecord = scheduled.filter((record) => record.availableAt <= todayStart).at(-1) ?? null;
  const queue = scheduled
    .filter((record) => record.availableAt > todayStart)
    .map((record, index) => ({ id: record.id, availableAt: record.availableAt, queuePosition: index + 1 }));
  const today = todayRecord ? toTodayCard(todayRecord, now) : null;
  const next = queue[0] ?? null;
  const totalCount = scheduled.length;
  const historyCount = todayRecord
    ? scheduled.filter((record) => record.availableAt < todayRecord.availableAt).length
    : 0;
  const kind: PraiseCardsStateKind = totalCount === 0 ? "empty" : today ? "today" : next ? "waiting" : "caught-up";
  return {
    kind,
    localDateKey: localDateKey(now),
    today,
    next,
    queue,
    historyCount,
    totalCount,
  };
}

/**
 * 기존 Vote.comment의 support:v1 JSON을 런타임에서 검증해 PraiseCardRecord로 변환한다.
 * 일반 comment, 손상 JSON, 빈 칭찬, 잘못된 공개 설정은 null이며 임의의 칭찬을 만들지 않는다.
 */
export function praiseRecordFromVote(vote: unknown, options: VoteToPraiseOptions): PraiseCardRecord | null {
  if (!plainObject(vote) || !finiteTimestamp(vote.at) || typeof vote.comment !== "string") return null;
  if (!vote.comment.startsWith(SUPPORT_PREFIX)) return null;
  const id = cleanText(options.id, MAX_ID_LENGTH);
  if (!id) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(vote.comment.slice(SUPPORT_PREFIX.length));
  } catch {
    return null;
  }
  if (!plainObject(parsed) || parsed.v !== 1 || typeof parsed.praise !== "string") return null;
  if (
    parsed.reveal !== "named" &&
    parsed.reveal !== "after-30d" &&
    parsed.reveal !== "forever-anonymous"
  ) return null;
  if (parsed.senderName !== undefined && typeof parsed.senderName !== "string") return null;
  if (parsed.ideaTitle !== undefined && typeof parsed.ideaTitle !== "string") return null;
  const message = cleanText(parsed.praise, MAX_MESSAGE_LENGTH);
  if (!message) return null;
  const senderName = typeof parsed.senderName === "string"
    ? cleanText(parsed.senderName, MAX_SENDER_NAME_LENGTH)
    : "";
  const ideaTitle = cleanText(
    typeof parsed.ideaTitle === "string" ? parsed.ideaTitle : options.ideaTitle ?? "",
    MAX_IDEA_TITLE_LENGTH,
  );
  const requestedAvailableAt = options.availableAt === undefined
    ? startOfLocalDay(vote.at)
    : asTimestamp(options.availableAt);
  if (!finiteTimestamp(requestedAvailableAt)) return null;
  return {
    id,
    message,
    senderRevealConsent: parsed.reveal,
    ...(parsed.reveal !== "forever-anonymous" && senderName ? { senderName } : {}),
    ...(ideaTitle ? { ideaTitle } : {}),
    receivedAt: vote.at,
    availableAt: startOfLocalDay(requestedAvailableAt),
  };
}
