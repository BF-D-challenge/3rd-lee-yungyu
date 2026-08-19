import { createHash, timingSafeEqual } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { listMatpinInstagramConversations } from "@/lib/matpin/admin-instagram";
import { resendMatpinAdminLibrary } from "@/lib/matpin/admin-service";
import { readMatpinAdminMessageOwner } from "@/lib/matpin/admin-store";
import { getMatpinServerClient } from "@/lib/matpin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const WINDOW_START = "2026-08-19T12:20:00.000Z";
const WINDOW_END = "2026-08-19T12:30:00.000Z";

function deterministicUuid(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex");
  const variant = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.MATPIN_RECOVERY_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);
}

function publicError(error: unknown): string {
  const code = error instanceof Error ? error.message.split(":", 1)[0] : "unknown_error";
  return code.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "unknown_error";
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const client = getMatpinServerClient();
    const { data: rawMessages, error: messageError } = await client
      .from("matpin_instagram_messages")
      .select("id,status,replied_at,received_at")
      .gte("received_at", WINDOW_START)
      .lt("received_at", WINDOW_END)
      .eq("status", "saved")
      .is("replied_at", null)
      .order("received_at", { ascending: true });
    if (messageError) throw new Error("target_message_read_failed");

    const messages = rawMessages ?? [];
    if (messages.length < 1 || messages.length > 2) {
      throw new Error("unexpected_target_count");
    }

    const messageIds = messages.map((message) => message.id);
    const { count: verifiedPlaceCount, error: placesError } = await client
      .from("matpin_saved_places")
      .select("id", { count: "exact", head: true })
      .in("message_id", messageIds)
      .eq("confirmation_source", "operator_verified")
      .is("deleted_at", null);
    if (placesError) throw new Error("target_place_read_failed");

    const owners = await Promise.all(messages.map((message) => readMatpinAdminMessageOwner(message.id)));
    const totalPlaces = owners.reduce((sum, owner) => sum + (owner?.savedPlaceCount ?? 0), 0);
    if (
      owners.some((owner) => !owner || owner.status !== "saved" || owner.savedPlaceCount < 1)
      || verifiedPlaceCount !== totalPlaces
    ) {
      throw new Error("target_owner_validation_failed");
    }

    const page = await listMatpinInstagramConversations();
    const matches = messages.map((message, index) => {
      const owner = owners[index]!;
      const conversation = page.conversations.find((item) => item.recipientId === owner!.senderScopedId);
      return { message, owner: owner!, conversation };
    });
    if (matches.some((item) => !item.conversation)) throw new Error("conversation_not_found");
    if (matches.some((item) => !item.conversation!.canReply)) throw new Error("reply_window_closed");
    if (new Set(matches.map((item) => item.conversation!.id)).size !== matches.length) {
      throw new Error("conversation_mapping_not_unique");
    }

    const operator = {
      id: deterministicUuid("matpin-codex-operator-recovery-2026-08-20"),
    } as User;
    let delivered = 0;
    let duplicates = 0;
    let replyTimestampsRecorded = 0;

    for (const item of matches) {
      const result = await resendMatpinAdminLibrary({
        user: operator,
        messageId: item.message.id,
        conversationId: item.conversation!.id,
        idempotencyKey: deterministicUuid(`matpin-completion-recovery:${item.message.id}`),
      });
      if ("duplicate" in result && result.duplicate) duplicates += 1;
      else delivered += 1;

      const { error: replyError } = await client
        .from("matpin_instagram_messages")
        .update({ replied_at: new Date().toISOString() })
        .eq("id", item.message.id)
        .eq("status", "saved")
        .is("replied_at", null);
      if (replyError) throw new Error("reply_timestamp_record_failed");
      replyTimestampsRecorded += 1;
    }

    return NextResponse.json({
      ok: true,
      targetMessages: messages.length,
      targetPlaces: totalPlaces,
      delivered,
      duplicates,
      replyTimestampsRecorded,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: publicError(error) }, {
      status: 409,
      headers: { "cache-control": "no-store" },
    });
  }
}
