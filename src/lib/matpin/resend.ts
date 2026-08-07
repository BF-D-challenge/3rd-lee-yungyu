import { z } from "zod";
import { sendMatpinInstagramMessage } from "@/lib/matpin/instagram-send";
import {
  createMatpinAccessToken,
  decryptMatpinValue,
  hashMatpinAccessToken,
} from "@/lib/matpin/security";
import { getMatpinServerClient } from "@/lib/matpin/store";

const messageSchema = z.object({
  sender_hash: z.string().length(64),
  status: z.literal("saved"),
});

const userSchema = z.object({
  sender_ciphertext: z.string().min(1),
  access_token_hash: z.string().length(64),
  link_expires_at: z.string().datetime({ offset: true }),
});

function publicMapUrl(accessToken: string): string {
  const origin = process.env.MATPIN_PUBLIC_APP_URL?.trim();
  if (!origin) throw new Error("matpin_public_url_not_configured");
  const url = new URL("/matpin/saved", origin);
  url.hash = `token=${encodeURIComponent(accessToken)}`;
  return url.toString();
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
    .select("sender_ciphertext,access_token_hash,link_expires_at")
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

  const { count, error: countError } = await client
    .from("matpin_saved_places")
    .select("id", { count: "exact", head: true })
    .eq("sender_hash", message.data.sender_hash)
    .is("deleted_at", null);
  if (countError) throw new Error(`matpin_resend_places_read_failed:${countError.message}`);
  if (!count) throw new Error("matpin_resend_places_unavailable");

  await sendMatpinInstagramMessage(senderScopedId, [
    `테스트로 보낸 릴스에서 찾은 장소 ${count}곳을 역별로 정리했어요.`,
    "앞으로 같은 Instagram 계정으로 릴스를 보내면 가까운 역에 계속 쌓여요.",
    publicMapUrl(accessToken),
  ].join("\n"));

  return { savedPlaceCount: count };
}
