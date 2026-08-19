alter table public.matpin_saved_places
  drop constraint if exists matpin_saved_places_confirmation_source_check;

alter table public.matpin_saved_places
  add constraint matpin_saved_places_confirmation_source_check
  check (confirmation_source in (
    'automatic_high_confidence',
    'user_confirmation',
    'operator_verified'
  ));

comment on column public.matpin_saved_places.confirmation_source is
  'automatic_high_confidence is the normal resolver path, user_confirmation is the end-user selection path, and operator_verified is a human recovery based on public post evidence.';

create or replace function public.matpin_save_places(
  p_message_id uuid,
  p_sender_hash text,
  p_places jsonb,
  p_confirmation_source text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.matpin_instagram_messages%rowtype;
  v_place jsonb;
  v_saved_count integer := 0;
begin
  if p_confirmation_source not in (
    'automatic_high_confidence',
    'user_confirmation',
    'operator_verified'
  ) then
    raise exception 'invalid matpin confirmation source';
  end if;

  if jsonb_typeof(p_places) <> 'array'
    or jsonb_array_length(p_places) < 1
    or jsonb_array_length(p_places) > 3 then
    raise exception 'matpin places must contain between one and three items';
  end if;

  select * into v_message
  from public.matpin_instagram_messages
  where id = p_message_id and sender_hash = p_sender_hash
  for update;

  if v_message.id is null then
    raise exception 'matpin message not found';
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
    status = 'saved',
    selected_place_id = p_places -> 0 ->> 'id',
    candidates = p_places,
    analyzed_at = coalesce(analyzed_at, now()),
    last_error = null,
    updated_at = now()
  where id = p_message_id and sender_hash = p_sender_hash;

  return v_saved_count;
end;
$$;

revoke all on function public.matpin_save_places(uuid, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.matpin_save_places(uuid, text, jsonb, text)
  to service_role;
