-- This cutover is intentionally strict. A live delivery or analysis job must
-- never cross the old direct-send contract and the durable outbox contract.
do $$
declare
  v_queue_has_messages boolean := false;
begin
  lock table public.matpin_instagram_messages in share row exclusive mode;
  lock table public.matpin_admin_actions in share row exclusive mode;
  lock table public.matpin_media_analysis_cache in share row exclusive mode;

  if pg_catalog.to_regclass('pgmq."q_matpin-instagram"') is not null then
    execute 'lock table pgmq."q_matpin-instagram" in share row exclusive mode';
    execute 'select exists (select 1 from pgmq."q_matpin-instagram")'
      into v_queue_has_messages;
  end if;

  if exists (
    select 1
    from public.matpin_instagram_messages
    where status in ('received', 'processing')
  ) or exists (
    select 1
    from public.matpin_admin_actions
    where status = 'pending'
  ) or v_queue_has_messages then
    raise exception 'matpin_outbox_cutover_requires_drained_messages';
  end if;
end;
$$;

alter table public.matpin_instagram_messages
  add column analysis_queue_message_id bigint,
  add column analysis_enqueued_at timestamptz,
  add column analysis_claim_token uuid,
  add column analysis_completed_claim_token uuid,
  add column analysis_claimed_at timestamptz,
  add column outbound_generation integer not null default 0
    check (outbound_generation between 0 and 1000000);

comment on column public.matpin_instagram_messages.analysis_queue_message_id is
  'PGMQ id set in the same transaction that first enqueues analysis.';
comment on column public.matpin_instagram_messages.analysis_enqueued_at is
  'Exactly-once analysis enqueue gate. A supported live message waits for a terminal receipt delivery.';
comment on column public.matpin_instagram_messages.analysis_claim_token is
  'Rotated for every queue lease and required by every analysis mutation.';
comment on column public.matpin_instagram_messages.analysis_completed_claim_token is
  'Retained after completion so a response-lost completion can be replayed idempotently.';
comment on column public.matpin_instagram_messages.analysis_claimed_at is
  'Time at which the current analysis claim token was issued.';
comment on column public.matpin_instagram_messages.outbound_generation is
  'Incremented only by an explicit failed-message reprocess so its final reply gets a new idempotency generation.';

-- Cache work can run for nearly the worker's 255-second deadline. A 300-second
-- fenced lease prevents duplicate owners while remaining below PGMQ's
-- 600-second crash-recovery visibility window.
delete from public.matpin_media_analysis_cache
where state = 'processing';

alter table public.matpin_media_analysis_cache
  add column claim_token uuid,
  add column completed_claim_token uuid;

update public.matpin_media_analysis_cache
set completed_claim_token = gen_random_uuid()
where state = 'ready';

alter table public.matpin_media_analysis_cache
  add constraint matpin_media_analysis_cache_claim_fence_check
  check (
    (
      state = 'processing'
      and claim_token is not null
      and completed_claim_token is null
      and lease_expires_at is not null
    )
    or (
      state = 'ready'
      and claim_token is null
      and completed_claim_token is not null
      and lease_expires_at is null
    )
  );

drop function public.matpin_complete_media_analysis(
  text, text, jsonb, text, integer, integer, integer, integer, integer
);
drop function public.matpin_release_media_analysis(text);

