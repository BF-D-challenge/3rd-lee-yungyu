import { z } from "zod";
import { isMatpinInstagramTextWithinLimit } from "@/lib/matpin/message-limits";

export const matpinAdminRangeSchema = z.enum(["24h", "7d", "30d", "all"]);
export type MatpinAdminRange = z.infer<typeof matpinAdminRangeSchema>;

export const matpinAdminFilterSchema = z.enum([
  "all",
  "attention",
  "processing",
  "saved",
  "failed",
]);
export type MatpinAdminFilter = z.infer<typeof matpinAdminFilterSchema>;

export const matpinAdminStatusSchema = z.enum([
  "received",
  "processing",
  "needs_confirmation",
  "saved",
  "failed",
  "deleted",
]);
export type MatpinAdminStatus = z.infer<typeof matpinAdminStatusSchema>;

export type MatpinAdminSummary = {
  range: MatpinAdminRange;
  generatedAt: string;
  instagramAvailable: boolean;
  recentConversations: number | null;
  replyNeeded: number | null;
  users: number;
  messages: number;
  processing: number;
  failed: number;
  savedPlaces: number;
  cacheEntries: number;
  cacheHits: number;
  apiRequests: number;
  totalTokens: number;
};

export type MatpinAdminLiveSummary = Pick<
  MatpinAdminSummary,
  "instagramAvailable" | "recentConversations" | "replyNeeded"
>;

export type MatpinAdminProfile = {
  name: string | null;
  username: string | null;
};

export type MatpinAdminMessagePreview = {
  id: string;
  direction: "inbound" | "outbound";
  text: string | null;
  attachmentKind: "image" | "video" | "share" | "other" | null;
  createdAt: string;
};

export const matpinAdminFailureCodeSchema = z.enum([
  "media_unavailable",
  "analysis_unavailable",
  "place_resolution_unavailable",
  "delivery_failed",
  "processing_failed",
]);
export type MatpinAdminFailureCode = z.infer<typeof matpinAdminFailureCodeSchema>;

export type MatpinAdminFailure = {
  code: MatpinAdminFailureCode;
  reason: string;
};

export function matpinAdminPublicFailure(lastError: string | null): MatpinAdminFailure | null {
  if (!lastError) return null;
  const code = lastError.split(":", 1)[0]?.trim().toLowerCase() ?? "";
  if (code.startsWith("reel_source_") || code.startsWith("media_")) {
    return { code: "media_unavailable", reason: "원본 게시물을 불러오지 못했습니다." };
  }
  if (code.startsWith("gemini_") || code.startsWith("analysis_")) {
    return { code: "analysis_unavailable", reason: "게시물 분석을 완료하지 못했습니다." };
  }
  if (code.startsWith("place_search_")) {
    return { code: "place_resolution_unavailable", reason: "장소 정보를 확인하지 못했습니다." };
  }
  if (code.startsWith("meta_send_")) {
    return { code: "delivery_failed", reason: "인스타그램 답장을 보내지 못했습니다." };
  }
  return { code: "processing_failed", reason: "저장 처리 중 오류가 발생했습니다." };
}

export type MatpinAdminStoredMessage = {
  id: string;
  status: MatpinAdminStatus;
  attachmentType: "share" | "ig_reel" | "reel";
  reelUrl: string | null;
  receivedAt: string;
  repliedAt: string | null;
  acknowledgedAt: string | null;
  attemptCount: number;
  failureCode: MatpinAdminFailureCode | null;
  failureReason: string | null;
  /** @deprecated Use failureReason. This value is a safe mapped reason, never the raw database error. */
  lastError: string | null;
  analysisDurationMs: number | null;
  totalTokens: number | null;
  savedPlaceCount: number;
};

export type MatpinAdminConversation = {
  id: string;
  updatedAt: string;
  profile: MatpinAdminProfile;
  latestMessage: MatpinAdminMessagePreview | null;
  latestStoredMessage: MatpinAdminStoredMessage | null;
  savedPlaceCount: number;
  failedMessageCount: number;
  needsReply: boolean;
  canReply: boolean;
  replyWindowEndsAt: string | null;
};

export type MatpinAdminSavedPlace = {
  id: number;
  messageId: string;
  name: string;
  address: string | null;
  stationName: string | null;
  savedAt: string;
};

export type MatpinAdminConversationDetail = MatpinAdminConversation & {
  messages: MatpinAdminMessagePreview[];
  storedMessages: MatpinAdminStoredMessage[];
  savedPlaces: MatpinAdminSavedPlace[];
  messageLimit: 20;
};

export const matpinAdminSendSchema = z.object({
  text: z.string().trim().min(1).max(1_000).refine(isMatpinInstagramTextWithinLimit),
  idempotencyKey: z.string().uuid(),
});

export const matpinAdminActionSchema = z.object({
  idempotencyKey: z.string().uuid(),
});

export const matpinAdminConversationActionSchema = matpinAdminActionSchema.extend({
  conversationId: z.string().trim().min(1).max(500).regex(/^[A-Za-z0-9_:-]+$/),
});
export const matpinAdminReprocessSchema = matpinAdminConversationActionSchema;
export const matpinAdminResendSchema = matpinAdminConversationActionSchema;

export function matpinAdminSince(range: MatpinAdminRange, now = Date.now()): string | null {
  const duration = range === "24h"
    ? 24 * 60 * 60 * 1000
    : range === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : range === "30d"
        ? 30 * 24 * 60 * 60 * 1000
        : null;
  return duration === null ? null : new Date(now - duration).toISOString();
}

export function matpinAdminReplyWindow(
  latestInboundAt: string | null,
  now = Date.now(),
): { canReply: boolean; endsAt: string | null } {
  if (!latestInboundAt) return { canReply: false, endsAt: null };
  const receivedAt = new Date(latestInboundAt).getTime();
  if (!Number.isFinite(receivedAt)) return { canReply: false, endsAt: null };
  const endsAt = receivedAt + 24 * 60 * 60 * 1000;
  return { canReply: now < endsAt, endsAt: new Date(endsAt).toISOString() };
}
