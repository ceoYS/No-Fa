// generate-future-image — server-side image generation (founder P3 + RC-17C §6 cost guard). The
// OPENAI_API_KEY stays server only; the SERVER builds the final prompt; the SERVER usage tables are the
// billing authority. Flow:
//   0. cost guards (server-only env): a kill-switch (NOF_IMAGE_GENERATION_ENABLED) that FAILS CLOSED,
//      and a GLOBAL daily ceiling (NOF_IMAGE_GLOBAL_DAILY_LIMIT) reserved BEFORE any provider call — the
//      real backstop against anonymous-signup cost bombs (a per-user cap alone can't bound unlimited
//      free accounts);
//   1. reserve the per-user monthly quota ATOMICALLY before any provider call (limit from
//      NOF_IMAGE_USER_MONTHLY_FREE_LIMIT, else the DB default FREE = 1);
//   2. generate (default quality low; medium only on request; at most one retry inside the helper);
//   3. store privately in the user's own storage folder;
//   4. safety: moderate the generated image before returning a shareable URL.
// On ANY unsuccessful path (kill-switch off, over a cap, provider error, storage error, image rejected,
// the safety check itself erroring, or any unexpected throw) EVERY reservation taken is REFUNDED, so
// ONLY a real, safe image is ever charged — exactly one successful generation charge. (P3-A/B/C, §6)
import { handlePreflight, json } from '../_shared/cors.ts';
import { requireUser, adminClient } from '../_shared/supabase.ts';
import { generateImage, moderate, openaiConfigured } from '../_shared/openai.ts';

// Server-only config — NEVER VITE_-prefixed; read from Deno.env at request time so it is changeable
// without a redeploy. Every gate FAILS CLOSED when unset.
function boolEnv(name: string): boolean {
  const v = (Deno.env.get(name) ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}
function intEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function decodeB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// The server builds the FINAL prompt — the raw user reflection is embedded but never used verbatim as
// the whole instruction, and the template steers toward a calm, non-explicit scene.
function buildPrompt(diaryText: string): string {
  const safe = String(diaryText ?? '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  return (
    'A calm, hopeful, non-explicit illustration of a peaceful future scene inspired by this personal ' +
    `reflection: "${safe}". Soft warm light, gentle and serene, no text, tasteful and wholesome.`
  );
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  // Declared in the handler scope so the outer catch can refund whatever was reserved, even on an
  // unexpected throw. Flags flip true only AFTER `admin` exists, so `admin` is non-null when refunding.
  let admin: ReturnType<typeof adminClient> | null = null;
  let uid = '';
  let globalReserved = false;
  let userReserved = false;
  const unwind = async () => {
    if (!admin) return;
    if (userReserved) { await admin.rpc('refund_image_generation', { p_uid: uid }).catch(() => {}); userReserved = false; }
    if (globalReserved) { await admin.rpc('refund_global_image_slot').catch(() => {}); globalReserved = false; }
  };

  try {
    ({ uid } = await requireUser(req));

    // Cost guards — every gate FAILS CLOSED, and all run BEFORE any reservation or provider call.
    if (!boolEnv('NOF_IMAGE_GENERATION_ENABLED')) return json({ ok: false, error: 'IMAGE_GENERATION_DISABLED' });
    if (!openaiConfigured()) return json({ ok: false, error: 'IMAGE_PROVIDER_NOT_CONFIGURED' });

    const { diaryText, quality } = await req.json().catch(() => ({}));
    admin = adminClient();

    // Global daily ceiling first (cheap backstop; FAIL CLOSED when unset/zero/invalid).
    const globalLimit = intEnv('NOF_IMAGE_GLOBAL_DAILY_LIMIT', 0);
    const { data: gOk, error: gErr } = await admin.rpc('reserve_global_image_slot', { p_limit: globalLimit });
    if (gErr) return json({ ok: false, error: 'quota_error' }, 500);
    if (gOk !== true) return json({ ok: false, error: 'daily_capacity' });
    globalReserved = true;

    // Per-user monthly reserve (atomic, server-authoritative). Limit from server env, else DB default.
    const userLimit = intEnv('NOF_IMAGE_USER_MONTHLY_FREE_LIMIT', 1);
    const { data: reservedRows, error: rerr } = await admin.rpc('reserve_image_generation', { p_uid: uid, p_limit: userLimit });
    const reserved = Array.isArray(reservedRows) ? reservedRows[0] : reservedRows;
    if (rerr || !reserved) { await unwind(); return json({ ok: false, error: 'quota_error' }, 500); }
    if (!reserved.allowed) { await unwind(); return json({ ok: false, error: 'quota_exceeded', used: reserved.used, limit: reserved.limit }); }
    userReserved = true;

    // Generate (default preview = low; at most one retry inside the helper).
    const q: 'low' | 'medium' = quality === 'medium' ? 'medium' : 'low';
    let img: { b64: string; mimeType: string };
    try {
      img = await generateImage({ prompt: buildPrompt(diaryText), quality: q });
    } catch {
      await unwind();
      return json({ ok: false, error: 'provider_error' });
    }

    // Store privately under the user's own folder.
    const path = `${uid}/${crypto.randomUUID()}.png`;
    const { error: upErr } = await admin.storage
      .from('future-images')
      .upload(path, decodeB64(img.b64), { contentType: img.mimeType, upsert: false });
    if (upErr) { await unwind(); return json({ ok: false, error: 'storage_error' }); }

    // Safety-moderate before it can ever be shared. A flagged image AND a moderation call that itself
    // errors both FAIL CLOSED: remove the object and refund — never charge for an unverified image.
    const { data: signed } = await admin.storage.from('future-images').createSignedUrl(path, 300);
    try {
      const m = await moderate({ imageUrl: signed?.signedUrl });
      if (m.configured && m.flagged) {
        await admin.storage.from('future-images').remove([path]).catch(() => {});
        await unwind();
        return json({ ok: false, error: 'image_rejected' });
      }
    } catch {
      await admin.storage.from('future-images').remove([path]).catch(() => {});
      await unwind();
      return json({ ok: false, error: 'moderation_unavailable' });
    }

    // Success — the single charge stands (both counters). Nothing to unwind.
    return json({ ok: true, imagePath: path, signedUrl: signed?.signedUrl, used: reserved.used, limit: reserved.limit });
  } catch (e) {
    await unwind(); // any unexpected throw after a reservation still refunds
    if (e instanceof Response) return e;
    return json({ ok: false, error: 'generate_error' }, 500);
  }
});
