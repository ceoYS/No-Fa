#!/usr/bin/env node
/**
 * NoF canonical kitten — automated multi-view reference pack generator.
 *
 * Generates the 8-view identity reference pack defined in
 * docs/prompts/NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md by calling the
 * Gemini image API with the canonical kitten images attached as identity
 * references. Prompts below are copied verbatim from that document — if the
 * document changes, update this script to match.
 *
 * Usage:
 *   GEMINI_API_KEY=...  node scripts/asset-pipeline/kitten/generate-multiview.mjs [options]
 *
 * Options:
 *   --views 01,03,04     which views to generate (default: 01 — front first;
 *                        generate the rest only after the front is approved)
 *   --candidates 3       candidates per view (default 3)
 *   --model <id>         default: gemini-2.5-flash-image
 *   --output-dir <dir>   output root (alias: --out). Falls back to the
 *                        NOF_KITTEN_OUTPUT_DIR environment variable, then to
 *                        ~/NoF-kitten-production/multiview-candidates.
 *                        The Windows Downloads path is never auto-guessed —
 *                        pass it explicitly per machine, e.g.
 *                        --output-dir /mnt/c/Users/<user>/Downloads/NoF-kitten-production/multiview-candidates
 *   --sheet              build per-view contact sheets (ffmpeg) from existing
 *                        candidates instead of generating
 *   --dry-run            print prompts + cost estimate, no API call
 *
 * Boundaries (per NoF asset pipeline rules):
 *   - The API key comes from the environment only; it is never written to disk.
 *   - Output goes OUTSIDE the repo (Downloads). Nothing is committed.
 *   - Generated images are candidates — a human must pass all of them through
 *     docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md before any image-to-3D step.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const REF_MAIN = join(REPO, 'public', 'assets', 'pets', 'white_kitten_main.webp');
const REF_WAVE = join(REPO, 'public', 'assets', 'pets', 'white_kitten_wave.webp');
// No machine-specific path is hardcoded: CLI flag > env var > home default.
const DEFAULT_OUT = join(homedir(), 'NoF-kitten-production', 'multiview-candidates');

const MASTER_PROMPT = `Use the attached NoF white kitten image as the exact character identity
reference. Generate the SAME individual kitten — not a generic white cat and
not a redesigned mascot.

Identity contract (must match the reference in every view):
- very large round dark-amber eyes with a soft catchlight
- small light-pink triangular nose
- extremely short flat muzzle, no snout protrusion
- round soft cheeks and a slightly oversized head (baby-kitten proportions)
- ivory-white short fluffy fur, no markings, no points, no stripes
- short legs, compact chubby body, natural plump tail
- identical ear size, ear placement and eye spacing in every view
- no collar, no pattern, no clothes, no props
- mouth closed, neutral calm expression

Framing contract (identical in every view):
- full body visible, standing on all four legs in the same neutral relaxed
  standing pose, same scale, kitten centered filling ~70% of frame height
- orthographic-like framing / very long focal length, no wide-angle distortion
- plain neutral light-gray studio background, soft even lighting,
  minimal soft floor contact shadow only
- no room, no cushion, no ember, no bed, no furniture, no text
- photorealistic soft-fur render matching the reference image's style
- do not invent or change any feature in side/back views — same one kitten`;

const NEGATIVE_PROMPT = `Strictly avoid all of the following: dog-like muzzle, adult cat proportions,
long torso, narrow face, black muzzle, human teeth, smile, exaggerated anime
eyes, plastic toy surface, ceramic surface, orange lighting, dramatic rim
lighting, room background, bed, blanket, accessories, asymmetrical identity,
different cat between views.`;

const VIEWS = {
  '01': {
    file: 'nof_kitten_ref_01_front',
    prompt: `View: perfect straight-on front view at the kitten's eye level (0°). Both eyes fully visible and symmetrical, both ears at equal height, all four legs visible, tail visible beside the body.`,
  },
  '02': {
    file: 'nof_kitten_ref_02_front34_left',
    prompt: `View: front three-quarter view from the kitten's left side (camera rotated ~40° toward the kitten's left), eye level. Both eyes still visible, left cheek and left flank visible, same standing pose.`,
  },
  '03': {
    file: 'nof_kitten_ref_03_left_profile',
    prompt: `View: exact left side profile (90°), eye level. One eye visible. The muzzle stays short and flat — absolutely no protruding dog-like snout in profile. Belly line, all four legs and tail clearly visible.`,
  },
  '04': {
    file: 'nof_kitten_ref_04_right_profile',
    prompt: `View: exact right side profile (90°), the mirror of the left profile — same pose, same proportions, same features.`,
  },
  '05': {
    file: 'nof_kitten_ref_05_back',
    prompt: `View: direct back view (180°), eye level. Back of the head with both ears from behind, rounded back, hips and tail. Still the same chubby baby-kitten build — not an adult cat from behind.`,
  },
  '06': {
    file: 'nof_kitten_ref_06_rear34',
    prompt: `View: rear three-quarter view (~135°, from behind and to the kitten's left). Shows the back, the left flank and the edge of the cheek — no full face. Same standing pose and scale.`,
  },
  '07': {
    file: 'nof_kitten_ref_07_top',
    prompt: `View: elevated camera ~35° above eye level, slightly in front — a gentle top-down view showing the top of the head, how the ears sit on the skull, the back length and the body footprint. Not a straight overhead shot.`,
  },
  '08': {
    file: 'nof_kitten_ref_08_neutral_pose',
    prompt: `Pose reference for 3D modeling topology: the same neutral standing pose with the four legs clearly separated and vertical under the body, tail relaxed and lifted slightly away from the body so it does not touch the legs or overlap the silhouette, head facing straight forward, mouth closed. Front three-quarter right angle so this sheet also covers the right ¾ that view 2 covers on the left.`,
  },
};

// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const flag = (name) => args.includes(`--${name}`);

const model = opt('model', 'gemini-2.5-flash-image');
const outRoot =
  opt('output-dir', null) ??
  opt('out', null) ??
  process.env.NOF_KITTEN_OUTPUT_DIR ??
  DEFAULT_OUT;
const outSource = opt('output-dir', null) || opt('out', null)
  ? '--output-dir'
  : process.env.NOF_KITTEN_OUTPUT_DIR
    ? 'NOF_KITTEN_OUTPUT_DIR'
    : 'default (~)';
const viewIds = opt('views', '01').split(',').map((v) => v.trim().padStart(2, '0'));
const nCand = Number(opt('candidates', '3'));
const dryRun = flag('dry-run');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildContactSheets() {
  for (const id of viewIds) {
    const dir = join(outRoot, `${id}_${VIEWS[id].file.replace('nof_kitten_ref_', '')}`);
    if (!existsSync(dir)) continue;
    const pngs = readdirSync(dir).filter((f) => f.endsWith('.png') && !f.startsWith('sheet')).sort();
    if (pngs.length < 2) continue;
    const inputs = pngs.flatMap((f) => ['-i', join(dir, f)]);
    const sheet = join(dir, `sheet_${id}.png`);
    try {
      execFileSync('ffmpeg', [
        '-hide_banner', '-loglevel', 'error', '-y',
        ...inputs,
        '-filter_complex', `hstack=inputs=${pngs.length}`,
        sheet,
      ]);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error('ffmpeg not found on this machine — install ffmpeg to build contact sheets, or review candidate PNGs directly.');
        process.exit(3);
      }
      throw e;
    }
    console.log(`sheet: ${sheet} (${pngs.length} candidates)`);
  }
}

async function generateOne(apiKey, viewId, candIdx, refs) {
  const view = VIEWS[viewId];
  const prompt = `${MASTER_PROMPT}\n\n${view.prompt}\n\n${NEGATIVE_PROMPT}`;
  const body = {
    contents: [
      {
        parts: [
          ...refs.map((b64) => ({ inline_data: { mime_type: 'image/webp', data: b64 } })),
          { text: prompt },
        ],
      },
    ],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
    if (res.status === 429 || res.status === 503) {
      const wait = 15000 * attempt;
      console.log(`  rate-limited (${res.status}), retry in ${wait / 1000}s (attempt ${attempt}/4)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.slice(0, 500)}`);
    }
    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p) => p.inlineData?.data);
    if (!img) {
      const reason = json.candidates?.[0]?.finishReason ?? 'no image part in response';
      throw new Error(`no image returned (${reason})`);
    }
    return Buffer.from(img.inlineData.data, 'base64');
  }
  throw new Error('rate limit retries exhausted');
}

async function main() {
  for (const id of viewIds) {
    if (!VIEWS[id]) {
      console.error(`unknown view ${id}; valid: ${Object.keys(VIEWS).join(',')}`);
      process.exit(1);
    }
  }

  const totalImages = viewIds.length * nCand;
  console.log(`model: ${model}`);
  console.log(`views: ${viewIds.join(', ')} × ${nCand} candidates = ${totalImages} images`);
  console.log(`out:   ${outRoot} (from ${outSource})`);
  console.log(`est. paid-tier cost (gemini-2.5-flash-image ≈ $0.039/img): ~$${(totalImages * 0.039).toFixed(2)} (free tier: $0, rate-limited)`);

  if (flag('sheet')) return buildContactSheets();

  if (dryRun) {
    for (const id of viewIds) {
      console.log(`\n=== view ${id} (${VIEWS[id].file}) ===`);
      console.log(`${MASTER_PROMPT}\n\n${VIEWS[id].prompt}\n\n${NEGATIVE_PROMPT}`);
    }
    console.log('\n[dry-run] no API calls made.');
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set. Set it in the environment (never in a file in the repo):');
    console.error('  GEMINI_API_KEY=... node scripts/asset-pipeline/kitten/generate-multiview.mjs');
    process.exit(2);
  }

  const refs = [REF_MAIN, REF_WAVE].map((p) => readFileSync(p).toString('base64'));
  const log = { startedAt: new Date().toISOString(), model, views: {}, errors: [] };

  for (const id of viewIds) {
    const view = VIEWS[id];
    const dir = join(outRoot, `${id}_${view.file.replace('nof_kitten_ref_', '')}`);
    mkdirSync(dir, { recursive: true });
    log.views[id] = [];
    for (let k = 1; k <= nCand; k++) {
      const target = join(dir, `${view.file}__cand${k}.png`);
      process.stdout.write(`view ${id} candidate ${k}/${nCand} ... `);
      try {
        const png = await generateOne(apiKey, id, k, refs);
        writeFileSync(target, png);
        console.log(`saved ${target} (${(png.length / 1024).toFixed(0)} KB)`);
        log.views[id].push({ file: target, bytes: png.length });
      } catch (e) {
        console.log(`FAILED: ${e.message}`);
        log.errors.push({ view: id, candidate: k, error: e.message });
      }
      await sleep(8000); // stay under free-tier RPM
    }
  }

  log.finishedAt = new Date().toISOString();
  const logPath = join(outRoot, `run-log-${log.startedAt.replace(/[:.]/g, '-')}.json`);
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log(`\nrun log: ${logPath}`);
  console.log('next: human identity review per docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md — no image goes to 3D before all 8 views pass.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
