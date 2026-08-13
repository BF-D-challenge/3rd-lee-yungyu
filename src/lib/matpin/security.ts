import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export class MatpinConfigurationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function requiredSecret(name: string, minimumLength = 32): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < minimumLength) throw new MatpinConfigurationError(`${name.toLowerCase()}_missing`);
  return value;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(expected, signatureHeader);
}

export function verifyMetaWebhookToken(receivedToken: string | null): boolean {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();
  return Boolean(expected && receivedToken && safeEqual(expected, receivedToken));
}

function dataSecret(): string {
  return requiredSecret("MATPIN_DATA_SECRET");
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(`matpin-encryption:${dataSecret()}`).digest();
}

export function encryptMatpinValue(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptMatpinValue(value: string): string {
  const [version, ivValue, tagValue, payload] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !payload) throw new Error("matpin_ciphertext_invalid");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(payload, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function hashMatpinSender(senderScopedId: string): string {
  return createHmac("sha256", dataSecret())
    .update(`sender:${senderScopedId}`)
    .digest("hex");
}

export type MatpinOutboundKind = "receipt" | "guidance" | "final";

function requiredOutboundIdentity(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 500) throw new Error(code);
  return normalized;
}

export function hashMatpinOutboundDedup(kind: MatpinOutboundKind, sourceId: string): string {
  const source = requiredOutboundIdentity(sourceId, "matpin_outbound_dedup_invalid");
  return createHmac("sha256", dataSecret())
    .update(`outbound-dedup:${kind}:${source}`)
    .digest("hex");
}

export function hashMatpinOutboundSender(senderScopedId: string): string {
  const sender = requiredOutboundIdentity(senderScopedId, "matpin_outbound_sender_invalid");
  return createHmac("sha256", dataSecret())
    .update(`outbound-sender:${sender}`)
    .digest("hex");
}

export function hashMatpinOutboundProviderMessage(providerMessageId: string): string {
  const providerMessage = requiredOutboundIdentity(
    providerMessageId,
    "matpin_outbound_provider_message_invalid",
  );
  return createHmac("sha256", dataSecret())
    .update(`outbound-provider:${providerMessage}`)
    .digest("hex");
}

export function createMatpinAccessToken(senderScopedId: string): string {
  return createHmac("sha256", requiredSecret("MATPIN_LINK_SECRET"))
    .update(`matpin-user:${senderScopedId}`)
    .digest("base64url");
}

export function hashMatpinAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createMatpinShortLinkCode(senderScopedId: string): string {
  return createHmac("sha256", requiredSecret("MATPIN_LINK_SECRET"))
    .update(`matpin-short-link:${senderScopedId}`)
    .digest("base64url")
    .slice(0, 16);
}

export function hashMatpinShortLinkCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export function verifyMatpinWorkerRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  const received = bearerToken(request);
  return Boolean(expected && received && safeEqual(expected, received));
}
