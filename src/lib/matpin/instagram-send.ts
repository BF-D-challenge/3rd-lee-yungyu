import { z } from "zod";
import { isMatpinInstagramTextWithinLimit } from "@/lib/matpin/message-limits";
import { MatpinConfigurationError } from "@/lib/matpin/security";

const sendResponseSchema = z.object({
  recipient_id: z.string().optional(),
  message_id: z.string().min(1),
});

const SAFE_GRAPH_VERSION = /^v\d{1,2}\.\d$/;

export class MatpinInstagramSendError extends Error {
  constructor(
    message: string,
    public readonly deliveryOutcome: "known_not_sent" | "uncertain",
    public readonly httpStatus: number | null = null,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "MatpinInstagramSendError";
  }
}

export function isMatpinInstagramSendKnownNotSent(error: unknown): boolean {
  return error instanceof MatpinInstagramSendError && error.deliveryOutcome === "known_not_sent";
}

export function preflightMatpinInstagramMessage(recipientId: string, text: string) {
  const accountId = process.env.META_INSTAGRAM_ACCOUNT_ID?.trim();
  const accessToken = process.env.META_INSTAGRAM_ACCESS_TOKEN?.trim();
  const graphVersion = process.env.META_GRAPH_API_VERSION?.trim();
  if (!accountId || !accessToken || !graphVersion || !SAFE_GRAPH_VERSION.test(graphVersion)) {
    throw new MatpinConfigurationError("meta_send_not_configured");
  }
  if (!text.trim() || !isMatpinInstagramTextWithinLimit(text)) {
    throw new Error("meta_send_text_invalid");
  }
  const recipient = z.string().trim().min(1).max(500).parse(recipientId);
  return { accountId, accessToken, graphVersion, recipientId: recipient, text };
}

export async function sendMatpinInstagramMessage(
  recipientId: string,
  text: string,
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const prepared = preflightMatpinInstagramMessage(recipientId, text);
  const localTimeout = AbortSignal.timeout(8_000);
  const signal = options.signal
    ? AbortSignal.any([options.signal, localTimeout])
    : localTimeout;

  let response: Response;
  try {
    response = await fetch(`https://graph.instagram.com/${prepared.graphVersion}/${prepared.accountId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${prepared.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: prepared.recipientId },
        message: { text: prepared.text },
      }),
      signal,
      cache: "no-store",
    });
  } catch {
    throw new MatpinInstagramSendError("meta_send_outcome_uncertain", "uncertain", null, false);
  }
  if (!response.ok) {
    if (response.status >= 500) {
      throw new MatpinInstagramSendError(
        "meta_send_outcome_uncertain",
        "uncertain",
        response.status,
        false,
      );
    }
    throw new MatpinInstagramSendError(
      `meta_send_failed:${response.status}`,
      "known_not_sent",
      response.status,
      response.status === 429,
    );
  }
  try {
    return sendResponseSchema.parse(await response.json()).message_id;
  } catch {
    throw new MatpinInstagramSendError(
      "meta_send_outcome_uncertain",
      "uncertain",
      response.status,
      false,
    );
  }
}
