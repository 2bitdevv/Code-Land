-- Fix missing profile rows and repair global_scores FK.
-- Run this in Supabase SQL Editor (or via supabase migration pipeline).

begin;

-- 1) Backfill missing profiles for existing auth users.
insert into public.profiles (id, username, role, created_at)
select
    au.id,
    coalesce(
        nullif(trim(au.raw_user_meta_data ->> 'username'), ''),
        nullif(split_part(coalesce(au.email, ''), '@', 1), ''),
        'player_' || left(au.id::text, 8)
    ) as username,
    case
        when (au.raw_user_meta_data ->> 'role') in ('teacher', 'student')
            then (au.raw_user_meta_data ->> 'role')
        else 'student'
    end as role,
    coalesce(au.created_at, now()) as created_at
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;

-- 2) Recreate FK to match app usage (global_scores.user_id -> profiles.id).
alter table public.global_scores
drop constraint if exists global_scores_user_id_fkey;

alter table public.global_scores
add constraint global_scores_user_id_fkey
foreign key (user_id)
references public.profiles (id)
on delete cascade;

commit;
