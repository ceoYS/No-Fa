import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildRoomShell } from './RoomShell.jsx';
import { buildRoomLighting } from './RoomLighting.jsx';
import { buildItemProxy, setGhostValidity } from './itemProxies.js';
import { buildCatRig } from './catRig.js';
import { makeContactShadowTexture, makeContactGlowTexture } from './roomTextures.js';
import {
  CAT_ANCHOR,
  CAT_REACTION_COOLDOWN_MS,
  ROOM3D,
  createCatAnimationState,
  evaluatePlacement,
  placementMetaFor,
  placementToWorld,
  stepRotation,
  worldToPlacement,
} from './roomDomain.js';
import { ITEM_BY_ID } from '../../constants/roomItems.js';
import { resolveItemAsset } from '../../constants/petAssets.js';

/*
 * PetRoom3D — the usable 3D pet room (?room3d=1 only).
 *
 * One persistent WebGL scene serves BOTH states: 감상 (view) and 꾸미기 (edit).
 * Toggling 아이템 배치하기 never swaps the canvas — the same camera, the same
 * scene graph, only the DOM overlay (tray / hints / done) changes around it.
 *
 * Viewing: OrbitControls with free 360° horizontal orbit, clamped pitch (the
 * floor never flips overhead), clamped zoom, pan disabled. The camera orbits
 * OUTSIDE the room; every frame the dollhouse cutaway hides EXACTLY the two
 * walls most facing the camera, so no wall slab ever crosses the view at any
 * azimuth/pitch/zoom combination (a fixed dot threshold left a diagonal gap
 * where a near wall stayed visible — the black-band bug).
 *
 * Editing (Phase B-3): previewed, validated placement — never a surprise
 * spawn. Arming a tray item shows a semi-transparent ghost of its proxy under
 * the pointer while the raycast is on real floor; a quiet amber ring means
 * the spot is allowed, a muted clay ring means it is blocked (cat areas,
 * fixed scenery, other items, zone rules — roomDomain.evaluatePlacement).
 * Persistence changes ONLY when a valid spot is tapped: the commit goes
 * through the SAME normalized { x, y } handlers the 2.5D editor writes
 * (onPlace / onMove), plus a stepped rotation through onRotate. A blocked tap
 * saves nothing and explains itself in one short line.
 *
 * Honesty: placed items render as grounded proxy objects following their
 * catalogue art silhouettes (itemProxies.js — the adapter for future approved
 * art). The cat (Phase C) is a real procedural 3D model (catRig.js) resting
 * on its bed at the cat anchor: its idle breath / blink / ear / tail-joint
 * motion and its short tap·stroke reactions are actual per-frame transform
 * animation, driven by a dedicated loop that runs only when the user allows
 * motion (prefers-reduced-motion sessions get a static resting pose and no
 * idle loop). Reactions answer the user's own gesture in VIEW mode only —
 * edit mode keeps every pointer for placement — under a shared cooldown, and
 * any reaction sound goes through the screen's gesture-gated usePetSound
 * (silent until real audio files are approved; never fired without a user
 * gesture). Mood presets
 * (roomDomain.deriveCatMood) come from local records and the clock alone and
 * only tune idle timing — never presented as the cat having feelings. The
 * only item animation is a ~190 ms scale settle on commit, removed under
 * prefers-reduced-motion.
 */

const CAMERA = Object.freeze({
  fov: 42,
  target: [0, 0.72, 0.05],
  startAzimuth: 0, // facing the back wall, same reading as the 2.5D stage
  startPolar: 1.1,
  startDist: 4.15,
  minDist: 3.0,
  maxDist: 5.6,
  minPolar: 0.62, // high view — well short of top-down, the floor stays a floor
  maxPolar: 1.38, // near-level view — never below the floor plane
});

const TAP_SLOP_PX = 7;
// A deliberate slow stroke across the cat (cumulative pointer travel while
// the gesture stays on the model) before it counts as 쓰다듬기 — a flick or a
// jitterly tap must not.
const CAT_STROKE_MIN_PX = 46;
// A stroke also has to last long enough to be deliberate. This is measured in
// the page clock (not event count), so a burst of back-and-forth jitter cannot
// become petting merely because a slow renderer queues its pointer events.
const CAT_STROKE_MIN_MS = 500;
const SETTLE_MS = 190;
const NOTICE_MS = 2600;

function webglSupported() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

