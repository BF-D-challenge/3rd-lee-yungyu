create table public.matpin_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  sender_hash text not null check (length(sender_hash) = 64),
  message_id uuid references public.matpin_instagram_messages(id) on delete set null,
  action text not null
    check (action in ('manual_reply', 'reprocess', 'resend_library')),
  idempotency_key uuid not null,
  payload_sha256 text check (payload_sha256 is null or length(payload_sha256) = 64),
  payload_length integer check (payload_length is null or payload_length between 0 and 1000),
  meta_message_id text,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  error_code text check (error_code is null or length(error_code) <= 200),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (admin_user_id, idempotency_key)
);

create index matpin_admin_actions_sender_created_idx
  on public.matpin_admin_actions (sender_hash, created_at desc);

create index matpin_admin_actions_status_created_idx
  on public.matpin_admin_actions (status, created_at desc);

alter table public.matpin_admin_actions enable row level security;

revoke all on table public.matpin_admin_actions from public, anon, authenticated;
grant select, insert, update on table public.matpin_admin_actions to service_role;
