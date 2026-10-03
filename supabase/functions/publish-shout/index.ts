// publish-shout — the ONLY path a 광장 message becomes public. It re-runs the structural checks
// (length / no links / no contact), enforces a 60s rate limit, requires moderation to be configured
// AND to pass (fail closed), then inserts a moderated row with the service role. RLS forbids a client
// from inserting a shout directly, so an un-moderated post can never appear. (founder P1-D, P2)
import { handlePreflight, json } from '../_shared/cors.ts';
import { requireUser, adminClient } from '../_shared/supabase.ts';
import { moderate, openaiConfigured } from '../_shared/openai.ts';

const LINK_RE = /(https?:\/\/|www\.|@[a-z0-9_]{2,}|[a-z0-9-]+\.(com|net|org|io|kr|xyz|link|me|gg|tv))/i;
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/;
const TTL_MS = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  try {
    const { uid } = await requireUser(req);
    const { text } = await req.json().catch(() => ({}));
    const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (!clean || clean.length > 100 || LINK_RE.test(clean) || PHONE_RE.test(clean)) {
      return json({ ok: false, error: 'invalid_text' });
    }

    const admin = adminClient();
    // Rate limit: at most one post per 60s per user.
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin
      .from('shout_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .gte('created_at', since);
    if ((count ?? 0) > 0) return json({ ok: false, error: 'rate_limited' });

    // Moderation gate — authoritative. Not configured → do NOT publish.
    if (!openaiConfigured()) return json({ ok: false, error: 'MODERATION_NOT_CONFIGURED' });
    const m = await moderate({ text: clean });
    if (m.flagged) return json({ ok: false, error: 'flagged', categories: m.categories });

    const { data: prof } = await admin.from('anonymous_profiles').select('display_alias').eq('id', uid).single();
    if (!prof) return json({ ok: false, error: 'no_profile' });

    const { data: row, error } = await admin
      .from('shout_messages')
      .insert({
        user_id: uid,
        display_alias: prof.display_alias,
        text: clean,
        moderated: true,
        expires_at: new Date(Date.now() + TTL_MS).toISOString(),
      })
      .select('id, display_alias, text, created_at, expires_at')
      .single();
    if (error) return json({ ok: false, error: 'insert_failed' });
    return json({ ok: true, shout: row });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ ok: false, error: 'publish_error' }, 500);
  }
});
