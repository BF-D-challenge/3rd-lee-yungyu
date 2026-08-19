alter table public.matpin_instagram_users
  add column manager_user_id uuid references auth.users(id) on delete set null,
  add column manager_linked_at timestamptz,
  add constraint matpin_instagram_users_manager_link_check check (
    (manager_user_id is null and manager_linked_at is null)
    or (manager_user_id is not null and manager_linked_at is not null)
  );

comment on column public.matpin_instagram_users.manager_user_id is
  'Verified Supabase Auth user first linked while holding this Instagram chat account private access token.';

create index matpin_instagram_users_manager_user_idx
  on public.matpin_instagram_users (manager_user_id)
  where manager_user_id is not null;
