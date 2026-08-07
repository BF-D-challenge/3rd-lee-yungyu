create extension if not exists pgmq;

create table public.matpin_instagram_users (
  sender_hash text primary key,
  sender_ciphertext text not null,
  access_token_hash text not null unique,
  link_expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(sender_hash) = 64),
  check (length(access_token_hash) = 64)
);

create table public.matpin_instagram_messages (
  id uuid primary key default gen_random_uuid(),
  meta_message_id text not null unique,
  sender_hash text not null references public.matpin_instagram_users(sender_hash) on delete cascade,
  reel_id text not null,
  reel_url text,
  attachment_type text not null
    check (attachment_type in ('share', 'video', 'ig_reel', 'reel')),
  media_url_ciphertext text,
  status text not null default 'received'
    check (status in ('received', 'processing', 'needs_confirmation', 'saved', 'failed', 'deleted')),
  candidates jsonb not null default '[]'::jsonb,
  selected_place_id text,
  analysis_model text,
  analysis_duration_ms integer check (analysis_duration_ms is null or analysis_duration_ms >= 0),
  media_bytes integer check (media_bytes is null or media_bytes >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  attempt_count integer not null default 0 check (attempt_count between 0 and 10),
  last_error text,
  received_at timestamptz not null default now(),
  started_at timestamptz,
  analyzed_at timestamptz,
  replied_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (sender_hash, reel_id),
  check (jsonb_typeof(candidates) = 'array')
);

create table public.matpin_saved_places (
  id bigint generated always as identity primary key,
  sender_hash text not null references public.matpin_instagram_users(sender_hash) on delete cascade,
  message_id uuid not null unique references public.matpin_instagram_messages(id) on delete cascade,
  reel_id text not null,
  reel_url text,
  place jsonb not null,
  confirmation_source text not null
    check (confirmation_source in ('automatic_high_confidence', 'user_confirmation')),
  saved_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (sender_hash, reel_id),
  check (jsonb_typeof(place) = 'object')
);

create index matpin_messages_sender_status_received_idx
  on public.matpin_instagram_messages (sender_hash, status, received_at desc);

create index matpin_saved_places_sender_saved_idx
  on public.matpin_saved_places (sender_hash, saved_at desc)
  where deleted_at is null;

alter table public.matpin_instagram_users enable row level security;
alter table public.matpin_instagram_messages enable row level security;
alter table public.matpin_saved_places enable row level security;

revoke all on table public.matpin_instagram_users from anon, authenticated;
revoke all on table public.matpin_instagram_messages from anon, authenticated;
revoke all on table public.matpin_saved_places from anon, authenticated;
revoke all on sequence public.matpin_saved_places_id_seq from anon, authenticated;

grant select, insert, update, delete on table public.matpin_instagram_users to service_role;
grant select, insert, update, delete on table public.matpin_instagram_messages to service_role;
grant select, insert, update, delete on table public.matpin_saved_places to service_role;
grant usage, select on sequence public.matpin_saved_places_id_seq to service_role;

select pgmq.create('matpin-instagram');

create or replace function public.matpin_ingest_message(
  p_meta_message_id text,
  p_sender_hash text,
  p_sender_ciphertext text,
  p_access_token_hash text,
  p_reel_id text,
  p_reel_url text,
  p_attachment_type text,
  p_media_url_ciphertext text,
  p_received_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id uuid;
  v_queue_message_id bigint;
begin
  insert into public.matpin_instagram_users (
    sender_hash,
    sender_ciphertext,
    access_token_hash,
    link_expires_at,
    updated_at
  ) values (
    p_sender_hash,
    p_sender_ciphertext,
    p_access_token_hash,
    now() + interval '90 days',
    now()
  )
  on conflict (sender_hash) do update set
    sender_ciphertext = excluded.sender_ciphertext,
    access_token_hash = excluded.access_token_hash,
    link_expires_at = now() + interval '90 days',
    updated_at = now();

  insert into public.matpin_instagram_messages (
    meta_message_id,
    sender_hash,
    reel_id,
    reel_url,
    attachment_type,
    media_url_ciphertext,
    received_at
  ) values (
    p_meta_message_id,
    p_sender_hash,
    p_reel_id,
    p_reel_url,
    p_attachment_type,
    p_media_url_ciphertext,
    p_received_at
  )
  on conflict do nothing
  returning id into v_message_id;

  if v_message_id is null then
    return jsonb_build_object('accepted', false, 'duplicate', true);
  end if;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', v_message_id)
  ) into v_queue_message_id;

  return jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'messageId', v_message_id,
    'queueMessageId', v_queue_message_id
  );
end;
$$;

create or replace function public.matpin_claim_next_message()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_queue_message_id bigint;
  v_queue_body jsonb;
  v_message public.matpin_instagram_messages%rowtype;
  v_user public.matpin_instagram_users%rowtype;
