import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type Channel = "card" | "duel";
type Action = "register" | "cast" | "comment" | "read";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;
const REQUEST_ID_PATTERN = /^feedback_[A-Za-z0-9_-]{20,128}$/;
const CARD_KINDS = new Set(["need", "notify", "watch", "cheer"]);
const DUEL_SIDES = new Set(["a", "b"]);
const PRAISE_IDS = new Set(["need", "notify", "cheer"]);
const MAX_BODY_BYTES = 16_384;
const MAX_COMMENT_LENGTH = 1_000;

const encoder = new TextEncoder();

const json = (status: number, body: Record<string, unknown>, origin = "*") => new Response(
  JSON.stringify(body),
  {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Vary": "Origin",
    },
  },
);

const hash = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const text = (value: unknown, max: number, required = false): string | null => {
  if (value === undefined || value === null) return required ? null : "";
  if (typeof value !== "string") return null;
  const clean = value.trim();
  if ((required && !clean) || clean.length > max) return null;
  return clean;
};

const token = (value: unknown): string | null => (
  typeof value === "string" && TOKEN_PATTERN.test(value) ? value : null
);

const requestId = (value: unknown): string | null => (
  typeof value === "string" && REQUEST_ID_PATTERN.test(value) ? value : null
);

const channel = (value: unknown): Channel | null => (
  value === "card" || value === "duel" ? value : null
);

const action = (value: unknown): Action | null => (
  value === "register" || value === "cast" || value === "comment" || value === "read" ? value : null
);

