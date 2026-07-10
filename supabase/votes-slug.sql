-- ============================================================================
-- 오늘 해볼까 — slug 기반 익명 응원 (피벗 P0: 투표가 발행자에게 실제로 도달)
-- ----------------------------------------------------------------------------
-- 왜 이 파일: 기존 schema.sql은 ideas 행 + owner 로그인을 전제하지만, 현재 앱은
--   카드/대결을 DB 행 없이 URL slug에 인코딩한다(무로그인 공유가 K의 심장).
--   그래서 "발행자가 응원을 실제로 본다"는 최소 기능만 slug 키로 구현한다.
--   기존 schema.sql(profiles/ideas/votes/purchases)은 로그인·결제 정식화 시점에 별도 적용.
--
-- 적용: Supabase 개인 대시보드 SQL Editor(프로젝트 fjhnwwdfuhmsffkvlbbo)에 통째 붙여넣기.
--   ⚠ claude.ai Supabase MCP 사용 금지(잘못된 조직 연결). 반드시 개인 대시보드로.
--   재실행 안전(IF NOT EXISTS / DROP ... IF EXISTS).
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. card_votes — 단일 카드 응원 (긍정 4종, 부정 없음). slug당 voter_fp 1표.
--    kind: 🔥 need(나도 이거 필요해) / 🙌 notify(완성하면 알려줘)
--          / 👀 watch(지켜볼게) / 💪 cheer(너라면 만들어)
-- ----------------------------------------------------------------------------
create table if not exists public.card_votes (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  kind       text not null check (kind in ('need', 'notify', 'watch', 'cheer')),
  comment    text,
  voter_fp   text not null,                    -- 익명 투표자 지문(브라우저 localStorage UUID)
  created_at timestamptz not null default now(),
  unique (slug, voter_fp)                      -- 같은 카드 중복 응원 차단
);
create index if not exists idx_card_votes_slug on public.card_votes (slug);

-- ----------------------------------------------------------------------------
-- 2. duel_votes — A/B 응원 대결. slug당 voter_fp 1표.
-- ----------------------------------------------------------------------------
create table if not exists public.duel_votes (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,
  side       text not null check (side in ('a', 'b')),
  comment    text,
  voter_fp   text not null,
  created_at timestamptz not null default now(),
  unique (slug, voter_fp)
);
create index if not exists idx_duel_votes_slug on public.duel_votes (slug);

-- v10 수신자 플로우 메타데이터. 기존 익명 행과 구버전 클라이언트를 위해 모두 nullable이다.
alter table public.duel_votes
  add column if not exists round_id       text,
  add column if not exists user_id        text,
  add column if not exists candidate_id   text,
  add column if not exists praise_id      text,
  add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'duel_votes_praise_id_check'
      and conrelid = 'public.duel_votes'::regclass
  ) then
    alter table public.duel_votes
      add constraint duel_votes_praise_id_check
      check (praise_id is null or praise_id in ('need', 'notify', 'cheer'));
  end if;
end
$$;

-- NULL은 여러 행에 허용하면서 v10 요청은 같은 키로 한 번만 저장한다.
create unique index if not exists uq_duel_votes_idempotency_key
  on public.duel_votes (idempotency_key);
create unique index if not exists uq_duel_votes_round_user
  on public.duel_votes (round_id, user_id)
  where round_id is not null and user_id is not null;
create index if not exists idx_duel_votes_round_candidate
  on public.duel_votes (round_id, candidate_id)
  where round_id is not null;
create index if not exists idx_duel_votes_user_id
  on public.duel_votes (user_id)
  where user_id is not null;

-- ----------------------------------------------------------------------------
-- RLS — 수신자 무로그인. 익명 insert 허용 + 공개 select.
--   slug는 추측 불가 capability 토큰(base64url 인코딩된 카드)이라, 이를 아는 사람만
--   해당 카드의 집계를 읽는다(기존 schema.sql ideas_select_public 과 동일 철학).
--   투표 내용에 PII 없음(voter_fp는 익명 UUID). 실명 리빌은 향후 opt-in으로 별도.
-- ----------------------------------------------------------------------------
alter table public.card_votes enable row level security;
alter table public.duel_votes enable row level security;

drop policy if exists card_votes_insert_anon on public.card_votes;
create policy card_votes_insert_anon on public.card_votes
  for insert to anon, authenticated with check (true);

drop policy if exists card_votes_select_public on public.card_votes;
create policy card_votes_select_public on public.card_votes
  for select to anon, authenticated using (true);

-- 응원 직후 한마디를 뒤늦게 붙일 때 자기 행 comment 갱신(프로토타입 신뢰모델 = insert와 동일).
drop policy if exists card_votes_update_anon on public.card_votes;
create policy card_votes_update_anon on public.card_votes
  for update to anon, authenticated using (true) with check (true);

drop policy if exists duel_votes_insert_anon on public.duel_votes;
create policy duel_votes_insert_anon on public.duel_votes
  for insert to anon, authenticated with check (true);

drop policy if exists duel_votes_select_public on public.duel_votes;
create policy duel_votes_select_public on public.duel_votes
  for select to anon, authenticated using (true);

drop policy if exists duel_votes_update_anon on public.duel_votes;
create policy duel_votes_update_anon on public.duel_votes
  for update to anon, authenticated using (true) with check (true);

-- 참고(어뷰징 방어): voter_fp는 클라이언트 생성이라 위조 가능. 프로토타입은 (slug,voter_fp)
--   unique + 클라이언트 dedup으로 충분. rate-limit/지문 무결성은 실측 후 Edge Function으로.

-- ----------------------------------------------------------------------------
-- 3. 컬럼 권한 강화 — update은 comment만 허용(응원 후 한마디를 뒤늦게 붙이는 용도).
--   위 update 정책의 using(true)/with check(true)는 "누가" 갱신 가능한지만 걸렀고
--   "어떤 컬럼"까지 바꿀 수 있는지는 막지 않았다 — 익명 누구나 임의 행의 kind/side까지
--   위조할 수 있던 구멍. 컬럼 단위 GRANT로 comment 외 컬럼은 update 자체를 차단한다.
--   (REVOKE/GRANT는 재실행해도 안전 — 존재 여부와 무관하게 멱등)
-- ----------------------------------------------------------------------------
revoke update on public.card_votes from anon, authenticated;
grant update (comment) on public.card_votes to anon, authenticated;

revoke update on public.duel_votes from anon, authenticated;
grant update (comment) on public.duel_votes to anon, authenticated;