create or replace function public.matpin_claim_media_analysis(
  p_media_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_analysis_cache%rowtype;
  v_claim_token uuid := gen_random_uuid();
begin
  if p_media_key is null or length(trim(p_media_key)) not between 1 and 500 then
    raise exception 'invalid matpin media key';
  end if;

  insert into public.matpin_media_analysis_cache (
    media_key,
    state,
    claim_token,
    lease_expires_at,
    last_used_at
  ) values (
    trim(p_media_key),
    'processing',
    v_claim_token,
    now() + interval '300 seconds',
    now()
  )
  on conflict (media_key) do nothing
  returning * into v_cache;

  if v_cache.media_key is not null then
    return jsonb_build_object('state', 'owner', 'claimToken', v_claim_token);
  end if;

  select * into v_cache
  from public.matpin_media_analysis_cache
  where media_key = trim(p_media_key)
  for update;

  if v_cache.state = 'ready' and v_cache.invalidated_at is null then
    update public.matpin_media_analysis_cache
    set
      hit_count = hit_count + 1,
      last_used_at = now(),
      updated_at = now()
    where media_key = v_cache.media_key;

    return jsonb_build_object(
      'state', 'hit',
      'outcome', v_cache.outcome,
      'candidates', v_cache.candidates
    );
  end if;

  if v_cache.invalidated_at is not null
    or v_cache.lease_expires_at is null
    or v_cache.lease_expires_at <= now()
  then
    v_claim_token := gen_random_uuid();
    update public.matpin_media_analysis_cache
    set
      state = 'processing',
      outcome = null,
      candidates = '[]'::jsonb,
      analysis_model = null,
      analysis_duration_ms = null,
      media_bytes = null,
      input_tokens = null,
      output_tokens = null,
      total_tokens = null,
      claim_token = v_claim_token,
      completed_claim_token = null,
      lease_expires_at = now() + interval '300 seconds',
      completed_at = null,
      invalidated_at = null,
      last_used_at = now(),
      updated_at = now()
    where media_key = v_cache.media_key;

    return jsonb_build_object('state', 'owner', 'claimToken', v_claim_token);
  end if;

  return jsonb_build_object('state', 'pending');
end;
$$;

create function public.matpin_complete_media_analysis(
  p_media_key text,
  p_claim_token uuid,
  p_outcome text,
  p_candidates jsonb,
  p_analysis_model text,
  p_analysis_duration_ms integer,
  p_media_bytes integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_analysis_cache%rowtype;
begin
  if p_outcome not in ('resolved', 'insufficient') then
    raise exception 'invalid matpin cache outcome';
  end if;
  if jsonb_typeof(coalesce(p_candidates, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid matpin cache candidates';
  end if;

  select * into v_cache
  from public.matpin_media_analysis_cache
  where media_key = trim(p_media_key)
  for update;

  if v_cache.state = 'ready' and v_cache.completed_claim_token = p_claim_token then
    return;
  end if;
  if v_cache.media_key is null
    or v_cache.state <> 'processing'
    or p_claim_token is null
    or v_cache.claim_token is distinct from p_claim_token
    or v_cache.lease_expires_at is null
    or v_cache.lease_expires_at <= now()
    or v_cache.invalidated_at is not null then
    raise exception 'matpin_cache_claim_mismatch';
  end if;

  update public.matpin_media_analysis_cache
  set
    state = 'ready',
    outcome = p_outcome,
    candidates = coalesce(p_candidates, '[]'::jsonb),
    analysis_model = p_analysis_model,
    analysis_duration_ms = p_analysis_duration_ms,
    media_bytes = p_media_bytes,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    total_tokens = p_total_tokens,
    claim_token = null,
    completed_claim_token = p_claim_token,
    lease_expires_at = null,
    completed_at = now(),
    last_used_at = now(),
    invalidated_at = null,
    updated_at = now()
  where media_key = v_cache.media_key;
end;
$$;

create function public.matpin_release_media_analysis(
  p_media_key text,
  p_claim_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_analysis_cache%rowtype;
begin
  select * into v_cache
  from public.matpin_media_analysis_cache
  where media_key = trim(p_media_key)
  for update;

  if v_cache.media_key is null then
    return;
  end if;
  if v_cache.state <> 'processing'
    or p_claim_token is null
    or v_cache.claim_token is distinct from p_claim_token
    or v_cache.lease_expires_at is null
    or v_cache.lease_expires_at <= now()
    or v_cache.invalidated_at is not null then
    raise exception 'matpin_cache_claim_mismatch';
  end if;

  delete from public.matpin_media_analysis_cache
  where media_key = v_cache.media_key;
end;
$$;

revoke all on function public.matpin_claim_media_analysis(text)
  from public, anon, authenticated;
revoke all on function public.matpin_complete_media_analysis(
  text, uuid, text, jsonb, text, integer, integer, integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.matpin_release_media_analysis(text, uuid)
  from public, anon, authenticated;

grant execute on function public.matpin_claim_media_analysis(text)
  to service_role;
grant execute on function public.matpin_complete_media_analysis(
  text, uuid, text, jsonb, text, integer, integer, integer, integer, integer
) to service_role;
grant execute on function public.matpin_release_media_analysis(text, uuid)
  to service_role;

create table public.matpin_outbound_deliveries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('receipt', 'guidance', 'final')),
  dedup_hash text not null unique check (dedup_hash ~ '^[0-9a-f]{64}$'),
  message_id uuid references public.matpin_instagram_messages(id) on delete cascade,
  generation integer not null default 0 check (generation between 0 and 1000000),
  sender_hash text not null check (sender_hash ~ '^[0-9a-f]{64}$'),
  recipient_ciphertext text,
  body_ciphertext text,
  state text not null default 'pending'
    check (state in ('pending', 'leased', 'sending', 'succeeded', 'failed', 'uncertain', 'superseded')),
  lease_token uuid,
  lease_expires_at timestamptz,
  terminal_lease_token uuid,
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  available_at timestamptz not null default now(),
  provider_message_id_hash text
    check (provider_message_id_hash is null or provider_message_id_hash ~ '^[0-9a-f]{64}$'),
  provider_status integer
    check (provider_status is null or provider_status between 100 and 599),
  error_code text check (error_code is null or length(error_code) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sending_started_at timestamptz,
  terminal_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  check (
    (kind = 'guidance' and message_id is null)
    or (kind in ('receipt', 'final') and message_id is not null)
  ),
  check (
    (state in ('pending', 'leased', 'sending')
      and recipient_ciphertext is not null
      and body_ciphertext is not null
      and terminal_at is null)
    or (state in ('succeeded', 'failed', 'uncertain', 'superseded')
      and recipient_ciphertext is null
      and body_ciphertext is null
      and terminal_at is not null)
  ),
  check (
    (state in ('leased', 'sending') and lease_token is not null and lease_expires_at is not null)
    or (state not in ('leased', 'sending') and lease_token is null and lease_expires_at is null)
  ),
  check (state in ('succeeded', 'failed', 'uncertain', 'superseded') or terminal_lease_token is null),
  check (expires_at > created_at)
);

comment on table public.matpin_outbound_deliveries is
  'Encrypted, leased outbound DM outbox. Terminal rows retain hashes and bounded status only; recipient and body ciphertext are scrubbed immediately.';

create unique index matpin_outbound_message_kind_generation_idx
  on public.matpin_outbound_deliveries (message_id, kind, generation)
  where message_id is not null;
create index matpin_outbound_claim_idx
  on public.matpin_outbound_deliveries (available_at, created_at)
  where state = 'pending';
create index matpin_outbound_lease_expiry_idx
  on public.matpin_outbound_deliveries (lease_expires_at)
  where state in ('leased', 'sending');
create index matpin_outbound_sender_guidance_idx
  on public.matpin_outbound_deliveries (sender_hash, created_at desc)
  where kind = 'guidance';
create index matpin_outbound_expiry_idx
  on public.matpin_outbound_deliveries (expires_at);

alter table public.matpin_outbound_deliveries enable row level security;
revoke all on table public.matpin_outbound_deliveries
  from public, anon, authenticated;
grant select, insert, update, delete on table public.matpin_outbound_deliveries
  to service_role;
grant usage on schema pgmq to service_role;
grant execute on function pgmq.send(text, jsonb, integer) to service_role;
grant execute on function pgmq.delete(text, bigint) to service_role;

-- Conservative terminal-only backfill. The existing sender hash is already an
-- HMAC. It is used only as the key for a second domain-separated HMAC, never as
-- an outbox sender identifier directly. No recipient or body can be recovered.
insert into public.matpin_outbound_deliveries (
  kind,
  dedup_hash,
  message_id,
  generation,
  sender_hash,
  state,
  terminal_at,
  expires_at,
  updated_at
)
select
  'receipt',
  encode(extensions.hmac(
    convert_to('outbound-dedup:receipt:legacy:' || message.id::text, 'utf8'),
    convert_to(message.sender_hash, 'utf8'),
    'sha256'
  ), 'hex'),
  message.id,
  0,
  encode(extensions.hmac(
    convert_to('outbound-sender:legacy:' || message.sender_hash, 'utf8'),
    convert_to(message.sender_hash, 'utf8'),
    'sha256'
  ), 'hex'),
  case when message.acknowledged_at is not null then 'succeeded' else 'uncertain' end,
  coalesce(message.acknowledged_at, message.analyzed_at, message.updated_at, now()),
  now() + interval '90 days',
  now()
from public.matpin_instagram_messages message
where message.reply_required = true
  and message.status not in ('received', 'processing');

insert into public.matpin_outbound_deliveries (
  kind,
  dedup_hash,
  message_id,
  generation,
  sender_hash,
  state,
  terminal_at,
  expires_at,
  updated_at
)
select
  'final',
  encode(extensions.hmac(
    convert_to('outbound-dedup:final:legacy:' || message.id::text, 'utf8'),
    convert_to(message.sender_hash, 'utf8'),
    'sha256'
  ), 'hex'),
  message.id,
  0,
  encode(extensions.hmac(
    convert_to('outbound-sender:legacy:' || message.sender_hash, 'utf8'),
    convert_to(message.sender_hash, 'utf8'),
    'sha256'
  ), 'hex'),
  case when message.replied_at is not null then 'succeeded' else 'uncertain' end,
  coalesce(message.replied_at, message.analyzed_at, message.updated_at, now()),
  now() + interval '90 days',
  now()
from public.matpin_instagram_messages message
where message.reply_required = true
  and message.status not in ('received', 'processing');

create function public.matpin_enqueue_analysis_once(
  p_message_id uuid
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_queue_message_id bigint;
begin
  if p_message_id is null then
    raise exception 'invalid_matpin_message_id';
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_message.id is null then
    raise exception 'matpin_message_not_found';
  end if;
  if v_message.analysis_queue_message_id is not null then
    return v_message.analysis_queue_message_id;
  end if;
  if v_message.status not in ('received', 'processing') then
    return null;
  end if;
  if v_message.reply_required and not exists (
    select 1
    from public.matpin_outbound_deliveries delivery
    where delivery.message_id = p_message_id
      and delivery.kind = 'receipt'
      and delivery.generation = v_message.outbound_generation
      and delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded')
  ) then
    raise exception 'matpin_receipt_not_terminal';
  end if;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', p_message_id)
  ) into v_queue_message_id;

  update public.matpin_instagram_messages
  set
    analysis_queue_message_id = v_queue_message_id,
    analysis_enqueued_at = now(),
    updated_at = now()
  where id = p_message_id;

  return v_queue_message_id;
end;
$$;

create function public.matpin_ingest_webhook_batch(
  p_events jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event jsonb;
  v_event_type text;
  v_message public.matpin_instagram_messages%rowtype;
  v_delivery public.matpin_outbound_deliveries%rowtype;
  v_inserted_message_id uuid;
  v_inserted_delivery_id uuid;
  v_supported_accepted integer := 0;
  v_duplicate_count integer := 0;
  v_receipt_queued integer := 0;
  v_guidance_queued integer := 0;
  v_guidance_cooldown integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_late_receipt boolean;
  v_receipt_body_ciphertext text;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'matpin_webhook_batch_must_be_array';
  end if;
  if jsonb_array_length(p_events) > 100 then
    raise exception 'matpin_webhook_batch_too_large';
  end if;

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    if jsonb_typeof(v_event) <> 'object' then
      raise exception 'matpin_webhook_event_invalid';
    end if;
    v_event_type := v_event ->> 'type';

    if v_event_type = 'supported' then
      if nullif(v_event ->> 'metaMessageId', '') is null
        or length(v_event ->> 'metaMessageId') > 500
        or (v_event ->> 'senderHash') !~ '^[0-9a-f]{64}$'
        or (v_event ->> 'outboundSenderHash') !~ '^[0-9a-f]{64}$'
        or (v_event ->> 'accessTokenHash') !~ '^[0-9a-f]{64}$'
        or (v_event ->> 'shortLinkHash') !~ '^[0-9a-f]{64}$'
        or (v_event ->> 'receiptDedupHash') !~ '^[0-9a-f]{64}$'
        or nullif(v_event ->> 'senderCiphertext', '') is null
        or nullif(v_event ->> 'recipientCiphertext', '') is null
        or nullif(v_event ->> 'bodyCiphertext', '') is null
        or nullif(v_event ->> 'returningBodyCiphertext', '') is null
        or nullif(v_event ->> 'alreadySavedBodyCiphertext', '') is null
        or nullif(v_event ->> 'reelId', '') is null
        or (v_event ->> 'attachmentType') not in ('share', 'ig_reel', 'reel') then
        raise exception 'matpin_supported_event_invalid';
      end if;

      insert into public.matpin_instagram_users (
        sender_hash,
        sender_ciphertext,
        access_token_hash,
        short_link_hash,
        link_expires_at,
        updated_at
      ) values (
        v_event ->> 'senderHash',
        v_event ->> 'senderCiphertext',
        v_event ->> 'accessTokenHash',
        v_event ->> 'shortLinkHash',
        now() + interval '90 days',
        now()
      )
      on conflict (sender_hash) do update set
        sender_ciphertext = excluded.sender_ciphertext,
        access_token_hash = excluded.access_token_hash,
        short_link_hash = excluded.short_link_hash,
        link_expires_at = now() + interval '90 days',
        updated_at = now();

      v_inserted_message_id := null;
      insert into public.matpin_instagram_messages (
        meta_message_id,
        sender_hash,
        reel_id,
        reel_url,
        attachment_type,
        media_url_ciphertext,
        received_at
      ) values (
        v_event ->> 'metaMessageId',
        v_event ->> 'senderHash',
        v_event ->> 'reelId',
        nullif(v_event ->> 'reelUrl', ''),
        v_event ->> 'attachmentType',
        v_event ->> 'mediaUrlCiphertext',
        (v_event ->> 'receivedAt')::timestamptz
      )
      on conflict (meta_message_id) do nothing
      returning id into v_inserted_message_id;

      if v_inserted_message_id is null then
        select * into v_message
        from public.matpin_instagram_messages
        where meta_message_id = v_event ->> 'metaMessageId'
        for update;
        if v_message.id is null or v_message.sender_hash <> v_event ->> 'senderHash' then
          raise exception 'matpin_message_idempotency_mismatch';
        end if;
        v_duplicate_count := v_duplicate_count + 1;
      else
        select * into v_message
        from public.matpin_instagram_messages
        where id = v_inserted_message_id
        for update;
        v_supported_accepted := v_supported_accepted + 1;
      end if;

      v_late_receipt := v_message.status not in ('received', 'processing')
        or v_message.analyzed_at is not null
        or v_message.replied_at is not null
        or exists (
        select 1
        from public.matpin_outbound_deliveries existing_final
        where existing_final.message_id = v_message.id
          and existing_final.kind = 'final'
      );

      if exists (
        select 1
        from public.matpin_saved_places saved
        where saved.sender_hash = v_message.sender_hash
          and saved.reel_id = v_message.reel_id
          and saved.deleted_at is null
      ) then
        v_receipt_body_ciphertext := v_event ->> 'alreadySavedBodyCiphertext';
      elsif (
        select count(*)
        from public.matpin_instagram_messages previous
        where previous.sender_hash = v_message.sender_hash
          and previous.status <> 'deleted'
      ) > 1 then
        v_receipt_body_ciphertext := v_event ->> 'returningBodyCiphertext';
      else
        v_receipt_body_ciphertext := v_event ->> 'bodyCiphertext';
      end if;

      v_inserted_delivery_id := null;
      if v_message.reply_required then
        insert into public.matpin_outbound_deliveries (
          kind,
          dedup_hash,
          message_id,
          generation,
          sender_hash,
          recipient_ciphertext,
          body_ciphertext,
          state,
          terminal_at,
          expires_at,
          updated_at
        ) values (
          'receipt',
          v_event ->> 'receiptDedupHash',
          v_message.id,
          v_message.outbound_generation,
          v_event ->> 'outboundSenderHash',
          case when v_late_receipt then null else v_event ->> 'recipientCiphertext' end,
          case when v_late_receipt then null else v_receipt_body_ciphertext end,
          case when v_late_receipt then 'superseded' else 'pending' end,
          case when v_late_receipt then now() else null end,
          now() + interval '7 days',
          now()
        )
        on conflict do nothing
        returning id into v_inserted_delivery_id;

        if v_inserted_delivery_id is null then
          select * into v_delivery
          from public.matpin_outbound_deliveries
          where dedup_hash = v_event ->> 'receiptDedupHash';
          if v_delivery.id is null
            or v_delivery.kind <> 'receipt'
            or v_delivery.message_id <> v_message.id
            or v_delivery.sender_hash <> v_event ->> 'outboundSenderHash' then
            raise exception 'matpin_outbound_idempotency_mismatch';
          end if;
        else
          select * into v_delivery
          from public.matpin_outbound_deliveries
          where id = v_inserted_delivery_id;
          if v_delivery.state = 'pending' then
            v_receipt_queued := v_receipt_queued + 1;
          else
            perform public.matpin_enqueue_analysis_once(v_message.id);
          end if;
        end if;
      else
        perform public.matpin_enqueue_analysis_once(v_message.id);
      end if;

      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'type', 'supported',
        'accepted', v_inserted_message_id is not null,
        'duplicate', v_inserted_message_id is null,
        'messageId', v_message.id,
        'outboundId', v_inserted_delivery_id,
        'deliveryState', case when v_message.reply_required then v_delivery.state else 'not_required' end
      ));

    elsif v_event_type = 'guidance' then
      if (v_event ->> 'dedupHash') !~ '^[0-9a-f]{64}$'
        or (v_event ->> 'outboundSenderHash') !~ '^[0-9a-f]{64}$'
        or nullif(v_event ->> 'recipientCiphertext', '') is null
        or nullif(v_event ->> 'bodyCiphertext', '') is null then
        raise exception 'matpin_guidance_event_invalid';
      end if;

      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_event ->> 'outboundSenderHash', 0)
      );

      delete from public.matpin_outbound_deliveries
      where kind = 'guidance'
        and state in ('succeeded', 'failed', 'uncertain', 'superseded')
        and expires_at <= now();

      select * into v_delivery
      from public.matpin_outbound_deliveries
      where dedup_hash = v_event ->> 'dedupHash'
      for update;

      if v_delivery.id is not null then
        if v_delivery.kind <> 'guidance'
          or v_delivery.sender_hash <> v_event ->> 'outboundSenderHash' then
          raise exception 'matpin_outbound_idempotency_mismatch';
        end if;
        v_duplicate_count := v_duplicate_count + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type', 'guidance',
          'queued', false,
          'duplicate', true,
          'cooldown', false,
          'outboundId', v_delivery.id,
          'deliveryState', v_delivery.state
        ));
      elsif exists (
        select 1
        from public.matpin_outbound_deliveries recent
        where recent.kind = 'guidance'
          and recent.sender_hash = v_event ->> 'outboundSenderHash'
          and recent.created_at > now() - interval '30 seconds'
          and recent.expires_at > now()
      ) then
        v_guidance_cooldown := v_guidance_cooldown + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type', 'guidance',
          'queued', false,
          'duplicate', false,
          'cooldown', true
        ));
      else
        insert into public.matpin_outbound_deliveries (
          kind,
          dedup_hash,
          sender_hash,
          recipient_ciphertext,
          body_ciphertext,
          expires_at
        ) values (
          'guidance',
          v_event ->> 'dedupHash',
          v_event ->> 'outboundSenderHash',
          v_event ->> 'recipientCiphertext',
          v_event ->> 'bodyCiphertext',
          now() + interval '7 days'
        )
        returning * into v_delivery;
        v_guidance_queued := v_guidance_queued + 1;
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'type', 'guidance',
          'queued', true,
          'duplicate', false,
          'cooldown', false,
          'outboundId', v_delivery.id,
          'deliveryState', v_delivery.state
        ));
      end if;
    else
      raise exception 'matpin_webhook_event_type_invalid';
    end if;
  end loop;

  return jsonb_build_object(
    'accepted', v_supported_accepted,
    'duplicates', v_duplicate_count,
    'receiptsQueued', v_receipt_queued,
    'guidanceQueued', v_guidance_queued,
    'guidanceCooldown', v_guidance_cooldown,
    'results', v_results
  );
