create index matpin_instagram_users_manager_user_idx
  on public.matpin_instagram_users (manager_user_id)
  where manager_user_id is not null;
