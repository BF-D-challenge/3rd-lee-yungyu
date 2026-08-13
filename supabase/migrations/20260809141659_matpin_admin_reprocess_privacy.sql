-- Keep the existing two-argument reprocess function for already-deployed
-- callers. The admin workflow uses this three-argument overload with false so
-- a historical retry cannot send a fresh unsolicited DM.

create function public.matpin_requeue_failed_message(
  p_message_id uuid,
  p_media_url_ciphertext text,
  p_reply_required boolean
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
    reply_required = p_reply_required,
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

revoke all on function public.matpin_requeue_failed_message(uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.matpin_requeue_failed_message(uuid, text, boolean)
  to service_role;

-- The admin audit table is intentionally not cascading from a foreign key so
-- its action references may be nullable. Remove its user hash only through
-- this account-deletion trigger, while direct DELETE remains unavailable to
-- the service role.
create or replace function public.matpin_delete_admin_actions_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.matpin_admin_actions
  where sender_hash = old.sender_hash;
  return old;
end;
$$;

revoke all on function public.matpin_delete_admin_actions_for_user()
  from public, anon, authenticated, service_role;

drop trigger if exists matpin_instagram_users_delete_admin_actions
  on public.matpin_instagram_users;

create trigger matpin_instagram_users_delete_admin_actions
before delete on public.matpin_instagram_users
for each row
execute function public.matpin_delete_admin_actions_for_user();

-- The audit writer only completes an action. It must not be able to alter
-- immutable request fingerprints or delete audit records directly.
revoke update on table public.matpin_admin_actions from service_role;
grant update (status, meta_message_id, error_code, completed_at)
  on table public.matpin_admin_actions to service_role;
