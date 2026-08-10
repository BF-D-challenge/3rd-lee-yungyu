import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260809174423_add_matpin_delivery_attempt_claims.sql",
), "utf8").toLowerCase();

const privacyMigration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260809141659_matpin_admin_reprocess_privacy.sql",
), "utf8").toLowerCase();

function sqlBetween(start: string, end: string): string {
  const startIndex = migration.indexOf(start);
  const endIndex = migration.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return migration.slice(startIndex, endIndex);
}

describe("Matpin SQL privacy and atomicity regressions", () => {
  it("maps only domain-separated hashes and terminalizes guidance before account cascade", () => {
    const accountDelete = sqlBetween(
      "create or replace function public.matpin_delete_admin_actions_for_user()",
      "revoke all on function public.matpin_delete_admin_actions_for_user()",
    );
    const ingestion = sqlBetween(
      "create function public.matpin_ingest_webhook_batch",
      "create function public.matpin_claim_next_outbound",
    );

    expect(migration).toContain("add column outbound_sender_hash text");
    expect(migration).toContain("matpin_instagram_users_outbound_sender_hash_idx");
    expect(migration).toContain("never a raw meta identifier");
    expect(migration).toContain("account_sender_hash text");
    expect(migration).toContain("create table public.matpin_sender_outbound_mappings");
    expect(migration).toContain(
      "alter table public.matpin_sender_outbound_mappings enable row level security",
    );
    expect(migration).toContain("create table public.matpin_account_deletion_tombstones");
    expect(migration).toContain(
      "alter table public.matpin_account_deletion_tombstones enable row level security",
    );
    expect(ingestion).toContain("v_event ->> 'senderhash'");
    expect(ingestion).toContain("v_event ->> 'outboundsenderhash'");
    expect(ingestion).toContain("insert into public.matpin_sender_outbound_mappings");
    expect(ingestion).toContain("account_sender_hash");
    expect(ingestion).toContain("matpin_sender_mapping_mismatch");
    expect(ingestion).toContain("delete from public.matpin_account_deletion_tombstones");
    expect(ingestion).toContain("'account_deleted'");
    expect(ingestion).toContain("'queued', false");
    expect(ingestion).toContain("continue;");
    expect(accountDelete).toContain("old.outbound_sender_hash");
    expect(accountDelete).toContain("delivery.account_sender_hash = old.sender_hash");
    expect(accountDelete).toContain("from public.matpin_sender_outbound_mappings mapping");
    expect(accountDelete).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(accountDelete).toContain(
      "insert into public.matpin_account_deletion_tombstones",
    );
    expect(accountDelete).toContain(
      "state = case when state = 'sending' then 'uncertain' else 'superseded' end",
    );
    expect(accountDelete).toContain("recipient_ciphertext = null");
    expect(accountDelete).toContain("body_ciphertext = null");
    expect(accountDelete).toContain("terminal_lease_token = lease_token");
    expect(accountDelete).toContain("error_code = 'account_deleted'");
    expect(accountDelete).toContain("state in ('pending', 'leased', 'sending')");
    expect(accountDelete).not.toContain("delete from public.matpin_outbound_deliveries");
    expect(privacyMigration).toContain(
      "execute function public.matpin_delete_admin_actions_for_user()",
    );
  });

  it("cleans bounded deletion markers from the poller without waiting on locked rows", () => {
    const claim = sqlBetween(
      "create function public.matpin_claim_next_outbound",
      "create function public.matpin_begin_outbound_send",
    );

    expect(claim).toContain("delete from public.matpin_account_deletion_tombstones tombstone");
    expect(claim).toContain("delete from public.matpin_sender_outbound_mappings mapping");
    expect(claim).toContain("where expired.expires_at <= now()");
    expect(claim).toContain("for update skip locked");
    expect(claim).toContain("limit 100");
  });

  it("keeps analysis places private until the saved completion transaction", () => {
    const stage = sqlBetween(
      "create function public.matpin_stage_places",
      "create function public.matpin_retry_message_v2",
    );
    const complete = sqlBetween(
      "create function public.matpin_complete_analysis_v2",
      "create function public.matpin_stage_places",
    );

    expect(migration).toContain("create table public.matpin_staged_places");
    expect(migration).toContain("analysis_claim_token uuid not null");
    expect(migration).toContain("alter table public.matpin_staged_places enable row level security");
    expect(migration).toContain(
      "revoke all on table public.matpin_staged_places\n  from public, anon, authenticated",
    );
    expect(stage).toContain("insert into public.matpin_staged_places");
    expect(stage).not.toContain("insert into public.matpin_saved_places");
    expect(stage).not.toContain("selected_place_id");
    expect(complete).toContain("staged.analysis_claim_token = p_analysis_claim_token");
    expect(complete).toContain("v_staged_places is distinct from");
    expect(complete).toContain("matpin_staged_places_mismatch");
    expect(complete).toContain("insert into public.matpin_saved_places");
    expect(complete).toContain("delete from public.matpin_staged_places");
    expect(complete).toContain("for key share");
    expect(complete.indexOf("for key share")).toBeLessThan(complete.indexOf("for update"));
    expect(stage).toContain("for key share");
    expect(stage.indexOf("for key share")).toBeLessThan(stage.indexOf("for update"));
    expect(complete.indexOf("insert into public.matpin_saved_places"))
      .toBeLessThan(complete.indexOf("status = p_status"));
  });

  it("discards staged rows on retry, unreadable terminalization, a new claim, and reprocess", () => {
    const retry = sqlBetween(
      "create function public.matpin_retry_message_v2",
      "create function public.matpin_terminalize_unreadable_claim",
    );
    const unreadable = sqlBetween(
      "create function public.matpin_terminalize_unreadable_claim",
      "create or replace function public.matpin_backfill_message",
    );
    const claim = sqlBetween(
      "create or replace function public.matpin_claim_next_message()",
      "create or replace function public.matpin_requeue_failed_message(",
    );
    const replyReprocess = sqlBetween(
      "create or replace function public.matpin_requeue_failed_message(",
      "create or replace function public.matpin_requeue_failed_message_without_reply",
    );
    const silentReprocess = sqlBetween(
      "create or replace function public.matpin_requeue_failed_message_without_reply",
      "-- strict maintenance makes these internal v1 write paths safe to remove",
    );

    for (const sql of [retry, unreadable, claim, replyReprocess, silentReprocess]) {
      expect(sql).toContain("delete from public.matpin_staged_places");
    }

    expect(migration).toContain("and message.status <> 'saved'");
    for (const sql of [replyReprocess, silentReprocess]) {
      expect(sql).toContain("update public.matpin_saved_places");
      expect(sql).toContain("set deleted_at = coalesce(deleted_at, now())");
      expect(sql).toContain("where message_id = p_message_id");
    }
  });

  it("rejects null outbound lease tokens with null-safe comparisons", () => {
    const release = sqlBetween(
      "create function public.matpin_release_outbound_lease",
      "create function public.matpin_finish_outbound",
    );
    const finish = sqlBetween(
      "create function public.matpin_finish_outbound",
      "create function public.matpin_complete_analysis_v2",
    );

    for (const sql of [release, finish]) {
      expect(sql).toContain("if p_lease_token is null then");
      expect(sql).toContain("is distinct from p_lease_token");
      expect(sql).not.toContain("lease_token <> p_lease_token");
      expect(sql).not.toContain("terminal_lease_token <> p_lease_token");
    }
  });
});
