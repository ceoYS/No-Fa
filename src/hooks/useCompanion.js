/*
 * useCompanion — the ONE companion-behaviour authority for the living pet room (Slice 3, and the
 * Founder "make the kitten feel alive" repair). A small state machine over the approved white-
 * kitten sprites. It owns the kitten's phase, pose, floor position and facing, and it enforces the
 * behaviour PRIORITY (Founder blocker 2E):
 *
 *   USER / FEED (direct)  >  PLAY / PET  >  HUNGER REQUEST  >  CURSOR ATTENTION
 *      >  AUTONOMOUS ROAM / SLEEP  >  AMBIENT IDLE
 *
 * A user action (feed / pet / tap / play) always pre-empts hunger, attention, roam and ambient;
 * a feed sequence, once begun, is atomic (a stray tap cannot restart or double-charge it). The
 * autonomous LIFE LOOP (one scheduler, restrained randomness) keeps the room awake with real
 * poses — look-around, groom, a wake beat, lie-down, roam — and, after a longer idle, real SLEEP.
 *
 * EVERY POSE IS A REAL APPROVED SPRITE (companionAssets.js): sleep / groom / lie-down / curious /
 * look-left / begging (and the wake pose) all exist on disk. Nothing fakes a pose the art lacks.
 * Walking cycles multiple approved WALK_GAIT frames while the foot point translates across the 4:3
 * floor; left-facing is a scaleX mirror — never a static-PNG slide.
 *
 * HUNGER (Founder blocker 2D) is a bounded, DURABLE state: only the timestamps lastFedAt /
 * lastFoodRequestAt are persisted (own localStorage key) — never a half-finished animation. After
 * a real interval since the last feed the kitten may ASK for food (begging pose + a gentle bubble),
 * rate-limited so it never nags; with zero snacks it asks softly once and backs off (no impossible-
 * food loop). A successful feed charges exactly ONE snack and clears hunger.
 *
 * REDUCED MOTION: with prefers-reduced-motion, autonomous roam, cursor-follow travel and ambient
 * pose churn are suppressed and feed/hunger skip their walking approach — but feed, pet, tap,
 * cursor FACING, sleep and the food request stay functional (pose-only). Transient state (phase /
 * pose / position) is never persisted, so a reload restores the calm home-idle state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WALK_GAIT,
  WALK_MS_PER_FRAME,
  WALK_STEP_OFF,
  AMBIENT_POSES,
  WAKE_POSE,
} from '../constants/companionAssets.js';
import { CAT_HOME, FEEDER, FLOOR, clamp01, inSafeZone } from '../constants/roomV2.js';

const SPEED = 0.14; // normalized floor units / second (a calm kitten pace)
const MOVE_MIN = 0.55; // s — a short hop still reads as a step
const MOVE_MAX = 6; // s — cap so a long cross never crawls
const PET_HOLD = 2400; // ms — 쓰다듬기 reaction hold before settling
const NOTICE_MS = 650; // ms — feedNotice (perks up) before approaching
const EAT_DOWN_MS = 700;
const EAT_CHEW_MS = 1600;
const EAT_FINISH_MS = 900;

// ---- autonomous life-loop cadence (tunable, not magic numbers — Founder blocker 2B) ----
const LIFE_TICK = 3500; // ms — how often the one autonomous scheduler wakes to consider a beat
const AMBIENT_EVERY = 11000; // ms — small idle beat (~8–18s band with tick granularity): a pose
const AMBIENT_HOLD = 3400; // ms — how long a small ambient pose is held
const ROAM_EVERY = 26000; // ms — larger autonomous action (~20–45s): a restrained roam
const SLEEP_AFTER = 75000; // ms — enter real sleep after this much unbroken idle (shorter at night)
const SLEEP_AFTER_NIGHT = 32000; // ms — at night the kitten drifts off sooner (not mandatory)
const LOOK_POSES = Object.freeze(['look-left', 'curious']); // real "look-around" attention poses

// ---- cursor / attention tracking (Founder blocker 2A) ----
const ATTN_DEADZONE = 0.06; // normalized — below this the kitten does not re-face (no jitter)
const ATTN_POSE_MS = 900; // ms — how long a "noticed you" look is held before returning to idle
const ATTN_POSE_THROTTLE = 1400; // ms — min gap between attention looks (no jitter on every pixel)
const DWELL_DIST = 0.26; // normalized — the pointer must be at least this far to invite a step
const DWELL_MS = 2200; // ms — the pointer must dwell that far away this long before the kitten walks
const DWELL_COOLDOWN = 9000; // ms — min gap between cursor-invited steps (restrained, not chasing)

// ---- hunger / food request (Founder blocker 2D) — durable timestamps only ----
const HUNGER_KEY = 'nof.companion.hunger.v1';
const HUNGER_AFTER = 3 * 60 * 60 * 1000; // ms — a real interval since the last feed (3h)
const REQUEST_COOLDOWN = 30 * 60 * 1000; // ms — rate-limit: at most one food request per 30m
const HUNGER_HOLD = 6000; // ms — how long a food request is shown before settling (then backs off)
const HUNGER_LINES = Object.freeze(['배가 조금 고픈가 봐요.', '간식이 있으면 하나 줄까요?']);
const HUNGER_EMPTY_LINE = '간식이 생기면 나눠줘요.'; // zero-snack: soft, never an impossible request

// A direct tap on the kitten answers with a quick affectionate beat, cycling a few approved
// reaction poses so repeated taps don't read as one canned frame. All real still-image swaps.
const TAP_POSES = Object.freeze(['happy', 'greeting', 'surprise', 'curious']);
const TAP_HOLD = 1000; // ms — the tap reaction hold before settling
const POUNCE_MS = 620; // ms — the pounce on reaching the toy
const PLAY_HOLD = 1000; // ms — the play pose held after the pounce

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isNight(now = Date.now()) {
  const h = new Date(now).getHours();
  return h >= 22 || h < 6;
}

// Durable hunger timestamps ONLY (never animation state). Missing/broken storage → fresh zeros.
function loadHunger() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { lastFedAt: 0, lastFoodRequestAt: 0 };
    const raw = window.localStorage.getItem(HUNGER_KEY);
    if (!raw) return { lastFedAt: 0, lastFoodRequestAt: 0 };
    const p = JSON.parse(raw);
    return {
      lastFedAt: Number(p?.lastFedAt) || 0,
      lastFoodRequestAt: Number(p?.lastFoodRequestAt) || 0,
    };
  } catch {
    return { lastFedAt: 0, lastFoodRequestAt: 0 };
  }
}

// A safe floor destination for a roam: inside the walkable band and clear of every safe zone
// (feeder / cat home / den) and any placed decor, a sensible step from the current spot.
function pickRoamTarget(from, occupied = [], rnd = Math.random) {
  for (let i = 0; i < 24; i += 1) {
    const x = FLOOR.xMin + rnd() * (FLOOR.xMax - FLOOR.xMin);
    const y = FLOOR.yMin + rnd() * (FLOOR.yMax - FLOOR.yMin);
    if (inSafeZone(x, y)) continue;
    if (occupied.some((o) => Math.hypot(x - o.x, y - o.y) < 0.1)) continue;
    if (dist({ x, y }, from) < 0.14) continue; // avoid a jittery micro-step
    return { x, y };
  }
  return null;
}

export function useCompanion({ getSnackCount, onConsumeSnack, occupied = [], seam = null } = {}) {
  const [pos, setPos] = useState(CAT_HOME);
  const [facing, setFacing] = useState(1);
  const [pose, setPose] = useState('idle');
  const [phase, setPhase] = useState('idle');
  const [moving, setMoving] = useState(false);
  const [moveDur, setMoveDur] = useState(0);
  const [feederFull, setFeederFull] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [toy, setToy] = useState(null); // {x,y} normalized play target the cat is chasing (view renders a marker)
  const [requestMsg, setRequestMsg] = useState(null); // food-request bubble copy (null = none)
  const tapIdx = useRef(0);
  const hungerLineIdx = useRef(0);

  // Refs that timers/intervals read so they never act on stale state.
  const phaseRef = useRef('idle');
  const posRef = useRef(CAT_HOME);
  const reducedRef = useRef(false);
  const visibleRef = useRef(true);
  const timers = useRef([]);
  const frameTimer = useRef(null);
  const occupiedRef = useRef(occupied);
  occupiedRef.current = occupied;
  // Live refs to the host callbacks so timer/effect closures (which may be captured on an earlier
  // render — e.g. forceHunger and the life-loop) always read the CURRENT snack count, never a
  // stale one. (feed() reads them via its own deps, which refresh every render.)
  const snackFnRef = useRef(getSnackCount);
  snackFnRef.current = getSnackCount;

  // Idle-loop bookkeeping (Founder blocker 2B/2C).
  const idleSinceRef = useRef(Date.now());
  const lastAmbientRef = useRef(0);
  const lastRoamRef = useRef(0);
  // Cursor attention bookkeeping (Founder blocker 2A).
  const attnRef = useRef({ x: CAT_HOME.x, t: 0 });
  const attnFarSinceRef = useRef(0);
  const lastAttnPoseRef = useRef(0);
  const lastDwellRef = useRef(0);
  const attnPoseTimer = useRef(null);
  // Durable hunger timestamps (Founder blocker 2D) — persisted, mirrored in refs.
  const hungerRef = useRef(loadHunger());

  const setPhaseBoth = (p) => {
    phaseRef.current = p;
    if (p === 'idle') idleSinceRef.current = Date.now();
    setPhase(p);
  };
  const at = (p) => {
    posRef.current = p;
    setPos(p);
  };
  const track = (id) => {
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (frameTimer.current) {
      clearInterval(frameTimer.current);
      frameTimer.current = null;
    }
  };
  const persistHunger = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      // ONLY durable timestamps — never phase/pose/position.
      window.localStorage.setItem(HUNGER_KEY, JSON.stringify(hungerRef.current));
    } catch {
      /* full / disabled / private mode — skip, never throw */
    }
  };

  // Live prefers-reduced-motion + tab-visibility (both re-read on change).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncR = () => {
      reducedRef.current = mq.matches;
    };
    const syncV = () => {
      visibleRef.current = document.visibilityState === 'visible';
    };
    syncR();
    syncV();
    mq.addEventListener?.('change', syncR);
    document.addEventListener('visibilitychange', syncV);
    return () => {
      mq.removeEventListener?.('change', syncR);
      document.removeEventListener('visibilitychange', syncV);
    };
  }, []);

  // Cleanup on unmount — nothing transient is persisted, so a remount is a fresh calm idle.
  useEffect(() => () => clearTimers(), []);

  // First-ever open: baseline the feed clock to now so hunger only comes after a REAL interval —
  // a brand-new kitten (no stored lastFedAt) must not read as "starving" the instant you arrive.
  useEffect(() => {
    if (!hungerRef.current.lastFedAt) {
      hungerRef.current = { ...hungerRef.current, lastFedAt: Date.now() };
      persistHunger();
    }
  }, []);

  const cycleFrames = () => {
    if (frameTimer.current) clearInterval(frameTimer.current);
    let i = 0;
    setPose(WALK_GAIT[0]);
    frameTimer.current = setInterval(() => {
      i = (i + 1) % WALK_GAIT.length;
      setPose(WALK_GAIT[i]);
    }, WALK_MS_PER_FRAME);
  };
  const stopFrames = () => {
    if (frameTimer.current) {
      clearInterval(frameTimer.current);
      frameTimer.current = null;
    }
  };

  // Walk the kitten to a target foot point, cycling the gait frames while the view interpolates
  // the translation, then run onArrive. Under reduced motion it jumps (no travel) but still calls
  // onArrive, so feed / hunger / return stay functional without autonomous travel.
  const walkTo = (target, onArrive) => {
    const t = { x: clamp01(target.x), y: clamp01(target.y) };
    if (Math.abs(t.x - posRef.current.x) > 0.001) setFacing(t.x >= posRef.current.x ? 1 : -1);
    if (reducedRef.current) {
      setMoving(false);
      setMoveDur(0);
      at(t);
      setPose('idle');
      onArrive?.();
      return;
    }
    const d = dist(t, posRef.current);
    const dur = Math.max(MOVE_MIN, Math.min(MOVE_MAX, d / SPEED)) * (seam?.moveScale ?? 1);
    setPose(WALK_STEP_OFF);
    setMoveDur(dur);
    setMoving(true);
    at(t);
    cycleFrames();
    track(
      setTimeout(() => {
        stopFrames();
        setMoving(false);
        setPose('idle');
        onArrive?.();
      }, dur * 1000),
    );
  };

  const settleIdle = () => {
    stopFrames();
    if (attnPoseTimer.current) {
      clearTimeout(attnPoseTimer.current);
      attnPoseTimer.current = null;
    }
    setMoving(false);
    setHearts(false);
    setToy(null);
    setRequestMsg(null);
    setPose('idle');
    setPhaseBoth('idle');
  };

  // A sleeping kitten is woken gently (a wake pose, then settle) — used before any direct action
  // that lands on a sleeping cat (tap / feed). Returns true if it actually woke one.
  const wakeGently = () => {
    if (phaseRef.current !== 'sleep') return false;
    clearTimers();
    stopFrames();
    setPhaseBoth('wake');
    setPose(WAKE_POSE);
    return true;
  };

  // ---- USER: 쓰다듬기 (pet) — interrupts hunger/attention/roam/ambient, never auto-fires. ----
  const pet = useCallback(() => {
    if (phaseRef.current.startsWith('feed')) return; // a feed sequence is atomic
    wakeGently();
    clearTimers();
    stopFrames();
    setMoving(false);
    setRequestMsg(null);
    setPhaseBoth('pet');
    setPose('pet');
    setHearts(true);
    track(
      setTimeout(() => {
        setHearts(false);
        setPose('happy');
        track(setTimeout(settleIdle, 500));
      }, PET_HOLD),
    );
  }, []);

  // ---- USER: tap the kitten — a quick affectionate beat (interrupts hunger/attention/roam/
  // ambient/play, never a feed). A tap also gently WAKES a sleeping kitten. Cycles a few approved
  // reaction poses + hearts, then settles. Repeatable and light. ----
  const tap = useCallback(() => {
    if (phaseRef.current.startsWith('feed')) return; // a feed sequence is atomic
    const woke = phaseRef.current === 'sleep';
    clearTimers();
    stopFrames();
    setMoving(false);
    setToy(null);
    setRequestMsg(null);
    setPhaseBoth('greet');
    // Waking from sleep is a softer beat (the wake pose), not the surprise cycle.
    setPose(woke ? WAKE_POSE : TAP_POSES[tapIdx.current % TAP_POSES.length]);
    tapIdx.current += 1;
    setHearts(true);
    track(
      setTimeout(() => {
        setHearts(false);
        setPose('happy');
        track(setTimeout(settleIdle, 400));
      }, TAP_HOLD),
    );
  }, []);

  // ---- USER: 놀아주기 (toy chase) — drop a toy on a safe floor spot and the kitten really WALKS
  // to it (gait frames + translation), pounces, plays, then settles. Interrupts hunger/attention/
  // roam/ambient, never a feed; returns the chosen target (or null) so the view can mark it. ----
  const playChase = useCallback(
    (target) => {
      if (phaseRef.current.startsWith('feed')) return null; // never interrupt a feed
      wakeGently();
      const t =
        target && Number.isFinite(target.x) && Number.isFinite(target.y)
          ? { x: clamp01(target.x), y: clamp01(target.y) }
          : pickRoamTarget(posRef.current, occupiedRef.current, seam?.rnd ?? Math.random);
      if (!t) return null;
      clearTimers();
      setHearts(false);
      setRequestMsg(null);
      setToy(t);
      setPhaseBoth('play');
      walkTo(t, () => {
        setPose('pounce');
        track(
          setTimeout(() => {
            setPose('play-yarn');
            track(setTimeout(settleIdle, PLAY_HOLD));
          }, POUNCE_MS),
        );
      });
      return t;
    },
    [seam],
  );

  // ---- USER: 간식 (feed) — eligibility → notice → approach feeder → down/chew/finish → idle.
  // Inventory is charged EXACTLY ONCE, at the start; a re-tap while feeding is ignored (no
  // double-start, no double-charge). Zero inventory never begins the approach. A feed clears the
  // hunger state and stamps lastFedAt (durable). ----
  const feed = useCallback(() => {
    if (phaseRef.current.startsWith('feed')) return false; // already feeding — no double-start
    if ((getSnackCount?.() ?? 0) <= 0) return false; // true zero: no fake approach, no charge
    onConsumeSnack?.(); // charge the one snack, exactly once
    wakeGently();
    clearTimers();
    stopFrames();
    setRequestMsg(null);
    // Durable: a real feed resets the hunger clock so the kitten won't ask again for a while.
    hungerRef.current = { ...hungerRef.current, lastFedAt: Date.now() };
    persistHunger();
    setPhaseBoth('feedNotice');
    setPose('greeting');
    setFeederFull(true); // food appears in the bowl (feeder-empty → feeder-full)
    const beginEat = () => {
      setPhaseBoth('feedEat');
      setPose('feed-down');
      track(
        setTimeout(() => {
          setPose('feed-chew');
          track(
            setTimeout(() => {
              setPhaseBoth('feedFinish');
              setPose('feed-finish');
              setFeederFull(false); // the food is gone (bowl back to empty)
              track(setTimeout(settleIdle, EAT_FINISH_MS));
            }, EAT_CHEW_MS),
          );
        }, EAT_DOWN_MS),
      );
    };
    track(
      setTimeout(() => {
        setPhaseBoth('feedApproach');
        walkTo(FEEDER, beginEat); // reduced-motion: walkTo jumps, then eats — still functional
      }, NOTICE_MS),
    );
    return true;
  }, [getSnackCount, onConsumeSnack]);

  // ---- CURSOR ATTENTION (Founder blocker 2A) — the kitten notices where the pointer/touch is.
  // Facing follows the pointer's x (outside a dead-zone, so no jitter); a throttled "look" pose
  // shows it noticed. Only from idle/ambient — never overrides a user action, feed, hunger, sleep
  // or a walk. Under reduced motion the FACING still flips (pose-only), but the dwell-walk (below,
  // in the life loop) is suppressed. Pass a normalized x in [0,1]. ----
  const attend = useCallback((nx) => {
    if (typeof nx !== 'number' || Number.isNaN(nx)) return;
    const x = clamp01(nx);
    const now = Date.now();
    attnRef.current = { x, t: now };
    const ph = phaseRef.current;
    // Facing/attention tracks from idle, an ambient beat, or an in-progress attend look — but
    // never overrides a higher-priority state (feed / play / pet / hunger / sleep / walk).
    if (ph !== 'idle' && ph !== 'ambient' && ph !== 'attend') return;
    if (!visibleRef.current) return;
    const dx = x - posRef.current.x;
    // Dwell bookkeeping: remember since when the pointer has been meaningfully far away.
    if (Math.abs(dx) > DWELL_DIST) {
      if (!attnFarSinceRef.current) attnFarSinceRef.current = now;
    } else {
      attnFarSinceRef.current = 0;
    }
    if (Math.abs(dx) <= ATTN_DEADZONE) return; // inside the dead-zone: do not re-face (no jitter)
    setFacing(dx >= 0 ? 1 : -1);
    // A light, throttled "noticed you" look (real look-left / curious poses), pose-only so it is
    // safe under reduced motion; reverts to idle shortly after.
    if (ph === 'idle' && now - lastAttnPoseRef.current > ATTN_POSE_THROTTLE) {
      lastAttnPoseRef.current = now;
      setPhaseBoth('attend');
      setPose(dx < 0 ? 'look-left' : LOOK_POSES[1]);
      if (attnPoseTimer.current) clearTimeout(attnPoseTimer.current);
      attnPoseTimer.current = setTimeout(() => {
        attnPoseTimer.current = null;
        if (phaseRef.current === 'attend') {
          setPose('idle');
          setPhaseBoth('idle');
        }
      }, ATTN_POSE_MS);
    }
  }, []);

  // ---- HUNGER / FOOD REQUEST (Founder blocker 2D) — a bounded, rate-limited ask. Only fires from
  // idle. With snacks: begging pose near the feeder + a gentle bubble ("간식이 있으면 하나 줄까요?").
  // With zero snacks: a soft curious look + a non-demanding line, then it backs off (never loops an
  // impossible request). Either way lastFoodRequestAt is stamped so it cannot nag. ----
  const enterHunger = () => {
    const snack = snackFnRef.current?.() ?? 0; // fresh count even from a captured caller
    clearTimers();
    stopFrames();
    setMoving(false);
    setToy(null);
    setHearts(false);
    hungerRef.current = { ...hungerRef.current, lastFoodRequestAt: Date.now() };
    persistHunger();
    setPhaseBoth('hungry');
    if (snack > 0) {
      const line = HUNGER_LINES[hungerLineIdx.current % HUNGER_LINES.length];
      hungerLineIdx.current += 1;
      setRequestMsg(line);
      // Sit NEAR the feeder (never on it) and beg, facing the bowl.
      const near = { x: clamp01(FEEDER.x - 0.15), y: FEEDER.y };
      walkTo(near, () => {
        setFacing(FEEDER.x >= posRef.current.x ? 1 : -1);
        setPose('begging');
      });
    } else {
      // No snacks: do NOT march to the feeder expectantly — a soft look + gentle copy only.
      setRequestMsg(HUNGER_EMPTY_LINE);
      setPose('curious');
    }
    track(
      setTimeout(() => {
        if (phaseRef.current === 'hungry') settleIdle();
      }, HUNGER_HOLD),
    );
  };

  const hungerAfter = () => seam?.hungerAfterMs ?? HUNGER_AFTER;
  const requestCooldown = () => seam?.requestCooldownMs ?? REQUEST_COOLDOWN;
  const hungerEligible = (now) => {
    const { lastFedAt, lastFoodRequestAt } = hungerRef.current;
    const sinceFed = now - (lastFedAt || 0);
    const sinceReq = now - (lastFoodRequestAt || 0);
    return sinceFed >= hungerAfter() && sinceReq >= requestCooldown();
  };

  // ---- AUTONOMOUS: roam — restrained, safe, cancels on any user action, no XP/League. ----
  const roamNow = useCallback(() => {
    if (phaseRef.current !== 'idle') return false;
    if (reducedRef.current || !visibleRef.current) return false;
    const target = pickRoamTarget(posRef.current, occupiedRef.current, seam?.rnd ?? Math.random);
    if (!target) return false;
    setPhaseBoth('walk');
    walkTo(target, settleIdle);
    return true;
  }, [seam]);

  const enterSleep = () => {
    clearTimers();
    stopFrames();
    setMoving(false);
    setToy(null);
    setHearts(false);
    setRequestMsg(null);
    setPhaseBoth('sleep');
    setPose('sleep'); // real approved sleep sprite; motion stops, blink is off (pose !== idle)
  };

  const ambientBeat = () => {
    const rnd = seam?.rnd ?? Math.random;
    const p = AMBIENT_POSES[Math.floor(rnd() * AMBIENT_POSES.length)];
    setPhaseBoth('ambient');
    setPose(p);
    track(
      setTimeout(() => {
        if (phaseRef.current === 'ambient') settleIdle();
      }, AMBIENT_HOLD),
    );
  };

  const lookAround = () => {
    const rnd = seam?.rnd ?? Math.random;
    setPhaseBoth('ambient');
    setPose(LOOK_POSES[Math.floor(rnd() * LOOK_POSES.length)]);
    track(
      setTimeout(() => {
        if (phaseRef.current === 'ambient') settleIdle();
      }, 1600),
    );
  };

  // ONE autonomous scheduler (Founder blocker 2B): a single tick that, only while idle, decides
  // the next living beat by PRIORITY — hunger first, then cursor-invited approach, then sleep after
  // a long idle, then a restrained roam, then a small ambient/look beat. Never fires during a user
  // action, feed, play, sleep-in-progress, etc. Never grants XP or League score.
  useEffect(() => {
    const tickMs = seam?.lifeTickMs ?? LIFE_TICK;
    const id = setInterval(() => {
      if (!visibleRef.current) return;
      if (phaseRef.current !== 'idle') return;
      const now = Date.now();

      // 1) HUNGER REQUEST (above cursor attention + autonomous).
      if (hungerEligible(now)) {
        enterHunger();
        return;
      }

      // Under reduced motion nothing autonomous that TRAVELS runs (no roam, no cursor-walk, no
      // ambient churn); the kitten still rests calmly (blink loop lives in the view).
      if (reducedRef.current) return;

      // 2) CURSOR ATTENTION dwell → step closer (restrained: only after a real dwell far away).
      const attn = attnRef.current;
      const pointerFresh = now - attn.t < 4000; // only react to a currently-present pointer
      if (
        pointerFresh &&
        attnFarSinceRef.current &&
        now - attnFarSinceRef.current > DWELL_MS &&
        now - lastDwellRef.current > DWELL_COOLDOWN
      ) {
        lastDwellRef.current = now;
        attnFarSinceRef.current = 0;
        const tx = clamp01(Math.max(FLOOR.xMin, Math.min(FLOOR.xMax, attn.x)));
        const target = { x: tx, y: posRef.current.y };
        if (Math.abs(target.x - posRef.current.x) > 0.05 && !inSafeZone(target.x, target.y)) {
          setPhaseBoth('walk');
          walkTo(target, settleIdle);
          return;
        }
      }

      // 3) SLEEP after a longer unbroken idle (sooner at night; never mandatory).
      const idleFor = now - idleSinceRef.current;
      const sleepAfter = seam?.sleepAfterMs ?? (isNight(now) ? SLEEP_AFTER_NIGHT : SLEEP_AFTER);
      if (idleFor > sleepAfter) {
        enterSleep();
        return;
      }

      // 4) restrained ROAM (larger action).
      const rnd = seam?.rnd ?? Math.random;
      const roamEvery = seam?.roamEveryMs ?? ROAM_EVERY;
      if (now - lastRoamRef.current > roamEvery && rnd() < 0.7) {
        lastRoamRef.current = now;
        lastAmbientRef.current = now; // a roam also counts as a beat
        roamNow();
        return;
      }

      // 5) small AMBIENT / look-around beat.
      if (now - lastAmbientRef.current > AMBIENT_EVERY) {
        lastAmbientRef.current = now;
        if (rnd() < 0.5) lookAround();
        else ambientBeat();
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [roamNow, seam]);

  // ---- Deterministic QA seams (Founder: "do not wait hours to test hunger/sleep"). Only meant to
  // be driven by the accelerated ?roomqa=1 harness; they are ordinary methods, safe in production
  // (they simply force a real state now). forceHunger clears the cooldown first so it always fires.
  const forceHunger = useCallback(() => {
    if (phaseRef.current.startsWith('feed')) return false;
    hungerRef.current = { lastFedAt: 0, lastFoodRequestAt: 0 };
    enterHunger();
    return true;
  }, []);
  const forceSleep = useCallback(() => {
    if (phaseRef.current.startsWith('feed')) return false;
    enterSleep();
    return true;
  }, []);

  return {
    pos,
    facing,
    pose,
    phase,
    moving,
    moveDur,
    feederFull,
    hearts,
    toy,
    requestMsg,
    sleeping: phase === 'sleep',
    feed,
    pet,
    tap,
    playChase,
    attend,
    wake: wakeGently,
    roamNow,
    forceHunger,
    forceSleep,
  };
}
