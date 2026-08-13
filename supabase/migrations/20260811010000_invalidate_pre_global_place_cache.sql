-- Global place types change the extraction and resolution contract. Do not
-- reuse a pre-expansion result whose media key has no contract version.
update public.matpin_media_analysis_cache
set
  invalidated_at = coalesce(invalidated_at, now()),
  updated_at = now()
where media_key not like 'global-place-types-v1:%'
  and invalidated_at is null;
