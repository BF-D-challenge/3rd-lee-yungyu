import {
  createFeedbackAccess,
  isFeedbackOwnerAccess,
  type FeedbackChannel,
  type FeedbackOwnerAccess,
  type FeedbackWriteAccess,
} from "../feedback-access";
import { registerFeedbackRequest } from "./feedback-api";

/**
 * 기존 안전 토큰이 있으면 재사용하고, 없거나 불완전하면 새 권한을 만든다.
 * 운영 환경에서는 서버 등록 실패 시 null을 반환해 안전하지 않은 링크 공유를 막는다.
 */
export async function prepareFeedbackAccess(
  channel: FeedbackChannel,
  writeAccess?: FeedbackWriteAccess,
  readToken?: string,
): Promise<FeedbackOwnerAccess | null> {
  const existing = writeAccess && readToken
    ? { ...writeAccess, readToken }
    : null;
  const access = existing && isFeedbackOwnerAccess(existing)
    ? existing
    : createFeedbackAccess();
  const registration = await registerFeedbackRequest(channel, access);
  return registration === "failed" ? null : access;
}
