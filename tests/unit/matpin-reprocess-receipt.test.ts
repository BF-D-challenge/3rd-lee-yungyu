import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260809174423_add_matpin_delivery_attempt_claims.sql",
), "utf8").toLowerCase();

function sqlBetween(start: string, end: string): string {
  const startIndex = migration.indexOf(start);
  const endIndex = migration.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return migration.slice(startIndex, endIndex);
}

describe("Matpin reply-required reprocess receipt gate", () => {
  it("replaces a cleaned receipt with a payload-free terminal receipt before queueing", () => {
    const claimOutbound = sqlBetween(
      "create function public.matpin_claim_next_outbound",
      "create function public.matpin_begin_outbound_send",
    );
    const requeue = sqlBetween(
      "create or replace function public.matpin_requeue_failed_message(",
      "create or replace function public.matpin_requeue_failed_message_without_reply",
    );

    expect(claimOutbound).toContain("delivery.expires_at <= now()");
    expect(claimOutbound).toContain("message.status not in ('received', 'processing')");
    expect(requeue).toContain("v_next_generation := v_outbound_generation + 1");
    expect(requeue).toContain("'outbound-dedup:receipt:reprocess:'");
    expect(requeue).toContain("'receipt'");
    expect(requeue).toContain("v_next_generation");
    expect(requeue).toContain("'superseded'");
    expect(requeue).toContain("'explicit_reprocess_no_receipt'");
    expect(requeue).toContain("now() + interval '7 days'");
    expect(requeue).toContain("outbound_generation = v_next_generation");
    expect(requeue.indexOf("insert into public.matpin_outbound_deliveries"))
      .toBeLessThan(requeue.indexOf("select pgmq.send("));
  });

  it("requires the same generation at enqueue, completion, and final leasing", () => {
    const enqueue = sqlBetween(
      "create function public.matpin_enqueue_analysis_once",
      "create function public.matpin_ingest_webhook_batch",
    );
    const claimOutbound = sqlBetween(
      "create function public.matpin_claim_next_outbound",
      "create function public.matpin_begin_outbound_send",
    );
    const complete = sqlBetween(
      "create function public.matpin_complete_analysis_v2",
      "create function public.matpin_stage_places",
    );

    expect(enqueue).toContain("delivery.generation = v_message.outbound_generation");
    expect(complete).toContain("receipt.generation = v_message.outbound_generation");
    expect(complete).toContain("perform pgmq.delete('matpin-instagram', p_queue_message_id)");
    expect(complete).toContain("insert into public.matpin_outbound_deliveries");
    expect(claimOutbound).toContain("receipt.generation = delivery.generation");
  });

  it("keeps the without-reply admin reprocess free of synthetic receipts", () => {
    const withoutReply = sqlBetween(
      "create or replace function public.matpin_requeue_failed_message_without_reply",
      "-- strict maintenance makes these internal v1 write paths safe to remove",
    );

    expect(withoutReply).toContain("reply_required = false");
    expect(withoutReply).toContain("outbound_generation = outbound_generation + 1");
    expect(withoutReply).toContain("select pgmq.send(");
    expect(withoutReply).not.toContain("explicit_reprocess_no_receipt");
    expect(withoutReply).not.toContain("'outbound-dedup:receipt:reprocess:'");
  });
});
