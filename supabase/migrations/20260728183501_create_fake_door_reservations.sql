create table if not exists public.fake_door_reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product     text not null check (
    product in ('matpick', 'onebite', 'today', 'story-cards')
  ),
  slot_key    text not null check (
    slot_key in ('this-week', 'next-week', 'launch-notice')
  ),
  status      text not null default 'reserved' check (
    status in ('reserved', 'cancelled')
  ),
  source_path text not null default '/' check (
    char_length(source_path) between 1 and 240
    and left(source_path, 1) = '/'
  ),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product)
);

create index if not exists idx_fake_door_reservations_product_created
  on public.fake_door_reservations (product, created_at desc);

drop trigger if exists trg_fake_door_reservations_updated_at
  on public.fake_door_reservations;
create trigger trg_fake_door_reservations_updated_at
  before update on public.fake_door_reservations
  for each row execute function public.set_updated_at();

alter table public.fake_door_reservations enable row level security;

revoke all on table public.fake_door_reservations from anon;
revoke all on table public.fake_door_reservations from authenticated;
grant select, insert, update on table public.fake_door_reservations to authenticated;
grant all on table public.fake_door_reservations to service_role;

drop policy if exists fake_door_reservations_select_own
  on public.fake_door_reservations;
create policy fake_door_reservations_select_own
  on public.fake_door_reservations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists fake_door_reservations_insert_own
  on public.fake_door_reservations;
create policy fake_door_reservations_insert_own
  on public.fake_door_reservations
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'reserved'
  );

drop policy if exists fake_door_reservations_update_own
  on public.fake_door_reservations;
create policy fake_door_reservations_update_own
  on public.fake_door_reservations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