end;
$$;

create function public.matpin_claim_next_outbound(
  p_lease_seconds integer default 30
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_delivery public.matpin_outbound_deliveries%rowtype;
begin
  if p_lease_seconds < 15 or p_lease_seconds > 120 then
    raise exception 'matpin_outbound_lease_invalid';
  end if;

  delete from public.matpin_outbound_deliveries delivery
  using public.matpin_instagram_messages message
  where delivery.message_id = message.id
    and delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded')
    and delivery.expires_at <= now()
    and (
      delivery.kind in ('final', 'guidance')
      or (
        delivery.kind = 'receipt'
        and message.status not in ('received', 'processing')
        and not exists (
          select 1
          from public.matpin_outbound_deliveries active_final
          where active_final.message_id = delivery.message_id
            and active_final.kind = 'final'
            and active_final.state in ('pending', 'leased', 'sending')
        )
      )
    );
  delete from public.matpin_outbound_deliveries delivery
  where delivery.message_id is null
    and delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded')
    and delivery.expires_at <= now();

  -- A crash before begin is known not to have sent anything, so its lease is
  -- safely recoverable. A crash after begin is terminally uncertain.
  update public.matpin_outbound_deliveries
  set
    state = 'pending',
    lease_token = null,
    lease_expires_at = null,
    terminal_lease_token = null,
    available_at = now(),
    error_code = 'lease_expired_before_send',
    updated_at = now()
  where state = 'leased'
    and lease_expires_at <= now()
    and expires_at > now();

  for v_delivery in
    select *
    from public.matpin_outbound_deliveries
    where state = 'sending'
      and lease_expires_at <= now()
    order by lease_expires_at
    for update skip locked
    limit 100
  loop
    update public.matpin_outbound_deliveries
    set
      state = 'uncertain',
      recipient_ciphertext = null,
      body_ciphertext = null,
      terminal_lease_token = lease_token,
      lease_token = null,
      lease_expires_at = null,
      error_code = 'send_lease_expired',
      terminal_at = now(),
      updated_at = now()
    where id = v_delivery.id;
    if v_delivery.kind = 'receipt' then
      perform public.matpin_enqueue_analysis_once(v_delivery.message_id);
    end if;
  end loop;

  for v_delivery in
    select *
    from public.matpin_outbound_deliveries
    where state in ('pending', 'leased')
      and expires_at <= now()
    order by expires_at
    for update skip locked
    limit 100
  loop
    update public.matpin_outbound_deliveries
    set
      state = 'failed',
      recipient_ciphertext = null,
      body_ciphertext = null,
      terminal_lease_token = lease_token,
      lease_token = null,
      lease_expires_at = null,
      error_code = 'delivery_expired',
      terminal_at = now(),
      updated_at = now()
    where id = v_delivery.id;
    if v_delivery.kind = 'receipt' then
      perform public.matpin_enqueue_analysis_once(v_delivery.message_id);
    end if;
  end loop;

  for v_delivery in
    select delivery.*
    from public.matpin_outbound_deliveries delivery
    join public.matpin_instagram_messages message on message.id = delivery.message_id
    where delivery.kind = 'receipt'
      and delivery.state = 'pending'
      and (
        message.status not in ('received', 'processing')
        or message.analyzed_at is not null
        or message.replied_at is not null
        or exists (
          select 1 from public.matpin_outbound_deliveries final_delivery
          where final_delivery.message_id = message.id
            and final_delivery.kind = 'final'
        )
      )
    for update of delivery skip locked
    limit 100
  loop
    update public.matpin_outbound_deliveries
    set
      state = 'superseded',
      recipient_ciphertext = null,
      body_ciphertext = null,
      error_code = 'analysis_already_terminal',
      terminal_at = now(),
      updated_at = now()
    where id = v_delivery.id;
    perform public.matpin_enqueue_analysis_once(v_delivery.message_id);
  end loop;

  select delivery.* into v_delivery
  from public.matpin_outbound_deliveries delivery
  left join public.matpin_instagram_messages message on message.id = delivery.message_id
  where delivery.state = 'pending'
    and delivery.available_at <= now()
    and delivery.expires_at > now()
    and delivery.attempt_count < 3
    and (
      delivery.kind <> 'final'
      or message.reply_required = false
      or exists (
        select 1
        from public.matpin_outbound_deliveries receipt
        where receipt.message_id = delivery.message_id
          and receipt.kind = 'receipt'
          and receipt.generation = delivery.generation
          and receipt.state in ('succeeded', 'failed', 'uncertain', 'superseded')
      )
    )
  order by
    case delivery.kind when 'receipt' then 0 when 'guidance' then 1 else 2 end,
    delivery.available_at,
    delivery.created_at
  for update of delivery skip locked
  limit 1;

  if v_delivery.id is null then
    return null;
  end if;

  update public.matpin_outbound_deliveries
  set
    state = 'leased',
    lease_token = gen_random_uuid(),
    lease_expires_at = now() + make_interval(secs => p_lease_seconds),
    terminal_lease_token = null,
    updated_at = now()
  where id = v_delivery.id
  returning * into v_delivery;

  return to_jsonb(v_delivery);
end;
$$;

create function public.matpin_begin_outbound_send(
  p_delivery_id uuid,
  p_lease_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.matpin_outbound_deliveries
  set
    state = 'sending',
    attempt_count = attempt_count + 1,
    sending_started_at = now(),
    updated_at = now()
  where id = p_delivery_id
    and state = 'leased'
    and lease_token = p_lease_token
    and lease_expires_at > now()
    and expires_at > now()
    and attempt_count < 3;
  return found;
end;
$$;

create function public.matpin_release_outbound_lease(
  p_delivery_id uuid,
  p_lease_token uuid,
  p_error_code text,
  p_retry_after_seconds integer default 30,
  p_permanent boolean default false
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_delivery public.matpin_outbound_deliveries%rowtype;
  v_terminal boolean;
begin
  if p_retry_after_seconds < 1 or p_retry_after_seconds > 3600 then
    raise exception 'matpin_outbound_retry_delay_invalid';
  end if;

  select * into v_delivery
  from public.matpin_outbound_deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null then
    raise exception 'matpin_outbound_not_found';
  end if;
  if v_delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded') then
    if v_delivery.terminal_lease_token is null
      or v_delivery.terminal_lease_token <> p_lease_token then
      raise exception 'matpin_outbound_lease_mismatch';
    end if;
    return v_delivery.state;
  end if;
  if v_delivery.state <> 'leased' or v_delivery.lease_token <> p_lease_token then
    raise exception 'matpin_outbound_lease_mismatch';
  end if;

  v_terminal := p_permanent
    or v_delivery.expires_at <= now() + make_interval(secs => p_retry_after_seconds);

  update public.matpin_outbound_deliveries
  set
    state = case when v_terminal then 'failed' else 'pending' end,
    recipient_ciphertext = case when v_terminal then null else recipient_ciphertext end,
    body_ciphertext = case when v_terminal then null else body_ciphertext end,
    terminal_lease_token = case when v_terminal then lease_token else null end,
    lease_token = null,
    lease_expires_at = null,
    available_at = case
      when v_terminal then available_at
      else now() + make_interval(secs => p_retry_after_seconds)
    end,
    error_code = left(coalesce(nullif(p_error_code, ''), 'preflight_failed'), 120),
    terminal_at = case when v_terminal then now() else null end,
    updated_at = now()
  where id = p_delivery_id
  returning * into v_delivery;

  if v_terminal and v_delivery.kind = 'receipt' then
    perform public.matpin_enqueue_analysis_once(v_delivery.message_id);
  end if;
  return v_delivery.state;
end;
$$;

create function public.matpin_finish_outbound(
  p_delivery_id uuid,
  p_lease_token uuid,
  p_outcome text,
  p_error_code text default null,
  p_provider_message_id_hash text default null,
  p_provider_status integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_delivery public.matpin_outbound_deliveries%rowtype;
  v_next_state text;
  v_retry_at timestamptz;
begin
  if p_outcome not in ('succeeded', 'known_not_sent', 'failed', 'uncertain') then
    raise exception 'matpin_outbound_outcome_invalid';
  end if;
  if p_provider_message_id_hash is not null
    and p_provider_message_id_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'matpin_provider_message_hash_invalid';
  end if;
  if p_provider_status is not null and (p_provider_status < 100 or p_provider_status > 599) then
    raise exception 'matpin_provider_status_invalid';
  end if;

  select * into v_delivery
  from public.matpin_outbound_deliveries
  where id = p_delivery_id
  for update;

  if v_delivery.id is null then
    raise exception 'matpin_outbound_not_found';
  end if;
  if v_delivery.state in ('succeeded', 'failed', 'uncertain', 'superseded') then
    if v_delivery.terminal_lease_token is null
      or v_delivery.terminal_lease_token <> p_lease_token then
      raise exception 'matpin_outbound_lease_mismatch';
    end if;
    return jsonb_build_object('state', v_delivery.state, 'retryAt', null);
  end if;
  if v_delivery.state <> 'sending' or v_delivery.lease_token <> p_lease_token then
    raise exception 'matpin_outbound_lease_mismatch';
  end if;

  if p_outcome = 'known_not_sent'
    and p_provider_status = 429
    and v_delivery.attempt_count < 3
    and v_delivery.expires_at > now() + make_interval(secs => least(300, 30 * (2 ^ greatest(v_delivery.attempt_count - 1, 0)))::integer) then
    v_next_state := 'pending';
    v_retry_at := now() + make_interval(
      secs => least(300, 30 * (2 ^ greatest(v_delivery.attempt_count - 1, 0)))::integer
    );
  elsif p_outcome = 'succeeded' then
    v_next_state := 'succeeded';
  elsif p_outcome = 'uncertain' then
    v_next_state := 'uncertain';
  else
    v_next_state := 'failed';
  end if;

  if v_delivery.kind = 'receipt'
    and exists (
      select 1
      from public.matpin_instagram_messages message
      where message.id = v_delivery.message_id
        and message.replied_at is not null
    ) then
    v_next_state := 'superseded';
    v_retry_at := null;
  end if;

  update public.matpin_outbound_deliveries
  set
    state = v_next_state,
    recipient_ciphertext = case when v_next_state = 'pending' then recipient_ciphertext else null end,
    body_ciphertext = case when v_next_state = 'pending' then body_ciphertext else null end,
    terminal_lease_token = case when v_next_state = 'pending' then null else lease_token end,
    lease_token = null,
    lease_expires_at = null,
    available_at = coalesce(v_retry_at, available_at),
    provider_message_id_hash = case
      when v_next_state = 'succeeded' then p_provider_message_id_hash
      else provider_message_id_hash
    end,
    provider_status = p_provider_status,
    error_code = case
      when v_next_state = 'succeeded' then null
      else left(coalesce(nullif(p_error_code, ''), p_outcome), 120)
    end,
    terminal_at = case when v_next_state = 'pending' then null else now() end,
    updated_at = now()
  where id = p_delivery_id
  returning * into v_delivery;

  if v_delivery.kind = 'receipt' and v_delivery.state <> 'pending' then
    if v_delivery.state = 'succeeded' then
      update public.matpin_instagram_messages
      set
        acknowledged_at = coalesce(acknowledged_at, now()),
        updated_at = now()
      where id = v_delivery.message_id
        and reply_required = true;
    end if;
    perform public.matpin_enqueue_analysis_once(v_delivery.message_id);
  elsif v_delivery.kind = 'final' and v_delivery.state = 'succeeded' then
    update public.matpin_instagram_messages
    set
      replied_at = coalesce(replied_at, now()),
      updated_at = now()
    where id = v_delivery.message_id
      and reply_required = true;
  end if;

  return jsonb_build_object('state', v_delivery.state, 'retryAt', v_retry_at);
end;
$$;

create function public.matpin_complete_analysis_v2(
  p_message_id uuid,
  p_queue_message_id bigint,
  p_analysis_claim_token uuid,
  p_status text,
  p_candidates jsonb,
  p_analysis_model text,
  p_analysis_duration_ms integer,
  p_media_bytes integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_total_tokens integer,
  p_final_dedup_hash text default null,
  p_final_sender_hash text default null,
  p_final_recipient_ciphertext text default null,
  p_final_body_ciphertext text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_delivery public.matpin_outbound_deliveries%rowtype;
  v_requires_final boolean;
begin
  if p_status not in ('needs_confirmation', 'saved', 'failed') then
    raise exception 'invalid_matpin_completion_status';
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_message.id is null then
    raise exception 'matpin_message_not_found';
  end if;
  if v_message.analysis_queue_message_id is distinct from p_queue_message_id then
    raise exception 'matpin_analysis_queue_mismatch';
  end if;
  if v_message.analysis_completed_claim_token = p_analysis_claim_token then
    select * into v_delivery
    from public.matpin_outbound_deliveries
    where message_id = p_message_id
      and kind = 'final'
      and generation = v_message.outbound_generation;
    return jsonb_build_object(
      'completed', true,
      'outboundId', v_delivery.id,
      'deliveryState', v_delivery.state
    );
  end if;
  if p_analysis_claim_token is null
    or v_message.status <> 'processing'
    or v_message.analysis_claim_token is distinct from p_analysis_claim_token then
    raise exception 'matpin_analysis_claim_mismatch';
  end if;

  v_requires_final := v_message.reply_required and v_message.replied_at is null;
  if v_requires_final and (
    p_final_dedup_hash !~ '^[0-9a-f]{64}$'
    or p_final_sender_hash !~ '^[0-9a-f]{64}$'
    or nullif(p_final_recipient_ciphertext, '') is null
    or nullif(p_final_body_ciphertext, '') is null
  ) then
    raise exception 'matpin_final_outbound_invalid';
  end if;
  if v_requires_final and not exists (
    select 1
    from public.matpin_outbound_deliveries receipt
    where receipt.message_id = p_message_id
      and receipt.kind = 'receipt'
      and receipt.generation = v_message.outbound_generation
      and receipt.state in ('succeeded', 'failed', 'uncertain', 'superseded')
  ) then
    raise exception 'matpin_receipt_not_terminal';
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
    analyzed_at = coalesce(analyzed_at, now()),
    analysis_claim_token = null,
    analysis_completed_claim_token = p_analysis_claim_token,
    analysis_claimed_at = null,
    last_error = null,
    updated_at = now()
  where id = p_message_id;

  perform pgmq.delete('matpin-instagram', p_queue_message_id);

  if v_requires_final then
    insert into public.matpin_outbound_deliveries (
      kind,
      dedup_hash,
      message_id,
      generation,
      sender_hash,
      recipient_ciphertext,
      body_ciphertext,
      expires_at
    ) values (
      'final',
      p_final_dedup_hash,
      p_message_id,
      v_message.outbound_generation,
      p_final_sender_hash,
      p_final_recipient_ciphertext,
      p_final_body_ciphertext,
      now() + interval '7 days'
    )
    on conflict do nothing
    returning * into v_delivery;

    if v_delivery.id is null then
      select * into v_delivery
      from public.matpin_outbound_deliveries
      where dedup_hash = p_final_dedup_hash;
      if v_delivery.id is null
        or v_delivery.kind <> 'final'
        or v_delivery.message_id <> p_message_id
        or v_delivery.generation <> v_message.outbound_generation
        or v_delivery.sender_hash <> p_final_sender_hash then
        raise exception 'matpin_outbound_idempotency_mismatch';
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'completed', true,
    'outboundId', v_delivery.id,
    'deliveryState', v_delivery.state
  );
end;
$$;

create function public.matpin_stage_places(
  p_message_id uuid,
  p_analysis_claim_token uuid,
  p_sender_hash text,
  p_places jsonb,
  p_confirmation_source text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_place jsonb;
  v_saved_count integer := 0;
begin
  if p_message_id is null
    or p_sender_hash is null
    or length(p_sender_hash) <> 64 then
    raise exception 'invalid matpin stage identity';
  end if;
  if p_confirmation_source not in ('automatic_high_confidence', 'user_confirmation') then
    raise exception 'invalid matpin confirmation source';
  end if;
  if jsonb_typeof(p_places) <> 'array'
    or jsonb_array_length(p_places) < 1
    or jsonb_array_length(p_places) > 3 then
    raise exception 'matpin places must contain between one and three items';
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id
    and sender_hash = p_sender_hash
  for update;

  if v_message.id is null
    or v_message.status <> 'processing'
    or p_analysis_claim_token is null
    or v_message.analysis_claim_token is distinct from p_analysis_claim_token then
    raise exception 'matpin message not stageable';
  end if;

  for v_place in select value from jsonb_array_elements(p_places)
  loop
    if jsonb_typeof(v_place) <> 'object'
      or nullif(v_place ->> 'id', '') is null
      or nullif(v_place ->> 'name', '') is null
      or nullif(v_place ->> 'address', '') is null then
      raise exception 'invalid matpin place';
    end if;

    insert into public.matpin_saved_places (
      sender_hash,
      message_id,
      reel_id,
      reel_url,
      place,
      confirmation_source,
      saved_at,
      deleted_at
    ) values (
      p_sender_hash,
      p_message_id,
      v_message.reel_id,
      v_message.reel_url,
      v_place,
      p_confirmation_source,
      now(),
      null
    )
    on conflict (sender_hash, reel_id, ((place ->> 'id')))
      where deleted_at is null
    do update set
      message_id = excluded.message_id,
      reel_url = excluded.reel_url,
      place = excluded.place,
      confirmation_source = excluded.confirmation_source,
      saved_at = now(),
      deleted_at = null;

    v_saved_count := v_saved_count + 1;
  end loop;

  update public.matpin_instagram_messages
  set
    status = 'processing',
    selected_place_id = p_places -> 0 ->> 'id',
    updated_at = now()
  where id = p_message_id
    and sender_hash = p_sender_hash;

  return v_saved_count;
end;
$$;

create function public.matpin_retry_message_v2(
  p_message_id uuid,
  p_queue_message_id bigint,
  p_analysis_claim_token uuid,
  p_error text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
begin
  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_message.id is null then
    raise exception 'matpin_message_not_found';
  end if;
  if v_message.status <> 'processing'
    or v_message.analysis_queue_message_id is distinct from p_queue_message_id
    or p_analysis_claim_token is null
    or v_message.analysis_claim_token is distinct from p_analysis_claim_token then
    raise exception 'matpin_analysis_claim_mismatch';
  end if;

  if v_message.attempt_count >= 2 then
    return 'complete_failed_required';
  end if;

  update public.matpin_instagram_messages
  set
    status = 'received',
    analysis_claim_token = null,
    analysis_claimed_at = null,
    last_error = left(coalesce(nullif(p_error, ''), 'matpin_analysis_retry'), 500),
    updated_at = now()
  where id = p_message_id;

  return 'retry';
end;
$$;

create function public.matpin_terminalize_unreadable_claim(
  p_message_id uuid,
  p_queue_message_id bigint,
  p_analysis_claim_token uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_delivery public.matpin_outbound_deliveries%rowtype;
  v_dedup_hash text;
  v_sender_hash text;
begin
  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_message.id is null then
    raise exception 'matpin_message_not_found';
  end if;
  if v_message.status = 'failed'
    and v_message.analysis_completed_claim_token = p_analysis_claim_token then
    return true;
  end if;
  if v_message.status <> 'processing'
    or v_message.analysis_queue_message_id is distinct from p_queue_message_id
    or p_analysis_claim_token is null
    or v_message.analysis_claim_token is distinct from p_analysis_claim_token then
    raise exception 'matpin_analysis_claim_mismatch';
  end if;

  if v_message.reply_required and v_message.replied_at is null then
    v_dedup_hash := encode(extensions.hmac(
      convert_to(
        'outbound-dedup:final:unreadable:' || v_message.id::text || ':' || v_message.outbound_generation::text,
        'utf8'
      ),
      convert_to(v_message.sender_hash, 'utf8'),
      'sha256'
    ), 'hex');
    v_sender_hash := encode(extensions.hmac(
      convert_to('outbound-sender:unreadable:' || v_message.sender_hash, 'utf8'),
      convert_to(v_message.sender_hash, 'utf8'),
      'sha256'
    ), 'hex');

    insert into public.matpin_outbound_deliveries (
      kind,
      dedup_hash,
      message_id,
      generation,
      sender_hash,
      state,
      error_code,
      terminal_at,
      expires_at,
      updated_at
    ) values (
      'final',
      v_dedup_hash,
      v_message.id,
      v_message.outbound_generation,
      v_sender_hash,
      'failed',
      'analysis_payload_unreadable',
      now(),
      now() + interval '7 days',
      now()
    )
    on conflict do nothing
    returning * into v_delivery;

    if v_delivery.id is null and not exists (
      select 1
      from public.matpin_outbound_deliveries existing_final
      where existing_final.message_id = v_message.id
        and existing_final.kind = 'final'
        and existing_final.generation = v_message.outbound_generation
    ) then
      raise exception 'matpin_unreadable_final_not_recorded';
    end if;
  end if;

  update public.matpin_instagram_messages
  set
    status = 'failed',
    candidates = '[]'::jsonb,
    media_url_ciphertext = null,
    analyzed_at = coalesce(analyzed_at, now()),
    analysis_claim_token = null,
    analysis_completed_claim_token = p_analysis_claim_token,
    analysis_claimed_at = null,
    last_error = 'analysis_payload_unreadable',
    updated_at = now()
  where id = p_message_id;

  perform pgmq.delete('matpin-instagram', p_queue_message_id);
  return true;
end;
$$;

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
security invoker
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
  on conflict (meta_message_id) do nothing
  returning id into v_message_id;

  if v_message_id is null then
    return jsonb_build_object('accepted', false, 'duplicate', true);
  end if;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', v_message_id)
  ) into v_queue_message_id;

  update public.matpin_instagram_messages
  set
    analysis_queue_message_id = v_queue_message_id,
    analysis_enqueued_at = now(),
    updated_at = now()
  where id = v_message_id;

  return jsonb_build_object(
    'accepted', true,
    'duplicate', false,
    'messageId', v_message_id,
    'queueMessageId', v_queue_message_id,
    'replyRequired', false
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
  v_message_id_text text;
  v_message public.matpin_instagram_messages%rowtype;
  v_user public.matpin_instagram_users%rowtype;
  v_claim_token uuid;
  v_poisoned boolean;
  v_terminal_failure_required boolean;
begin
  select msg_id, message
  into v_queue_message_id, v_queue_body
  from pgmq.read('matpin-instagram', 600, 1)
  limit 1;

  if v_queue_message_id is null then
    return null;
  end if;

  v_message_id_text := v_queue_body ->> 'message_id';
  if v_message_id_text is null
    or v_message_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    perform pgmq.delete('matpin-instagram', v_queue_message_id);
    return jsonb_build_object('skipped', true);
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = v_message_id_text::uuid
  for update;

  if v_message.id is null
    or v_message.status not in ('received', 'processing')
    or v_message.analysis_queue_message_id is distinct from v_queue_message_id then
    perform pgmq.delete('matpin-instagram', v_queue_message_id);
    return jsonb_build_object('skipped', true);
  end if;

  v_poisoned := v_message.attempt_count >= 10;
  v_claim_token := gen_random_uuid();

  update public.matpin_instagram_messages
  set
    status = 'processing',
    started_at = coalesce(started_at, now()),
    attempt_count = case when v_poisoned then attempt_count else attempt_count + 1 end,
    analysis_claim_token = v_claim_token,
    analysis_completed_claim_token = null,
    analysis_claimed_at = now(),
    last_error = case when v_poisoned then 'matpin_claim_attempt_limit' else null end,
    updated_at = now()
  where id = v_message.id
  returning * into v_message;

  v_terminal_failure_required := v_message.attempt_count >= 2;

  select * into v_user
  from public.matpin_instagram_users
  where sender_hash = v_message.sender_hash;

  return jsonb_build_object(
    'queueMessageId', v_queue_message_id,
    'poisoned', v_poisoned,
    'terminalFailureRequired', v_terminal_failure_required,
    'message', to_jsonb(v_message),
    'user', to_jsonb(v_user)
  );
end;
$$;

create or replace function public.matpin_requeue_failed_message(
  p_message_id uuid,
  p_media_url_ciphertext text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_reel_id text;
  v_reel_url text;
  v_sender_hash text;
  v_outbound_generation integer;
  v_next_generation integer;
  v_queue_message_id bigint;
  v_receipt_delivery_id uuid;
begin
  select status, reel_id, reel_url, sender_hash, outbound_generation
  into v_status, v_reel_id, v_reel_url, v_sender_hash, v_outbound_generation
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_status is null or v_status <> 'failed' or v_reel_url is null then
    return jsonb_build_object('accepted', false);
  end if;
  v_next_generation := v_outbound_generation + 1;

  update public.matpin_media_analysis_cache
  set invalidated_at = now(), updated_at = now()
  where media_key = v_reel_id;

  update public.matpin_outbound_deliveries
  set
    state = case when state = 'sending' then 'uncertain' else 'superseded' end,
    recipient_ciphertext = null,
    body_ciphertext = null,
    terminal_lease_token = lease_token,
    lease_token = null,
    lease_expires_at = null,
    error_code = 'explicit_reprocess',
    terminal_at = now(),
    updated_at = now()
  where message_id = p_message_id
    and kind = 'final'
    and state in ('pending', 'leased', 'sending');

  -- Explicit reply-required reprocesses do not send a second receipt. Record
  -- that fact as a terminal, payload-free receipt for the new generation so
  -- the receipt-before-analysis invariant remains intact after TTL cleanup.
  insert into public.matpin_outbound_deliveries (
    kind,
    dedup_hash,
    message_id,
    generation,
    sender_hash,
    state,
    error_code,
    terminal_at,
    expires_at,
    updated_at
  ) values (
    'receipt',
    encode(extensions.hmac(
      convert_to(
        'outbound-dedup:receipt:reprocess:' || p_message_id::text || ':' || v_next_generation::text,
        'utf8'
      ),
      convert_to(v_sender_hash, 'utf8'),
      'sha256'
    ), 'hex'),
    p_message_id,
    v_next_generation,
    encode(extensions.hmac(
      convert_to('outbound-sender:reprocess:' || v_sender_hash, 'utf8'),
      convert_to(v_sender_hash, 'utf8'),
      'sha256'
    ), 'hex'),
    'superseded',
    'explicit_reprocess_no_receipt',
    now(),
    now() + interval '7 days',
    now()
  )
  on conflict do nothing
  returning id into v_receipt_delivery_id;

  if v_receipt_delivery_id is null then
    select id into v_receipt_delivery_id
    from public.matpin_outbound_deliveries
    where message_id = p_message_id
      and kind = 'receipt'
      and generation = v_next_generation
      and state in ('succeeded', 'failed', 'uncertain', 'superseded');
    if v_receipt_delivery_id is null then
      raise exception 'matpin_reprocess_receipt_not_recorded';
    end if;
  end if;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', p_message_id)
  ) into v_queue_message_id;

  update public.matpin_instagram_messages
  set
    status = 'received',
    media_url_ciphertext = p_media_url_ciphertext,
    reply_required = true,
    candidates = '[]'::jsonb,
    selected_place_id = null,
    analysis_model = null,
    analysis_duration_ms = null,
    media_bytes = null,
    input_tokens = null,
    output_tokens = null,
    total_tokens = null,
    attempt_count = 0,
    last_error = null,
    started_at = null,
    analyzed_at = null,
    replied_at = null,
    analysis_queue_message_id = v_queue_message_id,
    analysis_enqueued_at = now(),
    analysis_claim_token = null,
    analysis_completed_claim_token = null,
    analysis_claimed_at = null,
    outbound_generation = v_next_generation,
    updated_at = now()
  where id = p_message_id;

  return jsonb_build_object(
    'accepted', true,
    'queueMessageId', v_queue_message_id,
    'receiptOutboundId', v_receipt_delivery_id
  );
end;
$$;

create or replace function public.matpin_requeue_failed_message_without_reply(
  p_message_id uuid,
  p_media_url_ciphertext text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_reel_id text;
  v_reel_url text;
  v_queue_message_id bigint;
begin
  select status, reel_id, reel_url
  into v_status, v_reel_id, v_reel_url
  from public.matpin_instagram_messages
  where id = p_message_id
  for update;

  if v_status is null or v_status <> 'failed' or v_reel_url is null then
    return jsonb_build_object('accepted', false);
  end if;

  update public.matpin_media_analysis_cache
  set invalidated_at = now(), updated_at = now()
  where media_key = v_reel_id;

  update public.matpin_outbound_deliveries
  set
    state = case when state = 'sending' then 'uncertain' else 'superseded' end,
    recipient_ciphertext = null,
    body_ciphertext = null,
    terminal_lease_token = lease_token,
    lease_token = null,
    lease_expires_at = null,
    error_code = 'explicit_reprocess_without_reply',
    terminal_at = now(),
    updated_at = now()
  where message_id = p_message_id
    and kind = 'final'
    and state in ('pending', 'leased', 'sending');

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', p_message_id)
  ) into v_queue_message_id;

  update public.matpin_instagram_messages
  set
    status = 'received',
    media_url_ciphertext = p_media_url_ciphertext,
    reply_required = false,
    candidates = '[]'::jsonb,
    selected_place_id = null,
    analysis_model = null,
    analysis_duration_ms = null,
    media_bytes = null,
    input_tokens = null,
    output_tokens = null,
    total_tokens = null,
    attempt_count = 0,
    last_error = null,
    started_at = null,
    analyzed_at = null,
    replied_at = null,
    analysis_queue_message_id = v_queue_message_id,
    analysis_enqueued_at = now(),
    analysis_claim_token = null,
    analysis_completed_claim_token = null,
    analysis_claimed_at = null,
    outbound_generation = outbound_generation + 1,
    updated_at = now()
  where id = p_message_id;

  return jsonb_build_object(
    'accepted', true,
    'queueMessageId', v_queue_message_id
  );
end;
$$;

-- Strict maintenance makes these internal v1 write paths safe to remove. They
-- bypass the receipt gate or can mark a reply without a durable outbox row.
drop function if exists public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, text, timestamptz
);
drop function if exists public.matpin_ingest_message(
  text, text, text, text, text, text, text, text, timestamptz
);
drop function if exists public.matpin_complete_analysis(
  uuid, bigint, text, jsonb, text, integer, integer, integer, integer, integer, boolean
);
drop function if exists public.matpin_mark_message_acknowledged(uuid);
drop function if exists public.matpin_retry_message(uuid, bigint, text);

-- New outbox contracts are service-only. The table remains RLS-protected even
-- if the project's Data API exposure defaults change.
revoke all on function public.matpin_enqueue_analysis_once(uuid)
  from public, anon, authenticated;
revoke all on function public.matpin_ingest_webhook_batch(jsonb)
  from public, anon, authenticated;
revoke all on function public.matpin_claim_next_outbound(integer)
  from public, anon, authenticated;
revoke all on function public.matpin_begin_outbound_send(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.matpin_release_outbound_lease(uuid, uuid, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.matpin_finish_outbound(uuid, uuid, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.matpin_complete_analysis_v2(
  uuid, bigint, uuid, text, jsonb, text, integer, integer, integer, integer, integer,
  text, text, text, text
) from public, anon, authenticated;
revoke all on function public.matpin_stage_places(uuid, uuid, text, jsonb, text)
  from public, anon, authenticated;
revoke all on function public.matpin_retry_message_v2(uuid, bigint, uuid, text)
  from public, anon, authenticated;
revoke all on function public.matpin_terminalize_unreadable_claim(uuid, bigint, uuid)
  from public, anon, authenticated;
revoke all on function public.matpin_backfill_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.matpin_claim_next_message()
  from public, anon, authenticated;
revoke all on function public.matpin_requeue_failed_message(uuid, text)
  from public, anon, authenticated;
revoke all on function public.matpin_requeue_failed_message_without_reply(uuid, text)
  from public, anon, authenticated;

grant execute on function public.matpin_enqueue_analysis_once(uuid)
  to service_role;
grant execute on function public.matpin_ingest_webhook_batch(jsonb)
  to service_role;
grant execute on function public.matpin_claim_next_outbound(integer)
  to service_role;
grant execute on function public.matpin_begin_outbound_send(uuid, uuid)
  to service_role;
grant execute on function public.matpin_release_outbound_lease(uuid, uuid, text, integer, boolean)
  to service_role;
grant execute on function public.matpin_finish_outbound(uuid, uuid, text, text, text, integer)
  to service_role;
grant execute on function public.matpin_complete_analysis_v2(
  uuid, bigint, uuid, text, jsonb, text, integer, integer, integer, integer, integer,
  text, text, text, text
) to service_role;
grant execute on function public.matpin_stage_places(uuid, uuid, text, jsonb, text)
  to service_role;
grant execute on function public.matpin_retry_message_v2(uuid, bigint, uuid, text)
  to service_role;
grant execute on function public.matpin_terminalize_unreadable_claim(uuid, bigint, uuid)
  to service_role;
grant execute on function public.matpin_backfill_message(
  text, text, text, text, text, text, text, text, text, timestamptz
) to service_role;
grant execute on function public.matpin_claim_next_message()
  to service_role;
grant execute on function public.matpin_requeue_failed_message(uuid, text)
  to service_role;
grant execute on function public.matpin_requeue_failed_message_without_reply(uuid, text)
  to service_role;
