import { z } from "zod";
import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  decryptMatpinValue,
  hashMatpinAccessToken,
  hashMatpinSender,
  hashMatpinShortLinkCode,
} from "@/lib/matpin/security";
import { getMatpinServerClient } from "@/lib/matpin/store";

const messageSchema = z.object({
  sender_hash: z.string().length(64),
  status: z.enum(["saved", "failed"]),
});

const userSchema = z.object({
  sender_ciphertext: z.string().min(1),
  access_token_hash: z.string().length(64),
  short_link_hash: z.string().length(64).nullable(),
  link_expires_at: z.string().datetime({ offset: true }),
});

function publicMapUrl(shortLinkCode: string): string {
  const origin = process.env.MATPIN_PUBLIC_APP_URL?.trim();
  if (!origin) throw new Error("matpin_public_url_not_configured");
  return new URL(`/s/${shortLinkCode}`, origin).toString();
}

async function prepareMatpinMap(messageId: string, expectedRecipientId: string): Promise<{
  senderScopedId: string;
  shortLinkCode: string;
  savedPlaceCount: number;
}> {
  const id = z.string().uuid().parse(messageId);
  const client = getMatpinServerClient();
  const { data: rawMessage, error: messageError } = await client
    .from("matpin_instagram_messages")
    .select("sender_hash,status")
    .eq("id", id)
    .maybeSingle();
  if (messageError) throw new Error(`matpin_resend_message_read_failed:${messageError.message}`);
  const message = messageSchema.safeParse(rawMessage);
  if (!message.success) throw new Error("matpin_resend_message_unavailable");
  if (message.data.status !== "saved") {
    throw new Error("matpin_resend_message_unavailable");
  }

  const { data: rawUser, error: userError } = await client
    .from("matpin_instagram_users")
    .select("sender_ciphertext,access_token_hash,short_link_hash,link_expires_at")
    .eq("sender_hash", message.data.sender_hash)
    .maybeSingle();
  if (userError) throw new Error(`matpin_resend_user_read_failed:${userError.message}`);
  const user = userSchema.safeParse(rawUser);
  if (!user.success || new Date(user.data.link_expires_at).getTime() <= Date.now()) {
    throw new Error("matpin_resend_user_unavailable");
  }

  const senderScopedId = decryptMatpinValue(user.data.sender_ciphertext);
  if (hashMatpinSender(senderScopedId) !== message.data.sender_hash) {
    throw new Error("matpin_resend_sender_mismatch");
  }
  const parsedExpectedRecipientId = z.string().trim().min(1).max(500).parse(expectedRecipientId);
  if (senderScopedId !== parsedExpectedRecipientId) {
    throw new Error("matpin_resend_recipient_mismatch");
  }
  const accessToken = createMatpinAccessToken(senderScopedId);
  if (hashMatpinAccessToken(accessToken) !== user.data.access_token_hash) {
    throw new Error("matpin_resend_token_mismatch");
  }
  const libraryCountQuery = client
    .from("matpin_saved_places")
    .select("id", { count: "exact", head: true })
    .eq("sender_hash", message.data.sender_hash)
    .is("deleted_at", null);
  const messageCountQuery = client
    .from("matpin_saved_places")
    .select("id", { count: "exact", head: true })
    .eq("message_id", id)
    .eq("sender_hash", message.data.sender_hash)
    .is("deleted_at", null);
  const [libraryCountResult, messageCountResult] = await Promise.all([
    libraryCountQuery,
    messageCountQuery,
  ]);
  if (libraryCountResult.error) {
    throw new Error(`matpin_resend_places_read_failed:${libraryCountResult.error.message}`);
  }
  if (messageCountResult.error) {
    throw new Error(`matpin_resend_message_places_read_failed:${messageCountResult.error.message}`);
  }
  if (!libraryCountResult.count || !messageCountResult.count) {
    throw new Error("matpin_resend_places_unavailable");
  }

  const shortLinkCode = createMatpinShortLinkCode(senderScopedId);
  const shortLinkHash = hashMatpinShortLinkCode(shortLinkCode);
  if (user.data.short_link_hash && user.data.short_link_hash !== shortLinkHash) {
    throw new Error("matpin_resend_short_link_mismatch");
  }
  if (!user.data.short_link_hash) {
    const { error: shortLinkError } = await client
      .from("matpin_instagram_users")
      .update({ short_link_hash: shortLinkHash })
      .eq("sender_hash", message.data.sender_hash)
      .is("short_link_hash", null);
    if (shortLinkError) throw new Error(`matpin_resend_short_link_failed:${shortLinkError.message}`);
  }

  return { senderScopedId, shortLinkCode, savedPlaceCount: libraryCountResult.count };
}

export async function resendMatpinLibrary(
  messageId: string,
  expectedRecipientId: string,
  beforeSend?: () => Promise<void>,
): Promise<{
  savedPlaceCount: number;
  metaMessageId: string;
}> {
  const prepared = await prepareMatpinMap(messageId, expectedRecipientId);
  await beforeSend?.();
  const metaMessageId = await sendMatpinInstagramMessage(prepared.senderScopedId, [
    "요청하신 맛핀 보관함 링크입니다.",
    `지금까지 저장한 장소 ${prepared.savedPlaceCount}곳을 확인할 수 있어요.`,
    publicMapUrl(prepared.shortLinkCode),
  ].join("\n"));
  return { savedPlaceCount: prepared.savedPlaceCount, metaMessageId };
}
