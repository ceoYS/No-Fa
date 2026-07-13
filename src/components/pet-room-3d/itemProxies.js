/*
 * itemProxies — neutral grounded 3D stand-ins for placed catalogue items.
 *
 * ADAPTER BOUNDARY for future approved art: buildItemProxy() is the single
 * place a placement becomes a visible object. When approved transparent item
 * assets land (see ASSET_CONTRACT.md), each builder body is swapped for the
 * real asset mesh without touching the placement, raycast or persistence code.
 *
 * Phase B-3: every proxy now follows its catalogue ART's silhouette and
 * proportions — the 잔불 램프 is a round paper mood lamp on a wood disc (NOT a
 * second floor stand), the 쿠션 is a round plush pouf, the 고양이집 has a peaked
 * roof and an arched doorway, the 화분 is a slim vase with thin branches, the
 * 장난감 is a yarn ball beside a small plush shape. Placeable items sit one
 * value step LIGHTER than the room surfaces so they read as yours at a glance.
 * Still honestly simple forms — never a claim of finished item art.
 *
 * Selection feedback is deliberately quiet: a thin warm ring plus a soft
 * contact glow at the base (no thick debug-style hoop). Ghost variants render
 * the same form semi-transparent with a validity ring for placement preview.
 */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { footprintFor, placementMetaFor } from './roomDomain.js';

const GHOST_VALID = '#d99a5b'; // quiet amber — this spot works
const GHOST_INVALID = '#8f4f43'; // muted clay red — this spot is taken

const mat = (THREE, color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...opts });

function solid(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Soft grounding disc under a proxy (shared radial texture).
function contactShadow(THREE, shadowTex, radius) {
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.8 }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.011;
  return disc;
}

// Selected-state marker: a THIN warm outline ring plus a soft amber contact
// glow — small, close to the base, never a thick white hoop.
function selectMarker(THREE, radius, glowTex) {
  const marker = new THREE.Group();
  marker.name = 'select-marker';
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.9, 0.007, 8, 48),
    new THREE.MeshBasicMaterial({ color: GHOST_VALID, transparent: true, opacity: 0.65, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.018;
  marker.add(ring);
  if (glowTex) {
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2.4, radius * 2.4),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.55 }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.014;
    marker.add(glow);
  }
  marker.visible = false;
  return marker;
}

const BUILDERS = {
  // 잔불 램프 — round paper mood lamp: warm glowing globe on a low wood disc.
  // Clearly a small table/mood lamp, NOT a second tall floor stand.
  ember_lamp(THREE, group) {
    const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.035, 24), mat(THREE, '#5a4130', { roughness: 0.7 })));
    base.position.y = 0.0175;
    const globe = solid(new THREE.Mesh(
      new THREE.SphereGeometry(0.115, 24, 18),
      mat(THREE, '#e9dcc2', { roughness: 0.6, emissive: '#d99a5b', emissiveIntensity: 0.55 }),
    ));
    globe.position.y = 0.15;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.014, 12), mat(THREE, '#5a4130', { roughness: 0.7 }));
    cap.position.y = 0.268;
    group.add(base, globe, cap);
  },

  // 포근한 쿠션 — round plush pouf: low base, rolled rim, soft inner pad, in
  // cream tones clearly lighter than the fixed dark-brown cat bed.
  cushion(THREE, group) {
    const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.25, 0.07, 28), mat(THREE, '#a2825f', { roughness: 1 })));
    base.position.y = 0.035;
    const rim = solid(new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.062, 12, 36), mat(THREE, '#ac8d6a', { roughness: 1 })));
    rim.rotation.x = -Math.PI / 2;
    rim.scale.z = 0.75;
    rim.position.y = 0.09;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.028, 24), mat(THREE, '#97795a', { roughness: 1 }));
    pad.position.y = 0.088;
    pad.receiveShadow = true;
    group.add(base, rim, pad);
  },

  // 러그 — flat woven oval, muted terracotta a step lighter than the fixed rug.
  rug(THREE, group) {
    const body = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.014, 40), mat(THREE, '#8f5f45', { roughness: 1 })));
    body.scale.set(1.0, 1, 0.64);
    body.position.y = 0.007;
    const border = new THREE.Mesh(
      new THREE.TorusGeometry(0.485, 0.016, 8, 48),
      mat(THREE, '#5c3a28', { roughness: 1 }),
    );
    border.rotation.x = -Math.PI / 2;
    border.scale.set(1.0, 0.64, 1);
    border.position.y = 0.011;
    border.receiveShadow = true;
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.004, 24), mat(THREE, '#9a6a4e', { roughness: 1 }));
    medallion.position.y = 0.016;
    medallion.receiveShadow = true;
    group.add(body, border, medallion);
  },

  // 고양이집 — peaked-roof den with an arched dark doorway, like the art.
  cat_house(THREE, group) {
    const body = solid(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.34, 0.44, 3, 0.03), mat(THREE, '#7c6047', { roughness: 0.9 })));
    body.position.y = 0.17;
    const roof = solid(new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.24, 4), mat(THREE, '#523c2a', { roughness: 0.85, flatShading: true })));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.34 + 0.12;
    const archTop = new THREE.Mesh(new THREE.CircleGeometry(0.095, 24), new THREE.MeshBasicMaterial({ color: '#17100a' }));
    archTop.position.set(0, 0.2, 0.221);
    const archBody = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.15), new THREE.MeshBasicMaterial({ color: '#17100a' }));
    archBody.position.set(0, 0.125, 0.2215);
    group.add(body, roof, archTop, archBody);
  },

  // 화분 — slim ivory vase with a few thin branches and small sage leaf tufts.
  plant(THREE, group) {
    const body = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.096, 0.24, 20), mat(THREE, '#b7a68c', { roughness: 0.6 })));
    body.position.y = 0.12;
    const neck = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.062, 0.06, 16), mat(THREE, '#b7a68c', { roughness: 0.6 })));
    neck.position.y = 0.27;
    const branchMat = mat(THREE, '#4f3b26', { roughness: 0.9 });
    const branches = [
      [0, 0.44, 0, 0.3, 0, 0],
      [0.045, 0.42, 0.02, 0.26, 0.28, 0.1],
      [-0.05, 0.4, -0.02, 0.24, -0.32, -0.12],
    ];
    for (const [x, y, z, len, tiltZ, tiltX] of branches) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, len, 6), branchMat);
      b.position.set(x, y, z);
      b.rotation.z = tiltZ;
      b.rotation.x = tiltX;
      b.castShadow = true;
      group.add(b);
    }
    const leafA = mat(THREE, '#5c684d', { roughness: 0.95 });
    const leafB = mat(THREE, '#505c44', { roughness: 0.95 });
    const tufts = [
      [0.01, 0.58, 0, 0.05, leafA],
      [0.1, 0.52, 0.045, 0.038, leafB],
      [-0.1, 0.5, -0.04, 0.036, leafB],
      [-0.02, 0.52, 0.05, 0.03, leafA],
    ];
    for (const [x, y, z, r, m] of tufts) {
      const tuft = solid(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m));
      tuft.position.set(x, y, z);
      tuft.scale.y = 0.7;
      group.add(tuft);
    }
  },

  // 장난감 — a yarn ball beside a small plush shape, like the art pair.
  toy(THREE, group) {
    const yarn = solid(new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), mat(THREE, '#ab8a64', { roughness: 1 })));
    yarn.position.set(-0.07, 0.075, 0.01);
    const plushBody = solid(new THREE.Mesh(new THREE.SphereGeometry(0.06, 18, 14), mat(THREE, '#9c7c5f', { roughness: 1 })));
    plushBody.scale.set(1.35, 0.72, 0.95);
    plushBody.position.set(0.085, 0.046, -0.02);
    const plushHead = solid(new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 12), mat(THREE, '#a3846a', { roughness: 1 })));
    plushHead.position.set(0.165, 0.05, -0.02);
    group.add(yarn, plushBody, plushHead);
  },
};

