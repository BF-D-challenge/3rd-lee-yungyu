-- Reprocessing must invalidate the versioned global-place cache as well as the legacy key.
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
  where media_key in (v_reel_id, 'global-place-types-v1:' || v_reel_id);

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
