/*
 * catRig — the procedural 3D cat that lives at the room's cat anchor.
 *
 * HONESTY CONTRACT (Phase C):
 *   - This is a real 3D object built from primitive geometry, in the same
 *     family as the item proxies: an honest stylized model, never a claim of
 *     finished character art. When an approved rigged cat asset lands (see
 *     ASSET_CONTRACT.md §6), buildCatRig() is the single swap point — the
 *     interaction, mood and render code above it stay untouched.
 *   - Every visible motion here is REAL transform animation computed each
 *     frame (breath scale, lid scale, ear/head/tail-joint rotation). Nothing
 *     is implied by copy that the rig does not actually do on screen.
 *   - Mood is a small idle-parameter preset derived from LOCAL signals only
 *     (roomDomain.deriveCatMood). It tunes timing and pose. It is never
 *     presented as the cat having feelings, and no copy may claim that.
 *   - No 2D shortcuts: no billboard planes, no image textures, no flat
 *     stand-in of any kind (guard #111 pins this) — geometry and
 *     MeshStandardMaterial only, so the cat sits in the room's real lighting
 *     and casts/receives the same shadows the furniture does.
 *   - No sound in here. Audio stays in the screen's gesture-gated usePetSound
 *     path (silent fallback while files are pending, guard #26/#33).
 *
 * Determinism: idle scheduling (blink gaps, ear flicks) runs on the same
 * seeded LCG roomTextures uses, so every mount behaves identically — stable
 * screenshots, stable QA.
 */
import { CAT_MOODS } from './roomDomain.js';

// Quiet ember-palette fur: warm white main coat one value step lighter than
// the ivory walls, so the cat reads as the room's living focus at a glance.
const FUR_MAIN = '#e9e2d5';
const FUR_SHADE = '#d8cdbb';
const EAR_INNER = '#c39b8a';
const EYE_INK = '#241b15';
const NOSE_CLAY = '#b47f6e';

// Idle-parameter presets per mood. Values are deliberately small and slow —
// a recovery room, not a toy: breath is a ±1.5–2% scale, the head drifts a
// few degrees, the tail sway stays under ~0.16 rad at the base joint.
const MOOD_PARAMS = {
  neutral: { breathHz: 0.22, breathAmp: 0.015, blinkGapMs: [3200, 5600], lidRest: 1, headPitch: 0.01, tailAmp: 0.1, tailHz: 0.14, earLift: 0, wander: 0.1 },
  calm: { breathHz: 0.18, breathAmp: 0.017, blinkGapMs: [3800, 6400], lidRest: 0.9, headPitch: 0.03, tailAmp: 0.07, tailHz: 0.11, earLift: 0.02, wander: 0.07 },
  curious: { breathHz: 0.26, breathAmp: 0.014, blinkGapMs: [2600, 4600], lidRest: 1, headPitch: -0.05, tailAmp: 0.16, tailHz: 0.2, earLift: -0.09, wander: 0.16 },
  sleepy: { breathHz: 0.13, breathAmp: 0.02, blinkGapMs: [4200, 7000], lidRest: 0.45, headPitch: 0.12, tailAmp: 0.04, tailHz: 0.08, earLift: 0.05, wander: 0.03 },
};

