alter table public.matpin_instagram_messages
  add column acknowledged_at timestamptz;

alter table public.matpin_instagram_messages
  drop constraint if exists matpin_instagram_messages_sender_hash_reel_id_key;

create index if not exists matpin_messages_sender_media_received_idx
  on public.matpin_instagram_messages (sender_hash, reel_id, received_at desc);

create or replace function public.matpin_conversation_context(
  p_sender_hash text,
  p_reel_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_known_user boolean;
  v_inbound_message_count bigint;
  v_saved_place_count bigint;
  v_has_saved_media boolean;
begin
  if p_sender_hash is null or length(p_sender_hash) <> 64 then
    raise exception 'invalid matpin sender hash';
  end if;

  select exists (
    select 1
    from public.matpin_instagram_users
    where sender_hash = p_sender_hash
  ) into v_known_user;

  select count(*)
  from public.matpin_instagram_messages
  where sender_hash = p_sender_hash
    and status <> 'deleted'
  into v_inbound_message_count;

  select count(*)
  from public.matpin_saved_places
  where sender_hash = p_sender_hash
    and deleted_at is null
  into v_saved_place_count;

  select p_reel_id is not null and exists (
    select 1
    from public.matpin_saved_places
    where sender_hash = p_sender_hash
      and reel_id = p_reel_id
      and deleted_at is null
  ) into v_has_saved_media;

  return jsonb_build_object(
    'knownUser', v_known_user,
    'inboundMessageCount', v_inbound_message_count,
    'savedPlaceCount', v_saved_place_count,
    'hasSavedMedia', v_has_saved_media
  );
end;
$$;

create or replace function public.matpin_mark_message_acknowledged(
  p_message_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.matpin_instagram_messages
  set
    acknowledged_at = now(),
    updated_at = now()
  where id = p_message_id
    and reply_required = true
    and acknowledged_at is null;

  return found;
end;
$$;

create or replace function public.matpin_ingest_message(
  p_meta_message_id text,
  p_sender_hash text,
  p_sender_ciphertext text,
  p_access_token_hash text,
  p_short_link_hash text,
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
  v_acknowledged boolean;
  v_reply_required boolean;
begin
  if p_short_link_hash is null or length(p_short_link_hash) <> 64 then
    raise exception 'invalid matpin short link hash';
  end if;

  insert into public.matpin_instagram_users (
    sender_hash,
    sender_ciphertext,
    access_token_hash,
    short_link_hash,
    link_expires_at,
    updated_at
  ) values (
    p_sender_hash,
    p_sender_ciphertext,
    p_access_token_hash,
    p_short_link_hash,
    now() + interval '90 days',
    now()
  )
  on conflict (sender_hash) do update set
    sender_ciphertext = excluded.sender_ciphertext,
    access_token_hash = excluded.access_token_hash,
    short_link_hash = excluded.short_link_hash,
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
  on conflict (meta_message_id) do nothing
  returning id into v_message_id;

  if v_message_id is null then
    select id, acknowledged_at is not null, reply_required
    into v_message_id, v_acknowledged, v_reply_required
    from public.matpin_instagram_messages
    where meta_message_id = p_meta_message_id;

    return jsonb_build_object(
      'accepted', false,
      'duplicate', true,
      'messageId', v_message_id,
      'acknowledged', coalesce(v_acknowledged, false),
      'replyRequired', coalesce(v_reply_required, false)
    );
  end if;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', v_message_id)
  ) into v_queue_message_id;

  return jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'messageId', v_message_id,
    'queueMessageId', v_queue_message_id,
    'acknowledged', false,
    'replyRequired', true
  );
end;
$$;

revoke all on function public.matpin_conversation_context(text, text)
  from public, anon, authenticated;
revoke all on function public.matpin_mark_message_acknowledged(uuid)
  from public, anon, authenticated;
revoke all on function public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.matpin_conversation_context(text, text)
  to service_role;
grant execute on function public.matpin_mark_message_acknowledged(uuid)
  to service_role;
grant execute on function public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) to service_role;
