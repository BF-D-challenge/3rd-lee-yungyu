alter table public.matpin_instagram_messages
  add column reply_required boolean not null default true;

create or replace function public.matpin_backfill_message(
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
begin
  if p_short_link_hash is null or length(p_short_link_hash) <> 64 then
    raise exception 'invalid matpin short link hash';
  end if;

  if p_attachment_type not in ('share', 'ig_reel', 'reel') then
    raise exception 'invalid matpin backfill attachment type';
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
    reply_required,
    received_at
  ) values (
    p_meta_message_id,
    p_sender_hash,
    p_reel_id,
    p_reel_url,
    p_attachment_type,
    p_media_url_ciphertext,
    false,
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

revoke all on function public.matpin_backfill_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.matpin_claim_next_message() from public, anon, authenticated;

grant execute on function public.matpin_backfill_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) to service_role;
grant execute on function public.matpin_claim_next_message() to service_role;
