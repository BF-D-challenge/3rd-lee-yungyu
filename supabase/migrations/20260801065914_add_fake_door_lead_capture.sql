-- Keep this migration self-contained because the first production reservation
-- migration used a different timestamp and may not include later local changes.
alter table public.fake_door_reservations
  add column if not exists instagram_handle text,
  add column if not exists contact_consent_at timestamptz,
  add column if not exists privacy_version text,
  add column if not exists acquisition_source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text;

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

do $$
begin
  if exists (
    select 1
    from public.fake_door_reservations
    where contact_consent_at is null or privacy_version is null
  ) then
    raise exception
      'fake_door_reservations contains rows without contact consent; review them before this migration';
  end if;
end
$$;

alter table public.fake_door_reservations
  alter column contact_consent_at set not null,
  alter column privacy_version set not null;

alter table public.fake_door_reservations
  drop constraint if exists fake_door_reservations_contact_consent_check,
  drop constraint if exists fake_door_reservations_privacy_version_check,
  drop constraint if exists fake_door_reservations_acquisition_source_check,
  drop constraint if exists fake_door_reservations_utm_source_check,
  drop constraint if exists fake_door_reservations_utm_medium_check,
  drop constraint if exists fake_door_reservations_utm_campaign_check,
  drop constraint if exists fake_door_reservations_utm_content_check,
  drop constraint if exists fake_door_reservations_utm_term_check;

alter table public.fake_door_reservations
  add constraint fake_door_reservations_contact_consent_check
    check (contact_consent_at <= now() + interval '5 minutes'),
  add constraint fake_door_reservations_privacy_version_check
    check (privacy_version = '2026-08-01'),
  add constraint fake_door_reservations_acquisition_source_check
    check (acquisition_source is null or char_length(acquisition_source) between 1 and 120),
  add constraint fake_door_reservations_utm_source_check
    check (utm_source is null or char_length(utm_source) between 1 and 120),
  add constraint fake_door_reservations_utm_medium_check
    check (utm_medium is null or char_length(utm_medium) between 1 and 120),
  add constraint fake_door_reservations_utm_campaign_check
    check (utm_campaign is null or char_length(utm_campaign) between 1 and 120),
  add constraint fake_door_reservations_utm_content_check
    check (utm_content is null or char_length(utm_content) between 1 and 120),
  add constraint fake_door_reservations_utm_term_check
    check (utm_term is null or char_length(utm_term) between 1 and 120);

create schema if not exists private;

create or replace view private.fake_door_reservation_leads
with (security_barrier = true)
as
select
  r.id as reservation_id,
  r.user_id,
  u.email as contact_email,
  u.email_confirmed_at,
  r.product,
  r.slot_key,
  r.status,
  r.instagram_handle,
  r.contact_consent_at,
  r.privacy_version,
  r.source_path,
  r.acquisition_source,
  r.utm_source,
  r.utm_medium,
  r.utm_campaign,
  r.utm_content,
  r.utm_term,
  r.created_at,
  r.updated_at
from public.fake_door_reservations r
join auth.users u on u.id = r.user_id;

revoke all on table private.fake_door_reservation_leads from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on table private.fake_door_reservation_leads to service_role;