// Reaction envelopes (ms). Both are single short answers to the user's own
// gesture, then the rig settles back to its idle — no looping excitement.
const REACTIONS = {
  tap: { durationMs: 950 },
  pet: { durationMs: 1350 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

// Same tiny seeded LCG as roomTextures — deterministic idle scheduling.
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildCatRig(THREE, { seed = 20260713 } = {}) {
  const group = new THREE.Group();
  group.name = 'cat-rig';

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0, ...opts });
  const furMat = mat(FUR_MAIN);
  const shadeMat = mat(FUR_SHADE);
  const earInnerMat = mat(EAR_INNER, { roughness: 0.9 });
  const eyeMat = mat(EYE_INK, { roughness: 0.35 });
  const noseMat = mat(NOSE_CLAY, { roughness: 0.6 });

  const solid = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // ── body (loaf pose: paws tucked, low silhouette inside the bed rim) ─────
  const breatheGroup = new THREE.Group();
  breatheGroup.name = 'cat-breathe';
  group.add(breatheGroup);

  const body = solid(new THREE.Mesh(new THREE.SphereGeometry(0.17, 26, 20), furMat));
  body.scale.set(0.95, 0.78, 1.18);
  body.position.y = 0.135;
  breatheGroup.add(body);

  const haunch = solid(new THREE.Mesh(new THREE.SphereGeometry(0.125, 22, 16), shadeMat));
  haunch.scale.set(1.05, 0.85, 1);
  haunch.position.set(0, 0.12, -0.11);
  breatheGroup.add(haunch);

  const chest = solid(new THREE.Mesh(new THREE.SphereGeometry(0.105, 22, 16), furMat));
  chest.position.set(0, 0.115, 0.13);
  breatheGroup.add(chest);

  for (const px of [-0.052, 0.052]) {
    const paw = solid(new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.06, 6, 12), furMat));
    paw.rotation.x = Math.PI / 2;
    paw.position.set(px, 0.038, 0.215);
    breatheGroup.add(paw);
  }

  // ── head (its own pivot: attention drift + reactions rotate this group) ──
  const headGroup = new THREE.Group();
  headGroup.name = 'cat-head';
  headGroup.position.set(0, 0.295, 0.155);
  breatheGroup.add(headGroup);

  const head = solid(new THREE.Mesh(new THREE.SphereGeometry(0.105, 26, 20), furMat));
  head.scale.set(1, 0.94, 0.96);
  headGroup.add(head);

  const muzzle = solid(new THREE.Mesh(new THREE.SphereGeometry(0.048, 18, 14), furMat));
  muzzle.scale.set(1.05, 0.78, 0.85);
  muzzle.position.set(0, -0.028, 0.082);
  headGroup.add(muzzle);

  const nose = solid(new THREE.Mesh(new THREE.SphereGeometry(0.0115, 10, 8), noseMat));
  nose.scale.set(1.2, 0.8, 0.7);
  nose.position.set(0, -0.008, 0.126);
  headGroup.add(nose);

  // Ears pivot at their base so a small rotation reads as a real flick.
  const ears = {};
  for (const [key, sx] of [['left', -1], ['right', 1]]) {
    const pivot = new THREE.Group();
    pivot.name = `cat-ear-${key}`;
    pivot.position.set(sx * 0.062, 0.082, -0.004);
    pivot.rotation.z = sx * -0.18;
    const outer = solid(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.088, 4), furMat));
    outer.position.y = 0.038;
    outer.rotation.y = Math.PI / 4;
    const inner = solid(new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.05, 4), earInnerMat));
    inner.position.set(0, 0.03, 0.011);
    inner.rotation.y = Math.PI / 4;
    pivot.add(outer, inner);
    headGroup.add(pivot);
    ears[key] = pivot;
  }

  // Eyes: the lid is the eye group's y-scale, so a blink is a real transform
  // (1 → 0.08 → 1) instead of a texture swap.
  const eyes = {};
  for (const [key, sx] of [['left', -1], ['right', 1]]) {
    const lid = new THREE.Group();
    lid.name = `cat-eye-${key}`;
    lid.position.set(sx * 0.047, 0.012, 0.086);
    const eye = solid(new THREE.Mesh(new THREE.SphereGeometry(0.0165, 12, 10), eyeMat));
    eye.scale.set(1, 1, 0.55);
    lid.add(eye);
    headGroup.add(lid);
    eyes[key] = lid;
  }

  // ── tail: three chained joints lying on the pad, curling around the body.
  // Sway bends each joint a little in the floor plane, tip more than base.
  const tailJoints = [];
  const tailBase = new THREE.Group();
  tailBase.name = 'cat-tail';
  tailBase.position.set(0.115, 0.048, -0.16);
  tailBase.rotation.y = -0.85; // resting curl start, wrapping toward the front
  breatheGroup.add(tailBase);
  let parent = tailBase;
  const segments = [
    { len: 0.095, r0: 0.02, r1: 0.016, curl: -0.55 },
    { len: 0.085, r0: 0.016, r1: 0.012, curl: -0.6 },
    { len: 0.075, r0: 0.012, r1: 0.009, curl: -0.55 },
  ];
  for (const seg of segments) {
    const joint = new THREE.Group();
    joint.rotation.y = seg.curl;
    const bone = solid(new THREE.Mesh(new THREE.CylinderGeometry(seg.r1, seg.r0, seg.len, 10), furMat));
    bone.rotation.x = Math.PI / 2;
    bone.position.z = seg.len / 2;
    joint.add(bone);
    parent.add(joint);
    parent = joint;
    tailJoints.push({ joint, restY: seg.curl });
  }
  const tailTip = solid(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), shadeMat));
  tailTip.position.z = segments[segments.length - 1].len;
  parent.add(tailTip);

  // ── animation state ──────────────────────────────────────────────────────
  const rng = makeRng(seed);
  let mood = 'neutral';
  // Smoothed working copy of the mood params, eased toward the target preset
  // so a mood change never snaps the pose.
  const live = { ...MOOD_PARAMS.neutral };
  let t = 0;
  let blinkAt = 2.2; // first blink lands early so QA can catch one quickly
  let blinkT = -1; // seconds into the current blink, -1 = not blinking
  let earFlickAt = 5 + rng() * 5;
  let earFlick = null; // { side, t }
  let reaction = null; // { kind, t }
  const state = { mode: 'idle', blinks: 0 };

  const BLINK_CLOSE = 0.07;
  const BLINK_HOLD = 0.06;
  const BLINK_OPEN = 0.11;
  const BLINK_TOTAL = BLINK_CLOSE + BLINK_HOLD + BLINK_OPEN;

  const scheduleBlink = () => {
    const [lo, hi] = live.blinkGapMs;
    blinkAt = t + (lo + rng() * (hi - lo)) / 1000;
  };

  const setMood = (next) => {
    if (!CAT_MOODS.includes(next) || next === mood) return;
    mood = next;
  };

  // One short reaction at a time; the caller also holds a cooldown so the
  // cat answers a gesture once, quietly, instead of rattling on every tap.
  const triggerReaction = (kind) => {
    if (!REACTIONS[kind] || reaction) return false;
    reaction = { kind, t: 0 };
    state.mode = kind;
    return true;
  };

  // Static pose for prefers-reduced-motion sessions: apply the mood's resting
  // lids/head once, run no per-frame animation at all.
  const applyStaticPose = () => {
    const p = MOOD_PARAMS[mood];
    eyes.left.scale.y = p.lidRest;
    eyes.right.scale.y = p.lidRest;
    headGroup.rotation.x = p.headPitch;
    ears.left.rotation.x = p.earLift;
    ears.right.rotation.x = p.earLift;
  };

  // Per-frame update. ctx.camAzimuth (radians, 0 = the room's front) lets the
  // head drift a few degrees toward the viewer — attention, not pursuit.
  const update = (dt, ctx = {}) => {
    t += dt;
    const target = MOOD_PARAMS[mood];
    const ease = Math.min(1, dt * 2.2);
    for (const k of Object.keys(live)) {
      if (k === 'blinkGapMs') {
        live.blinkGapMs = target.blinkGapMs;
      } else {
        live[k] = lerp(live[k], target[k], ease);
      }
    }

    // breath — a slow, visible rise and settle of the whole resting body
    const breathe = Math.sin(t * Math.PI * 2 * live.breathHz);
    breatheGroup.scale.y = 1 + live.breathAmp * breathe;
    breatheGroup.scale.x = 1 - live.breathAmp * 0.35 * breathe;
    breatheGroup.scale.z = 1 - live.breathAmp * 0.25 * breathe;

    // blink — scheduled by the seeded rng, shaped close → hold → open
    if (blinkT < 0 && t >= blinkAt) {
      blinkT = 0;
      state.blinks += 1;
    }
    let lid = live.lidRest;
    if (blinkT >= 0) {
      blinkT += dt;
      if (blinkT < BLINK_CLOSE) lid = lerp(live.lidRest, 0.08, blinkT / BLINK_CLOSE);
      else if (blinkT < BLINK_CLOSE + BLINK_HOLD) lid = 0.08;
      else if (blinkT < BLINK_TOTAL) lid = lerp(0.08, live.lidRest, (blinkT - BLINK_CLOSE - BLINK_HOLD) / BLINK_OPEN);
      else {
        blinkT = -1;
        scheduleBlink();
      }
    }

    // ear flick — occasional, one ear, quick out and back
    if (!earFlick && t >= earFlickAt) {
      earFlick = { side: rng() < 0.5 ? 'left' : 'right', t: 0 };
    }
    let earDelta = { left: 0, right: 0 };
    if (earFlick) {
      earFlick.t += dt;
      const k = earFlick.t / 0.16;
      if (k >= 1) {
        earFlick = null;
        earFlickAt = t + 6 + rng() * 8;
      } else {
        earDelta[earFlick.side] = Math.sin(k * Math.PI) * -0.3;
      }
    }

    // head attention — a slow wander, leaning slightly toward the camera
    const camAz = ctx.camAzimuth ?? 0;
    const toward = clamp(camAz * (mood === 'curious' ? 0.4 : 0.16), -0.34, 0.34);
    let headYaw = toward + Math.sin(t * 0.45) * live.wander * 0.5;
    let headPitch = live.headPitch + Math.sin(t * 0.3 + 1.7) * 0.012;
    let earLift = live.earLift;
    let bodyRoll = 0;

    // reaction envelope on top of idle — short, then back to rest
    if (reaction) {
      reaction.t += dt;
      const spec = REACTIONS[reaction.kind];
      const k = reaction.t / (spec.durationMs / 1000);
      if (k >= 1) {
        reaction = null;
        state.mode = 'idle';
      } else {
        const env = Math.sin(Math.min(1, k) * Math.PI); // 0 → 1 → 0
        if (reaction.kind === 'tap') {
          headPitch -= 0.11 * env; // lifts the head toward the viewer
          headYaw = lerp(headYaw, clamp(camAz * 0.5, -0.4, 0.4), env);
          earLift -= 0.14 * env;
        } else {
          lid = Math.min(lid, lerp(live.lidRest, 0.14, env)); // eyes soften shut
          headPitch += 0.09 * env; // settles down into the touch
          bodyRoll = 0.05 * env;
        }
      }
    }

    eyes.left.scale.y = lid;
    eyes.right.scale.y = lid;
    headGroup.rotation.y = headYaw;
    headGroup.rotation.x = headPitch;
    breatheGroup.rotation.z = bodyRoll;
    ears.left.rotation.x = earLift + earDelta.left;
    ears.right.rotation.x = earLift + earDelta.right;

    // tail sway — base joint leads, the next joints follow with a phase lag
    const sway = Math.sin(t * Math.PI * 2 * live.tailHz);
    tailJoints.forEach(({ joint, restY }, i) => {
      const follow = Math.sin(t * Math.PI * 2 * live.tailHz - i * 0.7);
      joint.rotation.y = restY + (i === 0 ? sway : follow) * live.tailAmp * (0.5 + i * 0.35);
    });
  };

  return {
    group,
    update,
    setMood,
    getMood: () => mood,
    triggerReaction,
    isReacting: () => reaction != null,
    applyStaticPose,
    getPose: () => ({
      breatheY: breatheGroup.scale.y,
      headPitch: headGroup.rotation.x,
      headYaw: headGroup.rotation.y,
      eyeLid: eyes.left.scale.y,
      earLeft: ears.left.rotation.x,
      earRight: ears.right.rotation.x,
      tail: tailJoints.map(({ joint }) => joint.rotation.y),
    }),
    state,
  };
}
