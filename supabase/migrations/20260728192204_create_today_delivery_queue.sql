create extension if not exists pgmq;

create table if not exists public.today_jobs (
  id uuid primary key,
  access_token_hash text not null,
  email text not null,
  masked_email text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'delivery_failed', 'failed', 'cancelled')),
  idea jsonb not null,
  channel text not null check (channel in ('instagram', 'community', 'direct')),
  signal text not null check (signal in ('waitlist', 'interview', 'deposit')),
  artifacts jsonb,
  submitted_at timestamptz not null default now(),
  ready_at timestamptz not null,
  started_at timestamptz,
  completed_at timestamptz,
  emailed_at timestamptz,
  resend_email_id text,
  attempt_count integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.today_jobs enable row level security;
revoke all on table public.today_jobs from anon, authenticated;
grant select, insert, update, delete on table public.today_jobs to service_role;

create index if not exists today_jobs_status_ready_at_idx
  on public.today_jobs (status, ready_at);

select pgmq.create('today-production');

create or replace function public.today_enqueue_job(
  p_job_id uuid,
  p_delay_seconds integer default 86400
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_message_id bigint;
begin
  select pgmq.send(
    'today-production',
    jsonb_build_object('job_id', p_job_id),
    greatest(0, p_delay_seconds)
  )
  into v_message_id;

  return v_message_id;
end;
$$;

create or replace function public.today_claim_next_job()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_message_id bigint;
  v_message_body jsonb;
  v_job public.today_jobs%rowtype;
begin
  select msg_id, message
  into v_message_id, v_message_body
  from pgmq.read('today-production', 300, 1)
  limit 1;

  if v_message_id is null then
    return null;
  end if;

  update public.today_jobs
  set
    status = 'processing',
    started_at = coalesce(started_at, now()),
    attempt_count = attempt_count + 1,
    last_error = null,
    updated_at = now()
  where id = (v_message_body ->> 'job_id')::uuid
    and status in ('queued', 'processing', 'delivery_failed')
  returning *
  into v_job;

  if v_job.id is null then
    perform pgmq.delete('today-production', v_message_id);
    return jsonb_build_object('skipped', true);
  end if;

  return jsonb_build_object(
    'messageId', v_message_id,
    'job', to_jsonb(v_job)
  );
end;
$$;

create or replace function public.today_complete_job(
  p_job_id uuid,
  p_message_id bigint,
  p_artifacts jsonb,
  p_resend_email_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.today_jobs
  set
    status = 'ready',
    artifacts = p_artifacts,
    completed_at = now(),
    emailed_at = now(),
    resend_email_id = p_resend_email_id,
    last_error = null,
    updated_at = now()
  where id = p_job_id;

  perform pgmq.delete('today-production', p_message_id);
end;
$$;

create or replace function public.today_retry_job(
  p_job_id uuid,
  p_error text
)
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  update public.today_jobs
  set
    status = case when attempt_count >= 3 then 'failed' else 'delivery_failed' end,
    last_error = left(p_error, 500),
    updated_at = now()
  where id = p_job_id;
$$;

revoke all on function public.today_enqueue_job(uuid, integer) from public, anon, authenticated;
revoke all on function public.today_claim_next_job() from public, anon, authenticated;
revoke all on function public.today_complete_job(uuid, bigint, jsonb, text) from public, anon, authenticated;
revoke all on function public.today_retry_job(uuid, text) from public, anon, authenticated;

grant execute on function public.today_enqueue_job(uuid, integer) to service_role;
grant execute on function public.today_claim_next_job() to service_role;
grant execute on function public.today_complete_job(uuid, bigint, jsonb, text) to service_role;
grant execute on function public.today_retry_job(uuid, text) to service_role;
