import { z } from "zod";
import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import {
  createMatpinAccessToken,
  createMatpinShortLinkCode,
  decryptMatpinValue,
  hashMatpinAccessToken,
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

export async function resendMatpinMap(messageId: string): Promise<{ savedPlaceCount: number }> {
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
  const accessToken = createMatpinAccessToken(senderScopedId);
  if (hashMatpinAccessToken(accessToken) !== user.data.access_token_hash) {
    throw new Error("matpin_resend_token_mismatch");
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

  const { count, error: countError } = await client
    .from("matpin_saved_places")
    .select("id", { count: "exact", head: true })
    .eq("sender_hash", message.data.sender_hash)
    .is("deleted_at", null);
  if (countError) throw new Error(`matpin_resend_places_read_failed:${countError.message}`);
  if (!count) throw new Error("matpin_resend_places_unavailable");

  await sendMatpinInstagramMessage(senderScopedId, [
    "앞서 보내주신 캐러셀은 저장되지 않았습니다.",
    "캐러셀 처리 기능이 빠져 있었어요.",
    "이용에 불편을 드려 죄송합니다.",
    "방금 일반 게시물과 캐러셀도 저장할 수 있도록 수정했어요.",
    "번거로우시겠지만 같은 게시물을 한 번만 다시 보내주세요.",
    `지금까지 저장한 맛집 ${count}곳은 아래 링크에서 확인할 수 있습니다.`,
    publicMapUrl(shortLinkCode),
  ].join("\n"));

  return { savedPlaceCount: count };
}
