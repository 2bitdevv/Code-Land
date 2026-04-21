-- Leaderboard / dashboard: allow reading all rows in global_scores.
-- Without this, RLS often restricts SELECT to auth.uid() only — then each user
-- only sees their own rows in GlobalLeaderboard and others appear missing.
--
-- Apply in Supabase SQL Editor or: supabase db push
-- INSERT/UPDATE policies should remain scoped to the player (unchanged here).

drop policy if exists "global_scores_select_leaderboard_public" on public.global_scores;

create policy "global_scores_select_leaderboard_public"
on public.global_scores
for select
to public
using (true);
