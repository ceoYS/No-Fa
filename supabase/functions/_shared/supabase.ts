// Shared Supabase clients for NoF edge functions. Deno import (does NOT affect the Vite client build).
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { json } from './cors.ts';

// Service-role admin client — bypasses RLS. Used ONLY server-side for moderated publish / usage /
// storage. The service role key is a server secret injected by Supabase; it never reaches the client.
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Resolve + verify the caller from the Authorization bearer JWT. Throws a 401 Response when missing or
// invalid, so callers can `catch (e) { if (e instanceof Response) return e; }`.
export async function requireUser(req: Request): Promise<{ uid: string; token: string }> {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) throw json({ ok: false, error: 'unauthenticated' }, 401);
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data?.user) throw json({ ok: false, error: 'unauthenticated' }, 401);
  return { uid: data.user.id, token };
}
