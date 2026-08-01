import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  todayApplicationSchema,
  type TodayApplication,
  type TodayApplicationRequest,
  type TodayArtifacts,
} from "@/lib/today-contract";

type TodayJobRow = {
  id: string;
  access_token_hash: string;
  email: string;
  masked_email: string;
  status: TodayApplication["status"];
  idea: TodayApplication["idea"];
  channel: TodayApplication["channel"];
  signal: TodayApplication["signal"];
  artifacts: TodayArtifacts | null;
  submitted_at: string;
  ready_at: string;
  emailed_at: string | null;
  attempt_count: number;
  last_error: string | null;
};

export class TodayDeliveryConfigurationError extends Error {
  constructor() {
    super("today_delivery_not_configured");
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new TodayDeliveryConfigurationError();
  return value;
}

export function getTodayServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new TodayDeliveryConfigurationError();
  return createClient(url, requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function maskTodayEmail(email: string): string {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"*".repeat(Math.max(2, name.length - 2))}@${domain}`;
}

export function createTodayAccessToken(jobId: string): string {
  return createHmac("sha256", requiredEnv("TODAY_LINK_SECRET"))
    .update(`today-job:${jobId}`)
    .digest("base64url");
}

export function hashTodayAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeTokenMatch(expectedHash: string, token: string): boolean {
  const actual = Buffer.from(hashTodayAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function toPublicTodayApplication(row: TodayJobRow): TodayApplication {
  return todayApplicationSchema.parse({
    id: row.id,
    submittedAt: row.submitted_at,
    readyAt: row.ready_at,
    status: row.status,
    maskedEmail: row.masked_email,
    idea: row.idea,
    channel: row.channel,
    signal: row.signal,
    artifacts: row.artifacts,
    emailedAt: row.emailed_at,
    attemptCount: row.attempt_count,
    notice: row.status === "ready"
      ? "완료된 결과는 이 링크에서 다시 열 수 있어요."
      : "완료되면 입력한 이메일로 전용 결과 링크를 보내드려요.",
  });
}

export async function enqueueTodayApplication(
  input: TodayApplicationRequest,
): Promise<{ job: TodayApplication; accessToken: string }> {
  const client = getTodayServerClient();
  const id = crypto.randomUUID();
  const accessToken = createTodayAccessToken(id);
  const submittedAt = new Date();
  const delaySeconds = Math.max(0, Number(process.env.TODAY_JOB_DELAY_SECONDS ?? 86_400));
  const readyAt = new Date(submittedAt.getTime() + delaySeconds * 1_000);

  const row = {
    id,
    access_token_hash: hashTodayAccessToken(accessToken),
    email: input.email,
    masked_email: maskTodayEmail(input.email),
    status: "queued",
    idea: input.idea,
    channel: input.channel,
    signal: input.signal,
    submitted_at: submittedAt.toISOString(),
    ready_at: readyAt.toISOString(),
  };

  const { data, error } = await client
    .from("today_jobs")
    .insert(row)
    .select("*")
    .single<TodayJobRow>();
  if (error || !data) throw new Error(`today_job_insert_failed:${error?.message ?? "empty"}`);

  const { error: queueError } = await client.rpc("today_enqueue_job", {
    p_job_id: id,
    p_delay_seconds: delaySeconds,
  });
  if (queueError) {
    await client.from("today_jobs").delete().eq("id", id);
    throw new Error(`today_queue_enqueue_failed:${queueError.message}`);
  }

  return { job: toPublicTodayApplication(data), accessToken };
}

export async function readTodayApplication(
  id: string,
  accessToken: string,
): Promise<TodayApplication | null> {
  const client = getTodayServerClient();
  const { data, error } = await client
    .from("today_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle<TodayJobRow>();
  if (error) throw new Error(`today_job_read_failed:${error.message}`);
  if (!data || !safeTokenMatch(data.access_token_hash, accessToken)) return null;
  return toPublicTodayApplication(data);
}

export async function cancelTodayApplication(id: string, accessToken: string): Promise<boolean> {
  const client = getTodayServerClient();
  const { data, error } = await client
    .from("today_jobs")
    .select("access_token_hash")
    .eq("id", id)
    .maybeSingle<{ access_token_hash: string }>();
  if (error) throw new Error(`today_job_cancel_read_failed:${error.message}`);
  if (!data || !safeTokenMatch(data.access_token_hash, accessToken)) return false;
  const result = await client
    .from("today_jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["queued", "delivery_failed"]);
  if (result.error) throw new Error(`today_job_cancel_failed:${result.error.message}`);
  return true;
}
