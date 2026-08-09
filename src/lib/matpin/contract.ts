import { z } from "zod";
import { instagramMediaId, normalizeInstagramMediaUrl } from "@/lib/matpick-dm-contract";

export const matpinAttachmentTypeSchema = z.enum(["share", "ig_reel", "reel"]);
export type MatpinAttachmentType = z.infer<typeof matpinAttachmentTypeSchema>;

const metaAttachmentSchema = z.object({
  type: z.string(),
  payload: z.object({
    url: z.string().url().max(16_384).optional(),
  }).passthrough().optional(),
}).passthrough();

const metaMessageSchema = z.object({
  mid: z.string().trim().min(1).max(500),
  text: z.string().max(2_000).optional(),
  is_deleted: z.boolean().optional(),
  is_echo: z.boolean().optional(),
  is_self: z.boolean().optional(),
  is_unsupported: z.boolean().optional(),
  attachments: z.array(metaAttachmentSchema).max(10).optional(),
}).passthrough();

const metaMessagingSchema = z.object({
  sender: z.object({ id: z.string().trim().min(1).max(200) }),
  recipient: z.object({ id: z.string().trim().min(1).max(200) }),
  timestamp: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]),
  message: metaMessageSchema,
}).passthrough();

export const matpinMetaWebhookSchema = z.object({
  object: z.literal("instagram"),
  entry: z.array(z.object({
    id: z.string().trim().min(1).max(200),
    time: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]).optional(),
    messaging: z.array(metaMessagingSchema).max(100).optional(),
  }).passthrough()).min(1).max(100),
});

export const matpinInboundMessageSchema = z.object({
  metaMessageId: z.string().min(1).max(500),
  senderScopedId: z.string().min(1).max(200),
  recipientAccountId: z.string().min(1).max(200),
  reelId: z.string().min(1).max(500),
  reelUrl: z.string().url().nullable(),
  mediaUrl: z.string().url().max(16_384),
  attachmentType: matpinAttachmentTypeSchema,
  receivedAt: z.string().datetime({ offset: true }),
});
export type MatpinInboundMessage = z.infer<typeof matpinInboundMessageSchema>;

export const matpinGuidanceReasonSchema = z.enum([
  "greeting",
  "appreciation",
  "help",
  "direct_image",
  "direct_video",
  "external_link",
  "instagram_profile",
  "plain_text",
  "unsupported_attachment",
]);
export type MatpinGuidanceReason = z.infer<typeof matpinGuidanceReasonSchema>;

export type MatpinGuidanceRecipient = {
  metaMessageId: string;
  senderScopedId: string;
  reason: MatpinGuidanceReason;
};

export const matpinEvidenceSchema = z.object({
  kind: z.enum([
    "caption",
    "creator_comment",
    "speech",
    "on_screen_text",
    "visual_sign",
    "video_metadata",
  ]),
  text: z.string().trim().min(1).max(180),
  timestampSeconds: z.number().int().min(0).max(3_600).nullable(),
});

export const matpinPlaceClueSchema = z.object({
  name: z.string().trim().min(1).max(120),
  branch: z.string().trim().min(1).max(80).nullable(),
  menus: z.array(z.string().trim().min(1).max(80)).max(8),
  regionHints: z.array(z.string().trim().min(1).max(80)).max(6),
  confidence: z.number().min(0).max(1),
  evidence: z.array(matpinEvidenceSchema).min(1).max(8),
});

export const matpinAnalysisSchema = z.object({
  status: z.enum(["resolved", "insufficient"]),
  summary: z.string().trim().min(1).max(240),
  places: z.array(matpinPlaceClueSchema).max(3),
}).superRefine((value, context) => {
  if (value.status === "resolved" && value.places.length === 0) {
    context.addIssue({ code: "custom", path: ["places"], message: "resolved에는 장소 단서가 필요합니다." });
  }
  if (value.status === "insufficient" && value.places.length > 0) {
    context.addIssue({ code: "custom", path: ["places"], message: "insufficient에는 장소 단서를 넣지 않습니다." });
  }
});
export type MatpinAnalysis = z.infer<typeof matpinAnalysisSchema>;

export const matpinPlaceCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  area: z.string().min(1),
  category: z.string(),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  mapUrl: z.string().url(),
  confidence: z.number().min(0).max(1),
  matchReason: z.string().min(1).max(300),
});
export type MatpinPlaceCandidate = z.infer<typeof matpinPlaceCandidateSchema>;

export const matpinMessagePublicSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["needs_confirmation", "saved", "failed", "deleted"]),
  selectedPlaceId: z.string().nullable(),
  reelUrl: z.string().url().nullable(),
  candidates: z.array(matpinPlaceCandidateSchema).max(3),
  receivedAt: z.string().datetime({ offset: true }),
  notice: z.string().min(1),
});
export type MatpinMessagePublic = z.infer<typeof matpinMessagePublicSchema>;

export const matpinSavedPlaceSchema = z.object({
  id: z.number().int().positive(),
  messageId: z.string().uuid(),
  reelId: z.string().min(1),
  reelUrl: z.string().url().nullable(),
  place: matpinPlaceCandidateSchema,
  confirmationSource: z.enum(["automatic_high_confidence", "user_confirmation"]),
  savedAt: z.string().datetime({ offset: true }),
});
export type MatpinSavedPlace = z.infer<typeof matpinSavedPlaceSchema>;

const SUPPORTED_ATTACHMENTS = new Set([
  "share",
  "ig_reel",
  "reel",
  "media",
]);

