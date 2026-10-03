-- NoF RC-17C — image cost circuit-breaker (§6 IMAGE_COST_GUARD). The per-user monthly cap
-- (image_usage) can NOT bound total spend on its own: anonymous auth means a script can mint unlimited
-- free accounts, each entitled to its own free generation. A GLOBAL daily ceiling is the real backstop.
-- It is server-authoritative and reserve-then-refund, exactly like the per-user ledger:
--   1. reserve_global_image_slot(limit) atomically increments today's counter IFF strictly under limit,
--      BEFORE any provider call — so a stampede can never exceed the day's cap;
--   2. the edge function proceeds only if BOTH the global and the per-user reservation succeeded;
--   3. on ANY failure the edge function refunds whatever it reserved.
-- The limit itself is passed by the edge function from a SERVER-ONLY env var (NOF_IMAGE_GLOBAL_DAILY_
-- LIMIT), never by a client. A missing/zero/negative limit means FAIL CLOSED (no generation).

create table if not exists public.image_global_usage (
  day_key    text primary key,                 -- 'YYYY-MM-DD' (server clock)
  count      integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

-- Server-only: no policy on an RLS-enabled table denies all client access. Only the service role (the
-- generate-future-image edge function) touches this counter, via the functions below.
alter table public.image_global_usage enable row level security;

-- Reserve one global slot for today. Returns true only when a slot was actually taken (strictly under
-- the cap). p_limit <= 0 or null → fail closed (false), so an unset env never opens the gate.
create or replace function public.reserve_global_image_slot(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day text := to_char(now(), 'YYYY-MM-DD');
begin
  if p_limit is null or p_limit <= 0 then
    return false; -- fail closed: no daily budget configured → no generation
  end if;
  insert into image_global_usage (day_key, count)
  values (v_day, 0)
  on conflict (day_key) do nothing;
  update image_global_usage
    set count = count + 1, updated_at = now()
    where day_key = v_day and count < p_limit;
  return found; -- true only when the guarded UPDATE actually incremented
end;
$$;

-- Refund one global slot for today (never below zero) when a reserved generation did not succeed.
create or replace function public.refund_global_image_slot()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day text := to_char(now(), 'YYYY-MM-DD');
begin
  update image_global_usage
    set count = greatest(count - 1, 0), updated_at = now()
    where day_key = v_day;
end;
$$;

revoke all on function public.reserve_global_image_slot(integer) from public;
revoke all on function public.refund_global_image_slot() from public;
-- Called only by the generate-future-image edge function (service role) after it verifies the caller's
-- JWT and the generation kill-switch. Not granted to `authenticated`, so a client cannot touch it.
