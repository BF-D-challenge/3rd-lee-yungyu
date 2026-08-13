import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260809174423_add_matpin_delivery_attempt_claims.sql",
), "utf8").toLowerCase();

describe("Matpin durable outbound migration", () => {
  it("fails the cutover while an old analysis job is active", () => {
    const guard = migration.indexOf("matpin_outbox_cutover_requires_drained_messages");
    const table = migration.indexOf("create table public.matpin_outbound_deliveries");

    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(table);
    expect(migration).toContain("where status in ('received', 'processing')");
    expect(migration).toContain("lock table public.matpin_instagram_messages in share row exclusive mode");
    expect(migration).toContain("lock table public.matpin_admin_actions in share row exclusive mode");
    expect(migration).toContain("pgmq.\"q_matpin-instagram\"");
    expect(migration).toContain("where status = 'pending'");
  });

  it("keeps the outbox service-only and stores only encrypted payload fields", () => {
    expect(migration).toContain("kind in ('receipt', 'guidance', 'final')");
    expect(migration).toContain("dedup_hash text not null unique");
    expect(migration).toContain("recipient_ciphertext text");
    expect(migration).toContain("body_ciphertext text");
    expect(migration).not.toContain("raw_sender");
    expect(migration).not.toContain("raw_inbound");
    expect(migration).not.toContain("raw_reply");
    expect(migration).toContain("alter table public.matpin_outbound_deliveries enable row level security");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });

  it("distinguishes a recoverable pre-send lease from a terminal sending crash", () => {
    expect(migration).toContain("error_code = 'lease_expired_before_send'");
    expect(migration).toContain("error_code = 'send_lease_expired'");
    expect(migration).toContain("state = 'uncertain'");
    expect(migration).toContain("terminal_lease_token = lease_token");
    expect(migration).toContain("recipient_ciphertext = null");
    expect(migration).toContain("body_ciphertext = null");
  });

  it("opens analysis exactly once only after a terminal receipt", () => {
    expect(migration).toContain("analysis_queue_message_id = v_queue_message_id");
    expect(migration).toContain("analysis_enqueued_at = now()");
    expect(migration).toContain("matpin_receipt_not_terminal");
    expect(migration).toContain("perform public.matpin_enqueue_analysis_once(v_delivery.message_id)");
    expect(migration).toContain("delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded')");
    expect(migration).toContain("delivery.generation = v_message.outbound_generation");
    expect(migration).toContain("receipt.generation = delivery.generation");
  });

  it("removes v1 bypasses and preserves the backfill queue gate", () => {
    expect(migration).toContain("drop function if exists public.matpin_ingest_message");
    expect(migration).toContain("drop function if exists public.matpin_complete_analysis");
    expect(migration).toContain("drop function if exists public.matpin_mark_message_acknowledged");
    expect(migration).toContain("create or replace function public.matpin_backfill_message");
    expect(migration).toContain("analysis_queue_message_id is distinct from v_queue_message_id");
  });

  it("keeps an expired receipt proof until its analysis is terminal", () => {
    expect(migration).toContain("delivery.kind = 'receipt'\n        and message.status not in ('received', 'processing')");
    expect(migration).toContain("delivery.kind in ('final', 'guidance')");
    expect(migration).toContain("active_final.state in ('pending', 'leased', 'sending')");
  });

  it("never expires an active guidance delivery during webhook ingestion", () => {
    expect(migration).toContain("kind = 'guidance'\n        and state in ('succeeded', 'failed', 'uncertain', 'superseded')\n        and expires_at <= now()");
  });

  it("fences every analysis mutation with a rotated claim token", () => {
    expect(migration).toContain("add column analysis_claim_token uuid");
    expect(migration).toContain("add column analysis_completed_claim_token uuid");
    expect(migration).toContain("v_claim_token := gen_random_uuid()");
    expect(migration).toContain("v_message.analysis_claim_token is distinct from p_analysis_claim_token");
    expect(migration).toContain("v_message.analysis_completed_claim_token = p_analysis_claim_token");
    expect(migration).toContain("create function public.matpin_retry_message_v2");
    expect(migration).toContain("return 'complete_failed_required'");
    expect(migration).toContain("drop function if exists public.matpin_retry_message(uuid, bigint, text)");
  });

  it("fences the 300-second media cache owner below queue visibility", () => {
    expect(migration).toContain("add column claim_token uuid");
    expect(migration).toContain("add column completed_claim_token uuid");
    expect(migration).toContain("now() + interval '300 seconds'");
    expect(migration).toContain("v_cache.claim_token is distinct from p_claim_token");
    expect(migration).toContain("v_cache.completed_claim_token = p_claim_token");
    expect(migration).toContain("matpin_cache_claim_mismatch");
    expect(migration).toContain("public.matpin_release_media_analysis(text, uuid)");
  });

  it("returns exhausted claims to the app for a durable failed final", () => {
    expect(migration).toContain("'poisoned', v_poisoned");
    expect(migration).toContain("v_terminal_failure_required := v_message.attempt_count >= 2");
    expect(migration).toContain("'terminalfailurerequired', v_terminal_failure_required");
    expect(migration).toContain("attempt_count = case when v_poisoned then attempt_count else attempt_count + 1 end");
    expect(migration).not.toContain("perform pgmq.delete('matpin-instagram', v_queue_message_id);\n    return jsonb_build_object('skipped', true);\n  end if;\n\n  update public.matpin_instagram_messages\n  set\n    status = 'failed'");
    expect(migration).toContain("create function public.matpin_terminalize_unreadable_claim");
    expect(migration).toContain("'analysis_payload_unreadable'");
    expect(migration).toContain("grant execute on function public.matpin_terminalize_unreadable_claim(uuid, bigint, uuid)");
  });

  it("supersedes a late duplicate receipt after any terminal analysis or final", () => {
    expect(migration).toContain("v_message.status not in ('received', 'processing')");
    expect(migration).toContain("v_message.analyzed_at is not null");
    expect(migration).toContain("existing_final.kind = 'final'");
    expect(migration).not.toContain("existing_final.state = 'succeeded'");
    expect(migration).toContain("error_code = 'analysis_already_terminal'");
  });

  it("drops both legacy ingest overloads that bypass the queue gate", () => {
    expect(migration).toContain(
      "text, text, text, text, text, text, text, text, text, timestamptz",
    );
    expect(migration).toContain(
      "text, text, text, text, text, text, text, text, timestamptz",
    );
  });

  it("records a terminal synthetic receipt for reply-required reprocess", () => {
    expect(migration).toContain("'outbound-dedup:receipt:reprocess:'");
    expect(migration).toContain("'explicit_reprocess_no_receipt'");
    expect(migration).toContain("'receiptoutboundid', v_receipt_delivery_id");
    expect(migration).toContain("outbound_generation = v_next_generation");
  });
});
