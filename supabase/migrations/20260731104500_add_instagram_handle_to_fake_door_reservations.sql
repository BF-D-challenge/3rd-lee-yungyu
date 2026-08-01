alter table public.fake_door_reservations
  add column if not exists instagram_handle text;

alter table public.fake_door_reservations
  drop constraint if exists fake_door_reservations_instagram_handle_check;

alter table public.fake_door_reservations
  add constraint fake_door_reservations_instagram_handle_check
  check (
    (
      instagram_handle is null
      and product not in ('matpick', 'onebite')
    )
    or (
      product in ('matpick', 'onebite')
      and instagram_handle is not null
      and char_length(instagram_handle) between 1 and 30
      and instagram_handle ~ '^[a-z0-9_]+([.][a-z0-9_]+)*$'
    )
  );
