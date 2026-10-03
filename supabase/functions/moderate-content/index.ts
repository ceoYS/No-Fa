// moderate-content — the client-facing moderation endpoint (founder P2). Judges only; never writes.
// If OpenAI is not configured, it returns allowed:false with MODERATION_NOT_CONFIGURED — public content
// must never be publishable without moderation (fail closed).
import { handlePreflight, json } from '../_shared/cors.ts';
import { requireUser } from '../_shared/supabase.ts';
import { moderate, openaiConfigured } from '../_shared/openai.ts';

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  try {
    await requireUser(req); // authenticated callers only
    // Input length caps — this endpoint is directly invocable, so bound what reaches the provider
    // (cost / abuse). Legit callers send short shout/diary prose well under these.
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.slice(0, 2000) : undefined;
    const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.slice(0, 2048) : undefined;
    if (!openaiConfigured()) {
      return json({ ok: true, configured: false, state: 'MODERATION_NOT_CONFIGURED', allowed: false });
    }
    const m = await moderate({ text, imageUrl });
    if (!m.configured) {
      return json({ ok: true, configured: false, state: 'MODERATION_NOT_CONFIGURED', allowed: false });
    }
    return json({ ok: true, configured: true, allowed: !m.flagged, flagged: !!m.flagged, categories: m.categories ?? [] });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ ok: false, error: 'moderation_error' }, 500);
  }
});
