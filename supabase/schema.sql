-- =====================================================================
--  Tapographer database
--  Paste this whole file into Supabase → SQL Editor → New query → Run.
--  Safe to run again: it drops and recreates the functions and policies,
--  and only creates tables that don't exist yet.
-- =====================================================================

-- ---------- tables ----------
create table if not exists public.settings (
  id            int primary key default 1 check (id = 1),
  signups_open  boolean not null default true,
  invite_code   text,                       -- when set, new players must enter it to sign up
  announcement  text,                       -- banner shown to every player
  daily_bonus   boolean not null default true,  -- MapTap-style country/continent floor in the Daily
  updated_at    timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null check (char_length(username) between 2 and 20 and username ~ '^[A-Za-z0-9_. -]+$'),
  avatar       text not null default '🧭' check (char_length(avatar) <= 8),
  color        text not null default '#4FE3B0' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_admin     boolean not null default false,
  banned       boolean not null default false,
  created_at   timestamptz not null default now(),
  last_played  timestamptz,
  games        int not null default 0,       -- ranked-format games (Random, Daily, Duel)
  score_sum    bigint not null default 0,
  avg          int not null default 0,
  best         int not null default 0,
  bullseyes    int not null default 0,
  rating       int not null default 1000,
  rated_games  int not null default 0,
  rating_hist  jsonb not null default '[]'::jsonb,
  recent       jsonb not null default '[]'::jsonb,
  daily        jsonb,
  streak       int not null default 0,
  streak_date  date,
  blitz_games  int not null default 0,
  blitz_best   int not null default 0,
  region_games int not null default 0,
  region_best  int not null default 0
);
create unique index if not exists profiles_username_lower on public.profiles (lower(username));

create table if not exists public.games (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  mode       text not null,
  score      int not null,
  max        int not null,
  raws       int[] not null,
  places     text[] not null default '{}',
  rating     int,
  delta      int,
  duel_id    uuid,
  created_at timestamptz not null default now()
);
create index if not exists games_user_time on public.games (user_id, created_at desc);

create table if not exists public.duels (
  id               uuid primary key default gen_random_uuid(),
  challenger       uuid not null references public.profiles (id) on delete cascade,
  opponent         uuid not null references public.profiles (id) on delete cascade,
  picks            int[] not null,
  created_at       timestamptz not null default now(),
  challenger_score int, challenger_raws int[], challenger_at timestamptz,
  opponent_score   int, opponent_raws   int[], opponent_at   timestamptz,
  rated            boolean not null default false,
  check (challenger <> opponent)
);
create index if not exists duels_time on public.duels (created_at desc);

-- ---------- permissions: nothing is writable directly except your own name/badge/color ----------
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.games    enable row level security;
alter table public.duels    enable row level security;

revoke all on public.settings, public.profiles, public.games, public.duels from anon, authenticated;
grant select on public.profiles, public.games, public.duels, public.settings to authenticated;
grant update (username, avatar, color) on public.profiles to authenticated;
grant update (signups_open, invite_code, announcement, daily_bonus, updated_at) on public.settings to authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "players read profiles" on public.profiles;
create policy "players read profiles" on public.profiles for select to authenticated using (true);
drop policy if exists "players edit own look" on public.profiles;
create policy "players edit own look" on public.profiles for update to authenticated
  using (id = auth.uid() and not banned) with check (id = auth.uid());

drop policy if exists "own games or host" on public.games;
create policy "own games or host" on public.games for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "players read duels" on public.duels;
create policy "players read duels" on public.duels for select to authenticated using (true);

drop policy if exists "host reads settings" on public.settings;
create policy "host reads settings" on public.settings for select to authenticated using (public.is_admin());
drop policy if exists "host edits settings" on public.settings;
create policy "host edits settings" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- sign-up ----------
-- What the sign-up screen may know before anyone logs in (never the invite code itself).
create or replace function public.public_settings() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('signups_open', signups_open, 'invite_required', invite_code is not null and invite_code <> '',
                            'announcement', announcement, 'daily_bonus', daily_bonus)
  from public.settings where id = 1;
$$;

-- Returns null when a sign-up would be accepted, otherwise the reason to show.
create or replace function public.check_signup(p_username text, p_invite text default null) returns text
language plpgsql stable security definer set search_path = public as $$
declare s public.settings; u text := btrim(coalesce(p_username, ''));
begin
  select * into s from public.settings where id = 1;
  if not s.signups_open then return 'New sign-ups are closed right now.'; end if;
  if coalesce(s.invite_code, '') <> '' and coalesce(btrim(p_invite), '') <> s.invite_code then return 'That invite code isn''t right.'; end if;
  if char_length(u) < 2 or char_length(u) > 20 then return 'Usernames are 2 to 20 characters.'; end if;
  if u !~ '^[A-Za-z0-9_. -]+$' then return 'Use letters, numbers, spaces, dots, dashes or underscores.'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(u)) then return 'That username is taken.'; end if;
  return null;