// Dispose helper for item proxies on rebuild — geometries and materials are
// per-proxy, but the contact-shadow/glow textures are SHARED, so maps stay
// alive until the final unmount dispose pass.
function disposeProxy(group) {
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) m.dispose();
    }
  });
}

function TrayFace({ item }) {
  const src = resolveItemAsset(item.assetId);
  return (
    <span className="room-tray-face">
      {src ? (
        <img className="room-card-img" src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="room-card-pending" aria-hidden="true" />
      )}
      <span className="room-card-name">{item.name}</span>
    </span>
  );
}

export default function PetRoom3D({
  placements = [],
  ownedDecor = [],
  editing = false,
  label = '3D 고양이 방',
  showDevNote = false,
  mood = 'neutral',
  onCatTap,
  onCatPet,
  onPlace,
  onMove,
  onRemove,
  onRotate,
  onDone,
  onUnsupported,
}) {
  const hostRef = useRef(null);
  const worldRef = useRef(null); // three.js world, set once on mount
  const onUnsupportedRef = useRef(onUnsupported);
  onUnsupportedRef.current = onUnsupported;
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onCatTapRef = useRef(onCatTap);
  onCatTapRef.current = onCatTap;
  const onCatPetRef = useRef(onCatPet);
  onCatPetRef.current = onCatPet;

  // Edit-mode UI state. Refs mirror the values the pointer handlers (bound
  // once at mount) need to read synchronously.
  const [selectedId, setSelectedId] = useState(null);
  const [trayArmedId, setTrayArmedId] = useState(null);
  const [placeNotice, setPlaceNotice] = useState(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const trayArmedRef = useRef(trayArmedId);
  trayArmedRef.current = trayArmedId;
  const placementsRef = useRef(placements);
  placementsRef.current = placements;
  const settleRef = useRef(null); // itemId committed this tick → scale settle

  // ── mount-once three.js world ─────────────────────────────────────────
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    if (!webglSupported()) {
      onUnsupportedRef.current?.();
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      onUnsupportedRef.current?.();
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0705');

    const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 24);

    const shadowTex = makeContactShadowTexture(THREE);
    const glowTex = makeContactGlowTexture(THREE);
    const shell = buildRoomShell(THREE, shadowTex);
    scene.add(shell.group);
    const lights = buildRoomLighting(THREE);
    scene.add(lights.group);

    // Placed-item proxies live in their own group; the placements-sync effect
    // below owns its children.
    const itemGroup = new THREE.Group();
    itemGroup.name = 'placed-items';
    scene.add(itemGroup);

    // Cat anchor — contact-shadow disc under the bed + the mount point. The
    // 2D frame-set animation state stays on the mount (its contract is still
    // pending, roomDomain), while Phase C rests the real procedural cat rig
    // on the bed pad: honest primitive geometry in the room's own light.
    const catShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(CAT_ANCHOR.shadowRadius * 2, CAT_ANCHOR.shadowRadius * 2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    catShadow.rotation.x = -Math.PI / 2;
    catShadow.position.set(CAT_ANCHOR.position.x, 0.009, CAT_ANCHOR.position.z);
    scene.add(catShadow);
    const catMount = new THREE.Group();
    catMount.name = 'cat-anchor';
    catMount.position.set(CAT_ANCHOR.position.x, 0, CAT_ANCHOR.position.z);
    catMount.userData.animationState = createCatAnimationState();
    scene.add(catMount);
    const catRig = buildCatRig(THREE);
    catRig.group.position.y = 0.095; // bed pad top — paws rest ON the cushion
    catMount.add(catRig.group);
    host.dataset.room3dCat = 'idle';
    host.dataset.room3dCatBlinks = '0';
    host.dataset.room3dCatFrames = '0';
    host.dataset.room3dCatMounted = 'true';
    host.dataset.room3dCatRoot = `${catMount.position.x.toFixed(3)}|${catMount.position.y.toFixed(3)}|${catMount.position.z.toFixed(3)}`;

    // ── camera controls: 360° yaw, clamped pitch/zoom, no pan ────────────
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    // The cat's idle life (breath/blink/tail) runs on a continuous loop ONLY
    // when the user allows motion; reduced-motion sessions keep the on-demand
    // renderer and a static resting pose.
    const catLoopOn = !reduceMotion;
    host.dataset.room3dCatMotion = catLoopOn ? 'on' : 'off';
    if (!catLoopOn) catRig.applyStaticPose();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA.target);
    controls.enablePan = false;
    controls.minDistance = CAMERA.minDist;
    controls.maxDistance = CAMERA.maxDist;
    controls.minPolarAngle = CAMERA.minPolar;
    controls.maxPolarAngle = CAMERA.maxPolar;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.7;
    // Inertial easing only when the user allows motion; with reduce on, the
    // camera answers the finger directly and stops the instant it lifts.
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;

    // Start pose — spherical → cartesian around the target.
    const startOffset = new THREE.Vector3().setFromSphericalCoords(
      CAMERA.startDist,
      CAMERA.startPolar,
      CAMERA.startAzimuth,
    );
    camera.position.copy(controls.target).add(startOffset);
    controls.update();

    // ── dollhouse cutaway + on-demand render loop ────────────────────────
    // Hide EXACTLY the two walls whose outward normals most face the camera's
    // horizontal direction. The pair nearest the camera is always the pair
    // that could cross the view; the remaining two are the far side of the
    // room. Rank-based (not threshold-based): at a diagonal both near walls
    // rank on top, at an axis view the second slot lands on an edge-on side
    // wall whose absence never shows — so no azimuth leaves a slab smeared
    // across the frame, at any pitch or zoom.
    const dirXZ = new THREE.Vector2();
    const updateWallVisibility = () => {
      dirXZ.set(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
      if (dirXZ.lengthSq() < 1e-6) return;
      dirXZ.normalize();
      const ranked = shell.walls
        .map((w, i) => ({ i, facing: w.normal.x * dirXZ.x + w.normal.z * dirXZ.y }))
        .sort((a, b) => b.facing - a.facing);
      const hidden = new Set([ranked[0].i, ranked[1].i]);
      const visibleKeys = [];
      shell.walls.forEach((w, i) => {
        const visible = !hidden.has(i);
        if (w.group.visible !== visible) w.group.visible = visible;
        if (visible) visibleKeys.push(w.key);
      });
      host.dataset.room3dWalls = visibleKeys.join(',');
    };

    const camAttrPoint = new THREE.Vector3();
    const updateCamAttr = () => {
      const az = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
      const pol = THREE.MathUtils.radToDeg(controls.getPolarAngle());
      const dist = camera.position.distanceTo(controls.target);
      host.dataset.room3dCam = `${az.toFixed(1)}|${pol.toFixed(1)}|${dist.toFixed(2)}`;
      // QA hook (same family as room3dCam/room3dGhost): the cat head's
      // projected canvas position, so a harness can aim a real tap/stroke at
      // the model instead of guessing pixels.
      camAttrPoint.set(CAT_ANCHOR.position.x, 0.36, CAT_ANCHOR.position.z).project(camera);
      const px = ((camAttrPoint.x + 1) / 2) * host.clientWidth;
      const py = ((1 - camAttrPoint.y) / 2) * host.clientHeight;
      host.dataset.room3dCatScreen = `${px.toFixed(0)}|${py.toFixed(0)}`;
    };

    let rafId = 0;
    let disposed = false;
    const renderFrame = () => {
      updateWallVisibility();
      renderer.render(scene, camera);
      updateCamAttr();
    };
    const step = () => {
      rafId = 0;
      if (disposed) return;
      const easing = controls.enableDamping ? controls.update() : false;
      renderFrame();
      if (easing) requestRender();
    };
    const requestRender = () => {
      // While the cat loop drives every frame, on-demand scheduling would
      // only double-render the same frame — it stands down.
      if (!rafId && !disposed && !catLoopOn) rafId = requestAnimationFrame(step);
    };
    controls.addEventListener('change', requestRender);

    // ── cat life loop + reactions ─────────────────────────────────────────
    let lastCatMode = 'idle';
    let lastCatBlinks = 0;
    let catFrames = 0;
    let catPoseDatasetAt = 0;
    const writeCatPoseDataset = () => {
      const pose = catRig.getPose();
      host.dataset.room3dCatPose = [
        pose.breatheY,
        pose.headPitch,
        pose.headYaw,
        pose.eyeLid,
        pose.earLeft,
        pose.earRight,
        ...pose.tail,
      ].map((v) => v.toFixed(5)).join('|');
    };
    const syncCatDataset = () => {
      if (catRig.state.mode !== lastCatMode) {
        lastCatMode = catRig.state.mode;
        host.dataset.room3dCat = lastCatMode;
      }
      if (catRig.state.blinks !== lastCatBlinks) {
        lastCatBlinks = catRig.state.blinks;
        host.dataset.room3dCatBlinks = String(lastCatBlinks);
      }
      catFrames += 1;
      host.dataset.room3dCatFrames = String(catFrames);
      if (performance.now() >= catPoseDatasetAt) {
        writeCatPoseDataset();
        catPoseDatasetAt = performance.now() + 80;
      }
    };

    let catRaf = 0;
    let catPrevT = 0;
    const catLoop = (now) => {
      catRaf = 0;
      if (disposed) return;
      // dt cap keeps a tab-resume from teleporting a tween, while still
      // letting slow renderers (~10 fps low-end / software GL) run the idle
      // life at close to real time instead of in slow motion.
      const dt = Math.min(0.12, catPrevT ? (now - catPrevT) / 1000 : 0.016);
      catPrevT = now;
      if (controls.enableDamping) controls.update();
      catRig.update(dt, { camAzimuth: controls.getAzimuthalAngle() });
      syncCatDataset();
      renderFrame();
      catRaf = requestAnimationFrame(catLoop);
    };
    writeCatPoseDataset();
    if (catLoopOn) catRaf = requestAnimationFrame(catLoop);

    // One quiet answer per gesture: reactions inside the cooldown are simply
    // dropped (no queue). Reduced-motion sessions skip the rig motion but the
    // screen callback still runs — the message + gesture-gated sound remain.
    let lastCatReactionAt = -Infinity;
    // dir.yaw (radians) is a gentle head-turn target toward the pointer's
    // contact point — a screen lean, never real hand tracking. A stroke on the
    // head reads as 'nuzzle', elsewhere as 'pet'; both answer through onCatPet.
    const fireCatReaction = (kind, dir) => {
      const now = performance.now();
      if (now - lastCatReactionAt < CAT_REACTION_COOLDOWN_MS) return;
      if (catLoopOn && !catRig.triggerReaction(kind, dir)) return;
      lastCatReactionAt = now;
      if (kind === 'tap') onCatTapRef.current?.();
      else onCatPetRef.current?.();
    };

    // ── placement ghost (preview before any persistence) ─────────────────
    // The ghost is the armed item's own proxy, semi-transparent, parked in
    // the scene root (NOT itemGroup, so item raycasts never hit it). It only
    // shows while the pointer ray lands on the real floor slab.
    let ghost = null; // { group, itemId }
    const setGhost = (itemId) => {
      if (ghost) {
        scene.remove(ghost.group);
        disposeProxy(ghost.group);
        ghost = null;
      }
      if (itemId && ITEM_BY_ID[itemId]) {
        const g = buildItemProxy(THREE, ITEM_BY_ID[itemId], shadowTex, { ghost: true, glowTex });
        g.visible = false;
        scene.add(g);
        ghost = { group: g, itemId };
      }
      host.dataset.room3dGhost = 'off';
      requestRender();
    };

    const insideFloor = (p) =>
      Math.abs(p.x) <= ROOM3D.width / 2 && Math.abs(p.z) <= ROOM3D.depth / 2;

    const hideGhost = () => {
      if (ghost && ghost.group.visible) {
        ghost.group.visible = false;
        host.dataset.room3dGhost = 'off';
        requestRender();
      }
    };

    const moveGhost = (e) => {
      if (!ghost) return;
      const p = floorPointAt(e);
      if (!p || !insideFloor(p)) {
        hideGhost();
        return;
      }
      const verdict = evaluatePlacement(ghost.itemId, { x: p.x, z: p.z }, placementsRef.current);
      ghost.group.position.set(verdict.world.x, 0, verdict.world.z);
      setGhostValidity(ghost.group, verdict.ok);
      ghost.group.visible = true;
      host.dataset.room3dGhost = verdict.ok ? 'valid' : 'invalid';
      requestRender();
    };

    // Validity marker under a proxy while it is dragged to a new spot.
    const dragMarker = (() => {
      const g = new THREE.Group();
      g.name = 'drag-marker';
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.012, 8, 48),
        new THREE.MeshBasicMaterial({ color: '#d99a5b', transparent: true, opacity: 0.85, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      const disc = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({ map: glowTex, color: '#d99a5b', transparent: true, depthWrite: false, opacity: 0.55 }),
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.012;
      g.add(ring, disc);
      g.visible = false;
      scene.add(g);
      return { g, ring, disc };
    })();
    const setDragMarker = (proxy, ok) => {
      const meta = placementMetaFor(proxy.userData.itemId);
      dragMarker.g.scale.setScalar(meta.radius + 0.04);
      dragMarker.g.position.set(proxy.position.x, 0, proxy.position.z);
      const color = ok ? '#d99a5b' : '#8f4f43';
      dragMarker.ring.material.color.set(color);
      dragMarker.disc.material.color.set(color);
      dragMarker.g.visible = true;
    };

    // Commit settle: one short scale ease on the just-committed proxy. This
    // is UI feedback on the user's own action — skipped entirely under
    // prefers-reduced-motion, and never applied to the cat (the rig owns its
    // own motion).
    let settleRaf = 0;
    const beginSettle = (itemId) => {
      if (reduceMotion) return;
      const proxy = itemGroup.children.find((c) => c.userData?.itemId === itemId);
      if (!proxy) return;
      const base = proxy.scale.x;
      const t0 = performance.now();
      if (settleRaf) cancelAnimationFrame(settleRaf);
      host.dataset.room3dSettle = '1';
      const tick = () => {
        settleRaf = 0;
        if (disposed) return;
        const k = Math.min(1, (performance.now() - t0) / SETTLE_MS);
        const ease = 1 - (1 - k) ** 3;
        proxy.scale.setScalar(base * (0.9 + 0.1 * ease));
        // The continuous cat loop will paint this scale update. Calling the
        // renderer here as well would double-render every settle frame.
        if (!catLoopOn) renderFrame();
        if (k < 1) {
          settleRaf = requestAnimationFrame(tick);
        } else {
          delete host.dataset.room3dSettle;
        }
      };
      settleRaf = requestAnimationFrame(tick);
    };

    // ── edit-mode pointer interaction (ghost place / drag-move) ──────────
    // Capture-phase listeners run before OrbitControls' own handlers, so an
    // item gesture can switch the camera off for its whole length.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planePoint = new THREE.Vector3();
    let press = null; // { x, y, id } — last pointerdown, for tap detection
    let dragging = null; // { proxy, itemId, moved, valid }
    // View-mode cat gesture: a press that starts on the cat owns the pointer
    // (the camera stands still), then resolves to a tap (short) or one stroke
    // (enough travel across the model). Edit mode never opens this — there,
    // every pointer belongs to placement.
    let catGesture = null; // { id, x, y, startedAt, dist, fired }

    const catAt = (e) => {
      if (!setNdcFromEvent(e)) return false;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.intersectObject(catRig.group, true).length > 0;
    };

    // Where on the cat the pointer is touching, in the rig's local space. Used
    // to lean the head toward the contact point and to tell a head touch
    // (→ nuzzle) from a body stroke (→ pet). Returns null when the ray misses
    // the cat, so callers keep their existing "must be on the cat" gate.
    const catLocalPoint = new THREE.Vector3();
    const catContact = (e) => {
      if (!setNdcFromEvent(e)) return null;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(catRig.group, true);
      if (!hits.length) return null;
      catLocalPoint.copy(hits[0].point);
      catRig.group.worldToLocal(catLocalPoint);
      // The cat faces +z (+x is its right). A touch to one side turns the head
      // that way; the head sits well above the body centre in local y.
      const yaw = Math.max(-0.5, Math.min(0.5, Math.atan2(catLocalPoint.x, Math.max(0.12, catLocalPoint.z + 0.2))));
      return { yaw, onHead: catLocalPoint.y > 0.24 };
    };

    const setNdcFromEvent = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      return true;
    };

    const proxyAt = (e) => {
      if (!setNdcFromEvent(e)) return null;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(itemGroup.children, true);
      for (const hit of hits) {
        let obj = hit.object;
        while (obj && obj !== itemGroup && !obj.userData?.placedItem) obj = obj.parent;
        if (obj && obj.userData?.placedItem) return obj;
      }
      return null;
    };

    function floorPointAt(e) {
      if (!setNdcFromEvent(e)) return null;
      raycaster.setFromCamera(ndc, camera);
      // The math plane keeps a drag continuous even when the pointer leaves
      // the floor mesh; insideFloor()/the domain clamp pull results back in.
      if (!raycaster.ray.intersectPlane(floorPlane, planePoint)) return null;
      return planePoint;
    }

    const onPointerDown = (e) => {
      if (!e.isPrimary) return;
      press = { x: e.clientX, y: e.clientY, id: e.pointerId };
      if (!editingRef.current) {
        if (catAt(e)) {
          catGesture = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            startedAt: performance.now(),
            dist: 0,
            fired: false,
          };
          controls.enabled = false; // the gesture belongs to the cat, not the camera
          renderer.domElement.setPointerCapture?.(e.pointerId);
        }
        return;
      }
      const proxy = proxyAt(e);
      if (proxy) {
        dragging = { proxy, itemId: proxy.userData.itemId, moved: false, valid: true };
        controls.enabled = false; // the gesture belongs to the item, not the camera
        hideGhost();
        renderer.domElement.setPointerCapture?.(e.pointerId);
        return;
      }
      if (trayArmedRef.current) {
        // Armed aiming gesture: the finger drives the ghost, not the camera.
        controls.enabled = false;
        renderer.domElement.setPointerCapture?.(e.pointerId);
        moveGhost(e);
      }
    };

    const onPointerMove = (e) => {
      if (catGesture && e.pointerId === catGesture.id) {
        catGesture.dist += Math.hypot(e.clientX - catGesture.x, e.clientY - catGesture.y);
        catGesture.x = e.clientX;
        catGesture.y = e.clientY;
        const elapsed = performance.now() - catGesture.startedAt;
        if (
          !catGesture.fired &&
          catGesture.dist >= CAT_STROKE_MIN_PX &&
          elapsed >= CAT_STROKE_MIN_MS
        ) {
          const contact = catContact(e);
          if (contact) {
            catGesture.fired = true; // one stroke per gesture
            fireCatReaction(contact.onHead ? 'nuzzle' : 'pet', { yaw: contact.yaw });
          }
        }
        return;
      }
      if (editingRef.current && trayArmedRef.current && !dragging) {
        moveGhost(e); // hover (mouse) and armed press-drag (touch) both aim
        return;
      }
      if (!dragging || !press || e.pointerId !== press.id) return;
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_SLOP_PX) dragging.moved = true;
      if (!dragging.moved) return;
      const p = floorPointAt(e);
      if (!p) return;
      // Round-trip through the placement domain = the exact clamp the 2.5D
      // editor applies, so the live proxy never leaves the placeable band.
      const verdict = evaluatePlacement(dragging.itemId, { x: p.x, z: p.z }, placementsRef.current);
      dragging.proxy.position.set(verdict.world.x, 0, verdict.world.z);
      dragging.valid = verdict.ok;
      dragging.message = verdict.ok ? null : verdict.message;
      setDragMarker(dragging.proxy, verdict.ok);
      requestRender();
    };

    const onPointerUp = (e) => {
      const wasPress = press && e.pointerId === press.id;
      const tapped =
        wasPress && Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP_SLOP_PX;
      if (catGesture && e.pointerId === catGesture.id) {
        const g = catGesture;
        catGesture = null;
        controls.enabled = true;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
        const elapsed = performance.now() - g.startedAt;
        const contact = catContact(e);
        if (!g.fired && g.dist >= CAT_STROKE_MIN_PX && elapsed >= CAT_STROKE_MIN_MS && contact) {
          fireCatReaction(contact.onHead ? 'nuzzle' : 'pet', { yaw: contact.yaw });
        } else if (!g.fired && g.dist <= TAP_SLOP_PX) {
          fireCatReaction('tap', contact ? { yaw: contact.yaw } : undefined);
        }
        press = null;
        return;
      }
      if (dragging) {
        const { proxy, itemId, moved, valid, message } = dragging;
        dragging = null;
        controls.enabled = true;
        dragMarker.g.visible = false;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
        if (moved) {
          if (valid) {
            const norm = worldToPlacement({ x: proxy.position.x, z: proxy.position.z });
            settleRef.current = itemId;
            onMoveRef.current?.(itemId, norm.x, norm.y);
          } else {
            // Blocked drop: nothing persists — the proxy returns to its spot
            // and the last blocked-move reason is surfaced.
            const prev = placementsRef.current.find((p) => p.itemId === itemId);
            if (prev) {
              const w = placementToWorld(prev);
              proxy.position.set(w.x, 0, w.z);
            }
            if (message) setPlaceNotice(message);
          }
          requestRender();
        } else if (tapped) {
          setSelectedId((cur) => (cur === itemId ? null : itemId));
        }
        press = null;
        return;
      }
      const armed = trayArmedRef.current;
      if (wasPress && editingRef.current && armed) {
        controls.enabled = true;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
        const p = floorPointAt(e);
        if (p && insideFloor(p)) {
          const verdict = evaluatePlacement(armed, { x: p.x, z: p.z }, placementsRef.current);
          if (verdict.ok) {
            settleRef.current = armed;
            onPlaceRef.current?.(armed, verdict.norm.x, verdict.norm.y);
            setTrayArmedId(null);
            setSelectedId(armed);
            setPlaceNotice(null);
          } else {
            setPlaceNotice(verdict.message);
          }
        }
        press = null;
        return;
      }
      if (wasPress && tapped && editingRef.current) {
        const p = floorPointAt(e);
        if (p) setSelectedId(null);
      }
      press = null;
    };

    const onPointerLeave = () => {
      if (!dragging) hideGhost();
    };

    // A cancelled pointer (system gesture, tab switch) must never leave the
    // camera switched off — drop the in-flight cat/drag gesture quietly.
    const onPointerCancel = (e) => {
      if (catGesture && e.pointerId === catGesture.id) {
        catGesture = null;
        controls.enabled = true;
      }
      if (dragging && press && e.pointerId === press.id) {
        dragging = null;
        controls.enabled = true;
        dragMarker.g.visible = false;
      }
      if (press && e.pointerId === press.id) controls.enabled = true;
      if (renderer.domElement.hasPointerCapture?.(e.pointerId)) {
        renderer.domElement.releasePointerCapture?.(e.pointerId);
      }
      press = null;
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown, true);
    el.addEventListener('pointermove', onPointerMove, true);
    el.addEventListener('pointerup', onPointerUp, true);
    el.addEventListener('pointerleave', onPointerLeave, true);
    el.addEventListener('pointercancel', onPointerCancel, true);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderFrame();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    worldRef.current = {
      scene,
      itemGroup,
      shadowTex,
      glowTex,
      requestRender,
      setGhost,
      beginSettle,
      // Mood only tunes the rig's idle parameters. In a reduced-motion
      // session the loop is off, so re-apply the static pose and paint once.
      setCatMood: (next) => {
        catRig.setMood(next);
        host.dataset.room3dCatMood = catRig.getMood();
        if (!catLoopOn) {
          catRig.applyStaticPose();
          writeCatPoseDataset();
          renderFrame();
        }
      },
    };
    host.dataset.room3dCatMood = catRig.getMood();

    return () => {
      disposed = true;
      worldRef.current = null;
      if (rafId) cancelAnimationFrame(rafId);
      if (settleRaf) cancelAnimationFrame(settleRaf);
      if (catRaf) cancelAnimationFrame(catRaf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('pointermove', onPointerMove, true);
      el.removeEventListener('pointerup', onPointerUp, true);
      el.removeEventListener('pointerleave', onPointerLeave, true);
      el.removeEventListener('pointercancel', onPointerCancel, true);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) {
            if (m.map) m.map.dispose();
            if (m.emissiveMap && m.emissiveMap !== m.map) m.emissiveMap.dispose();
            m.dispose();
          }
        }
      });
      shadowTex.dispose();
      glowTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // Notice auto-clear — the line explains a blocked spot, then steps aside.
  useEffect(() => {
    if (!placeNotice) return undefined;
    const t = setTimeout(() => setPlaceNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [placeNotice]);

  // ── placements → proxy sync (never rebuilds the world or the camera) ───
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const { itemGroup, shadowTex, glowTex, requestRender, beginSettle } = world;
    for (const child of [...itemGroup.children]) {
      itemGroup.remove(child);
      disposeProxy(child);
    }
    for (const p of placements) {
      const item = ITEM_BY_ID[p.itemId];
      if (!item) continue;
      const proxy = buildItemProxy(THREE, item, shadowTex, { glowTex });
      const w = placementToWorld(p);
      const meta = placementMetaFor(p.itemId);
      proxy.position.set(w.x, 0, w.z);
      proxy.rotation.y = THREE.MathUtils.degToRad(p.rot ?? meta.defaultRotation);
      itemGroup.add(proxy);
    }
    if (hostRef.current) hostRef.current.dataset.room3dSlots = String(itemGroup.children.length);
    if (settleRef.current) {
      beginSettle(settleRef.current);
      settleRef.current = null;
    }
    requestRender();
  }, [placements]);

  // ── ghost lifecycle: armed tray item ⇄ preview proxy ───────────────────
  useEffect(() => {
    worldRef.current?.setGhost(editing ? trayArmedId : null);
  }, [trayArmedId, editing]);

  // ── cat mood sync (idle parameters only — see roomDomain.deriveCatMood) ─
  useEffect(() => {
    worldRef.current?.setCatMood(mood);
  }, [mood]);

  // ── selection marker sync (thin warm ring + soft contact glow) ─────────
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    for (const proxy of world.itemGroup.children) {
      const marker = proxy.getObjectByName('select-marker');
      if (marker) marker.visible = editing && proxy.userData.itemId === selectedId;
    }
    world.requestRender();
  }, [selectedId, editing, placements]);

  // Leaving edit mode clears the working selection state.
  useEffect(() => {
    if (!editing) {
      setSelectedId(null);
      setTrayArmedId(null);
      setPlaceNotice(null);
    }
  }, [editing]);

  const placedIds = new Set(placements.map((p) => p.itemId));
  const trayItems = ownedDecor.filter((it) => !placedIds.has(it.id));
  const selectedItem = selectedId ? ITEM_BY_ID[selectedId] : null;
  const armedItem = trayArmedId ? ITEM_BY_ID[trayArmedId] : null;

  const rotateSelected = (direction) => {
    if (!selectedId) return;
    const placed = placements.find((p) => p.itemId === selectedId);
    if (!placed) return;
    const current = placed.rot ?? placementMetaFor(selectedId).defaultRotation;
    onRotate?.(selectedId, stepRotation(selectedId, current, direction));
  };

  return (
    <>
      <div
        ref={hostRef}
        className="pet-stage pet-room-3d"
        role="group"
        aria-label={label}
        data-room3d="on"
        data-editing={editing || undefined}
      />
      {showDevNote ? (
        <p className="room-scene-note">
          실험용 3D 방이에요. 끌어서 360도로 둘러보고, 휠이나 두 손가락으로 확대할 수 있어요. 고양이와
          배치한 아이템은 아직 임시 3D 모형으로 보여요. 감상 중에 고양이를 살짝 탭하거나 천천히
          쓰다듬으면 작은 반응을 볼 수 있어요. 이 반응은 화면 연출이에요.
        </p>
      ) : !editing ? (
        // Non-debug product copy: a gentle invitation only. It promises no
        // sound (no audio files are wired yet), no feelings, and no life — the
        // reaction the user then sees is real on-screen motion, not a claim.
        <p className="room-scene-note">고양이를 살짝 누르거나 천천히 쓰다듬어 보세요.</p>
      ) : null}

      {editing ? (
        <>
          <p className="room-decorator-help" aria-live="polite">
            {armedItem
              ? `‘${armedItem.name}’ 자리를 고르는 중이에요. 바닥의 미리보기가 밝게 표시되는 자리를 탭하면 놓여요.`
              : '아이템을 고른 뒤 바닥에서 미리보기로 자리를 확인하고 탭해 놓아 보세요. 놓인 아이템은 끌어 옮기거나 선택해서 돌릴 수 있어요.'}
          </p>
          {placeNotice ? (
            <p className="room-place-notice" role="status">
              {placeNotice}
            </p>
          ) : null}

          {selectedItem && placedIds.has(selectedItem.id) ? (
            <div className="room-select-bar room-select-bar--compact">
              <span className="room-select-name">{selectedItem.name}</span>
              <div className="room-select-actions">
                <button type="button" className="room-select-btn" onClick={() => rotateSelected(-1)}>
                  왼쪽 15도
                </button>
                <button type="button" className="room-select-btn" onClick={() => rotateSelected(1)}>
                  오른쪽 15도
                </button>
                <button
                  type="button"
                  className="room-select-btn"
                  onClick={() => {
                    onRemove?.(selectedItem.id);
                    setSelectedId(null);
                  }}
                >
                  보관함으로 치우기
                </button>
                <button
                  type="button"
                  className="room-select-btn room-select-btn--ghost"
                  onClick={() => setSelectedId(null)}
                >
                  선택 해제
                </button>
              </div>
            </div>
          ) : null}

          <div className="room-tray" role="list" aria-label="배치할 아이템">
            {trayItems.length === 0 ? (
              <p className="hairline-note">방에 놓을 아이템이 없어요. 상점에서 데려오면 여기에 모여요.</p>
            ) : (
              trayItems.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="room-tray-item"
                  data-item={it.id}
                  data-selected={trayArmedId === it.id}
                  role="listitem"
                  aria-pressed={trayArmedId === it.id}
                  aria-label={`${it.name} 방에 놓기`}
                  onClick={() => setTrayArmedId((cur) => (cur === it.id ? null : it.id))}
                >
                  <TrayFace item={it} />
                </button>
              ))
            )}
          </div>

          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            배치 마치기
          </button>
        </>
      ) : null}
    </>
  );
}
