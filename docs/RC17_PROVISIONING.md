# NoF RC-17 — Provisioning (STOP points)

RC-17 built everything locally possible with NO hosted credentials. Two provisioning actions are
required before the real services connect. Nothing here fabricates a key or a connected state.

```
SUPABASE_PROJECT_PROVISIONING_REQUIRED = YES
OPENAI_API_CREDENTIAL_REQUIRED         = YES
```

---

## 1. Supabase project

**What the Founder must create**
1. A Supabase project (a paid plan is the Founder's call — do not create it automatically).
2. In the project: **Authentication → Providers → Anonymous** = enabled (public identity is anonymous).
3. (Optional, for TTL cleanup) **Database → Extensions → pg_cron** = enabled, or schedule the
   `plaza-cleanup` function instead.
4. Storage: the private `future-images` bucket is created by migration `..._storage.sql`; no manual step.

**Apply the schema + functions** (from the repo root, with the Supabase CLI linked to the project):
```
supabase link --project-ref <your-project-ref>
supabase db push                         # applies supabase/migrations/*.sql (schema + RLS + RPCs + storage)
supabase functions deploy moderate-content publish-shout publish-future-diary-share generate-future-image plaza-cleanup
```

**Which values to copy (from Project Settings → API)**
| Value | Where it goes | Client-safe? |
|-------|---------------|--------------|
| Project URL | `.env` → `VITE_SUPABASE_URL` (client) and `SUPABASE_URL` (function local serve) | URL only — safe |
| `anon` public key | `.env` → `VITE_SUPABASE_ANON_KEY` | **CLIENT-SAFE** (public by design; RLS guards data) |
| `service_role` key | Supabase function secret only — `supabase secrets set` / auto-injected | **SERVER-ONLY** — never in the client |

**Where they are stored locally**
- Client + local-serve values: `.env` at the repo root (gitignored; copy from `.env.example`).
- Function secrets: `supabase secrets set ...` (stored by Supabase, not in the repo).

**Safe client-side:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
**Server-only:** `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CLEANUP_SECRET`.

---

## 2. OpenAI credential

`OPENAI_API_CREDENTIAL_REQUIRED = YES`. The key is used only inside the edge functions (moderation +
image). It must never reach Vite/the client.

Set it as a Supabase function secret (do not paste it into chat or source):
```
supabase secrets set OPENAI_API_KEY=<the key>
supabase secrets set CLEANUP_SECRET=<a random string>   # guards the plaza-cleanup schedule
```

Models are already wired to the Founder's decisions: `omni-moderation-latest`, image default
`gpt-image-2.5-flare`, precision-edit `gpt-image-2.5-sunburst`.

### Image cost guard (server-only secrets — RC-17C §6)

Image generation is **OFF and fail-closed** until you deliberately enable AND budget it. These are
server-only (never `VITE_`-prefixed); set them as Supabase function secrets. See `.env.example`.
```
supabase secrets set NOF_IMAGE_GENERATION_ENABLED=true          # master kill-switch (off unless true/1/yes/on)
supabase secrets set NOF_IMAGE_GLOBAL_DAILY_LIMIT=<n>            # hard daily ceiling across ALL users (anon-signup cost backstop; unset/0 = off)
supabase secrets set NOF_IMAGE_USER_MONTHLY_FREE_LIMIT=1        # per-user monthly (unset ⇒ DB default FREE=1)
```
`NOF_IMAGE_USER_MONTHLY_PRO_LIMIT` is reserved for when a PRO entitlement source exists (not this
milestone). With none of these set, `generate-future-image` returns `IMAGE_GENERATION_DISABLED` and
never calls the provider.

---

## 3. Production adult blocklist (separate STOP — license)

Independent of the two above:
```
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES
```
See `extensions/chrome-shield/data/BLOCKLIST_ATTRIBUTION.md`. The fetch/build pipeline exists; a human
must verify upstream redistribution rights and set the cleared flag before promotion.

---

## 4. When the Supabase slot arrives — one clean sequence

Do this in order. **Never paste any secret into ChatGPT / Claude / a chat window** — secrets go to the
Supabase CLI / dashboard only. `<...>` are values you fill locally.

```
1.  Create a Supabase STAGING project (dashboard).                         # a separate prod project comes later
2.  Authentication → Providers → Anonymous = enabled.                      # public identity is anonymous
3.  supabase link --project-ref <staging-ref>                             # link the CLI
4.  supabase db push                                                       # applies supabase/migrations/*.sql (schema+RLS+RPCs+storage+cost-guard)
5.  supabase functions deploy moderate-content publish-shout \
      publish-future-diary-share generate-future-image plaza-cleanup
6.  supabase secrets set OPENAI_API_KEY=<key> CLEANUP_SECRET=<random>      # server-only; + image guard secrets from §2 above
7.  cp .env.example .env  &&  edit .env:                                   # client values (gitignored)
      VITE_SUPABASE_URL=<project-url>   VITE_SUPABASE_ANON_KEY=<anon-key>  # anon key is public by design (RLS guards data)
8.  node scripts/nof-rc17-provisioning-doctor.mjs                          # says exactly what is still missing (no network, no secrets printed)
9.  NOF_RC17_STAGING=YES node scripts/nof-rc17-live-smoke.mjs             # live checks A–O, WITHOUT any paid image (disposable anon accounts)
10. NOF_ALLOW_PAID_IMAGE_TEST=YES NOF_RC17_STAGING=YES \                   # OPTIONAL: authorize EXACTLY ONE paid image E2E
      node scripts/nof-rc17-live-smoke.mjs
11. npm run build && npm run check:nof && npm run qa:mvp && npm run qa:ext  # final regression gates — all must pass
```

- Step 8 is safe to run anytime (a report, never a mutation). Step 9 uses throwaway anonymous accounts
  and cleans up after itself. Step 10 is the only step that can incur a provider charge, and only with
  the explicit flag — one image.
- `node scripts/nof-rc17-live-smoke.mjs --preflight` gives a no-network readiness check at any point.
- Production adult blocklist is a **separate** gate (§3) — do not conflate it with Supabase/OpenAI.

## What is already true without credentials

- Client build, `check:nof`, `qa:mvp`, `qa:ext` pass. The app shows honest NOT_CONFIGURED states.
- The moment the two `.env` client values + the function secrets exist, the same code paths connect —
  no code change needed. Until then, nothing is faked.
