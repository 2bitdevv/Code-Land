-- Room leaderboard: let players and room host read room_scores for that room.
-- Without SELECT for peers, realtime fetch often returns only your own rows (RLS),
-- so the teacher sees empty tables even when data exists.

drop policy if exists "room_scores_select_participants" on public.room_scores;

create policy "room_scores_select_participants"
on public.room_scores
for select
to public
using (
    exists (
        select 1
        from public.room_players rp
        where rp.room_id = room_scores.room_id
          and rp.student_id = auth.uid()
    )
    or exists (
        select 1
        from public.rooms r
        where r.id = room_scores.room_id
          and r.teacher_id = auth.uid()
    )
);
