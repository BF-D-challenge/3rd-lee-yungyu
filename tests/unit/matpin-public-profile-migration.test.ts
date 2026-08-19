import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260813172618_add_matpin_public_profiles.sql",
), "utf8");
const managerMigration = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260815052306_add_matpin_manager_binding.sql",
), "utf8");
const managerIndexRestore = readFileSync(join(
  process.cwd(),
  "supabase/migrations/20260815052350_restore_matpin_manager_fk_index.sql",
), "utf8");

describe("Matpin public profile migration", () => {
  it("keeps public profiles opt-in and service-role only", () => {
    expect(migration).toContain("is_public boolean not null default false");
    expect(migration).toContain("sender_hash text primary key");
    expect(migration).toContain("on delete cascade");
    expect(migration).toContain("publication_authorized_at timestamptz");
    expect(migration).toContain("publication_authorization_source in ('operator_manual', 'user_request')");
    expect(migration).toContain("publication_authorization_source is not null");
    expect(migration).toContain("username_verified_at timestamptz");
    expect(migration).toContain("create unique index matpin_public_profiles_visible_username_idx");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.matpin_public_profiles from public, anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).not.toContain("grant select on table public.matpin_public_profiles to anon");
    expect(migration).not.toContain("access_token");
    expect(migration).not.toContain("sender_ciphertext");
  });

  it("binds destructive management to a verified auth user without changing chat-based saves", () => {
    expect(managerMigration).toContain("alter table public.matpin_instagram_users");
    expect(managerMigration).toContain("manager_user_id uuid references auth.users(id) on delete set null");
    expect(managerMigration).toContain("manager_linked_at timestamptz");
    expect(managerMigration).toContain("matpin_instagram_users_manager_link_check");
    expect(managerIndexRestore).toContain("matpin_instagram_users_manager_user_idx");
    expect(managerMigration).not.toContain("manager_user_id uuid unique");
  });

  it("accepts only normalized Instagram usernames", () => {
    expect(migration).toContain("username = lower(username)");
    expect(migration).toContain("char_length(username) between 1 and 30");
    expect(migration).toContain("username !~ '\\.\\.'");
  });
});
