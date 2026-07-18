create extension if not exists pgcrypto with schema extensions;

create table if not exists public.feedback_requests (
  id               uuid primary key default gen_random_uuid(),
  channel          text not null check (channel in ('card', 'duel')),
  request_id       text not null,
  write_token_hash text not null,
  read_token_hash  text not null,
  created_at       timestamptz not null default now(),
  unique (channel, request_id),
  unique (write_token_hash),
  unique (read_token_hash),
  check (write_token_hash <> read_token_hash)
);

alter table public.feedback_requests enable row level security;
revoke all on public.feedback_requests from anon, authenticated;
grant select, insert on public.feedback_requests to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.feedback_rate_limits (
  bucket_hash   text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (bucket_hash, window_start)
);

create index if not exists idx_feedback_rate_limits_window
  on private.feedback_rate_limits (window_start);

revoke all on private.feedback_rate_limits from public, anon, authenticated;

create or replace function public.consume_feedback_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if length(p_bucket) < 16
    or p_limit < 1 or p_limit > 1000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into private.feedback_rate_limits (bucket_hash, window_start, request_count)
  values (p_bucket, v_window_start, 1)
  on conflict (bucket_hash, window_start)
  do update set request_count = private.feedback_rate_limits.request_count + 1
  returning request_count into v_count;

  delete from private.feedback_rate_limits
  where window_start < clock_timestamp() - interval '1 day';

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_feedback_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_feedback_rate_limit(text, integer, integer) to service_role;

alter table public.published_cards
  add column if not exists feedback_read_token text;

-- 직접 브라우저 접근 차단은 새 웹앱 배포가 확인된 뒤
-- 20260718020000_lock_direct_feedback_access.sql로 전환한다.
-- 이 단계는 구버전 웹앱을 깨뜨리지 않는 additive migration이다.

alter function public.set_updated_at() set search_path = '';