begin
  select msg_id, message
  into v_queue_message_id, v_queue_body
  from pgmq.read('matpin-instagram', 45, 1)
  limit 1;

  if v_queue_message_id is null then
    return null;
  end if;

  update public.matpin_instagram_messages
  set
    status = 'processing',
    started_at = coalesce(started_at, now()),
    attempt_count = attempt_count + 1,
    last_error = null,
    updated_at = now()
  where id = (v_queue_body ->> 'message_id')::uuid
    and status in ('received', 'processing')
  returning * into v_message;

  if v_message.id is null then
    perform pgmq.delete('matpin-instagram', v_queue_message_id);
    return jsonb_build_object('skipped', true);
  end if;

  select * into v_user
  from public.matpin_instagram_users
  where sender_hash = v_message.sender_hash;

  return jsonb_build_object(
    'queueMessageId', v_queue_message_id,
    'message', to_jsonb(v_message),
    'user', to_jsonb(v_user)
  );
end;
$$;

create or replace function public.matpin_complete_analysis(
  p_message_id uuid,
  p_queue_message_id bigint,
  p_status text,
  p_candidates jsonb,
  p_analysis_model text,
  p_analysis_duration_ms integer,
  p_media_bytes integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_replied boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('needs_confirmation', 'saved', 'failed') then
    raise exception 'invalid matpin completion status';
  end if;

  update public.matpin_instagram_messages
  set
    status = p_status,
    candidates = coalesce(p_candidates, '[]'::jsonb),
    analysis_model = p_analysis_model,
    analysis_duration_ms = p_analysis_duration_ms,
    media_bytes = p_media_bytes,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    media_url_ciphertext = null,
    analyzed_at = now(),
    replied_at = case when p_replied then now() else replied_at end,
    last_error = null,
    updated_at = now()
  where id = p_message_id;

  perform pgmq.delete('matpin-instagram', p_queue_message_id);
end;
$$;

create or replace function public.matpin_retry_message(
  p_message_id uuid,
  p_queue_message_id bigint,
  p_error text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_count integer;
begin
  select attempt_count into v_attempt_count
  from public.matpin_instagram_messages
  where id = p_message_id;

  if coalesce(v_attempt_count, 0) >= 2 then
    update public.matpin_instagram_messages
    set
      status = 'failed',
      media_url_ciphertext = null,
      last_error = left(p_error, 500),
      analyzed_at = now(),
      updated_at = now()
    where id = p_message_id;
    perform pgmq.delete('matpin-instagram', p_queue_message_id);
    return 'failed';
  end if;

  update public.matpin_instagram_messages
  set
    status = 'received',
    last_error = left(p_error, 500),
    updated_at = now()
  where id = p_message_id;
  return 'retry';
end;
$$;

create or replace function public.matpin_confirm_place(
  p_message_id uuid,
  p_sender_hash text,
  p_place jsonb,
  p_confirmation_source text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_saved_id bigint;
begin
  if p_confirmation_source not in ('automatic_high_confidence', 'user_confirmation') then
    raise exception 'invalid matpin confirmation source';
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id and sender_hash = p_sender_hash
  for update;

  if v_message.id is null or v_message.status in ('failed', 'deleted') then
    raise exception 'matpin message unavailable';
  end if;

  insert into public.matpin_saved_places (
    sender_hash,
    message_id,
    reel_id,
    reel_url,
    place,
    confirmation_source,
    deleted_at
  ) values (
    v_message.sender_hash,
    v_message.id,
    v_message.reel_id,
    v_message.reel_url,
    p_place,
    p_confirmation_source,
    null
  )
  on conflict (sender_hash, reel_id) do update set
    message_id = excluded.message_id,
    reel_url = excluded.reel_url,
    place = excluded.place,
    confirmation_source = excluded.confirmation_source,
    saved_at = now(),
    deleted_at = null
  returning id into v_saved_id;

  update public.matpin_instagram_messages
  set selected_place_id = p_place ->> 'id', status = 'saved', updated_at = now()
  where id = v_message.id;

  return v_saved_id;
end;
$$;

create or replace function public.matpin_delete_saved_place(
  p_saved_id bigint,
  p_sender_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id uuid;
begin
  delete from public.matpin_saved_places
  where id = p_saved_id and sender_hash = p_sender_hash
  returning message_id into v_message_id;

  if v_message_id is null then
    return false;
  end if;

  update public.matpin_instagram_messages
  set
    status = 'deleted',
    candidates = '[]'::jsonb,
    selected_place_id = null,
    reel_url = null,
    media_url_ciphertext = null,
    updated_at = now()
  where id = v_message_id and sender_hash = p_sender_hash;

  return true;
end;
$$;

revoke all on function public.matpin_ingest_message(text, text, text, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.matpin_claim_next_message() from public, anon, authenticated;
revoke all on function public.matpin_complete_analysis(uuid, bigint, text, jsonb, text, integer, integer, integer, integer, integer, boolean) from public, anon, authenticated;
revoke all on function public.matpin_retry_message(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.matpin_confirm_place(uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.matpin_delete_saved_place(bigint, text) from public, anon, authenticated;

grant execute on function public.matpin_ingest_message(text, text, text, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.matpin_claim_next_message() to service_role;
grant execute on function public.matpin_complete_analysis(uuid, bigint, text, jsonb, text, integer, integer, integer, integer, integer, boolean) to service_role;
grant execute on function public.matpin_retry_message(uuid, bigint, text) to service_role;
grant execute on function public.matpin_confirm_place(uuid, text, jsonb, text) to service_role;
grant execute on function public.matpin_delete_saved_place(bigint, text) to service_role;
