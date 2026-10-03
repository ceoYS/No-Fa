-- NoF RC-17 — server-side image usage authority (P3-B). The CLIENT ledger (useImageUsage) is a UX
-- pre-check only; THIS is the billing authority. Generation is reserve-then-confirm:
--   1. reserve_image_generation() atomically increments the monthly counter IFF under the limit,
--      BEFORE any provider call — so concurrent calls can never exceed the cap.
--   2. the edge function calls the provider.
--   3. on ANY failure (provider error / moderation reject / timeout) the function calls
--      refund_image_generation(), so only a real successful image stays counted.
--
-- The monthly limit is decided SERVER-side. With no billing/entitlement source wired yet, it defaults
-- to the FREE limit (1) for everyone — the safe direction (it can never over-charge). Raising a user
-- to the PRO limit (8) requires a server-side entitlement source, which is a separate provisioning
-- step (there is no subscriptions table in this milestone).

create or replace function public.image_monthly_limit(p_uid uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- ponytail: no entitlement source exists yet → everyone is FREE (1). When a subscriptions/
  -- entitlements table lands, return 8 for an active PRO row here. Never trust a client-supplied tier.
  return 1;
end;
$$;

-- Both reserve + refund take an explicit p_uid and are callable ONLY by the service role (the
-- generate-future-image edge function, after it has verified the caller's JWT). They are NOT granted
-- to `authenticated`, so a client can neither reserve nor refund out of band — the whole quota is
-- server-mediated.
create or replace function public.reserve_image_generation(p_uid uuid, p_limit integer default null)
returns table (allowed boolean, used integer, "limit" integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := p_uid;
  v_month text := to_char(now(), 'YYYY-MM');
  v_limit integer;
  v_used  integer;
begin
  if v_uid is null then
    raise exception 'missing user id';
  end if;
  -- Effective monthly cap: an explicit server-passed p_limit (from the generate-future-image edge
  -- function's NOF_IMAGE_USER_MONTHLY_* env) wins; otherwise the in-DB default (image_monthly_limit,
  -- FREE = 1, fail-closed). A negative/invalid override is clamped to 0 (fail closed, never unbounded).
  v_limit := coalesce(p_limit, image_monthly_limit(v_uid));
  if v_limit < 0 then v_limit := 0; end if;

  -- Atomic upsert: create the month row if absent, then increment only when strictly under the limit.
  insert into image_usage (user_id, month_key, successful_generations, updated_at)
  values (v_uid, v_month, 0, now())
  on conflict (user_id, month_key) do nothing;

  update image_usage
    set successful_generations = successful_generations + 1, updated_at = now()
    where user_id = v_uid and month_key = v_month and successful_generations < v_limit
    returning successful_generations into v_used;

  if v_used is null then
    -- Already at/over the limit — no reservation made.
    select successful_generations into v_used from image_usage where user_id = v_uid and month_key = v_month;
    return query select false, coalesce(v_used, v_limit), v_limit;
  else
    return query select true, v_used, v_limit;
  end if;
end;
$$;

-- Refund one reserved generation (never below zero) when the provider call did not produce an image.
create or replace function public.refund_image_generation(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month text := to_char(now(), 'YYYY-MM');
begin
  if p_uid is null then
    raise exception 'missing user id';
  end if;
  update image_usage
    set successful_generations = greatest(successful_generations - 1, 0), updated_at = now()
    where user_id = p_uid and month_key = v_month;
end;
$$;

revoke all on function public.reserve_image_generation(uuid, integer) from public;
revoke all on function public.refund_image_generation(uuid) from public;
revoke all on function public.image_monthly_limit(uuid) from public;
-- Called by the generate-future-image edge function (service role) after it verifies the caller's JWT.
-- Not granted to `authenticated`, so a client cannot reserve/refund out of band.
