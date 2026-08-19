create table public.matpin_media_extraction_cache (
  media_key text not null,
  extraction_version text not null,
  state text not null default 'processing'
    check (state in ('processing', 'ready')),
  analysis jsonb,
  analysis_model text,
  analysis_duration_ms integer
    check (analysis_duration_ms is null or analysis_duration_ms >= 0),
  request_count integer
    check (request_count is null or request_count >= 0),
  media_bytes integer
    check (media_bytes is null or media_bytes >= 0),
  input_tokens integer
    check (input_tokens is null or input_tokens >= 0),
  output_tokens integer
    check (output_tokens is null or output_tokens >= 0),
  thought_tokens integer
    check (thought_tokens is null or thought_tokens >= 0),
  tool_use_tokens integer
    check (tool_use_tokens is null or tool_use_tokens >= 0),
  total_tokens integer
    check (total_tokens is null or total_tokens >= 0),
  claim_token uuid,
  completed_claim_token uuid,
  lease_expires_at timestamptz,
  expires_at timestamptz,
  completed_at timestamptz,
  last_used_at timestamptz,
  hit_count bigint not null default 0 check (hit_count >= 0),
  invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (media_key, extraction_version),
  check (length(media_key) between 1 and 500),
  check (length(extraction_version) between 1 and 120),
  check (analysis is null or jsonb_typeof(analysis) = 'object'),
  check (
    (
      state = 'processing'
      and analysis is null
      and claim_token is not null
      and completed_claim_token is null
      and lease_expires_at is not null
      and expires_at is null
    )
    or (
      state = 'ready'
      and analysis is not null
      and claim_token is null
      and completed_claim_token is not null
      and lease_expires_at is null
      and expires_at is not null
    )
  )
);

comment on table public.matpin_media_extraction_cache is
  'Versioned, user-independent Instagram extraction results. Never stores sender ids, message ids, private links, or signed media URLs.';

alter table public.matpin_media_extraction_cache enable row level security;
revoke all on table public.matpin_media_extraction_cache
  from public, anon, authenticated;
grant select, insert, update, delete on table public.matpin_media_extraction_cache
  to service_role;

