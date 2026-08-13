-- A media analysis can exceed the previous 45-second queue visibility window.
-- The deployed worker is capped at 300 seconds, so a 600-second lease prevents
-- a second worker from claiming the same message
-- while the first invocation is still alive and still permits crash recovery.
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
  from pgmq.read('matpin-instagram', 600, 1)
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

revoke all on function public.matpin_claim_next_message()
  from public, anon, authenticated;
grant execute on function public.matpin_claim_next_message()
  to service_role;
