create index matpin_admin_actions_message_idx
  on public.matpin_admin_actions (message_id)
  where message_id is not null;
