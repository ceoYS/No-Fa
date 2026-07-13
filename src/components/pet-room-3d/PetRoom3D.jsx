import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildRoomShell } from './RoomShell.jsx';
import { buildRoomLighting } from './RoomLighting.jsx';
import { buildItemProxy } from './itemProxies.js';
import { makeContactShadowTexture } from './roomTextures.js';
import {
  CAT_ANCHOR,
  createCatAnimationState,
  placementToWorld,
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
 * OUTSIDE the room; a per-frame dollhouse cutaway hides whichever walls sit
 * between the camera and the interior so no wall back or void is ever shown.
 * Rendering is on-demand: an idle room schedules zero animation frames.
 *
 * Editing: tap a tray item, then tap the floor — a raycast picks the floor
 * point and the placement persists through the SAME normalized { x, y }
 * handlers the 2.5D editor writes (onPlace / onMove). A placed proxy can be
 * dragged to a new spot; while an item drags, OrbitControls is disabled so
 * the camera never fights the gesture.
 *
 * Honesty: placed items render as neutral grounded proxy objects (see
 * itemProxies.js — the adapter for future approved art), and the cat exists
 * only as its empty bed + contact shadow + anchor mount. No cat visual is
 * fabricated, no motion is claimed, and prefers-reduced-motion turns off the
 * camera's inertial easing (manual control stays available; nothing moves on
 * its own either way).
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

function webglSupported() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

