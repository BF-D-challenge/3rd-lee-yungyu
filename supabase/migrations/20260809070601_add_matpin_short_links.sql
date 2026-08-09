alter table public.matpin_instagram_users
  add column short_link_hash text;

alter table public.matpin_instagram_users
  add constraint matpin_instagram_users_short_link_hash_check
  check (short_link_hash is null or length(short_link_hash) = 64);

create unique index matpin_instagram_users_short_link_hash_idx
  on public.matpin_instagram_users (short_link_hash)
  where short_link_hash is not null;

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

revoke all on function public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) to service_role;
