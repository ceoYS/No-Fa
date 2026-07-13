/*
 * roomTextures — procedural CanvasTexture builders for the 3D pet room.
 *
 * Every surface texture is drawn locally on an offscreen canvas: no external
 * texture URLs, no bundled image assets, nothing fetched at runtime. The goal
 * is material SEPARATION (wood floor vs plaster wall vs woven rug vs night
 * glass), not photorealism — values stay inside the quiet ember palette:
 * deep ink brown, warm ivory, muted wood, restrained amber.
 *
 * Determinism: a small seeded LCG replaces Math.random so every mount draws
 * the identical room (stable screenshots, stable QA).
 */

function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function toTexture(THREE, canvas, { repeat, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.anisotropy = 4;
  return tex;
}

// Wood plank floor — horizontal boards with per-board value jitter, dark seam
// lines and light grain streaks. Darker walnut (B-3): the floor sits a clear
// value step BELOW the ivory walls so the two never blur into one brown.
export function makeWoodFloorTexture(THREE) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rng = makeRng(20260713);
  ctx.fillStyle = '#2c1f16';
  ctx.fillRect(0, 0, 512, 512);

  const boardH = 64;
  for (let row = 0; row < 512 / boardH; row++) {
    const jitter = (rng() - 0.5) * 12;
    const base = 34 + jitter; // lightness anchor per board — walnut range
    ctx.fillStyle = `rgb(${Math.round(base + 12)}, ${Math.round(base - 1)}, ${Math.round(base - 12)})`;
    ctx.fillRect(0, row * boardH, 512, boardH);

    // grain streaks — long, low-alpha strokes along the board
    for (let g = 0; g < 26; g++) {
      const y = row * boardH + 4 + rng() * (boardH - 8);
      const x0 = rng() * 512;
      const len = 60 + rng() * 220;
      ctx.strokeStyle = rng() > 0.5 ? 'rgba(20, 12, 7, 0.16)' : 'rgba(122, 92, 62, 0.10)';
      ctx.lineWidth = 0.8 + rng() * 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + len * 0.5, y + (rng() - 0.5) * 3, x0 + len, y);
      ctx.stroke();
    }

    // board seam + staggered butt joints
    ctx.fillStyle = 'rgba(12, 7, 4, 0.85)';
    ctx.fillRect(0, row * boardH, 512, 2);
    const joint = ((row * 197) % 512 + rng() * 60) % 512;
    ctx.fillRect(joint, row * boardH, 2, boardH);
  }
  return toTexture(THREE, canvas, { repeat: [1.6, 1.35] });
}

// Plaster wall — soft mottled blotches over a warm ivory/taupe base (B-3),
// slightly shaded toward the top so the room reads lit from within. The walls
// carry the LIGHT value in the room; floor and furniture stay dark wood.
export function makePlasterTexture(THREE) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rng = makeRng(9127001);
  ctx.fillStyle = '#6e6355';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 260; i++) {
    const x = rng() * 512;
    const y = rng() * 512;
    const r = 14 + rng() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rng() > 0.5;
    g.addColorStop(0, warm ? 'rgba(150, 132, 108, 0.06)' : 'rgba(50, 42, 33, 0.05)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const shade = ctx.createLinearGradient(0, 0, 0, 512);
  shade.addColorStop(0, 'rgba(24, 19, 14, 0.14)');
  shade.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(30, 24, 18, 0.1)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 512, 512);
  return toTexture(THREE, canvas, { repeat: [1.5, 1] });
}

// Round woven rug — concentric rings in two muted warm tones with a darker
// border band and faint stitch ticks. Drawn as a full disc; mapped onto a
// circle geometry.
export function makeRugTexture(THREE) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const rng = makeRng(5150033);
  const cx = 256;
  ctx.clearRect(0, 0, 512, 512);

  const rings = 13;
  for (let i = rings; i >= 0; i--) {
    const r = (i / rings) * 250;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    // Muted terracotta rings (B-3) — clearly warmer than the walnut floor,
    // clearly deeper than the ivory walls, never a loud game orange.
    if (i >= rings - 1) ctx.fillStyle = '#41291d';
    else ctx.fillStyle = i % 2 === 0 ? '#7d503a' : '#6e4432';
    ctx.fill();
  }
  // faint stitch ticks around a few rings
  ctx.strokeStyle = 'rgba(28, 18, 11, 0.5)';
  ctx.lineWidth = 1.2;
  for (let ring = 2; ring < rings; ring += 3) {
    const r = (ring / rings) * 250;
    const ticks = 40 + ring * 8;
    for (let t = 0; t < ticks; t++) {
      const a = (t / ticks) * Math.PI * 2 + rng() * 0.02;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 3), cx + Math.sin(a) * (r - 3));
      ctx.lineTo(cx + Math.cos(a) * (r + 3), cx + Math.sin(a) * (r + 3));
      ctx.stroke();
    }
  }
  // center medallion
  ctx.beginPath();
  ctx.arc(cx, cx, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#84543b';
  ctx.fill();
  return toTexture(THREE, canvas);
}

// Soft radial CONTACT GLOW disc — a white radial falloff meant to be tinted
// by its material color (amber for selection / validity feedback). The quiet
// replacement for the old thick selection hoop.
export function makeContactGlowTexture(THREE, size = 128) {
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  g.addColorStop(0.55, 'rgba(255, 255, 255, 0.2)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(THREE, canvas);
}

// Night window glass — a deep ink-blue gradient with a soft pale glow and a
// few faint distant points. Pure scenery: a quiet night outside, nothing that
// claims motion or a live world.
export function makeNightWindowTexture(THREE) {
  const { canvas, ctx } = makeCanvas(256, 320);
  const rng = makeRng(7772011);
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#0d1420');
  sky.addColorStop(0.55, '#141d2c');
  sky.addColorStop(1, '#1b2433');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 320);

  // soft pale glow high in the pane
  const moon = ctx.createRadialGradient(178, 64, 2, 178, 64, 60);
  moon.addColorStop(0, 'rgba(214, 222, 228, 0.85)');
  moon.addColorStop(0.18, 'rgba(196, 206, 216, 0.32)');
  moon.addColorStop(1, 'rgba(196, 206, 216, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(98, -16, 160, 160);

  for (let i = 0; i < 26; i++) {
    const x = rng() * 256;
    const y = rng() * 250;
    ctx.fillStyle = `rgba(206, 214, 224, ${0.12 + rng() * 0.3})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  // dim rooftops line at the sill
  ctx.fillStyle = '#0a0e16';
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(0, 286);
  let x = 0;
  while (x < 256) {
    const w = 24 + rng() * 40;
    const h = 270 + rng() * 26;
    ctx.lineTo(x, h);
    ctx.lineTo(x + w, h);
    x += w;
  }
  ctx.lineTo(256, 320);
  ctx.closePath();
  ctx.fill();
  return toTexture(THREE, canvas);
}

// Soft radial contact-shadow disc — shared by the cat bed, scenery furniture
// and placed item proxies for honest grounding on the floor.
export function makeContactShadowTexture(THREE, size = 128) {
  const { canvas, ctx } = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.26)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(THREE, canvas);
}
