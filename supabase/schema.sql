-- ============================================================================
-- 오늘 해볼까? (oneul-haebolkka) — Supabase schema v2
-- 개선안 §3.4 초안을 실전 DDL로 구현.
--   여정: 씨앗 입력 → 3릴 슬롯(씨앗 고정) → 카드 발행(로그인) → 지인 익명 투표 →
--         수요 대시보드/리포트 → 실행 플랜.
--   결제 3지점: ① 오늘 패스(day_pass) ② 실행 플랜(plan) ③ 수요 리포트(demand_report)
--
-- 적용:
--   supabase db push  (또는 Supabase SQL Editor에 통째 붙여넣기)
--   재실행 안전을 위해 대부분 IF NOT EXISTS / DROP ... IF EXISTS 로 방어.
--
-- 인증 전제: Supabase Auth (구글 OAuth + 이메일 매직링크). auth.users 를 기준으로 함.
-- ============================================================================

-- gen_random_uuid() / gen_random_bytes() 용. Supabase 는 보통 이미 활성.
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 0. ENUM 타입
-- ----------------------------------------------------------------------------
-- 투표 3종: 🔥 나도 써볼래 / 💬 문제 공감 / 🤔 글쎄
do $$ begin
  create type public.vote_type as enum ('try', 'empathy', 'meh');
exception when duplicate_object then null; end $$;

-- 결제 상품 3종
do $$ begin
  create type public.product_type as enum ('plan', 'day_pass', 'demand_report');
exception when duplicate_object then null; end $$;

