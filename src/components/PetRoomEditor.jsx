import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CatFigure } from './EmberCat.jsx';
import {
  CANONICAL_BLINK_MOTION,
  CANONICAL_LAYERED,
  isItemSpriteReady,
  resolveItemAsset,
  resolvePetStageRoomAsset,
  petStageArtReady,
  petStageLayeredCandidateReady,
  petStageLayeredReady,
  resolveCanonicalPlate,
  resolveCanonicalKitten,
  resolveCanonicalShadow,
  shouldUsePetSceneMode,
} from '../constants/petAssets.js';
import { ITEM_BY_ID } from '../constants/roomItems.js';

/*
 * PetRoomEditor — the draggable room stage (PRD §0.6.9), asset-first.
 *
 * Visuals: the room background, the cat and every decor token come from approved
 * art (petAssets.js). Art-pending mode: while the room background or cat art is
 * missing the stage shows ONE clean pending panel — not a skeleton cat stacked
 * with dashed decor slots (that reads as a broken editor). Current non-alpha
 * art uses scene mode: one finished room image, no pasted cat/item overlays.
 * Decor drag/rendering is enabled only after an item is marked spriteReady.
 *
 * Placement is coordinate-based: every decor token sits at a normalized (x, y)
 * inside the stage. Drag works for mouse + touch through the Pointer Events API;
 * the stage sets `touch-action: none` so a drag never scrolls the page. Two drag
 * sources share one controller:
 *   - move: pointerdown on a placed token (a short press with no travel = select)
 *   - place: the 보관함 calls beginPlaceDrag(item, event) via the editor ref
 * On pointerup the pointer is hit-tested against the live stage rect; inside →
 * coords are normalized + clamped and committed, outside → place cancels and
 * move snaps back in.
 */

const PAD = 0.08; // keep token centers inside the stage edges
const TAP_SLOP = 6; // px of travel under which a press counts as a tap (select)
const LOOPBACK_HOSTNAMES = Object.freeze([
  'localhost',
  '127.0.0.1',
  '::1',
]);
const LAYERED_PRELOAD_URLS = Object.freeze([
  '/assets/rooms/ember_room_canonical_clean.png',
  '/assets/pets/white_kitten_idle_alpha.png',
]);

const clamp01 = (v) => Math.min(1 - PAD, Math.max(PAD, v));

function normalizeLoopbackHostname(hostname) {
  return hostname === '[::1]' ? '::1' : hostname;
}

function readLayeredCandidateRequest() {
  if (typeof window === 'undefined') return false;
  const queryRequested = new URLSearchParams(window.location.search).get('kitten') === '1';
  let storedRequested = false;
  try {
    storedRequested = window.localStorage.getItem('nof.kittenLayered') === '1';
  } catch {
    storedRequested = false;
  }
  return queryRequested || storedRequested;
}

