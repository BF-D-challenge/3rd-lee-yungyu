-- Delivery can succeed even when Meta's response or the audit completion
-- update is lost. Model that state explicitly so it is never mistaken for a
-- retryable failure.
alter table public.matpin_admin_actions
  drop constraint matpin_admin_actions_status_check;

alter table public.matpin_admin_actions
  add constraint matpin_admin_actions_status_check
  check (status in ('pending', 'succeeded', 'failed', 'uncertain'));

update public.matpin_admin_actions
set
  status = 'uncertain',
  error_code = 'admin_action_completion_uncertain',
  completed_at = now()
where status = 'pending'
  and created_at <= now() - interval '10 minutes';

create index matpin_admin_actions_fingerprint_created_idx
  on public.matpin_admin_actions (
    sender_hash,
    action,
    message_id,
    payload_sha256,
    created_at desc
  );

-- Replay reads also reconcile stale pending rows. This is deliberately a
-- terminal uncertain state, not a retry, because delivery cannot be proved.
create function public.matpin_read_admin_action_replay(
  p_admin_user_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_action public.matpin_admin_actions%rowtype;
begin
  select *
  into v_action
  from public.matpin_admin_actions
  where admin_user_id = p_admin_user_id
    and idempotency_key = p_idempotency_key
  for update;

  if v_action.id is null then
    return null;
  end if;

  if v_action.status = 'pending'
    and v_action.created_at <= now() - interval '10 minutes'
  then
    update public.matpin_admin_actions
    set
      status = 'uncertain',
      error_code = 'admin_action_completion_uncertain',
      completed_at = now()
    where id = v_action.id
      and status = 'pending'
    returning * into v_action;
  end if;

  return jsonb_build_object(
    'state', 'duplicate',
    'id', v_action.id,
    'status', v_action.status,
    'metaMessageId', v_action.meta_message_id,
    'action', v_action.action,
    'messageId', v_action.message_id,
    'payloadSha256', v_action.payload_sha256
  );
end;
$$;

revoke all on function public.matpin_read_admin_action_replay(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.matpin_read_admin_action_replay(uuid, uuid)
  to service_role;

-- Claim under a transaction-scoped advisory lock. The lock makes the
-- fingerprint check and insert atomic even when two admins submit different
-- idempotency UUIDs at the same time. Only hashes and lengths are persisted.
create function public.matpin_claim_admin_action(
  p_admin_user_id uuid,
  p_sender_hash text,
  p_message_id uuid,
  p_action text,
  p_idempotency_key uuid,
  p_payload_sha256 text,
  p_payload_length integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_action public.matpin_admin_actions%rowtype;
  v_lock_material text;
begin
  v_lock_material := concat_ws(
    chr(31),
    p_sender_hash,
    p_action,
    coalesce(p_message_id::text, ''),
    coalesce(p_payload_sha256, '')
  );
  perform pg_advisory_xact_lock(hashtextextended(v_lock_material, 0));

  select *
  into v_action
  from public.matpin_admin_actions
  where admin_user_id = p_admin_user_id
    and idempotency_key = p_idempotency_key
  for update;

  if v_action.id is not null then
    if v_action.action <> p_action
      or v_action.sender_hash <> p_sender_hash
      or v_action.message_id is distinct from p_message_id
      or v_action.payload_sha256 is distinct from p_payload_sha256
    then
      raise exception using
        errcode = '22023',
        message = 'admin_action_idempotency_mismatch';
    end if;

    if v_action.status = 'pending'
      and v_action.created_at <= now() - interval '10 minutes'
    then
      update public.matpin_admin_actions
      set
        status = 'uncertain',
        error_code = 'admin_action_completion_uncertain',
        completed_at = now()
      where id = v_action.id
        and status = 'pending'
      returning * into v_action;
    end if;

    return jsonb_build_object(
      'state', 'duplicate',
      'id', v_action.id,
      'status', v_action.status,
      'metaMessageId', v_action.meta_message_id
    );
  end if;

  update public.matpin_admin_actions
  set
    status = 'uncertain',
    error_code = 'admin_action_completion_uncertain',
    completed_at = now()
  where sender_hash = p_sender_hash
    and action = p_action
    and message_id is not distinct from p_message_id
    and payload_sha256 is not distinct from p_payload_sha256
    and status = 'pending'
    and created_at <= now() - interval '10 minutes';

  select *
  into v_action
  from public.matpin_admin_actions
  where sender_hash = p_sender_hash
    and action = p_action
    and message_id is not distinct from p_message_id
    and payload_sha256 is not distinct from p_payload_sha256
    and (
      status in ('pending', 'uncertain')
      or created_at > now() - interval '10 minutes'
    )
  order by
    case status
      when 'pending' then 0
      when 'uncertain' then 1
      else 2
    end,
    created_at desc
  limit 1
  for update;

  if v_action.id is not null then
    return jsonb_build_object(
      'state', 'duplicate',
      'id', v_action.id,
      'status', v_action.status,
      'metaMessageId', v_action.meta_message_id
    );
  end if;

  insert into public.matpin_admin_actions (
    admin_user_id,
    sender_hash,
    message_id,
    action,
    idempotency_key,
    payload_sha256,
    payload_length
  ) values (
    p_admin_user_id,
    p_sender_hash,
    p_message_id,
    p_action,
    p_idempotency_key,
    p_payload_sha256,
    p_payload_length
  )
  returning * into v_action;

  return jsonb_build_object(
    'state', 'claimed',
    'id', v_action.id
  );
end;
$$;

revoke all on function public.matpin_claim_admin_action(
  uuid, text, uuid, text, uuid, text, integer
) from public, anon, authenticated;
grant execute on function public.matpin_claim_admin_action(
  uuid, text, uuid, text, uuid, text, integer
) to service_role;
