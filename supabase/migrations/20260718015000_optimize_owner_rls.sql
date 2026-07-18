-- auth.uid()를 행마다 다시 계산하지 않고 쿼리당 한 번만 계산한다.
-- 정책의 허용 범위는 바뀌지 않는다.

alter policy profiles_select_own on public.profiles
  using ((select auth.uid()) = id);
alter policy profiles_insert_own on public.profiles
  with check ((select auth.uid()) = id);
alter policy profiles_update_own on public.profiles
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy ideas_insert_own on public.ideas
  with check ((select auth.uid()) = owner_id);
alter policy ideas_update_own on public.ideas
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
alter policy ideas_delete_own on public.ideas
  using ((select auth.uid()) = owner_id);

alter policy votes_select_owner_paid on public.votes
  using (
    exists (
      select 1 from public.ideas i
      where i.id = votes.idea_id and i.owner_id = (select auth.uid())
    )
    and exists (
      select 1 from public.purchases p
      where p.idea_id = votes.idea_id
        and p.user_id = (select auth.uid())
        and p.product = 'demand_report'
        and p.status = 'paid'
    )
  );
alter policy votes_delete_owner on public.votes
  using (
    exists (
      select 1 from public.ideas i
      where i.id = votes.idea_id and i.owner_id = (select auth.uid())
    )
  );

alter policy spins_select_own on public.spins
  using ((select auth.uid())::text = user_or_session_id);
alter policy spins_insert_own on public.spins
  with check ((select auth.uid())::text = user_or_session_id);
alter policy spins_update_own on public.spins
  using ((select auth.uid())::text = user_or_session_id)
  with check ((select auth.uid())::text = user_or_session_id);

alter policy purchases_select_own on public.purchases
  using ((select auth.uid()) = user_id);
alter policy purchases_insert_own on public.purchases
  with check ((select auth.uid()) = user_id);

alter policy published_cards_select_own on public.published_cards
  using ((select auth.uid()) = user_id);
alter policy published_cards_insert_own on public.published_cards
  with check ((select auth.uid()) = user_id);
alter policy published_cards_update_own on public.published_cards
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
alter policy published_cards_delete_own on public.published_cards
  using ((select auth.uid()) = user_id);

drop index if exists public.idx_ideas_share_slug;