const PetRoomEditor = forwardRef(function PetRoomEditor(
  {
    theme = 'empty',
    placements = [],
    tone = 'bright',
    editable = true,
    selectedId = null,
    catMotion = 'idle',
    onSelect,
    onMove,
    onPlaceAt,
    onCatTap,
    label,
    sceneMode,
    reacting = false,
  },
  ref,
) {
  const stageRef = useRef(null);
  const dragRef = useRef(null); // { mode, item, startX, startY, moved }
  const [ghost, setGhost] = useState(null); // { src, x, y } in client px
  const [preloadState, setPreloadState] = useState('idle');
  const preloadRunRef = useRef(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'visible',
  );
  const [blinkReady, setBlinkReady] = useState(false);
  const [blinkUnavailable, setBlinkUnavailable] = useState(false);
  const [blinkActive, setBlinkActive] = useState(false);
  const blinkPreloadRunRef = useRef(0);
  const blinkStartTimerRef = useRef(null);
  const blinkEndTimerRef = useRef(null);
  const resolvedSceneMode = sceneMode ?? shouldUsePetSceneMode({ catState: catMotion });
  const browserEnvironment = typeof window !== 'undefined';
  const browserHostname = browserEnvironment
    ? normalizeLoopbackHostname(window.location.hostname)
    : '';
  const candidateRequested = readLayeredCandidateRequest();
  const loopbackReviewOrigin =
    browserEnvironment && LOOPBACK_HOSTNAMES.includes(browserHostname);
  const candidateAuthorized =
    browserEnvironment && loopbackReviewOrigin && candidateRequested;
  const qaLayeredAuthorized =
    resolvedSceneMode && candidateAuthorized && petStageLayeredCandidateReady();
  const productionLayeredAuthorized =
    resolvedSceneMode && petStageLayeredReady();
  const layeredPreloadAuthorized =
    qaLayeredAuthorized || productionLayeredAuthorized;
  const useLayered =
    layeredPreloadAuthorized && preloadState === 'ready';
  const layeredIndicator = productionLayeredAuthorized
    ? 'production'
    : qaLayeredAuthorized
      ? 'candidate'
      : undefined;

  useEffect(() => {
    const images = [];
    const myRun = ++preloadRunRef.current;
    let completed = 0;
    let failed = false;
    let cancelled = false;

    const stale = () => cancelled || myRun !== preloadRunRef.current;

    const cleanup = () => {
      ++preloadRunRef.current;
      cancelled = true;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
        image.src = '';
      }
    };

    if (!layeredPreloadAuthorized) {
      setPreloadState('idle');
      return cleanup;
    }

    setPreloadState('preloading');

    const fail = () => {
      if (stale() || failed) return;
      failed = true;
      setPreloadState('failed');
    };

    const completeOne = () => {
      if (stale() || failed) return;
      completed += 1;
      if (completed === LAYERED_PRELOAD_URLS.length) setPreloadState('ready');
    };

    for (const url of LAYERED_PRELOAD_URLS) {
      const image = new Image();
      images.push(image);
      image.onerror = fail;
      image.onload = async () => {
        if (stale() || failed) return;
        try {
          if (typeof image.decode === 'function') await image.decode();
        } catch {
          fail();
          return;
        }
        if (stale() || failed) return;
        completeOne();
      };
      image.src = url;
    }

    return cleanup;
  }, [layeredPreloadAuthorized]);

  useEffect(function watchCanonicalBlinkMotionPreference() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setMotionAllowed(false);
      return undefined;
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const syncMotionPreference = () => setMotionAllowed(motionQuery.matches);
    syncMotionPreference();

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', syncMotionPreference);
      return () => motionQuery.removeEventListener('change', syncMotionPreference);
    }

    motionQuery.addListener(syncMotionPreference);
    return () => motionQuery.removeListener(syncMotionPreference);
  }, []);

  useEffect(function watchCanonicalBlinkVisibility() {
    if (typeof document === 'undefined') {
      setDocumentVisible(false);
      return undefined;
    }

    const syncVisibility = () => setDocumentVisible(document.visibilityState === 'visible');
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(function resetCanonicalBlinkMount() {
    if (useLayered) return undefined;
    setBlinkReady(false);
    setBlinkUnavailable(false);
    setBlinkActive(false);
    return undefined;
  }, [useLayered]);

  useEffect(function preloadCanonicalBlink() {
    const myRun = ++blinkPreloadRunRef.current;
    let image = null;
    let cancelled = false;
    let failed = false;

    const stale = () => cancelled || myRun !== blinkPreloadRunRef.current;
    const cleanup = () => {
      ++blinkPreloadRunRef.current;
      cancelled = true;
      if (image) {
        image.onload = null;
        image.onerror = null;
        image.src = '';
      }
    };

    if (
      !useLayered
      || !CANONICAL_LAYERED.blink.present
      || !motionAllowed
      || !documentVisible
      || blinkReady
      || blinkUnavailable
    ) {
      return cleanup;
    }

    const failBlink = () => {
      if (stale() || failed) return;
      failed = true;
      setBlinkReady(false);
      setBlinkUnavailable(true);
      setBlinkActive(false);
    };

    image = new Image();
    image.onerror = failBlink;
    image.onload = async () => {
      if (stale() || failed) return;
      try {
        if (typeof image.decode === 'function') await image.decode();
      } catch {
        failBlink();
        return;
      }
      if (stale() || failed) return;
      setBlinkReady(true);
    };
    image.src = CANONICAL_LAYERED.blink.path;

    return cleanup;
  }, [useLayered, motionAllowed, documentVisible, blinkReady, blinkUnavailable]);

  useEffect(function scheduleCanonicalBlink() {
    let cancelled = false;
    let cadenceIndex = 0;

    const clearOwnedTimers = () => {
      if (blinkStartTimerRef.current !== null) {
        clearTimeout(blinkStartTimerRef.current);
        blinkStartTimerRef.current = null;
      }
      if (blinkEndTimerRef.current !== null) {
        clearTimeout(blinkEndTimerRef.current);
        blinkEndTimerRef.current = null;
      }
    };

    const eligible =
      useLayered
      && blinkReady
      && !blinkUnavailable
      && motionAllowed
      && documentVisible;

    if (!eligible) {
      clearOwnedTimers();
      setBlinkActive(false);
      return clearOwnedTimers;
    }

    const scheduleStart = (delayMs) => {
      blinkStartTimerRef.current = setTimeout(() => {
        blinkStartTimerRef.current = null;
        if (cancelled) return;
        setBlinkActive(true);
        blinkEndTimerRef.current = setTimeout(() => {
          blinkEndTimerRef.current = null;
          if (cancelled) return;
          setBlinkActive(false);
          const nextDelay = CANONICAL_BLINK_MOTION.intervalsMs[cadenceIndex];
          cadenceIndex = (cadenceIndex + 1) % CANONICAL_BLINK_MOTION.intervalsMs.length;
          scheduleStart(nextDelay);
        }, CANONICAL_BLINK_MOTION.durationMs);
      }, delayMs);
    };

    scheduleStart(CANONICAL_BLINK_MOTION.initialDelayMs);

    return () => {
      cancelled = true;
      clearOwnedTimers();
      setBlinkActive(false);
    };
  }, [useLayered, blinkReady, blinkUnavailable, motionAllowed, documentVisible]);

  const normalizeFromClient = (clientX, clientY) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const inside =
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    return {
      inside,
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    };
  };

  const endDrag = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', endDrag);
    setGhost(null);
    if (!drag) return;

    // A press that never traveled is a tap → toggle selection, leave position.
    if (drag.mode === 'move' && !drag.moved) {
      onSelect?.(selectedId === drag.item.id ? null : drag.item.id);
      return;
    }
    const pos = normalizeFromClient(e.clientX, e.clientY);
    if (!pos) return;
    if (drag.mode === 'place') {
      if (pos.inside) onPlaceAt?.(drag.item.id, pos.x, pos.y);
      return; // dropped outside → stays in 보관함
    }
    // move: always land inside (clamped), never falls off the stage
    onMove?.(drag.item.id, pos.x, pos.y);
  };

  const handleMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_SLOP) drag.moved = true;
    setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
  };

  const beginDrag = (mode, item, e) => {
    if (resolvedSceneMode || !isItemSpriteReady(item.assetId)) return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode, item, startX: e.clientX, startY: e.clientY, moved: false };
    setGhost({ src: resolveItemAsset(item.assetId), x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', endDrag);
  };

  // Inventory thumbs start a place-drag through this handle. An item with no
  // approved art is not placeable yet — never start a drag for an invisible token.
  useImperativeHandle(ref, () => ({
    beginPlaceDrag: (item, e) => {
      if (resolvedSceneMode || !isItemSpriteReady(item.assetId)) return;
      beginDrag('place', item, e);
    },
  }));

  const roomSrc = resolvePetStageRoomAsset({ theme, sceneMode: resolvedSceneMode });
  const artReady = petStageArtReady({ theme, catState: catMotion, sceneMode: resolvedSceneMode });
  const plateSrc = useLayered ? resolveCanonicalPlate() : null;
  const idleKittenSrc = useLayered ? resolveCanonicalKitten('idle') : null;
  const blinkKittenSrc = useLayered ? resolveCanonicalKitten('blink') : null;
  const showCanonicalBlink =
    useLayered
    && blinkReady
    && !blinkUnavailable
    && motionAllowed
    && documentVisible
    && blinkActive;
  const kittenSrc = showCanonicalBlink ? blinkKittenSrc : idleKittenSrc;
  const canonicalKittenClassName = [
    'canonical-kitten-layer',
    useLayered
      && motionAllowed
      && documentVisible
      && 'canonical-kitten-layer--breathing',
  ]
    .filter(Boolean)
    .join(' ');
  const shadowSrc = useLayered ? resolveCanonicalShadow() : null;
  const handleLayeredImageError = () => setPreloadState('failed');
  const handleCanonicalKittenError = () => {
    if (showCanonicalBlink) {
      setBlinkUnavailable(true);
      setBlinkReady(false);
      setBlinkActive(false);
      return;
    }
    setPreloadState('failed');
  };
  const stageClass = [
    'pet-stage',
    'pet-room',
    'pet-room--editor',
    resolvedSceneMode && 'pet-room--scene',
    resolvedSceneMode && reacting && 'pet-room--scene-reacting',
    !artReady && 'pet-room--pending',
    tone === 'dim' && 'pet-stage--dim',
    tone === 'bright' && 'pet-stage--bright',
  ]
    .filter(Boolean)
    .join(' ');

  // Only decor with approved art is drawn — a missing item is absent, never a
  // dashed pending slot inside the stage.
  const ordered = [...placements]
    .filter((p) => ITEM_BY_ID[p.itemId] && isItemSpriteReady(ITEM_BY_ID[p.itemId].assetId))
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  // Pointer/tilt parallax — nudge the plate, depth layers and items by different
  // amounts so a single flat image reads as 2.5D. Writes CSS vars straight to the
  // node (no re-render); prefers-reduced-motion zeroes the offsets in CSS.
  const handleParallax = (e) => {
    if (!resolvedSceneMode) return;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    el.style.setProperty('--par-x', nx.toFixed(3));
    el.style.setProperty('--par-y', ny.toFixed(3));
  };
  const resetParallax = () => {
    const el = stageRef.current;
    if (!el) return;
    el.style.setProperty('--par-x', '0');
    el.style.setProperty('--par-y', '0');
  };

  return (
    <>
      <div
        ref={stageRef}
        className={stageClass}
        data-theme={theme}
        data-layered={useLayered ? layeredIndicator : undefined}
        role="group"
        aria-label={label ?? '고양이 방 편집'}
        onPointerMove={handleParallax}
        onPointerLeave={resetParallax}
      >
        {artReady ? (
          <>
            {useLayered ? (
              <>
                {/* A2 layered scene: matched clean plate + optional contact
                    shadow + canonical kitten cutout, authored to ONE framing so
                    they stack pixel-aligned and share the plate's static parallax. */}
                <img
                  className="room-img"
                  src={plateSrc}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={handleLayeredImageError}
                />
                {shadowSrc ? (
                  <img
                    className="canonical-kitten-shadow"
                    src={shadowSrc}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <img
                  className={canonicalKittenClassName}
                  src={kittenSrc}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  onError={handleCanonicalKittenError}
                />
              </>
            ) : (
              <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" />
            )}
            {resolvedSceneMode ? (
              <>
                {/* Depth + ambient light over the finished scene. The scene is already
                    a fully-decorated composite, so nothing is overlaid on it — the
                    2.5D feel comes purely from lighting, vignette and parallax. */}
                <div className="scene-depth" aria-hidden="true" />
                <div className="scene-glow" aria-hidden="true" />
                {onCatTap ? (
                  <button
                    type="button"
                    className="pet-room-scene-tap"
                    onClick={onCatTap}
                    aria-label="고양이 방 쓰다듬기"
                  />
                ) : null}
              </>
            ) : (
              <>
                <div className="pet-stage-floor" />

                <CatFigure motionState={catMotion} label="잔불 곁의 흰 고양이" />
                {onCatTap ? (
                  <button type="button" className="pet-cat-tap" onClick={onCatTap} aria-label="고양이 쓰다듬기" />
                ) : null}

                {ordered.map((p) => {
                  const item = ITEM_BY_ID[p.itemId];
                  return (
                    <RoomToken
                      key={p.itemId}
                      item={item}
                      placement={p}
                      selected={selectedId === p.itemId}
                      interactive={editable}
                      onPointerDown={(e) => beginDrag('move', item, e)}
                    />
                  );
                })}

                <div className={tone === 'dim' ? 'pet-ember pet-ember--low' : 'pet-ember'} />
              </>
            )}
          </>
        ) : (
          <div className="pet-room-pending-panel">
            <span className="pet-room-pending-title">고양이 방 아트 적용 전</span>
            <p className="pet-room-pending-copy">
              승인된 고양이와 방 이미지를 연결하면 꾸미기 화면이 열려요.
            </p>
          </div>
        )}
      </div>

      {resolvedSceneMode && artReady ? (
        <p className="room-scene-note">
          완성된 방 한 장면이에요. 오늘의 절제가 이 방을 조용히 밝혀요.
        </p>
      ) : null}

      {ghost ? (
        <div className="room-drag-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          {ghost.src ? (
            <img className="room-drag-ghost-img" src={ghost.src} alt="" />
          ) : (
            <span className="room-drag-ghost-pending" />
          )}
        </div>
      ) : null}
    </>
  );
});

export default PetRoomEditor;

// Shared room token — real item art when present, else a clean neutral slot.
// Interactive on the editor (a button you can drag/select), static on the preview.
// No emoji, no glow blob, no floating text label.
export function RoomToken({ item, placement, selected = false, interactive = false, onPointerDown }) {
  const src = isItemSpriteReady(item.assetId) ? resolveItemAsset(item.assetId) : null;
  const style = {
    left: `${(placement.x ?? 0.5) * 100}%`,
    top: `${(placement.y ?? 0.6) * 100}%`,
    zIndex: placement.z ?? 1,
    '--scale': placement.scale ?? 1,
  };
  const className = `room-token${selected ? ' is-selected' : ''}${src ? '' : ' room-token--pending'}`;
  const inner = src ? (
    <img className="room-token-img" src={src} alt="" />
  ) : (
    <span className="room-token-pending" />
  );

  if (!interactive) {
    return (
      <span className={className} style={style} data-item={item.id} aria-hidden="true">
        {inner}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={className}
      style={style}
      data-item={item.id}
      onPointerDown={onPointerDown}
      aria-label={`${item.name} · 끌어서 옮기기`}
      aria-pressed={selected}
    >
      {inner}
    </button>
  );
}
