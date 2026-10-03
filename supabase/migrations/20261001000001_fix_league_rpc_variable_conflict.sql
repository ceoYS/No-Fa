-- NoF RC-17 corrective migration
-- Fix PL/pgSQL output-column / table-column name collisions in
-- public.record_league_contribution(text).
--
-- RETURNS TABLE exposes league_id / week_key / score / counted as PL/pgSQL
-- variables. The original function also uses table columns with those names.
-- Prefer table columns whenever an SQL column and a PL/pgSQL variable collide.
-- Local procedural variables are intentionally v_* prefixed.

create or replace function public.record_league_contribution(p_kind text)
returns table (league_id uuid, week_key text, score integer, counted boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid        uuid := auth.uid();
  v_tier       text;
  v_week_key   text := to_char(now(), 'IYYY"-W"IW');
  v_week_start timestamptz := date_trunc('week', now());
  v_week_end   timestamptz := date_trunc('week', now()) + interval '7 days';
  v_day_key    text := to_char(now(), 'YYYY-MM-DD');
  v_points     integer;
  v_league_id  uuid;
  v_event_key  text;
  v_inserted   boolean := false;
  v_rows        bigint := 0;
  v_weekly_cap constant integer := 500;
  v_score      integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  v_points := case p_kind
    when 'checkin'    then 10
    when 'day_clean'  then 20
    when 'reflection' then 5
    else null
  end;

  if v_points is null then
    raise exception 'invalid contribution kind: %', p_kind;
  end if;

  select league_tier
    into v_tier
    from anonymous_profiles
    where id = v_uid;

  if v_tier is null then
    raise exception 'no profile for user';
  end if;

  insert into weekly_leagues (week_key, tier, starts_at, ends_at)
  values (v_week_key, v_tier, v_week_start, v_week_end)
  on conflict (week_key, tier) do nothing;

  select id
    into v_league_id
    from weekly_leagues
    where week_key = v_week_key
      and tier = v_tier;

  insert into league_memberships (league_id, user_id)
  values (v_league_id, v_uid)
  on conflict (league_id, user_id) do nothing;

  v_event_key := p_kind || ':' || v_day_key;

  insert into league_contributions (league_id, user_id, kind, points, event_key)
  values (v_league_id, v_uid, p_kind, v_points, v_event_key)
  on conflict (user_id, event_key) do nothing;

  get diagnostics v_rows = row_count;
  v_inserted := (v_rows = 1);

  if v_inserted then
    update league_memberships
      set score = least(score + v_points, v_weekly_cap)
      where league_id = v_league_id
        and user_id = v_uid
      returning score into v_score;
  else
    select lm.score
      into v_score
      from league_memberships as lm
      where lm.league_id = v_league_id
        and lm.user_id = v_uid;
  end if;

  return query
    select v_league_id, v_week_key, v_score, v_inserted;
end;
$$;

revoke all on function public.record_league_contribution(text) from public;
grant execute on function public.record_league_contribution(text) to authenticated;
