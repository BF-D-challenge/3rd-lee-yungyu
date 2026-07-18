-- 새 feedback-api를 사용하는 웹앱이 운영 배포된 것을 확인한 뒤에만 적용한다.
-- 이 마이그레이션을 먼저 적용하면 구버전 웹앱의 응원 읽기·쓰기가 중단된다.

drop policy if exists card_votes_insert_anon on public.card_votes;
drop policy if exists card_votes_select_public on public.card_votes;
drop policy if exists card_votes_update_anon on public.card_votes;
drop policy if exists duel_votes_insert_anon on public.duel_votes;
drop policy if exists duel_votes_select_public on public.duel_votes;
drop policy if exists duel_votes_update_anon on public.duel_votes;

revoke all on public.card_votes from anon, authenticated;
revoke all on public.duel_votes from anon, authenticated;
grant select, insert, update on public.card_votes to service_role;
grant select, insert, update on public.duel_votes to service_role;

drop policy if exists votes_insert_anon on public.votes;
revoke insert on public.votes from anon, authenticated;