// Fallback for any future catalogue id without a dedicated builder.
function defaultBuilder(THREE, group, itemId) {
  const fp = footprintFor(itemId);
  const body = solid(new THREE.Mesh(
    new RoundedBoxGeometry(fp.w * 0.9, fp.h, fp.d * 0.9, 3, Math.min(0.05, fp.h * 0.3)),
    mat(THREE, '#8a6c4f'),
  ));
  body.position.y = fp.h / 2;
  group.add(body);
}

// Placement-preview ghost dressing: the whole form goes semi-transparent, a
// validity ring + tinted disc sits at the base. setGhostValidity() flips the
// tint between quiet amber (valid) and muted clay red (blocked).
function ghostDress(THREE, group, radius, glowTex) {
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = false;
      obj.receiveShadow = false;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        m.transparent = true;
        m.opacity = Math.min(m.opacity ?? 1, 0.5);
        m.depthWrite = false;
      }
    }
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.011, 8, 48),
    new THREE.MeshBasicMaterial({ color: GHOST_VALID, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.name = 'ghost-ring';
  group.add(ring);
  if (glowTex) {
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2.5, radius * 2.5),
      new THREE.MeshBasicMaterial({ map: glowTex, color: GHOST_VALID, transparent: true, depthWrite: false, opacity: 0.6 }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.013;
    disc.name = 'ghost-disc';
    group.add(disc);
  }
}

export function setGhostValidity(group, valid) {
  const color = valid ? GHOST_VALID : GHOST_INVALID;
  const ring = group.getObjectByName('ghost-ring');
  if (ring) ring.material.color.set(color);
  const disc = group.getObjectByName('ghost-disc');
  if (disc) disc.material.color.set(color);
  group.userData.ghostValid = Boolean(valid);
}

export function buildItemProxy(THREE, item, shadowTex, { ghost = false, glowTex = null } = {}) {
  const group = new THREE.Group();
  group.name = ghost ? `ghost-${item.id}` : `item-${item.id}`;
  const fp = footprintFor(item.id);
  const meta = placementMetaFor(item.id);
  const groundRadius = Math.max(fp.w, fp.d) * 0.58;
  (BUILDERS[item.id] ?? ((t, g) => defaultBuilder(t, g, item.id)))(THREE, group);
  if (ghost) {
    ghostDress(THREE, group, Math.max(groundRadius, meta.radius), glowTex);
    group.userData = { itemId: item.id, itemName: item.name, ghostItem: true, ghostValid: true };
  } else {
    group.add(contactShadow(THREE, shadowTex, groundRadius));
    group.add(selectMarker(THREE, Math.max(groundRadius, meta.radius), glowTex));
    group.userData = { itemId: item.id, itemName: item.name, placedItem: true };
  }
  group.scale.setScalar(meta.realWorldScale);
  return group;
}
