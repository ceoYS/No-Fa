// plaza-cleanup — scheduled deletion of expired shouts (founder P1-D). This is the non-pg_cron path:
// invoke it on a Supabase schedule (or external cron) with the shared CLEANUP_SECRET header. It is not
// publicly invocable (no user JWT; verify_jwt=false in config.toml, guarded by the secret instead).
import { handlePreflight, json } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  const secret = req.headers.get('x-cleanup-secret');
  const expected = Deno.env.get('CLEANUP_SECRET');
  if (!expected || secret !== expected) return json({ ok: false, error: 'forbidden' }, 403);

  const { error, count } = await adminClient()
    .from('shout_messages')
    .delete({ count: 'exact' })
    .lte('expires_at', new Date().toISOString());
  if (error) return json({ ok: false, error: 'cleanup_failed' }, 500);
  return json({ ok: true, deleted: count ?? 0 });
});
