create table if not exists public.idea_taste_answers (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null check (char_length(question_id) between 1 and 64),
  answer_id   text not null check (char_length(answer_id) between 1 and 64),
  trait_id    text check (trait_id is null or char_length(trait_id) between 1 and 64),
  created_at  timestamptz not null default now(),
  constraint idea_taste_answers_known_choice check (
    (question_id, answer_id, coalesce(trait_id, '')) in (
      ('audience', 'personal', 'audience:personal'),
      ('audience', 'work', 'audience:work'),
      ('audience', 'either', ''),
      ('input', 'lightweight', 'input:lightweight'),
      ('input', 'media', 'input:media'),
      ('input', 'either', ''),
      ('outcome', 'create', 'outcome:create'),
      ('outcome', 'decide', 'outcome:decide'),
      ('outcome', 'either', ''),
      ('surface', 'browser', 'surface:browser'),
      ('surface', 'mobile', 'surface:mobile'),
      ('surface', 'either', '')
    )
  )
);

create index if not exists idx_idea_taste_answers_user_created
  on public.idea_taste_answers (user_id, created_at desc);

alter table public.idea_taste_answers enable row level security;

revoke all on table public.idea_taste_answers from anon;
revoke all on table public.idea_taste_answers from authenticated;
grant select, insert on table public.idea_taste_answers to authenticated;
grant all on table public.idea_taste_answers to service_role;

drop policy if exists idea_taste_answers_select_own on public.idea_taste_answers;
create policy idea_taste_answers_select_own
  on public.idea_taste_answers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists idea_taste_answers_insert_own on public.idea_taste_answers;
create policy idea_taste_answers_insert_own
  on public.idea_taste_answers
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
