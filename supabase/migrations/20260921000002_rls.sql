-- NoF RC-17 — Row Level Security. The trust model: clients (anonymous authenticated users) may touch
-- ONLY their own rows, may never award themselves score, and may never publish UNMODERATED public
-- content. Publishing shouts/shares and awarding league score happen through server-side paths
-- (edge functions with the service role, and a SECURITY DEFINER RPC) that run validation + moderation
-- first; the service role bypasses RLS, so those paths are the only way moderated/scored rows appear.
--
-- A table with RLS enabled and NO matching policy denies the action for ordinary users by default —
-- that is deliberate for every server-only write below.

alter table public.anonymous_profiles   enable row level security;
alter table public.weekly_leagues        enable row level security;
alter table public.league_memberships    enable row level security;
alter table public.league_contributions  enable row level security;
alter table public.shout_messages         enable row level security;
alter table public.reactions              enable row level security;
alter table public.future_diary_shares    enable row level security;
alter table public.reports                enable row level security;
alter table public.block_relations        enable row level security;
alter table public.image_usage            enable row level security;

-- ── anonymous_profiles: read any (aliases are public); write ONLY your own ─────────────────────────
create policy profiles_select_all on public.anonymous_profiles
  for select to authenticated using (true);
create policy profiles_insert_self on public.anonymous_profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.anonymous_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_delete_self on public.anonymous_profiles
  for delete to authenticated using (id = auth.uid());

-- ── League: read the current window + the leaderboard; NEVER write (score is server-controlled) ────
create policy leagues_select on public.weekly_leagues
  for select to authenticated using (true);
create policy memberships_select on public.league_memberships
  for select to authenticated using (true);
-- (no insert/update/delete policies: weekly_leagues, league_memberships, league_contributions are
--  written only by the SECURITY DEFINER RPC / service role — clients cannot inject or edit a score.)

-- ── 광장 shouts: read moderated + live only; publish is SERVER-side (no client insert); delete OWN ──
create policy shouts_select_live on public.shout_messages
  for select to authenticated using (moderated = true and expires_at > now());
create policy shouts_delete_self on public.shout_messages
  for delete to authenticated using (user_id = auth.uid());
-- (no insert policy: a shout becomes public only through the moderated publish-shout edge function.)

-- ── Reactions: user-scoped — you may add/remove YOUR OWN reaction, and read counts ─────────────────
create policy reactions_select on public.reactions
  for select to authenticated using (true);
create policy reactions_insert_self on public.reactions
  for insert to authenticated with check (user_id = auth.uid());
create policy reactions_delete_self on public.reactions
  for delete to authenticated using (user_id = auth.uid());

-- ── 영감 shares: read moderated only; publish SERVER-side; delete OWN public copy (private untouched) ─
create policy shares_select_moderated on public.future_diary_shares
  for select to authenticated using (moderated = true);
create policy shares_delete_self on public.future_diary_shares
  for delete to authenticated using (user_id = auth.uid());
-- (no insert policy: the public copy is created only through the moderated publish-future-diary-share
--  edge function; deleting this row never affects the user's PRIVATE diary, a separate local store.)

-- ── Reports: write-only for ordinary users (insert your own; you cannot read the report queue) ─────
create policy reports_insert_self on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
-- (no select policy: reports are write-only from ordinary users.)

-- ── Blocks: fully owned by the blocker ─────────────────────────────────────────────────────────────
create policy blocks_all_self on public.block_relations
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ── image_usage: read YOUR OWN server-truth counter; writes are server-only (billing authority) ────
create policy image_usage_select_self on public.image_usage
  for select to authenticated using (user_id = auth.uid());
-- (no insert/update policy: only the generate-future-image edge function, via service role, may
--  increment usage — the client ledger is a UX pre-check, never the billing authority.)
