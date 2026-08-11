import { createHmac, timingSafeEqual } from "node:crypto";
import { after, NextResponse } from "next/server";
import {
  normalizeMetaWebhookGuidanceRecipients,
  normalizeMetaWebhookMessages,
} from "@/lib/matpin/contract";
import {
  buildMatpinGuidanceReply,
  buildMatpinReceiptReply,
  getMatpinMediaKind,
} from "@/lib/matpin/conversation-copy";
import { preflightMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import { getMatpinPipelineModeState } from "@/lib/matpin/pipeline-mode";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  encryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinOutboundDedup,
  hashMatpinOutboundSender,
  hashMatpinSender,
  hashMatpinShortLinkCode,
  verifyMetaWebhookSignature,
  verifyMetaWebhookToken,
} from "@/lib/matpin/security";
import {
  enqueueMatpinWebhookBatch,
  type MatpinPreparedWebhookEvent,
} from "@/lib/matpin/store";
import { processMatpinWorkCycle } from "@/lib/matpin/work-cycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_WEBHOOK_BYTES = 512 * 1024;
const MAX_WEBHOOK_EVENTS = 100;
const WEBHOOK_DATABASE_TIMEOUT_MS = 4_000;
const PIPELINE_MODE_CHECK_MAX_SKEW_SECONDS = 60;
const PIPELINE_MODE_CHECK_CONTEXT = "matpin-pipeline-mode-check:v1";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPipelineModeCheckRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const timestampHeader = request.headers.get("x-matpin-mode-check-timestamp")?.trim();
  const signature = request.headers.get("x-matpin-mode-check-signature")?.trim();
  if (!secret || !timestampHeader || !signature) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isSafeInteger(timestamp)) return false;
  const now = Math.floor(Date.now() / 1_000);
  if (Math.abs(now - timestamp) > PIPELINE_MODE_CHECK_MAX_SKEW_SECONDS) return false;

  const expected = `sha256=${createHmac("sha256", secret)
    .update(`${PIPELINE_MODE_CHECK_CONTEXT}:${timestampHeader}`)
    .digest("hex")}`;
  return safeEqual(expected, signature);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("mode_check") === "1") {
    if (!verifyPipelineModeCheckRequest(request)) {
      return NextResponse.json({ error: "unauthorized" }, {
        status: 401,
        headers: { "cache-control": "private, no-store" },
      });
    }

    const state = getMatpinPipelineModeState();
    return new NextResponse(null, {
      status: state.valid ? 204 : 503,
      headers: {
        "cache-control": "private, no-store",
        "x-matpin-pipeline-mode": state.mode,
        "x-matpin-pipeline-mode-valid": String(state.valid),
        "x-matpin-pipeline-environment": state.environment,
        "x-matpin-pipeline-accepts-events": String(state.valid && state.mode === "live"),
      },
    });
  }

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || !challenge || !verifyMetaWebhookToken(token)) {
    return noStoreJson({ error: "verification_failed" }, 403);
  }
  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function prepareSupportedEvent(
  message: ReturnType<typeof normalizeMetaWebhookMessages>[number],
): MatpinPreparedWebhookEvent {
  const mediaKind = getMatpinMediaKind(message);
  const newUserReceipt = buildMatpinReceiptReply({
    mediaKind,
    isReturningUser: false,
    alreadySavedMedia: false,
  });
  const returningUserReceipt = buildMatpinReceiptReply({
    mediaKind,
    isReturningUser: true,
    alreadySavedMedia: false,
  });
  const alreadySavedReceipt = buildMatpinReceiptReply({
    mediaKind,
    isReturningUser: true,
    alreadySavedMedia: true,
  });

  preflightMatpinInstagramMessage(message.senderScopedId, newUserReceipt);
  preflightMatpinInstagramMessage(message.senderScopedId, returningUserReceipt);
  preflightMatpinInstagramMessage(message.senderScopedId, alreadySavedReceipt);

  const accessToken = createMatpinAccessToken(message.senderScopedId);
  const shortLinkCode = createMatpinShortLinkCode(message.senderScopedId);
  return {
    type: "supported",
    metaMessageId: message.metaMessageId,
    senderHash: hashMatpinSender(message.senderScopedId),
    outboundSenderHash: hashMatpinOutboundSender(message.senderScopedId),
    senderCiphertext: encryptMatpinValue(message.senderScopedId),
    accessTokenHash: hashMatpinAccessToken(accessToken),
    shortLinkHash: hashMatpinShortLinkCode(shortLinkCode),
    reelId: message.reelId,
    reelUrl: message.reelUrl,
    attachmentType: message.attachmentType,
    mediaUrlCiphertext: encryptMatpinValue(message.mediaUrl),
    receivedAt: message.receivedAt,
    receiptDedupHash: hashMatpinOutboundDedup("receipt", message.metaMessageId),
    recipientCiphertext: encryptMatpinValue(message.senderScopedId),
    bodyCiphertext: encryptMatpinValue(newUserReceipt),
    returningBodyCiphertext: encryptMatpinValue(returningUserReceipt),
    alreadySavedBodyCiphertext: encryptMatpinValue(alreadySavedReceipt),
  };
}

