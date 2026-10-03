// Shared OpenAI helpers for NoF edge functions (founder RC-17 vendor decisions). The OPENAI_API_KEY is
// a SERVER secret read from Deno.env — it is never sent to, or referenced by, the client bundle.
//
// Models (founder): moderation = omni-moderation-latest · image default = gpt-image-2.5-flare ·
// image precision-edit = gpt-image-2.5-sunburst (used only when a genuine precision edit is needed;
// not used in the V1 first-generation path below).

const OPENAI = 'https://api.openai.com/v1';

export function openaiConfigured(): boolean {
  return !!Deno.env.get('OPENAI_API_KEY');
}
function authHeader(): Record<string, string> {
  return { Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`, 'content-type': 'application/json' };
}

// POST with AT MOST ONE retry, and only for a transient failure (network throw or HTTP 5xx). A 4xx is
// returned as-is (no retry). This bounds provider calls (founder P3-B: max 1 retry, never a loop).
async function postJson(url: string, body: unknown): Promise<Response> {
  const once = () => fetch(url, { method: 'POST', headers: authHeader(), body: JSON.stringify(body) });
  try {
    const r = await once();
    if (r.status >= 500) {
      try {
        return await once();
      } catch {
        return r;
      }
    }
    return r;
  } catch {
    return await once(); // retry the network error exactly once
  }
}

export async function moderate(
  { text, imageUrl }: { text?: string; imageUrl?: string },
): Promise<{ configured: boolean; flagged?: boolean; categories?: string[] }> {
  if (!openaiConfigured()) return { configured: false };
  const input: unknown[] = [];
  if (text) input.push({ type: 'text', text });
  if (imageUrl) input.push({ type: 'image_url', image_url: { url: imageUrl } });
  if (input.length === 0) {
    // Never interpret "nothing reached the provider" as a safe moderation verdict.
    throw new Error('moderation input missing');
  }
  const res = await postJson(`${OPENAI}/moderations`, { model: 'omni-moderation-latest', input });
  if (!res.ok) throw new Error(`moderation ${res.status}`);
  const data = await res.json();
  const result = data.results?.[0];
  if (!result || typeof result.flagged !== 'boolean') {
    // A successful HTTP response is not itself a moderation verdict.
    // Missing/malformed provider output must never be interpreted as safe.
    throw new Error('moderation verdict missing');
  }
  const categories = Object.entries(result.categories ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  return { configured: true, flagged: result.flagged, categories };
}

export async function generateImage(
  { prompt, quality }: { prompt: string; quality: 'low' | 'medium' },
): Promise<{ b64: string; mimeType: string }> {
  if (!openaiConfigured()) throw new Error('image provider not configured');
  const res = await postJson(`${OPENAI}/images/generations`, {
    model: 'gpt-image-2.5-flare',
    prompt,
    quality,
    n: 1,
  });
  if (!res.ok) throw new Error(`image ${res.status}`);
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('no image returned');
  return { b64, mimeType: 'image/png' };
}
