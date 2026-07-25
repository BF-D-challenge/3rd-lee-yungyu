const RESULT_KEY = "oneul:idea-result-session:v1";
const DEVICE_RESULT_KEY = "oneul:idea-result-device:v1";
const LOGIN_PENDING_KEY = "oneul:idea-result-login-pending:v1";
const LOGIN_PENDING_TTL_MS = 10 * 60 * 1_000;
const MAX_ID_LENGTH = 128;

export interface IdeaResultSession {
  v: 1;
  scenarioId: string;
  payerId: string;
  momentId: string;
  twistId: string;
  savedAt: number;
}

export type SaveIdeaResultSessionInput = Omit<IdeaResultSession, "v">;

interface ResultLoginPending {
  v: 1;
  scenarioId: string;
  markedAt: number;
}

const validId = (value: unknown): value is string =>
  typeof value === "string"
  && value.trim() === value
  && value.length > 0
  && value.length <= MAX_ID_LENGTH;

const validTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const validResult = (value: unknown): value is IdeaResultSession => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Partial<IdeaResultSession>;
  return result.v === 1
    && validId(result.scenarioId)
    && validId(result.payerId)
    && validId(result.momentId)
    && validId(result.twistId)
    && validTimestamp(result.savedAt);
};

const validPending = (value: unknown): value is ResultLoginPending => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pending = value as Partial<ResultLoginPending>;
  return pending.v === 1
    && validId(pending.scenarioId)
    && validTimestamp(pending.markedAt);
};

/** 현재 선택 ID만 같은 탭과 기기에 남긴다. 카드 문구나 자유 입력은 저장하지 않는다. */
export function saveIdeaResultSession(input: SaveIdeaResultSessionInput): boolean {
  const result: IdeaResultSession = { v: 1, ...input };
  if (!validResult(result)) return false;
  let saved = false;
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    saved = true;
  } catch {
    // sessionStorage가 막혀도 같은 기기 보관을 시도한다.
  }
  try {
    localStorage.setItem(DEVICE_RESULT_KEY, JSON.stringify(result));
    saved = true;
  } catch {
    // 로컬 저장이 막혀도 현재 화면은 계속 사용할 수 있다.
  }
  return saved;
}

export function loadIdeaResultSession(): IdeaResultSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(RESULT_KEY) ?? "null") as unknown;
    if (validResult(value)) return value;
  } catch {
    // 로컬 보관본으로 폴백한다.
  }
  try {
    const value = JSON.parse(localStorage.getItem(DEVICE_RESULT_KEY) ?? "null") as unknown;
    return validResult(value) ? value : null;
  } catch {
    return null;
  }
}

/** 결과 화면에서 시작한 로그인만 별도 귀속한다. 실제 인증 완료 전에는 결과를 지우지 않는다. */
export function markIdeaResultLoginPending(): boolean {
  const result = loadIdeaResultSession();
  if (!result) return false;
  const pending: ResultLoginPending = {
    v: 1,
    scenarioId: result.scenarioId,
    markedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(LOGIN_PENDING_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

/** 로그인 완료 귀속은 한 번만 소비하고, 결과 snapshot 자체는 복원용으로 유지한다. */
export function consumeIdeaResultLoginPending(): IdeaResultSession | null {
  try {
    const raw = sessionStorage.getItem(LOGIN_PENDING_KEY);
    sessionStorage.removeItem(LOGIN_PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as unknown;
    const result = loadIdeaResultSession();
    if (!validPending(pending) || !result) return null;
    if (
      Date.now() - pending.markedAt < 0
      || Date.now() - pending.markedAt > LOGIN_PENDING_TTL_MS
      || pending.scenarioId !== result.scenarioId
    ) return null;
    return result;
  } catch {
    return null;
  }
}

export function clearIdeaResultSession(): void {
  try {
    sessionStorage.removeItem(RESULT_KEY);
    sessionStorage.removeItem(LOGIN_PENDING_KEY);
    localStorage.removeItem(DEVICE_RESULT_KEY);
  } catch {
    // 저장소 정리 실패가 앱의 핵심 이용을 막지 않는다.
  }
}
