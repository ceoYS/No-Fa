// publish-future-diary-share — the ONLY path a 영감 PUBLIC copy is created. Only the whitelisted prose
// (and an optional own-folder image) is accepted; the private diary is never involved. Moderation is
// required + authoritative (text, and the image if present); fail closed. Inserted moderated, service
// role. RLS forbids a client insert, so an un-moderated share can never appear. (founder P1-E, P2, P3-C)
import { handlePreflight, json } from '../_shared/cors.ts';
import { requireUser, adminClient } from '../_shared/supabase.ts';
import { moderate, openaiConfigured } from '../_shared/openai.ts';

const MAX_FIELD = 500;

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  try {
    const { uid } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const futureSelf = String(body.futureSelf ?? '').trim().slice(0, MAX_FIELD);
    const idealDay = String(body.idealDay ?? '').trim().slice(0, MAX_FIELD);
    const feelings = String(body.feelingsEnvironment ?? '').trim().slice(0, MAX_FIELD);
    const imagePath = body.imagePath ? String(body.imagePath) : null;
    const combined = [futureSelf, idealDay, feelings].filter(Boolean).join('\n');
    if (!combined && !imagePath) return json({ ok: false, error: 'empty' });

    // Moderation gate — authoritative. Not configured → do NOT publish.
    if (!openaiConfigured()) return json({ ok: false, error: 'MODERATION_NOT_CONFIGURED' });

    const admin = adminClient();
    let imageUrl: string | undefined;
    if (imagePath) {
      // Own-folder guard: only this user's objects may be attached.
      if (!imagePath.startsWith(`${uid}/`)) return json({ ok: false, error: 'invalid_image_path' });
      const { data: signed } = await admin.storage.from('future-images').createSignedUrl(imagePath, 120);
      imageUrl = signed?.signedUrl;
    }

    const m = await moderate({ text: combined, imageUrl });
    if (m.flagged) return json({ ok: false, error: 'flagged', categories: m.categories });

    const { data: prof } = await admin.from('anonymous_profiles').select('display_alias').eq('id', uid).single();
    if (!prof) return json({ ok: false, error: 'no_profile' });

    const { data: row, error } = await admin
      .from('future_diary_shares')
      .insert({
        user_id: uid,
        display_alias: prof.display_alias,
        future_self: futureSelf,
        ideal_day: idealDay,
        feelings_environment: feelings,
        image_path: imagePath,
        moderated: true,
      })
      .select('id')
      .single();
    if (error) return json({ ok: false, error: 'insert_failed' });
    return json({ ok: true, publicShareId: row.id });
  } catch (e) {
    if (e instanceof Response) return e;
    return json({ ok: false, error: 'publish_error' }, 500);
  }
});