-- 결제 상태
do $$ begin
  create type public.purchase_status as enum ('pending', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- 씨앗 트랙: 좋아하는 걸로 / 잘 아는 걸로 (온보딩 S0-a)
do $$ begin
  create type public.seed_track as enum ('love', 'know');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- updated_at 자동 갱신 트리거 함수 (공용)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. profiles — auth.users(1:1). 온보딩에서 채운 씨앗/트랙/시간/레벨 보관.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  seed_text     text,                                  -- 확정 씨앗(소분류 칩 or 자유입력 탈출구)
  track         public.seed_track,                     -- love | know
  weekly_hours  smallint check (weekly_hours is null or weekly_hours between 0 and 168),
  skill_level   smallint check (skill_level  is null or skill_level  between 1 and 3),  -- Lv.1~3
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ideas — 확정된 아이디어 카드. share_slug 로 공개 투표 페이지 노출.
-- ----------------------------------------------------------------------------
create table if not exists public.ideas (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  seed_text      text not null,                         -- 이 카드가 태어난 씨앗
  combo_json     jsonb not null default '{}'::jsonb,    -- 3릴 표면 + 숨은 상황/심리 축 조합 규칙 결과
  title          text,
  oneliner       text,
  plan_unlocked  boolean not null default false,        -- 결제② 실행 플랜 해제 여부
  share_slug     text not null unique
                   default encode(extensions.gen_random_bytes(8), 'hex'),  -- 추측 불가 공유 토큰
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

create index if not exists idx_ideas_owner       on public.ideas (owner_id);

-- ----------------------------------------------------------------------------
-- 3. votes — 비로그인 익명 투표. (idea_id, voter_fp) 로 1인 1표.
--    voter_fp = 브라우저 지문 + IP 해시 (앱/Edge Function 에서 생성).
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  idea_id    uuid not null references public.ideas (id) on delete cascade,
  vote_type  public.vote_type not null,
  comment    text,                                      -- 선택적 한마디(유일한 주관식 탈출구)
  voter_fp   text not null,                             -- 익명 투표자 핑거프린트 해시
  created_at timestamptz not null default now(),
  unique (idea_id, voter_fp)                            -- 같은 카드 중복 투표 차단
);

create index if not exists idx_votes_idea on public.votes (idea_id);

-- ----------------------------------------------------------------------------
-- 4. spins — 데일리 5회 스핀 캡. 로그인/비로그인 통합 키(user_or_session_id).
--    (키, 날짜) 당 1행, count 증가. 5 초과 시 결제① 페이월.
-- ----------------------------------------------------------------------------
create table if not exists public.spins (
  id                  uuid primary key default gen_random_uuid(),
  user_or_session_id  text not null,                    -- auth.uid()::text | 익명 세션 id
  spin_date           date not null default current_date,
  count               smallint not null default 0 check (count >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_or_session_id, spin_date)
);

drop trigger if exists trg_spins_updated_at on public.spins;
create trigger trg_spins_updated_at
  before update on public.spins
  for each row execute function public.set_updated_at();

create index if not exists idx_spins_key_date on public.spins (user_or_session_id, spin_date);

-- ----------------------------------------------------------------------------
-- 5. purchases — 결제 이력 3상품. idea_id 는 plan/demand_report 에서 참조, day_pass 는 null 가능.
-- ----------------------------------------------------------------------------
create table if not exists public.purchases (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  idea_id    uuid references public.ideas (id) on delete set null,
  product    public.product_type not null,
  amount     integer not null check (amount >= 0),      -- 원(KRW), 정수
  status     public.purchase_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create index if not exists idx_purchases_user on public.purchases (user_id);
create index if not exists idx_purchases_idea on public.purchases (idea_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
alter table public.profiles  enable row level security;
alter table public.ideas     enable row level security;
alter table public.votes     enable row level security;
alter table public.spins     enable row level security;
alter table public.purchases enable row level security;

-- ---- profiles: 본인만 ------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ---- ideas: share_slug 공개 읽기 + owner 쓰기 -----------------------------
-- 공개 읽기: slug 자체가 추측 불가 capability 토큰이라 anon 에도 select 개방.
-- (카드 내용은 비밀이 아님. 결제 게이팅[plan_unlocked]은 앱 레벨에서 블러 처리.)
drop policy if exists ideas_select_public on public.ideas;
create policy ideas_select_public on public.ideas
  for select to anon, authenticated using (true);

drop policy if exists ideas_insert_own on public.ideas;
create policy ideas_insert_own on public.ideas
  for insert to authenticated with check ((select auth.uid()) = owner_id);

drop policy if exists ideas_update_own on public.ideas;
create policy ideas_update_own on public.ideas
  for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

drop policy if exists ideas_delete_own on public.ideas;
create policy ideas_delete_own on public.ideas
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- ---- votes: 익명 insert 허용 / 상세 읽기는 owner + 수요리포트 결제 확인 ----
-- rate-limit(브라우저지문+IP당 분당 N건 등)은 RLS 로 표현 불가 →
--   Edge Function(service_role) 에서 voter_fp 생성·중복·레이트리밋을 강제한 뒤 insert 를 위임한다.
--   아래 insert 정책은 최소 개방(anon)만 담당하고, 남용 방지는 Edge Function 책임.
drop policy if exists votes_insert_anon on public.votes;
create policy votes_insert_anon on public.votes
  for insert to anon, authenticated with check (true);

-- 무료 층(투표 수 카운트)은 security-definer 집계 RPC 로 노출하고,
-- 행 단위 상세(누가·왜 = comment/voter_fp)는 owner 이면서 해당 카드 demand_report 결제 완료자만.
drop policy if exists votes_select_owner_paid on public.votes;
create policy votes_select_owner_paid on public.votes
  for select to authenticated using (
    exists (
      select 1 from public.ideas i
      where i.id = votes.idea_id and i.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.purchases p
      where p.idea_id = votes.idea_id
        and p.user_id = (select auth.uid())
        and p.product = 'demand_report'
        and p.status  = 'paid'
    )
  );

drop policy if exists votes_delete_owner on public.votes;
create policy votes_delete_owner on public.votes
  for delete to authenticated using (
    exists (
      select 1 from public.ideas i
      where i.id = votes.idea_id and i.owner_id = (select auth.uid())
    )
  );

-- ---- spins: 로그인 사용자 본인 키만 (익명 세션 캡은 Edge Function 위임) ----
-- 익명(anon) 세션의 스핀 카운트/캡 증가는 service_role Edge Function 에서 처리(RLS 우회).
drop policy if exists spins_select_own on public.spins;
create policy spins_select_own on public.spins
  for select to authenticated using ((select auth.uid())::text = user_or_session_id);

drop policy if exists spins_insert_own on public.spins;
create policy spins_insert_own on public.spins
  for insert to authenticated with check ((select auth.uid())::text = user_or_session_id);

drop policy if exists spins_update_own on public.spins;
create policy spins_update_own on public.spins
  for update to authenticated
  using ((select auth.uid())::text = user_or_session_id)
  with check ((select auth.uid())::text = user_or_session_id);

-- ---- purchases: owner 만 -------------------------------------------------
-- 상태 전이(pending→paid 등)는 PG 웹훅을 받는 service_role Edge Function 이 담당(RLS 우회).
drop policy if exists purchases_select_own on public.purchases;
create policy purchases_select_own on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists purchases_insert_own on public.purchases;
create policy purchases_insert_own on public.purchases
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 6. published_cards — 로그인 발행자의 카드 목록(기기 간 동기화용).
--    slug(URL 인코딩 payload)를 그대로 보관 — 조회는 항상 payload 컬럼에서, DB 재계산 없음.
--    참고: card_votes/duel_votes(응원 데이터)는 이 파일 v2 이후 대시보드 SQL Editor에서
--    별도로 추가돼 라이브에는 존재하나 이 schema.sql에는 아직 반영 안 돼 있었음(2026-07-08 확인).
--    이 섹션은 그 갭과는 별개로 새로 추가하는 v3 테이블이다.
-- ----------------------------------------------------------------------------
create table if not exists public.published_cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  slug          text not null,
  payload       jsonb not null,
  feedback_read_token text,
  published_at  timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists idx_published_cards_user
  on public.published_cards (user_id, published_at desc);

alter table public.published_cards enable row level security;

drop policy if exists published_cards_select_own on public.published_cards;
create policy published_cards_select_own on public.published_cards
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists published_cards_insert_own on public.published_cards;
create policy published_cards_insert_own on public.published_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists published_cards_update_own on public.published_cards;
create policy published_cards_update_own on public.published_cards
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists published_cards_delete_own on public.published_cards;
create policy published_cards_delete_own on public.published_cards
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ============================================================================
-- 끝. 요약
--   테이블 6  : profiles, ideas, votes, spins, purchases, published_cards
--   ENUM   4  : vote_type, product_type, purchase_status, seed_track
--   RLS 정책 19: profiles×3, ideas×4, votes×3, spins×3, purchases×2, published_cards×4
--   Edge Function 위임: capability 토큰 기반 익명 응원 / rate-limit / 익명 스핀 캡 / 결제 상태 전이
--   ⚠ 라이브 DB에는 이 파일에 없는 card_votes/duel_votes 테이블이 이미 존재함(2026-07-08 REST 프로브로 확인).
--     본 파일과 라이브 스키마가 어긋나 있으니, 다음 정리 작업 때 card_votes/duel_votes 정의도
--     이 파일에 역으로 반영해 단일 진실 소스로 통합할 것.
-- ============================================================================
