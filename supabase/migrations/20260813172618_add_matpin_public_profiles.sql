create table public.matpin_public_profiles (
  sender_hash text primary key
    references public.matpin_instagram_users(sender_hash) on delete cascade,
  username text,
  is_public boolean not null default false,
  publication_authorized_at timestamptz,
  publication_authorization_source text,
  username_verified_at timestamptz,
  enabled_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matpin_public_profiles_sender_hash_check check (
    sender_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint matpin_public_profiles_authorization_source_check check (
    publication_authorization_source is null
    or publication_authorization_source in ('operator_manual', 'user_request')
  ),
  constraint matpin_public_profiles_username_check check (
    username is null
    or (
      username = lower(username)
      and char_length(username) between 1 and 30
      and username ~ '^[a-z0-9_](?:[a-z0-9._]*[a-z0-9_])?$'
      and username !~ '\.\.'
    )
  ),
  constraint matpin_public_profiles_enabled_check check (
    not is_public
    or (
      username is not null
      and publication_authorized_at is not null
      and publication_authorization_source is not null
      and publication_authorization_source in ('operator_manual', 'user_request')
      and username_verified_at is not null
      and enabled_at is not null
      and disabled_at is null
    )
  )
);

comment on table public.matpin_public_profiles is
  'Explicitly authorized mapping from a public Instagram username to a Matpin account. Never stores an access token or raw Meta scoped ID.';

comment on column public.matpin_public_profiles.publication_authorization_source is
  'Audit source for enabling the public profile. operator_manual means the service operator explicitly approved publication.';

alter table public.matpin_public_profiles enable row level security;

revoke all on table public.matpin_public_profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.matpin_public_profiles to service_role;

create unique index matpin_public_profiles_visible_username_idx
  on public.matpin_public_profiles (username)
  where is_public = true;