end $$;

-- Runs when Supabase creates an account. The very first account becomes the host.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
        reason text; u text := btrim(coalesce(meta->>'username', ''));
        av text := coalesce(nullif(meta->>'avatar', ''), '🧭');
        co text := coalesce(nullif(meta->>'color', ''), '#4FE3B0');
begin
  reason := public.check_signup(u, meta->>'invite');
  if reason is not null then raise exception '%', reason; end if;
  if char_length(av) > 8 then av := '🧭'; end if;
  if co !~ '^#[0-9A-Fa-f]{6}$' then co := '#4FE3B0'; end if;
  insert into public.profiles (id, username, avatar, color, is_admin)
  values (new.id, u, av, co, not exists (select 1 from public.profiles where is_admin));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Log in with a username: find the email that goes with it.
create or replace function public.email_for_login(p_login text) returns text
language sql stable security definer set search_path = public, auth as $$
  select case when position('@' in p_login) > 0 then btrim(p_login)
              else (select u.email from auth.users u join public.profiles p on p.id = u.id where lower(p.username) = lower(btrim(p_login))) end;
$$;

-- ---------- playing ----------
-- Records a finished game. Scores are recomputed here from the five round scores,
-- and stats, streaks and the skill rating are all updated server-side.
create or replace function public.record_game(p_mode text, p_raws int[], p_places text[], p_day date, p_duel uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p public.profiles; mults int[]; mx int; sc int := 0; i int;
        rated boolean; delta int := null; expected numeric; k int; is_best boolean := false;
        d public.duels; side text; result jsonb; dc int; s numeric; ec numeric; rc int; ro int;
begin
  if me is null then raise exception 'Not logged in'; end if;
  select * into p from public.profiles where id = me for update;
  if not found then raise exception 'No profile'; end if;
  if p.banned then raise exception 'This account is suspended.'; end if;
  if p_mode not in ('random','daily','duel','blitz','us','eu','as','af','am') then raise exception 'Unknown mode'; end if;
  if coalesce(array_length(p_raws, 1), 0) <> 5 then raise exception 'Five rounds expected'; end if;
  for i in 1..5 loop
    if p_raws[i] is null or p_raws[i] < 0 or p_raws[i] > 100 then raise exception 'Bad round score'; end if;
  end loop;
  mults := case when p_mode in ('random','daily','duel') then array[1,1,2,3,3] else array[1,1,1,1,1] end;
  mx := case when p_mode in ('random','daily','duel') then 1000 else 500 end;
  for i in 1..5 loop sc := sc + p_raws[i] * mults[i]; end loop;
  rated := p_mode in ('random','daily','duel');

  if p_mode = 'daily' then
    if p_day is null or p_day < current_date - 1 or p_day > current_date + 1 then raise exception 'Bad date'; end if;
    if p.daily is not null and p.daily->>'date' = p_day::text then raise exception 'You already played today''s Daily.'; end if;
  end if;
  if p_mode = 'duel' then
    select * into d from public.duels where id = p_duel for update;
    if not found then raise exception 'Duel not found'; end if;
    side := case when d.challenger = me then 'challenger' when d.opponent = me then 'opponent' else null end;
    if side is null then raise exception 'Not your duel'; end if;
    if (side = 'challenger' and d.challenger_score is not null) or (side = 'opponent' and d.opponent_score is not null) then
      raise exception 'You already played this duel.';
    end if;
  end if;

  p.bullseyes := p.bullseyes + (select count(*) from unnest(p_raws) r where r = 100);
  p.last_played := now();
  if rated then
    is_best := p.games > 0 and sc > p.best;
    p.games := p.games + 1; p.score_sum := p.score_sum + sc; p.avg := round(p.score_sum::numeric / p.games); p.best := greatest(p.best, sc);
    p.recent := (jsonb_build_array(jsonb_build_object('s', sc, 'm', p_mode, 't', (extract(epoch from now()) * 1000)::bigint)) || p.recent);
    if jsonb_array_length(p.recent) > 30 then p.recent := (select jsonb_agg(x) from (select x from jsonb_array_elements(p.recent) with ordinality t(x, n) where n <= 30 order by n) q); end if;
    -- skill rating: beat what your rating predicts to climb
    expected := 1000 / (1 + power(10, (1000 - p.rating) / 400.0));
    k := case when p.rated_games < 10 then 160 else 80 end;
    delta := round(k * (sc - expected) / 1000);
    p.rating := greatest(100, p.rating + delta);
    p.rated_games := p.rated_games + 1;
    p.rating_hist := (jsonb_build_array(jsonb_build_object('r', p.rating, 't', (extract(epoch from now()) * 1000)::bigint)) || p.rating_hist);
    if jsonb_array_length(p.rating_hist) > 40 then p.rating_hist := (select jsonb_agg(x) from (select x from jsonb_array_elements(p.rating_hist) with ordinality t(x, n) where n <= 40 order by n) q); end if;
  elsif p_mode = 'blitz' then
    is_best := p.blitz_games > 0 and sc > p.blitz_best; p.blitz_games := p.blitz_games + 1; p.blitz_best := greatest(p.blitz_best, sc);
  else
    is_best := p.region_games > 0 and sc > p.region_best; p.region_games := p.region_games + 1; p.region_best := greatest(p.region_best, sc);
  end if;
  if p_mode = 'daily' then
    p.streak := case when p.streak_date = p_day - 1 then p.streak + 1 when p.streak_date = p_day then p.streak else 1 end;
    p.streak_date := p_day;
    p.daily := jsonb_build_object('date', p_day::text, 'score', sc, 'raws', to_jsonb(p_raws));
  end if;

  update public.profiles set bullseyes = p.bullseyes, last_played = p.last_played, games = p.games, score_sum = p.score_sum, avg = p.avg,
    best = p.best, recent = p.recent, rating = p.rating, rated_games = p.rated_games, rating_hist = p.rating_hist,
    blitz_games = p.blitz_games, blitz_best = p.blitz_best, region_games = p.region_games, region_best = p.region_best,
    streak = p.streak, streak_date = p.streak_date, daily = p.daily
  where id = me;
  insert into public.games (user_id, mode, score, max, raws, places, rating, delta, duel_id)
  values (me, p_mode, sc, mx, p_raws, coalesce(p_places, '{}'), p.rating, delta, case when p_mode = 'duel' then p_duel end);

  result := jsonb_build_object('score', sc, 'max', mx, 'rating', p.rating, 'delta', delta, 'is_best', is_best);

  if p_mode = 'duel' then
    if side = 'challenger' then
      update public.duels set challenger_score = sc, challenger_raws = p_raws, challenger_at = now() where id = d.id returning * into d;
    else
      update public.duels set opponent_score = sc, opponent_raws = p_raws, opponent_at = now() where id = d.id returning * into d;
    end if;
    -- both done: head-to-head Elo swing (K = 32) for both players, once
    if d.challenger_score is not null and d.opponent_score is not null and not d.rated then
      select rating into rc from public.profiles where id = d.challenger for update;
      select rating into ro from public.profiles where id = d.opponent for update;
      s := case when d.challenger_score > d.opponent_score then 1 when d.challenger_score < d.opponent_score then 0 else 0.5 end;
      ec := 1 / (1 + power(10, (ro - rc) / 400.0));
      dc := round(32 * (s - ec));
      update public.profiles set rating = greatest(100, rating + dc),
        rating_hist = jsonb_build_array(jsonb_build_object('r', greatest(100, rating + dc), 't', (extract(epoch from now()) * 1000)::bigint)) || rating_hist
        where id = d.challenger;
      update public.profiles set rating = greatest(100, rating - dc),
        rating_hist = jsonb_build_array(jsonb_build_object('r', greatest(100, rating - dc), 't', (extract(epoch from now()) * 1000)::bigint)) || rating_hist
        where id = d.opponent;
      update public.duels set rated = true where id = d.id;
      result := result || jsonb_build_object('duel_delta', case when side = 'challenger' then dc else -dc end);
      select rating into rc from public.profiles where id = me;
      result := result || jsonb_build_object('rating', rc);
    end if;
  end if;
  return result;
end $$;

create or replace function public.create_duel(p_opponent uuid, p_picks int[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'Not logged in'; end if;
  if exists (select 1 from public.profiles where id = me and banned) then raise exception 'This account is suspended.'; end if;
  if p_opponent = me then raise exception 'You can''t duel yourself.'; end if;
  if not exists (select 1 from public.profiles where id = p_opponent and not banned) then raise exception 'That player can''t be challenged.'; end if;
  if coalesce(array_length(p_picks, 1), 0) <> 5 then raise exception 'Five places expected'; end if;
  if (select count(*) from public.duels where challenger = me and (challenger_score is null or opponent_score is null)) >= 25 then
    raise exception 'You have too many unfinished duels. Finish some first.';
  end if;
  insert into public.duels (challenger, opponent, picks) values (me, p_opponent, p_picks) returning id into new_id;
  return new_id;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if public.is_admin() and (select count(*) from public.profiles where is_admin) = 1 then
    raise exception 'You''re the only host. Make someone else host before deleting your account.';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- host control panel ----------
create or replace function public.require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'Host only'; end if; end $$;

create or replace function public.admin_users()
returns table (id uuid, username text, email text, email_confirmed boolean, created_at timestamptz, last_sign_in timestamptz,
               is_admin boolean, banned boolean, games int, avg int, best int, rating int, rated_games int, bullseyes int,
               streak int, last_played timestamptz, blitz_games int, blitz_best int, region_games int, region_best int, avatar text, color text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  perform public.require_admin();
  return query
    select p.id, p.username, u.email::text, u.email_confirmed_at is not null, p.created_at, u.last_sign_in_at,
           p.is_admin, p.banned, p.games, p.avg, p.best, p.rating, p.rated_games, p.bullseyes, p.streak, p.last_played,
           p.blitz_games, p.blitz_best, p.region_games, p.region_best, p.avatar, p.color
    from public.profiles p join auth.users u on u.id = p.id
    order by p.rating desc;
end $$;

create or replace function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'players', (select count(*) from public.profiles),
    'banned', (select count(*) from public.profiles where banned),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'games', (select count(*) from public.games),
    'games_today', (select count(*) from public.games where created_at > now() - interval '24 hours'),
    'active_7d', (select count(distinct user_id) from public.games where created_at > now() - interval '7 days'),
    'duels', (select count(*) from public.duels),
    'duels_open', (select count(*) from public.duels where challenger_score is null or opponent_score is null),
    'avg_rating', (select round(avg(rating)) from public.profiles));
end $$;

create or replace function public.admin_set_banned(p_user uuid, p_banned boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() then raise exception 'You can''t suspend yourself.'; end if;
  update public.profiles set banned = p_banned where id = p_user;
end $$;

create or replace function public.admin_set_host(p_user uuid, p_flag boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if not p_flag and (select count(*) from public.profiles where is_admin and id <> p_user) = 0 then
    raise exception 'There must always be at least one host.';
  end if;
  update public.profiles set is_admin = p_flag where id = p_user;
end $$;

create or replace function public.admin_rename(p_user uuid, p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare u text := btrim(coalesce(p_name, ''));
begin
  perform public.require_admin();
  if char_length(u) < 2 or char_length(u) > 20 then raise exception 'Usernames are 2 to 20 characters.'; end if;
  if exists (select 1 from public.profiles where lower(username) = lower(u) and id <> p_user) then raise exception 'That username is taken.'; end if;
  update public.profiles set username = u where id = p_user;
end $$;

create or replace function public.admin_reset_stats(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.profiles set games = 0, score_sum = 0, avg = 0, best = 0, bullseyes = 0, rating = 1000, rated_games = 0,
    rating_hist = '[]', recent = '[]', daily = null, streak = 0, streak_date = null,
    blitz_games = 0, blitz_best = 0, region_games = 0, region_best = 0 where id = p_user;
  delete from public.games where user_id = p_user;
end $$;

create or replace function public.admin_delete_user(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.require_admin();
  if p_user = auth.uid() then raise exception 'You can''t delete your own account from here.'; end if;
  delete from auth.users where id = p_user;   -- profile, games and duels go with it
end $$;

create or replace function public.admin_delete_duel(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin perform public.require_admin(); delete from public.duels where id = p_id; end $$;

create or replace function public.admin_clear_duels(p_days int, p_unfinished_only boolean) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform public.require_admin();
  delete from public.duels where created_at < now() - make_interval(days => greatest(p_days, 0))
    and (not p_unfinished_only or challenger_score is null or opponent_score is null);
  get diagnostics n = row_count;
  return n;
end $$;

-- Only the functions below may be called from the website.
revoke all on function public.is_admin(), public.public_settings(), public.check_signup(text, text), public.handle_new_user(),
  public.email_for_login(text), public.record_game(text, int[], text[], date, uuid), public.create_duel(uuid, int[]),
  public.delete_my_account(), public.require_admin(), public.admin_users(), public.admin_overview(),
  public.admin_set_banned(uuid, boolean), public.admin_set_host(uuid, boolean), public.admin_rename(uuid, text),
  public.admin_reset_stats(uuid), public.admin_delete_user(uuid), public.admin_delete_duel(uuid), public.admin_clear_duels(int, boolean)
  from public, anon, authenticated;
grant execute on function public.public_settings(), public.check_signup(text, text), public.email_for_login(text) to anon, authenticated;
grant execute on function public.is_admin(), public.record_game(text, int[], text[], date, uuid), public.create_duel(uuid, int[]),
  public.delete_my_account(), public.admin_users(), public.admin_overview(), public.admin_set_banned(uuid, boolean),
  public.admin_set_host(uuid, boolean), public.admin_rename(uuid, text), public.admin_reset_stats(uuid),
  public.admin_delete_user(uuid), public.admin_delete_duel(uuid), public.admin_clear_duels(int, boolean) to authenticated;
