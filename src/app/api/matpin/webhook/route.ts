import { after, NextResponse } from "next/server";
import {
  normalizeMetaWebhookGuidanceRecipients,
  normalizeMetaWebhookMessages,
} from "@/lib/matpin/contract";
import { MATPIN_USAGE_GUIDANCE } from "@/lib/matpin/guidance";
import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import { verifyMetaWebhookSignature, verifyMetaWebhookToken } from "@/lib/matpin/security";
import { ingestMatpinMessage } from "@/lib/matpin/store";
import { processMatpinQueue } from "@/lib/matpin/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_WEBHOOK_BYTES = 512 * 1024;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
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

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return noStoreJson({ error: "invalid_json" }, 400);
  }

  if (process.env.MATPIN_INSTAGRAM_PIPELINE_MODE !== "live") {
    return noStoreJson({ ok: true, accepted: 0, pipelineMode: "mock" });
  }

  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  if (!accountId) return noStoreJson({ error: "meta_account_not_configured" }, 503);
  const messages = normalizeMetaWebhookMessages(payload, accountId);
  const guidanceRecipients = normalizeMetaWebhookGuidanceRecipients(payload, accountId);
  if (messages.length === 0 && guidanceRecipients.length === 0) {
    return noStoreJson({ ok: true, accepted: 0, ignored: true });
  }

  try {
    await Promise.all(guidanceRecipients.map((recipient) =>
      sendMatpinInstagramMessage(recipient.senderScopedId, MATPIN_USAGE_GUIDANCE)
    ));
    const results = await Promise.all(messages.map((message) => ingestMatpinMessage(message)));
    const accepted = results.filter((result) => result.accepted).length;
    if (accepted > 0) {
      after(async () => {
        try {
          await processMatpinQueue(Math.min(accepted, 3));
        } catch (error) {
          console.error("[matpin-webhook] background_worker_failed", error instanceof Error ? error.message : "unknown_error");
        }
      });
    }
    return noStoreJson({
      ok: true,
      accepted,
      duplicates: results.filter((result) => result.duplicate).length,
      guidanceSent: guidanceRecipients.length,
    });
  } catch (error) {
    console.error("[matpin-webhook] ingest_failed", error instanceof Error ? error.message : "unknown_error");
    return noStoreJson({ error: "ingest_failed" }, 503);
  }
}
