/*
 * itemProxies — neutral grounded 3D stand-ins for placed catalogue items.
 *
 * ADAPTER BOUNDARY for future approved art: buildItemProxy() is the single
 * place a placement becomes a visible object. When approved transparent item
 * assets land (see ASSET_CONTRACT.md), each builder body is swapped for the
 * real asset mesh without touching the placement, raycast or persistence code.
 *
 * Until then every proxy is an honestly simple object that physically SITS on
 * the floor — a small lamp form, a low cushion form, a bowl-scale toy form —
 * never a floating framed card and never a claim of finished item art. Muted
 * warm materials only; shapes echo each item's catalogue footprint.
 */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { footprintFor } from './roomDomain.js';

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

// Selection ring — hidden until the item is selected in edit mode.
function selectRing(THREE, radius) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.014, 10, 48),
    new THREE.MeshBasicMaterial({ color: '#e8b06a', transparent: true, opacity: 0.9, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.name = 'select-ring';
  ring.visible = false;
  return ring;
}

const BUILDERS = {
  // 잔불 램프 — small floor lamp: base, stem, warm fabric shade.
  ember_lamp(THREE, group) {
    const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.03, 24), mat(THREE, '#2c1f16', { roughness: 0.7 })));
    base.position.y = 0.015;
    const stem = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.32, 12), mat(THREE, '#3a2a1d', { roughness: 0.6 })));
    stem.position.y = 0.19;
    const shade = solid(new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.108, 0.15, 24, 1, true),
      mat(THREE, '#d8be93', {
        roughness: 0.85,
        emissive: '#b97c3c',
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
      }),
    ));
    shade.position.y = 0.415;
    group.add(base, stem, shade);
  },

  // 포근한 쿠션 — low rounded fabric block with a dimple button.
  cushion(THREE, group) {
    const body = solid(new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.15, 0.44, 4, 0.06), mat(THREE, '#5f4531', { roughness: 1 })));
    body.position.y = 0.075;
    const button = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), mat(THREE, '#4a3323', { roughness: 1 })));
    button.position.y = 0.155;
    group.add(body, button);
  },

  // 러그 — flat woven oval with a darker border ring.
  rug(THREE, group) {
    const body = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.016, 40), mat(THREE, '#6b4a35', { roughness: 1 })));
    body.scale.set(1.12, 1, 0.62);
    body.position.y = 0.008;
    const border = new THREE.Mesh(
      new THREE.TorusGeometry(0.485, 0.018, 8, 48),
      mat(THREE, '#3e2b1d', { roughness: 1 }),
    );
    border.rotation.x = -Math.PI / 2;
    border.scale.set(1.12, 0.62, 1);
    border.position.y = 0.012;
    border.receiveShadow = true;
    group.add(body, border);
  },

  // 고양이집 — small covered den: rounded body, darker roof plate, round doorway.
  cat_house(THREE, group) {
    const body = solid(new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.48, 0.46, 4, 0.05), mat(THREE, '#4a3626', { roughness: 0.9 })));
    body.position.y = 0.24;
    const roof = solid(new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.055, 0.52, 3, 0.025), mat(THREE, '#31231a', { roughness: 0.85 })));
    roof.position.y = 0.5;
    const doorway = new THREE.Mesh(
      new THREE.CircleGeometry(0.115, 28),
      new THREE.MeshBasicMaterial({ color: '#120b07' }),
    );
    doorway.position.set(0, 0.21, 0.234);
    group.add(body, roof, doorway);
  },

  // 화분 — clay pot with a few rounded leaf masses in muted moss green.
  plant(THREE, group) {
    const pot = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.082, 0.16, 20), mat(THREE, '#67462f', { roughness: 0.75 })));
    pot.position.y = 0.08;
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.012, 20), mat(THREE, '#241811', { roughness: 1 }));
    soil.position.y = 0.158;
    const leafMat = mat(THREE, '#4d5940', { roughness: 0.95 });
    const leafMatDim = mat(THREE, '#434f38', { roughness: 0.95 });
    const puffs = [
      [0, 0.32, 0, 0.105, leafMat],
      [0.07, 0.27, 0.04, 0.082, leafMatDim],
      [-0.075, 0.28, -0.03, 0.075, leafMatDim],
    ];
    for (const [x, y, z, r, m] of puffs) {
      const puff = solid(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m));
      puff.position.set(x, y, z);
      puff.scale.y = 0.82;
      group.add(puff);
    }
    group.add(pot, soil);
  },

  // 장난감 — a small ball beside a flat play ring.
  toy(THREE, group) {
    const ball = solid(new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 16), mat(THREE, '#7c5136', { roughness: 0.55 })));
    ball.position.set(-0.05, 0.07, 0);
    const ring = solid(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 10, 30), mat(THREE, '#3c2b1e', { roughness: 0.8 })));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0.09, 0.02, 0.03);
    group.add(ball, ring);
  },
};

// Fallback for any future catalogue id without a dedicated builder.
function defaultBuilder(THREE, group, itemId) {
  const fp = footprintFor(itemId);
  const body = solid(new THREE.Mesh(
    new RoundedBoxGeometry(fp.w * 0.9, fp.h, fp.d * 0.9, 3, Math.min(0.05, fp.h * 0.3)),
    mat(THREE, '#5d442f'),
  ));
  body.position.y = fp.h / 2;
  group.add(body);
}

export function buildItemProxy(THREE, item, shadowTex) {
  const group = new THREE.Group();
  group.name = `item-${item.id}`;
  const fp = footprintFor(item.id);
  const groundRadius = Math.max(fp.w, fp.d) * 0.58;
  (BUILDERS[item.id] ?? ((t, g) => defaultBuilder(t, g, item.id)))(THREE, group);
  group.add(contactShadow(THREE, shadowTex, groundRadius));
  group.add(selectRing(THREE, groundRadius));
  group.userData = { itemId: item.id, itemName: item.name, placedItem: true };
  return group;
}
