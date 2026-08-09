create table public.matpin_api_usage_events (
  id bigint generated always as identity primary key,
  message_id uuid not null references public.matpin_instagram_messages(id) on delete cascade,
  stage text not null check (stage in ('extraction', 'place_resolution')),
  provider text not null,
  model text,
  outcome text not null default 'success' check (outcome in ('success', 'error')),
  request_count integer not null default 1 check (request_count >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  thought_tokens integer check (thought_tokens is null or thought_tokens >= 0),
  tool_use_tokens integer check (tool_use_tokens is null or tool_use_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  grounding_query_count integer check (grounding_query_count is null or grounding_query_count >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index matpin_api_usage_events_created_idx
  on public.matpin_api_usage_events (created_at desc);

create index matpin_api_usage_events_message_idx
  on public.matpin_api_usage_events (message_id, created_at);

alter table public.matpin_api_usage_events enable row level security;

revoke all on table public.matpin_api_usage_events from public, anon, authenticated;
revoke all on sequence public.matpin_api_usage_events_id_seq from public, anon, authenticated;

grant select, insert on table public.matpin_api_usage_events to service_role;
grant usage, select on sequence public.matpin_api_usage_events_id_seq to service_role;