const clientIp = (request: Request): string => (
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  || request.headers.get("cf-connecting-ip")
  || "unknown"
);

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "*";
  if (request.method === "OPTIONS") return json(200, { ok: true }, origin);
  if (request.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" }, origin);

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "payload_too_large" }, origin);
  }

  const raw = await request.text();
  if (encoder.encode(raw).byteLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "payload_too_large" }, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: "invalid_json" }, origin);
  }

  const requestedAction = action(body.action);
  const requestedChannel = channel(body.channel);
  const requestedId = requestId(body.requestId);
  if (!requestedAction || !requestedChannel || !requestedId) {
    return json(400, { ok: false, error: "invalid_request" }, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json(503, { ok: false, error: "service_unavailable" }, origin);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ipHash = await hash(`${clientIp(request)}:${request.headers.get("user-agent") ?? ""}`);
  const mutation = requestedAction !== "read";
  const requestLimit = requestedAction === "read" ? 180 : requestedAction === "register" ? 30 : 120;
  const requestBucket = requestedAction === "register"
    ? `${requestedAction}:${ipHash}`
    : `${requestedAction}:${requestedId}:${ipHash}`;
  const { data: allowed, error: rateError } = await supabase.rpc("consume_feedback_rate_limit", {
    p_bucket: requestBucket,
    p_limit: requestLimit,
    p_window_seconds: 300,
  });
  if (rateError) return json(503, { ok: false, error: "rate_limit_unavailable" }, origin);
  if (allowed !== true) return json(429, { ok: false, error: "rate_limited" }, origin);
  if (mutation && requestedAction !== "register") {
    const { data: globallyAllowed, error: globalRateError } = await supabase.rpc("consume_feedback_rate_limit", {
      p_bucket: `mutation:${ipHash}`,
      p_limit: 300,
      p_window_seconds: 300,
    });
    if (globalRateError) return json(503, { ok: false, error: "rate_limit_unavailable" }, origin);
    if (globallyAllowed !== true) return json(429, { ok: false, error: "rate_limited" }, origin);
  }

  if (requestedAction === "register") {
    const writeToken = token(body.writeToken);
    const readToken = token(body.readToken);
    if (!writeToken || !readToken || writeToken === readToken) {
      return json(400, { ok: false, error: "invalid_token" }, origin);
    }
    const writeHash = await hash(writeToken);
    const readHash = await hash(readToken);
    const { data: existing, error: existingError } = await supabase
      .from("feedback_requests")
      .select("write_token_hash,read_token_hash")
      .eq("channel", requestedChannel)
      .eq("request_id", requestedId)
      .maybeSingle();
    if (existingError) return json(500, { ok: false, error: "database_error" }, origin);
    if (existing) {
      const matches = existing.write_token_hash === writeHash && existing.read_token_hash === readHash;
      return json(matches ? 200 : 409, { ok: matches, error: matches ? undefined : "request_exists" }, origin);
    }
    const { error } = await supabase.from("feedback_requests").insert({
      channel: requestedChannel,
      request_id: requestedId,
      write_token_hash: writeHash,
      read_token_hash: readHash,
    });
    if (error) return json(error.code === "23505" ? 409 : 500, { ok: false, error: "registration_failed" }, origin);
    return json(201, { ok: true }, origin);
  }

  const suppliedToken = token(requestedAction === "read" ? body.readToken : body.writeToken);
  if (!suppliedToken) return json(401, { ok: false, error: "invalid_token" }, origin);
  const suppliedHash = await hash(suppliedToken);
  const tokenColumn = requestedAction === "read" ? "read_token_hash" : "write_token_hash";
  const { data: registered, error: authError } = await supabase
    .from("feedback_requests")
    .select("request_id")
    .eq("channel", requestedChannel)
    .eq("request_id", requestedId)
    .eq(tokenColumn, suppliedHash)
    .maybeSingle();
  if (authError) return json(500, { ok: false, error: "database_error" }, origin);
  if (!registered) return json(401, { ok: false, error: "unauthorized" }, origin);

  if (requestedAction === "read") {
    if (requestedChannel === "card") {
      const excludeVoterToken = text(body.excludeVoterToken, 256);
      if (excludeVoterToken === null) return json(400, { ok: false, error: "invalid_voter" }, origin);
      let query = supabase
        .from("card_votes")
        .select("id,kind,comment,created_at")
        .eq("slug", requestedId)
        .order("created_at", { ascending: true });
      if (excludeVoterToken) {
        query = query.neq("voter_fp", await hash(`${requestedId}:${excludeVoterToken}`));
      }
      const { data, error } = await query;
      if (error) return json(500, { ok: false, error: "database_error" }, origin);
      return json(200, {
        ok: true,
        votes: (data ?? []).map((row) => ({
          id: row.id,
          type: row.kind,
          comment: row.comment ?? undefined,
          at: new Date(row.created_at).getTime(),
        })),
      }, origin);
    }
    const { data, error } = await supabase
      .from("duel_votes")
      .select("side,comment,created_at")
      .eq("slug", requestedId)
      .order("created_at", { ascending: true });
    if (error) return json(500, { ok: false, error: "database_error" }, origin);
    const votes = { a: 0, b: 0, comments: [] as Array<{ side: "a" | "b"; text: string; at: number }> };
    for (const row of data ?? []) {
      const side = row.side as "a" | "b";
      votes[side] += 1;
      if (row.comment) votes.comments.push({ side, text: row.comment, at: new Date(row.created_at).getTime() });
    }
    return json(200, { ok: true, votes }, origin);
  }

  const voterToken = text(body.voterToken, 256, true);
  if (!voterToken) return json(400, { ok: false, error: "invalid_voter" }, origin);
  const voterHash = await hash(`${requestedId}:${voterToken}`);
  const comment = text(body.comment, MAX_COMMENT_LENGTH);
  if (comment === null) return json(400, { ok: false, error: "invalid_comment" }, origin);

  if (requestedAction === "comment") {
    const table = requestedChannel === "card" ? "card_votes" : "duel_votes";
    const { error } = await supabase
      .from(table)
      .update({ comment: comment || null })
      .eq("slug", requestedId)
      .eq("voter_fp", voterHash);
    if (error) return json(500, { ok: false, error: "database_error" }, origin);
    return json(200, { ok: true }, origin);
  }

  if (requestedChannel === "card") {
    const kind = text(body.kind, 16, true);
    if (!kind || !CARD_KINDS.has(kind)) return json(400, { ok: false, error: "invalid_kind" }, origin);
    const { error } = await supabase.from("card_votes").upsert(
      {
        slug: requestedId,
        kind,
        comment: comment || null,
        voter_fp: voterHash,
      },
      { onConflict: "slug,voter_fp", ignoreDuplicates: true },
    );
    if (error) return json(500, { ok: false, error: "database_error" }, origin);
    return json(200, { ok: true }, origin);
  }

  const side = text(body.side, 4, true);
  if (!side || !DUEL_SIDES.has(side)) return json(400, { ok: false, error: "invalid_side" }, origin);
  const praiseId = text(body.praiseId, 16);
  if (praiseId === null || (praiseId && !PRAISE_IDS.has(praiseId))) {
    return json(400, { ok: false, error: "invalid_praise" }, origin);
  }
  const roundId = text(body.roundId, 160);
  const userId = text(body.userId, 256);
  const candidateId = text(body.candidateId, 256);
  const idempotencyKey = text(body.idempotencyKey, 512);
  if ([roundId, userId, candidateId, idempotencyKey].some((value) => value === null)) {
    return json(400, { ok: false, error: "invalid_metadata" }, origin);
  }
  const { error } = await supabase.from("duel_votes").upsert(
    {
      slug: requestedId,
      side,
      comment: comment || null,
      voter_fp: voterHash,
      round_id: roundId || null,
      user_id: userId ? await hash(userId) : null,
      candidate_id: candidateId || null,
      praise_id: praiseId || null,
      idempotency_key: idempotencyKey ? await hash(idempotencyKey) : null,
    },
    {
      onConflict: idempotencyKey ? "idempotency_key" : "slug,voter_fp",
      ignoreDuplicates: true,
    },
  );
  if (error && error.code !== "23505") return json(500, { ok: false, error: "database_error" }, origin);
  return json(200, { ok: true }, origin);
});
