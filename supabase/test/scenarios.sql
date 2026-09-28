\set QUIET 1
\pset format unaligned
\pset tuples_only on
-- sign-ups (as Supabase would insert them)
\echo == 1. first sign-up becomes host; bad names and duplicates are refused
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000a', 'greg@example.com', '{"username":"Greg","avatar":"🌍","color":"#FFC857"}');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-00000000000b', 'maya@example.com', '{"username":"Maya"}');
select username, is_admin from profiles order by created_at, username;
\echo -- duplicate username (case-insensitive) must fail:
insert into auth.users (email, raw_user_meta_data) values ('x@example.com', '{"username":"greg"}');
\echo -- bad characters must fail:
insert into auth.users (email, raw_user_meta_data) values ('y@example.com', '{"username":"<script>"}');
select 'check_signup(greg)', public.check_signup('greg');

\echo == 2. anon can only use the three public functions
set role anon;
select 'public_settings', public.public_settings();
select 'login email for Maya', public.email_for_login('maya');
select count(*) from profiles;
reset role;

\echo == 3. a player cannot touch stats, other profiles, games or settings directly
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
update profiles set avatar = '🦊', color = '#C58BFF' where id = auth.uid();
select 'maya look', avatar, color from profiles where id = auth.uid();
\echo -- rating edit must fail:
update profiles set rating = 3000 where id = auth.uid();
\echo -- editing Greg must change 0 rows:
update profiles set avatar = '💀' where username = 'Greg';
select 'greg avatar still', avatar from profiles where username = 'Greg';
\echo -- insert game directly must fail:
insert into games (user_id, mode, score, max, raws) values (auth.uid(), 'random', 1000, 1000, '{100,100,100,100,100}');
select 'settings visible to player', count(*) from settings;
\echo -- admin function must fail:
select public.admin_users();
select 'is_admin', public.is_admin();

\echo == 4. record games: server recomputes score and rating
select 'random', public.record_game('random', '{100,95,80,70,60}', '{Paris,Seoul,Petra,Waterloo,Nuuk}', current_date);
select 'daily', public.record_game('daily', '{90,90,90,90,90}', '{A,B,C,D,E}', current_date);
\echo -- second daily same day must fail:
select public.record_game('daily', '{100,100,100,100,100}', '{A,B,C,D,E}', current_date);
\echo -- out-of-range round must fail:
select public.record_game('random', '{101,100,100,100,100}', '{}', current_date);
select 'blitz', public.record_game('blitz', '{50,50,50,50,50}', '{}', current_date);
select 'maya stats', games, avg, best, rating, rated_games, streak, blitz_best, bullseyes from profiles where id = auth.uid();
select 'maya sees own games', count(*) from games;

\echo == 5. duel: both play, Elo applies once to both
select set_config('t.duel', public.create_duel('00000000-0000-0000-0000-00000000000a', '{0,30,60,90,120}')::text, false);
select 'maya plays', public.record_game('duel', '{100,100,100,100,100}', '{}', current_date, current_setting('t.duel')::uuid);
\echo -- replay must fail:
select public.record_game('duel', '{100,100,100,100,100}', '{}', current_date, current_setting('t.duel')::uuid);
\echo -- self-duel must fail:
select public.create_duel(auth.uid(), '{1,2,3,4,5}');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select 'greg rating before', rating from profiles where id = auth.uid();
select 'greg plays', public.record_game('duel', '{10,10,10,10,10}', '{}', current_date, current_setting('t.duel')::uuid);
select 'after duel', username, rating from profiles order by username;
select 'duel rated', rated, challenger_score, opponent_score from duels;
select 'greg (host) sees all games', count(*) from games;

\echo == 6. host controls
select 'overview', public.admin_overview();
select 'users', username, email, is_admin from public.admin_users();
select public.admin_rename('00000000-0000-0000-0000-00000000000b', 'Maya R');
select public.admin_set_banned('00000000-0000-0000-0000-00000000000b', true);
update settings set signups_open = false, invite_code = 'globe42', announcement = 'Welcome!' where id = 1;
select 'settings', signups_open, invite_code, announcement from settings;
\echo -- removing the last host must fail:
select public.admin_set_host('00000000-0000-0000-0000-00000000000a', false);
\echo -- host deleting self must fail:
select public.admin_delete_user('00000000-0000-0000-0000-00000000000a');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
\echo -- banned player recording must fail:
select public.record_game('random', '{1,1,1,1,1}', '{}', current_date);
\echo -- banned player editing look changes 0 rows:
update profiles set avatar = '😈' where id = auth.uid();
reset role;

\echo == 7. sign-up rules
\echo -- closed sign-ups must fail:
insert into auth.users (email, raw_user_meta_data) values ('z@example.com', '{"username":"Zed","invite":"globe42"}');
update settings set signups_open = true;
\echo -- wrong invite must fail:
insert into auth.users (email, raw_user_meta_data) values ('z@example.com', '{"username":"Zed","invite":"nope"}');
insert into auth.users (email, raw_user_meta_data) values ('z@example.com', '{"username":"Zed","invite":"globe42"}');
select 'zed', username, is_admin from profiles where username = 'Zed';

\echo == 8. host resets and deletes
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.admin_reset_stats('00000000-0000-0000-0000-00000000000b');
select 'maya after reset', games, rating from profiles where id = '00000000-0000-0000-0000-00000000000b';
select 'cleared duels', public.admin_clear_duels(0, false);
select public.admin_delete_user('00000000-0000-0000-0000-00000000000b');
reset role;
select 'players left', string_agg(username, ', ' order by username) from profiles;
select 'auth users left', count(*) from auth.users;
