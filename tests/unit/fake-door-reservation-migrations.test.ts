import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSql = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8").replace(/\s+/g, " ").trim();

const createReservations = readSql(
  "supabase/migrations/20260728183501_create_fake_door_reservations.sql",
);
const createTodayQueue = readSql(
  "supabase/migrations/20260728192204_create_today_delivery_queue.sql",
);
const addInstagram = readSql(
  "supabase/migrations/20260731104500_add_instagram_handle_to_fake_door_reservations.sql",
);
const addLeadCapture = readSql(
  "supabase/migrations/20260801065914_add_fake_door_lead_capture.sql",
);
const schema = readSql("supabase/schema.sql");

describe("reservation migration and schema parity", () => {
  it("keeps the same four products, slots, RLS ownership, and Data API grants", () => {
    for (const fragment of [
      "product in ('matpick', 'onebite', 'today', 'story-cards')",
      "slot_key in ('this-week', 'next-week', 'launch-notice')",
      "alter table public.fake_door_reservations enable row level security",
      "grant select, insert, update on table public.fake_door_reservations to authenticated",
      "using ((select auth.uid()) = user_id)",
      "with check ((select auth.uid()) = user_id)",
    ]) {
      expect(createReservations).toContain(fragment);
      expect(schema).toContain(fragment);
    }
  });

  it("requires a normalized Instagram handle only for matpick and onebite", () => {
    const instagramCheck =
      "char_length(instagram_handle) between 1 and 30 and instagram_handle ~ '^[a-z0-9_]+([.][a-z0-9_]+)*$'";

    expect(addInstagram).toContain(instagramCheck);
    expect(addInstagram).toContain("instagram_handle is null and product not in ('matpick', 'onebite')");
    expect(addInstagram).toContain("product in ('matpick', 'onebite') and instagram_handle is not null");
    expect(addInstagram).not.toContain("alter column instagram_handle set not null");
    expect(schema).toContain("instagram_handle text check");
    expect(schema).toContain("instagram_handle is null and product not in ('matpick', 'onebite')");
    expect(schema).toContain("product in ('matpick', 'onebite') and instagram_handle is not null");
    expect(schema).toContain(instagramCheck);
  });

  it("keeps the private Today queue, service role grants, and worker RPCs in schema", () => {
    for (const fragment of [
      "create table if not exists public.today_jobs",
      "alter table public.today_jobs enable row level security",
      "revoke all on table public.today_jobs from anon, authenticated",
      "grant select, insert, update, delete on table public.today_jobs to service_role",
      "select pgmq.create('today-production')",
      "public.today_enqueue_job",
      "public.today_claim_next_job",
      "public.today_complete_job",
      "public.today_retry_job",
    ]) {
      expect(createTodayQueue).toContain(fragment);
      expect(schema).toContain(fragment);
    }
  });

  it("stores consent and bounded acquisition fields without copying email into the public table", () => {
    for (const fragment of [
      "contact_consent_at timestamptz",
      "privacy_version text",
      "privacy_version = '2026-08-01'",
      "acquisition_source text",
      "utm_source text",
      "utm_medium text",
      "utm_campaign text",
      "utm_content text",
      "utm_term text",
      "char_length(utm_campaign) between 1 and 120",
    ]) {
      expect(addLeadCapture).toContain(fragment);
      expect(schema).toContain(fragment);
    }
    expect(addLeadCapture).toContain("alter column contact_consent_at set not null");
    expect(addLeadCapture).toContain("alter column privacy_version set not null");
    expect(schema).toContain("contact_consent_at timestamptz not null");
    expect(schema).not.toContain("contact_email text");
  });

  it("exposes verified Google email only through a private service-role lead view", () => {
    for (const fragment of [
      "create or replace view private.fake_door_reservation_leads",
      "u.email as contact_email",
      "join auth.users u on u.id = r.user_id",
      "revoke all on table private.fake_door_reservation_leads from public, anon, authenticated",
      "grant select on table private.fake_door_reservation_leads to service_role",
    ]) {
      expect(addLeadCapture).toContain(fragment);
      expect(schema).toContain(fragment);
    }
    expect(addLeadCapture).not.toContain("grant select on table private.fake_door_reservation_leads to authenticated");
  });
});