function prepareGuidanceEvent(
  recipient: ReturnType<typeof normalizeMetaWebhookGuidanceRecipients>[number],
): MatpinPreparedWebhookEvent {
  const text = buildMatpinGuidanceReply(recipient.reason);
  preflightMatpinInstagramMessage(recipient.senderScopedId, text);
  return {
    type: "guidance",
    dedupHash: hashMatpinOutboundDedup("guidance", recipient.metaMessageId),
    senderHash: hashMatpinSender(recipient.senderScopedId),
    outboundSenderHash: hashMatpinOutboundSender(recipient.senderScopedId),
    recipientCiphertext: encryptMatpinValue(recipient.senderScopedId),
    bodyCiphertext: encryptMatpinValue(text),
  };
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_WEBHOOK_BYTES) return noStoreJson({ error: "payload_too_large" }, 413);
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BYTES) {
    return noStoreJson({ error: "payload_too_large" }, 413);
  }
  if (!verifyMetaWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return noStoreJson({ error: "invalid_signature" }, 401);
  }

  const pipelineState = getMatpinPipelineModeState();
  if (pipelineState.valid && pipelineState.mode === "maintenance") {
    return noStoreJson({ error: "maintenance" }, 503);
  }
  if (!pipelineState.valid) {
    return noStoreJson({ error: "pipeline_not_configured" }, 503);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }

  if (pipelineState.mode === "mock") {
    return noStoreJson({ ok: true, accepted: 0, pipelineMode: "mock" });
  }

  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  if (!accountId) return noStoreJson({ error: "meta_account_not_configured" }, 503);
  const messages = normalizeMetaWebhookMessages(payload, accountId);
  const guidanceRecipients = normalizeMetaWebhookGuidanceRecipients(payload, accountId);
  if (messages.length + guidanceRecipients.length > MAX_WEBHOOK_EVENTS) {
    return noStoreJson({ error: "too_many_events" }, 413);
  }
  if (messages.length === 0 && guidanceRecipients.length === 0) {
    return noStoreJson({ ok: true, accepted: 0, ignored: true });
  }

  try {
    const events = [
      ...messages.map(prepareSupportedEvent),
      ...guidanceRecipients.map(prepareGuidanceEvent),
    ];
    const result = await enqueueMatpinWebhookBatch(events, {
      signal: AbortSignal.timeout(WEBHOOK_DATABASE_TIMEOUT_MS),
    });
    const outboundQueued = result.receiptsQueued + result.guidanceQueued;
    if (outboundQueued > 0) {
      after(async () => {
        try {
          await processMatpinWorkCycle();
        } catch (error) {
          console.error(
            "[matpin-webhook] work_cycle_wake_failed",
            error instanceof Error ? error.message : "unknown_error",
          );
        }
      });
    }
    return noStoreJson({
      ok: true,
      accepted: result.accepted,
      duplicates: result.duplicates,
      receiptsQueued: result.receiptsQueued,
      guidanceQueued: result.guidanceQueued,
      guidanceCooldown: result.guidanceCooldown,
      outboundQueued,
    });
  } catch (error) {
    console.error(
      "[matpin-webhook] batch_enqueue_failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    return noStoreJson({ error: "ingest_failed" }, 503);
  }
}
