import { z } from "zod";
import { MatpinConfigurationError } from "@/lib/matpin/security";

const sendResponseSchema = z.object({
  recipient_id: z.string().optional(),
  message_id: z.string().min(1),
});

const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;

export async function sendMatpinInstagramMessage(recipientId: string, text: string): Promise<string> {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim();
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim();
  if (!accountId || !accessToken || !graphVersion || !SAFE_GRAPH_VERSION.test(graphVersion)) {
    throw new MatpinConfigurationError("meta_send_not_configured");
  }

  const response = await fetch(`https://graph.instagram.com/${graphVersion}/${accountId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text.slice(0, 1_000) },
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`meta_send_failed:${response.status}`);
  return sendResponseSchema.parse(await response.json()).message_id;
}
