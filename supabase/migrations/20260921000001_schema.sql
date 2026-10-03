-- NoF RC-17 — Supabase schema for the anonymous community (League · 광장 · 영감) + server-side
-- image usage authority. Everything here is PUBLIC-anonymous by design: no real name, no private
-- diary, no current-run history, no counter names, no private check-in notes. Public rows carry only
-- whitelisted, non-identifying fields. RLS (next migration) enforces ownership + the moderated-publish
-- boundary; this migration only defines the shape.

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── anonymous identity ───────────────────────────────────────────────────────────────────────────
-- id = auth.uid() of a Supabase ANONYMOUS user. The public identity is alias + cosmetic form + tier.
create table if not exists public.anonymous_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_alias text not null check (char_length(display_alias) between 1 and 40),
  kitten_form  text not null default 'ember',
  league_tier  text not null default 'ember',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── League (real weekly competition; server-authoritative scoring) ─────────────────────────────────
-- A weekly league window, per tier. Server-owned: the weekly boundary is defined here, never by a client.
create table if not exists public.weekly_leagues (
  id         uuid primary key default gen_random_uuid(),
  week_key   text not null,               -- ISO week, e.g. '2026-W38' (server-computed)
  tier       text not null default 'ember',
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  unique (week_key, tier),
  check (ends_at > starts_at)
);

-- Membership + the SERVER-maintained score aggregate. Clients never write score.
create table if not exists public.league_memberships (
  id        uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.weekly_leagues (id) on delete cascade,
  user_id   uuid not null references public.anonymous_profiles (id) on delete cascade,
  score     integer not null default 0 check (score >= 0),
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

-- Append-only, server-validated contribution events. `points` is decided by server logic, never sent
-- by the client. `event_key` makes a contribution idempotent (no double count for the same event).
create table if not exists public.league_contributions (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.weekly_leagues (id) on delete cascade,
  user_id    uuid not null references public.anonymous_profiles (id) on delete cascade,
  kind       text not null,               -- server-validated set (see record_league_contribution)
  points     integer not null check (points >= 0),
  event_key  text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)             -- dedupe: one contribution per (user, event)
);

-- ── 광장 (shout stream: short, anonymous, 24h TTL, no links, no DM, no images) ──────────────────────
-- No `recipient` column exists anywhere: there is no direct-message concept, by construction.
-- `moderated` is set true ONLY by the server-side publish path after omni-moderation passes; a row that
-- is not moderated is never visible (RLS select gates on moderated = true).
create table if not exists public.shout_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.anonymous_profiles (id) on delete cascade,
  display_alias text not null,
  text          text not null check (char_length(text) between 1 and 100),
  moderated     boolean not null default false,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null,     -- created_at + 24h, set by the server publish path
  check (expires_at > created_at)
);
create index if not exists shout_live_idx on public.shout_messages (expires_at) where moderated;

-- Reactions: a small warm set, user-scoped, one per (message, user, kind).
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.shout_messages (id) on delete cascade,
  user_id    uuid not null references public.anonymous_profiles (id) on delete cascade,
  kind       text not null check (kind in ('ember','cheer','together')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, kind)
);

-- ── 영감 (Future Diary PUBLIC copy — whitelist fields only; NEVER the private record) ───────────────
-- id IS the publicShareId. There is deliberately NO counter name, streak length, private local id,
-- timestamp discriminator, or mood column here — public copies are built by whitelist, never by
-- stripping a private record. Deleting this row never touches the user's private diary (a different store).
create table if not exists public.future_diary_shares (
  id                    uuid primary key default gen_random_uuid(),  -- publicShareId
  user_id               uuid not null references public.anonymous_profiles (id) on delete cascade,
  display_alias         text not null,
  future_self           text not null default '',
  ideal_day             text not null default '',
  feelings_environment  text not null default '',
  image_path            text,                                        -- optional Storage object path (private bucket)
  moderated             boolean not null default false,
  created_at            timestamptz not null default now()
);
create index if not exists share_live_idx on public.future_diary_shares (created_at desc) where moderated;

-- ── Safety: reports (write-only for ordinary users) + blocks (owned by blocker) ─────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.anonymous_profiles (id) on delete cascade,
  target_type text not null check (target_type in ('shout','share')),
  target_id   uuid not null,
  reason      text not null check (reason in ('sexual','harassment','doxxing','medical','spam','other')),
  created_at  timestamptz not null default now()
);

create table if not exists public.block_relations (
  blocker_id uuid not null references public.anonymous_profiles (id) on delete cascade,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ── Image usage authority (P3-B): the SERVER's billing ledger. The client ledger is UX-only. ────────
create table if not exists public.image_usage (
  user_id                uuid not null references public.anonymous_profiles (id) on delete cascade,
  month_key              text not null,   -- 'YYYY-MM'
  successful_generations integer not null default 0 check (successful_generations >= 0),
  updated_at             timestamptz not null default now(),
  primary key (user_id, month_key)
);
