alter table public.matpin_instagram_messages
  drop constraint if exists matpin_instagram_messages_attachment_type_check;

alter table public.matpin_instagram_messages
  add constraint matpin_instagram_messages_attachment_type_check
  check (attachment_type in ('share', 'ig_reel', 'reel'));

create table public.matpin_media_analysis_cache (
  media_key text primary key,
  state text not null default 'processing'
    check (state in ('processing', 'ready')),
  outcome text
    check (outcome in ('resolved', 'insufficient')),
  candidates jsonb not null default '[]'::jsonb,
  analysis_model text,
  analysis_duration_ms integer check (analysis_duration_ms is null or analysis_duration_ms >= 0),
  media_bytes integer check (media_bytes is null or media_bytes >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  lease_expires_at timestamptz,
  completed_at timestamptz,
  last_used_at timestamptz,
  hit_count bigint not null default 0 check (hit_count >= 0),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(media_key) between 1 and 500),
  check (jsonb_typeof(candidates) = 'array'),
  check (
    state = 'processing'
    or (
      state = 'ready'
      and outcome is not null
      and (
        (outcome = 'resolved' and jsonb_array_length(candidates) > 0)
        or (outcome = 'insufficient' and jsonb_array_length(candidates) = 0)
      )
    )
  )
);

alter table public.matpin_media_analysis_cache enable row level security;
revoke all on table public.matpin_media_analysis_cache from anon, authenticated;
grant select, insert, update, delete on table public.matpin_media_analysis_cache to service_role;

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
begin
  if p_media_key is null or length(trim(p_media_key)) not between 1 and 500 then
    raise exception 'invalid matpin media key';
  end if;

  insert into public.matpin_media_analysis_cache (
    media_key,
    state,
    lease_expires_at,
    last_used_at
  ) values (
    trim(p_media_key),
    'processing',
    now() + interval '90 seconds',
    now()
  )
  on conflict (media_key) do nothing;

  if found then
    return jsonb_build_object('state', 'owner');
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
      lease_expires_at = now() + interval '90 seconds',
      completed_at = null,
      invalidated_at = null,
      last_used_at = now(),
      updated_at = now()
    where media_key = v_cache.media_key;

    return jsonb_build_object('state', 'owner');
  end if;

  return jsonb_build_object('state', 'pending');
end;
$$;

create or replace function public.matpin_complete_media_analysis(
  p_media_key text,
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
begin
  if p_outcome not in ('resolved', 'insufficient') then
    raise exception 'invalid matpin cache outcome';
  end if;

  if jsonb_typeof(coalesce(p_candidates, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid matpin cache candidates';
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
    lease_expires_at = null,
    completed_at = now(),
    last_used_at = now(),
    invalidated_at = null,
    updated_at = now()
  where media_key = trim(p_media_key)
    and state = 'processing';

  if not found then
    raise exception 'matpin cache claim unavailable';
  end if;
end;
$$;

create or replace function public.matpin_release_media_analysis(
  p_media_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.matpin_media_analysis_cache
  where media_key = trim(p_media_key)
    and state = 'processing';
end;
$$;

revoke all on function public.matpin_claim_media_analysis(text) from public, anon, authenticated;
revoke all on function public.matpin_complete_media_analysis(text, text, jsonb, text, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.matpin_release_media_analysis(text) from public, anon, authenticated;

grant execute on function public.matpin_claim_media_analysis(text) to service_role;
grant execute on function public.matpin_complete_media_analysis(text, text, jsonb, text, integer, integer, integer, integer, integer) to service_role;
grant execute on function public.matpin_release_media_analysis(text) to service_role;

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

  update public.matpin_instagram_messages
  set
    status = 'received',
    media_url_ciphertext = p_media_url_ciphertext,
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
    updated_at = now()
  where id = p_message_id;

  select pgmq.send(
    'matpin-instagram',
    jsonb_build_object('message_id', p_message_id)
  ) into v_queue_message_id;

  return jsonb_build_object(
    'accepted', true,
    'queueMessageId', v_queue_message_id
  );
end;
$$;

revoke all on function public.matpin_requeue_failed_message(uuid, text)
  from public, anon, authenticated;
grant execute on function public.matpin_requeue_failed_message(uuid, text)
  to service_role;