create function public.matpin_claim_media_extraction(
  p_media_key text,
  p_extraction_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_extraction_cache%rowtype;
  v_claim_token uuid := gen_random_uuid();
  v_media_key text := trim(p_media_key);
  v_extraction_version text := trim(p_extraction_version);
begin
  if p_media_key is null or length(v_media_key) not between 1 and 500 then
    raise exception 'invalid matpin extraction media key';
  end if;
  if p_extraction_version is null
    or length(v_extraction_version) not between 1 and 120 then
    raise exception 'invalid matpin extraction version';
  end if;

  insert into public.matpin_media_extraction_cache (
    media_key,
    extraction_version,
    state,
    claim_token,
    lease_expires_at,
    last_used_at
  ) values (
    v_media_key,
    v_extraction_version,
    'processing',
    v_claim_token,
    now() + interval '300 seconds',
    now()
  )
  on conflict (media_key, extraction_version) do nothing
  returning * into v_cache;

  if v_cache.media_key is not null then
    return jsonb_build_object('state', 'owner', 'claimToken', v_claim_token);
  end if;

  select * into v_cache
  from public.matpin_media_extraction_cache
  where media_key = v_media_key
    and extraction_version = v_extraction_version
  for update;

  if v_cache.state = 'ready'
    and v_cache.invalidated_at is null
    and v_cache.expires_at > now() then
    update public.matpin_media_extraction_cache
    set
      hit_count = hit_count + 1,
      last_used_at = now(),
      updated_at = now()
    where media_key = v_media_key
      and extraction_version = v_extraction_version;

    return jsonb_build_object(
      'state', 'hit',
      'analysis', v_cache.analysis
    );
  end if;

  if v_cache.state = 'ready'
    or v_cache.invalidated_at is not null
    or v_cache.lease_expires_at is null
    or v_cache.lease_expires_at <= now() then
    v_claim_token := gen_random_uuid();
    update public.matpin_media_extraction_cache
    set
      state = 'processing',
      analysis = null,
      analysis_model = null,
      analysis_duration_ms = null,
      request_count = null,
      media_bytes = null,
      input_tokens = null,
      output_tokens = null,
      thought_tokens = null,
      tool_use_tokens = null,
      total_tokens = null,
      claim_token = v_claim_token,
      completed_claim_token = null,
      lease_expires_at = now() + interval '300 seconds',
      expires_at = null,
      completed_at = null,
      invalidated_at = null,
      last_used_at = now(),
      updated_at = now()
    where media_key = v_media_key
      and extraction_version = v_extraction_version;

    return jsonb_build_object('state', 'owner', 'claimToken', v_claim_token);
  end if;

  return jsonb_build_object('state', 'pending');
end;
$$;

create function public.matpin_complete_media_extraction(
  p_media_key text,
  p_extraction_version text,
  p_claim_token uuid,
  p_analysis jsonb,
  p_analysis_model text,
  p_analysis_duration_ms integer,
  p_request_count integer,
  p_media_bytes integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_thought_tokens integer,
  p_tool_use_tokens integer,
  p_total_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_extraction_cache%rowtype;
  v_media_key text := trim(p_media_key);
  v_extraction_version text := trim(p_extraction_version);
begin
  if p_analysis is null or jsonb_typeof(p_analysis) <> 'object' then
    raise exception 'invalid matpin extraction analysis';
  end if;

  select * into v_cache
  from public.matpin_media_extraction_cache
  where media_key = v_media_key
    and extraction_version = v_extraction_version
  for update;

  if v_cache.state = 'ready'
    and v_cache.completed_claim_token = p_claim_token then
    return;
  end if;
  if v_cache.media_key is null
    or v_cache.state <> 'processing'
    or p_claim_token is null
    or v_cache.claim_token is distinct from p_claim_token
    or v_cache.lease_expires_at is null
    or v_cache.lease_expires_at <= now()
    or v_cache.invalidated_at is not null then
    raise exception 'matpin_extraction_cache_claim_mismatch';
  end if;

  update public.matpin_media_extraction_cache
  set
    state = 'ready',
    analysis = p_analysis,
    analysis_model = p_analysis_model,
    analysis_duration_ms = p_analysis_duration_ms,
    request_count = p_request_count,
    media_bytes = p_media_bytes,
    input_tokens = p_input_tokens,
    output_tokens = p_output_tokens,
    thought_tokens = p_thought_tokens,
    tool_use_tokens = p_tool_use_tokens,
    total_tokens = p_total_tokens,
    claim_token = null,
    completed_claim_token = p_claim_token,
    lease_expires_at = null,
    expires_at = now() + interval '30 days',
    completed_at = now(),
    last_used_at = now(),
    invalidated_at = null,
    updated_at = now()
  where media_key = v_media_key
    and extraction_version = v_extraction_version;
end;
$$;

create function public.matpin_release_media_extraction(
  p_media_key text,
  p_extraction_version text,
  p_claim_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cache public.matpin_media_extraction_cache%rowtype;
  v_media_key text := trim(p_media_key);
  v_extraction_version text := trim(p_extraction_version);
begin
  select * into v_cache
  from public.matpin_media_extraction_cache
  where media_key = v_media_key
    and extraction_version = v_extraction_version
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
    raise exception 'matpin_extraction_cache_claim_mismatch';
  end if;

  delete from public.matpin_media_extraction_cache
  where media_key = v_media_key
    and extraction_version = v_extraction_version;
end;
$$;

revoke all on function public.matpin_claim_media_extraction(text, text)
  from public, anon, authenticated;
revoke all on function public.matpin_complete_media_extraction(
  text, text, uuid, jsonb, text, integer, integer, integer, integer, integer,
  integer, integer, integer
) from public, anon, authenticated;
revoke all on function public.matpin_release_media_extraction(text, text, uuid)
  from public, anon, authenticated;

grant execute on function public.matpin_claim_media_extraction(text, text)
  to service_role;
grant execute on function public.matpin_complete_media_extraction(
  text, text, uuid, jsonb, text, integer, integer, integer, integer, integer,
  integer, integer, integer
) to service_role;
grant execute on function public.matpin_release_media_extraction(text, text, uuid)
  to service_role;