// Dispose helper for item proxies on rebuild — geometries and materials are
// per-proxy, but the contact-shadow texture is SHARED, so maps stay alive
// until the final unmount dispose pass.
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
  onPlace,
  onMove,
  onRemove,
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

  // Edit-mode UI state. Refs mirror the values the pointer handlers (bound
  // once at mount) need to read synchronously.
  const [selectedId, setSelectedId] = useState(null);
  const [trayArmedId, setTrayArmedId] = useState(null);
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const trayArmedRef = useRef(trayArmedId);
  trayArmedRef.current = trayArmedId;

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
    const shell = buildRoomShell(THREE, shadowTex);
    scene.add(shell.group);
    const lights = buildRoomLighting(THREE);
    scene.add(lights.group);

    // Placed-item proxies live in their own group; the placements-sync effect
    // below owns its children.
    const itemGroup = new THREE.Group();
    itemGroup.name = 'placed-items';
    scene.add(itemGroup);

    // Cat anchor — contact-shadow disc (under the empty bed) + a mount point
    // carrying the animation-state interface. Nothing visible pretends to be
    // the cat; the bed in the shell just makes the spot read as a home.
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

    // ── camera controls: 360° yaw, clamped pitch/zoom, no pan ────────────
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
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
    // Hide the wall(s) whose outward normal faces the camera's HORIZONTAL
    // direction. A plane-side test breaks at high pitch / close zoom (the
    // camera's ground footprint can slip inside a wall plane while it looks
    // over the open top, leaving a near wall smeared across the view); the
    // azimuth test is pitch- and zoom-independent, so a corner view always
    // clears exactly the one or two walls between the viewer and the room.
    const dirXZ = new THREE.Vector2();
    const updateWallVisibility = () => {
      dirXZ.set(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
      if (dirXZ.lengthSq() < 1e-6) return;
      dirXZ.normalize();
      for (const w of shell.walls) {
        const facing = w.normal.x * dirXZ.x + w.normal.z * dirXZ.y;
        const visible = facing < 0.35;
        if (w.group.visible !== visible) w.group.visible = visible;
      }
    };

    const updateCamAttr = () => {
      const az = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
      const pol = THREE.MathUtils.radToDeg(controls.getPolarAngle());
      const dist = camera.position.distanceTo(controls.target);
      host.dataset.room3dCam = `${az.toFixed(1)}|${pol.toFixed(1)}|${dist.toFixed(2)}`;
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
      if (!rafId && !disposed) rafId = requestAnimationFrame(step);
    };
    controls.addEventListener('change', requestRender);

    // ── edit-mode pointer interaction (raycast place / drag-move) ────────
    // Capture-phase listeners run before OrbitControls' own handlers, so an
    // item drag can switch the camera off for the length of the gesture.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planePoint = new THREE.Vector3();
    let press = null; // { x, y, id } — last pointerdown, for tap detection
    let dragging = null; // { proxy, itemId, moved }

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

    const floorPointAt = (e) => {
      if (!setNdcFromEvent(e)) return null;
      raycaster.setFromCamera(ndc, camera);
      // The math plane keeps the drag continuous even when the pointer leaves
      // the floor mesh; the placement domain clamp pulls it back inside.
      if (!raycaster.ray.intersectPlane(floorPlane, planePoint)) return null;
      return planePoint;
    };

    const onPointerDown = (e) => {
      if (!e.isPrimary) return;
      press = { x: e.clientX, y: e.clientY, id: e.pointerId };
      if (!editingRef.current) return;
      const proxy = proxyAt(e);
      if (!proxy) return;
      dragging = { proxy, itemId: proxy.userData.itemId, moved: false };
      controls.enabled = false; // the gesture belongs to the item, not the camera
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragging || !press || e.pointerId !== press.id) return;
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_SLOP_PX) dragging.moved = true;
      if (!dragging.moved) return;
      const p = floorPointAt(e);
      if (!p) return;
      // Round-trip through the placement domain = the exact clamp the 2.5D
      // editor applies, so the live proxy never leaves the placeable band.
      const snapped = placementToWorld(worldToPlacement({ x: p.x, z: p.z }));
      dragging.proxy.position.set(snapped.x, 0, snapped.z);
      requestRender();
    };

    const onPointerUp = (e) => {
      const wasPress = press && e.pointerId === press.id;
      const tapped =
        wasPress && Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP_SLOP_PX;
      if (dragging) {
        const { proxy, itemId, moved } = dragging;
        dragging = null;
        controls.enabled = true;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
        if (moved) {
          const norm = worldToPlacement({ x: proxy.position.x, z: proxy.position.z });
          onMoveRef.current?.(itemId, norm.x, norm.y);
        } else if (tapped) {
          setSelectedId((cur) => (cur === itemId ? null : itemId));
        }
        press = null;
        return;
      }
      if (wasPress && tapped && editingRef.current) {
        const armed = trayArmedRef.current;
        const p = floorPointAt(e);
        if (armed && p) {
          const norm = worldToPlacement({ x: p.x, z: p.z });
          onPlaceRef.current?.(armed, norm.x, norm.y);
          setTrayArmedId(null);
          setSelectedId(armed);
        } else if (p) {
          setSelectedId(null);
        }
      }
      press = null;
    };

    const el = renderer.domElement;
    el.addEventListener('pointerdown', onPointerDown, true);
    el.addEventListener('pointermove', onPointerMove, true);
    el.addEventListener('pointerup', onPointerUp, true);

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

    worldRef.current = { scene, itemGroup, shadowTex, requestRender };

    return () => {
      disposed = true;
      worldRef.current = null;
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('pointermove', onPointerMove, true);
      el.removeEventListener('pointerup', onPointerUp, true);
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
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  // ── placements → proxy sync (never rebuilds the world or the camera) ───
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const { itemGroup, shadowTex, requestRender } = world;
    for (const child of [...itemGroup.children]) {
      itemGroup.remove(child);
      disposeProxy(child);
    }
    for (const p of placements) {
      const item = ITEM_BY_ID[p.itemId];
      if (!item) continue;
      const proxy = buildItemProxy(THREE, item, shadowTex);
      const w = placementToWorld(p);
      proxy.position.set(w.x, 0, w.z);
      itemGroup.add(proxy);
    }
    if (hostRef.current) hostRef.current.dataset.room3dSlots = String(itemGroup.children.length);
    requestRender();
  }, [placements]);

  // ── selection ring sync ────────────────────────────────────────────────
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    for (const proxy of world.itemGroup.children) {
      const ring = proxy.getObjectByName('select-ring');
      if (ring) ring.visible = editing && proxy.userData.itemId === selectedId;
    }
    world.requestRender();
  }, [selectedId, editing, placements]);

  // Leaving edit mode clears the working selection state.
  useEffect(() => {
    if (!editing) {
      setSelectedId(null);
      setTrayArmedId(null);
    }
  }, [editing]);

  const placedIds = new Set(placements.map((p) => p.itemId));
  const trayItems = ownedDecor.filter((it) => !placedIds.has(it.id));
  const selectedItem = selectedId ? ITEM_BY_ID[selectedId] : null;
  const armedItem = trayArmedId ? ITEM_BY_ID[trayArmedId] : null;

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
      <p className="room-scene-note">
        실험용 3D 방이에요. 끌어서 360도로 둘러보고, 휠이나 두 손가락으로 확대할 수 있어요. 고양이
        아트는 아직 연결 전이라 자리만 비워 두었고, 배치한 아이템은 임시 모형으로 보여요.
      </p>

      {editing ? (
        <>
          <p className="room-decorator-help" aria-live="polite">
            {armedItem
              ? `방 바닥을 탭하면 ‘${armedItem.name}’ 아이템이 그 자리에 놓여요.`
              : '아이템을 고른 뒤 방 바닥을 탭해 놓아 보세요. 놓인 아이템은 끌어서 옮길 수 있어요.'}
          </p>

          {selectedItem && placedIds.has(selectedItem.id) ? (
            <div className="room-select-bar">
              <span className="room-select-name">{selectedItem.name} 선택됨</span>
              <div className="room-select-actions">
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
