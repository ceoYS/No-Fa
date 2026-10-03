-- NoF RC-17 — server-authoritative League scoring (P1-C) + 광장 TTL cleanup (P1-D).
--
-- record_league_contribution() is the ONLY way score changes. It is SECURITY DEFINER, so it runs as
-- the table owner and bypasses RLS, but every score-affecting fact is decided INSIDE the function:
--   • the weekly boundary is computed here (ISO week), never supplied by the client;
--   • `points` come from a fixed server map keyed on `p_kind` — the client cannot pass a score;
--   • `event_key` (user + kind + day) is unique, so the same event can never be counted twice;
--   • a weekly per-user cap bounds the total.
-- The client calls it as an RPC with only a `p_kind`; it can inject neither points nor another user's id.

create or replace function public.record_league_contribution(p_kind text)
returns table (league_id uuid, week_key text, score integer, counted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_tier       text;
  v_week_key   text := to_char(now(), 'IYYY"-W"IW');       -- e.g. 2026-W38
  v_week_start timestamptz := date_trunc('week', now());   -- Monday 00:00
  v_week_end   timestamptz := date_trunc('week', now()) + interval '7 days';
  v_day_key    text := to_char(now(), 'YYYY-MM-DD');
  v_points     integer;
  v_league_id  uuid;
  v_event_key  text;
  v_inserted   boolean := false;
  v_weekly_cap constant integer := 500;                    -- belt: bound runaway totals
  v_score      integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Server-decided points per validated kind. Unknown kinds are rejected (no arbitrary scoring).
  v_points := case p_kind
    when 'checkin'    then 10
    when 'day_clean'  then 20
    when 'reflection' then 5
    else null
  end;
  if v_points is null then
    raise exception 'invalid contribution kind: %', p_kind;
  end if;

  select league_tier into v_tier from anonymous_profiles where id = v_uid;
  if v_tier is null then
    raise exception 'no profile for user';
  end if;

  -- Ensure the weekly league window exists (server-defined boundary).
  insert into weekly_leagues (week_key, tier, starts_at, ends_at)
  values (v_week_key, v_tier, v_week_start, v_week_end)
  on conflict (week_key, tier) do nothing;
  select id into v_league_id from weekly_leagues where week_key = v_week_key and tier = v_tier;

  -- Ensure membership.
  insert into league_memberships (league_id, user_id)
  values (v_league_id, v_uid)
  on conflict (league_id, user_id) do nothing;

  -- Idempotent contribution: one (kind, day) per user. Duplicate → do nothing (counted = false).
  v_event_key := p_kind || ':' || v_day_key;
  insert into league_contributions (league_id, user_id, kind, points, event_key)
  values (v_league_id, v_uid, p_kind, v_points, v_event_key)
  on conflict (user_id, event_key) do nothing;
  get diagnostics v_inserted = row_count;  -- 1 when a new row was inserted, 0 on conflict

  if v_inserted then
    update league_memberships
      set score = least(score + v_points, v_weekly_cap)
      where league_id = v_league_id and user_id = v_uid
      returning score into v_score;
  else
    select lm.score into v_score from league_memberships lm
      where lm.league_id = v_league_id and lm.user_id = v_uid;
  end if;

  return query select v_league_id, v_week_key, v_score, (v_inserted::int = 1);
end;
$$;

revoke all on function public.record_league_contribution(text) from public;
grant execute on function public.record_league_contribution(text) to authenticated;

-- ── 광장 TTL cleanup ───────────────────────────────────────────────────────────────────────────────
-- Belt-and-suspenders over the `expires_at > now()` read filter (expired rows are never SELECTable via
-- RLS, but they should also not accumulate). This function deletes them; schedule it below.
create or replace function public.delete_expired_shouts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from shout_messages where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.delete_expired_shouts() from public;
-- Not granted to `authenticated`: cleanup runs from the scheduler / service role only.

-- Schedule the cleanup every 15 minutes via pg_cron, IF the extension is available on this project.
-- pg_cron may need enabling in the Supabase dashboard (Database → Extensions). If it is not present,
-- this block only raises a NOTICE — the migration still succeeds, and the `plaza-cleanup` edge
-- function (invoked by an external/Supabase schedule) is the alternative cleanup path.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('nof-plaza-cleanup', '*/15 * * * *', 'select public.delete_expired_shouts();');
exception when others then
  raise notice 'pg_cron not scheduled (%). Enable pg_cron in the dashboard, or run the plaza-cleanup edge function on a schedule.', sqlerrm;
end;
$$;
