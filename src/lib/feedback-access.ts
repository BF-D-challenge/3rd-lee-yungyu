export type FeedbackChannel = "card" | "duel";

export interface FeedbackWriteAccess {
  requestId: string;
  writeToken: string;
}

export interface FeedbackOwnerAccess extends FeedbackWriteAccess {
  readToken: string;
}

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;
const REQUEST_ID_PATTERN = /^feedback_[A-Za-z0-9_-]{20,128}$/;

const randomToken = (): string => {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("안전한 공유 링크를 만들 수 없는 브라우저입니다.");
  }
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export const createFeedbackAccess = (): FeedbackOwnerAccess => ({
  requestId: `feedback_${randomToken()}`,
  writeToken: randomToken(),
  readToken: randomToken(),
});

export const writeAccessFrom = (access: FeedbackOwnerAccess): FeedbackWriteAccess => ({
  requestId: access.requestId,
  writeToken: access.writeToken,
});

export const isFeedbackWriteAccess = (value: unknown): value is FeedbackWriteAccess => {
  if (!value || typeof value !== "object") return false;
  const access = value as Partial<FeedbackWriteAccess>;
  return (
    typeof access.requestId === "string"
    && REQUEST_ID_PATTERN.test(access.requestId)
    && typeof access.writeToken === "string"
    && TOKEN_PATTERN.test(access.writeToken)
  );
};

export const isFeedbackOwnerAccess = (value: unknown): value is FeedbackOwnerAccess => {
  if (!isFeedbackWriteAccess(value)) return false;
  const readToken = (value as Partial<FeedbackOwnerAccess>).readToken;
  return typeof readToken === "string"
    && TOKEN_PATTERN.test(readToken)
    && readToken !== value.writeToken;
};