function toDate(timestamp: string | number): string {
  const numeric = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1_000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function possibleInstagramMediaUrl(value: string): string | null {
  return normalizeInstagramMediaUrl(value);
}

function instagramAssetId(value: string): string | null {
  try {
    const assetId = new URL(value).searchParams.get("asset_id")?.trim();
    return assetId && /^\d{5,50}$/.test(assetId) ? assetId : null;
  } catch {
    return null;
  }
}

function storedAttachmentType(value: string): MatpinAttachmentType | null {
  if (value === "media") return "share";
  const parsed = matpinAttachmentTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function guidanceReason(message: z.infer<typeof metaMessageSchema>): MatpinGuidanceReason {
  const attachmentTypes = new Set(message.attachments?.map((item) => item.type) ?? []);
  if (attachmentTypes.has("image")) return "direct_image";
  if (attachmentTypes.has("video")) return "direct_video";
  if (attachmentTypes.size > 0) return "unsupported_attachment";

  const text = message.text?.trim() ?? "";
  if (/^(안녕|안녕하세요|반가워|hello\b|hi\b)/i.test(text)) return "greeting";
  if (/(고마워|고맙|감사|신기|대박|좋네요|좋아요|유용|멋지)/i.test(text)) return "appreciation";
  if (/(어떻게|사용법|사용 방법|도움|뭘 보내|뭐 보내|지원|되나요|방법)/i.test(text)) return "help";

  const urlMatch = text.match(/https?:\/\/[^\s]+/i)?.[0];
  if (urlMatch) {
    try {
      const url = new URL(urlMatch);
      if (/(^|\.)instagram\.com$/i.test(url.hostname)) return "instagram_profile";
    } catch {
      // 유효하지 않은 URL은 일반 글로 안내한다.
    }
    return "external_link";
  }

  return "plain_text";
}

export function normalizeMetaWebhookMessages(
  payload: unknown,
  expectedAccountId: string,
): MatpinInboundMessage[] {
  const parsed = matpinMetaWebhookSchema.safeParse(payload);
  if (!parsed.success) return [];

  const results: MatpinInboundMessage[] = [];
  for (const entry of parsed.data.entry) {
    for (const event of entry.messaging ?? []) {
      const message = event.message;
      if (
        event.recipient.id !== expectedAccountId
        || message.is_deleted
        || message.is_echo
        || message.is_self
        || message.is_unsupported
      ) continue;

      const attachment = message.attachments?.find((item) =>
        SUPPORTED_ATTACHMENTS.has(item.type)
        && Boolean(item.payload?.url),
      );
      const attachmentType = attachment
        ? storedAttachmentType(attachment.type)
        : null;
      const textMediaUrl = !attachment && message.text
        ? possibleInstagramMediaUrl(message.text)
        : null;
      const mediaUrl = attachment?.payload?.url ?? textMediaUrl;
      if (!mediaUrl || (attachment && !attachmentType)) continue;

      const reelUrl = possibleInstagramMediaUrl(mediaUrl);
      const reelId = reelUrl
        ? instagramMediaId(reelUrl)
        : instagramAssetId(mediaUrl);

      results.push(matpinInboundMessageSchema.parse({
        metaMessageId: message.mid,
        senderScopedId: event.sender.id,
        recipientAccountId: event.recipient.id,
        reelId: reelId ?? `message-${message.mid}`,
        reelUrl,
        mediaUrl,
        attachmentType: attachmentType ?? "share",
        receivedAt: toDate(event.timestamp),
      }));
    }
  }
  return results;
}

export function normalizeMetaWebhookGuidanceRecipients(
  payload: unknown,
  expectedAccountId: string,
): MatpinGuidanceRecipient[] {
  const parsed = matpinMetaWebhookSchema.safeParse(payload);
  if (!parsed.success) return [];

  const supportedMessages = normalizeMetaWebhookMessages(payload, expectedAccountId);
  const supportedMessageIds = new Set(supportedMessages.map((message) => message.metaMessageId));
  const supportedSenders = new Set(supportedMessages.map((message) => message.senderScopedId));
  const recipients = new Map<string, MatpinGuidanceRecipient>();

  for (const entry of parsed.data.entry) {
    for (const event of entry.messaging ?? []) {
      const message = event.message;
      if (
        event.recipient.id !== expectedAccountId
        || message.is_deleted
        || message.is_echo
        || message.is_self
        || message.is_unsupported
        || supportedMessageIds.has(message.mid)
        || supportedSenders.has(event.sender.id)
      ) continue;

      recipients.set(event.sender.id, {
        metaMessageId: message.mid,
        senderScopedId: event.sender.id,
        reason: guidanceReason(message),
      });
    }
  }

  return [...recipients.values()];
}

export const matpinGeminiJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["resolved", "insufficient"] },
    summary: { type: "string" },
    places: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          branch: { type: ["string", "null"] },
          menus: { type: "array", maxItems: 8, items: { type: "string" } },
          regionHints: { type: "array", maxItems: 6, items: { type: "string" } },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                kind: {
                  type: "string",
                  enum: [
                    "caption",
                    "creator_comment",
                    "speech",
                    "on_screen_text",
                    "visual_sign",
                    "video_metadata",
                  ],
                },
                text: { type: "string" },
                timestampSeconds: { type: ["integer", "null"], minimum: 0, maximum: 3_600 },
              },
              required: ["kind", "text", "timestampSeconds"],
            },
          },
        },
        required: ["name", "branch", "menus", "regionHints", "confidence", "evidence"],
      },
    },
  },
  required: ["status", "summary", "places"],
} as const;
