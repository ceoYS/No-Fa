/*
 * RoomShell — the full 3D room: wood floor, four plaster walls with baseboards
 * and a top frame band (open ceiling), a night window, a wall shelf, a low
 * table, a warm floor lamp, a round rug, an empty cat bed and a floor cushion.
 *
 * 360° viewing model: the camera orbits OUTSIDE the room (dollhouse cutaway).
 * Each wall is its own group carrying its outward normal + center; PetRoom3D
 * hides whichever walls sit between the camera and the room every frame, so a
 * full horizontal orbit never shows a wall back or an empty void seam.
 *
 * All surface detail is procedural CanvasTexture work (roomTextures.js) — no
 * external texture URLs, no bundled image assets. The cat bed itself stays
 * plain furniture; the cat resting on it is the separate procedural rig
 * (catRig.js, mounted by PetRoom3D at the cat anchor — see ASSET_CONTRACT.md).
 *
 * Plain builder functions (no react wrapper): the caller owns the scene graph
 * and the dispose pass covers every geometry/material/texture created here.
 */
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ROOM3D, CAT_ANCHOR, SCENERY } from './roomDomain.js';
import {
  makeWoodFloorTexture,
  makePlasterTexture,
  makeRugTexture,
  makeNightWindowTexture,
} from './roomTextures.js';

// B-3 separation palette: walls warm ivory/taupe (light), floor dark walnut,
// rug muted terracotta, fixed furniture dark wood, scenery cushion warm beige.
// Placeable item proxies (itemProxies.js) sit one value step lighter again.
const WOOD_DARK = '#241812';
const WOOD_MID = '#43301f';
const WOOD_WARM = '#3f2c1e';
const FABRIC_BED = '#6d4c34';
const FABRIC_BED_RIM = '#6d4f3a';
const FABRIC_BED_PAD = '#5c412d';
const IVORY = '#c6b89f';
const IVORY_SHADE = '#d8be93';

export function buildRoomShell(THREE, shadowTex) {
  const group = new THREE.Group();
  group.name = 'room-shell';
  const { width, depth, height } = ROOM3D;
  const halfW = width / 2;
  const halfD = depth / 2;

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0, ...opts });

  const solid = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const ground = (radius, x, z, opacity = 0.75) => {
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity }),
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, 0.01, z);
    return disc;
  };

  // ── floor ───────────────────────────────────────────────────────────────
  const floorTex = makeWoodFloorTexture(THREE);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mat('#83705f', { map: floorTex, roughness: 0.82 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // ── walls (one group per side, cutaway metadata attached) ───────────────
  const plasterTex = makePlasterTexture(THREE);
  const wallMat = () =>
    mat('#ded2c0', { map: plasterTex, roughness: 0.97, side: THREE.DoubleSide });
  const slabT = 0.09;
  const bandH = 0.12;
  const boardH = 0.1;

  const walls = [];
  const wallDefs = [
    { key: 'back', normal: [0, 0, -1], size: [width + slabT * 2, height, slabT], pos: [0, height / 2, -halfD - slabT / 2], innerLen: width, axis: 'x' },
    { key: 'front', normal: [0, 0, 1], size: [width + slabT * 2, height, slabT], pos: [0, height / 2, halfD + slabT / 2], innerLen: width, axis: 'x' },
    { key: 'west', normal: [-1, 0, 0], size: [slabT, height, depth], pos: [-halfW - slabT / 2, height / 2, 0], innerLen: depth, axis: 'z' },
    { key: 'east', normal: [1, 0, 0], size: [slabT, height, depth], pos: [halfW + slabT / 2, height / 2, 0], innerLen: depth, axis: 'z' },
  ];

  for (const def of wallDefs) {
    const wg = new THREE.Group();
    wg.name = `wall-${def.key}`;

    const slab = new THREE.Mesh(new THREE.BoxGeometry(...def.size), wallMat());
    slab.position.set(...def.pos);
    slab.receiveShadow = true;
    wg.add(slab);

    // Inner-face offset for trim pieces (baseboard, top band): the trim sits
    // just inside its OWN wall, i.e. pushed toward the wall along its outward
    // normal. B-3 fix: the sign was inverted, which attached every wall's
    // trim to the OPPOSITE side of the room — so a VISIBLE far wall carried a
    // floating dark band across the near (cutaway) edge, the reported
    // black-band artifact at high pitch / close zoom.
    const n = def.normal;
    const innerX = def.axis === 'z' ? n[0] * (halfW - 0.025) : 0;
    const innerZ = def.axis === 'x' ? n[2] * (halfD - 0.025) : 0;
    const trimSize = def.axis === 'x' ? [def.innerLen, 0, 0.05] : [0.05, 0, def.innerLen];

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(trimSize[0] || 0.05, boardH, trimSize[2] || 0.05),
      mat(WOOD_DARK, { roughness: 0.8 }),
    );
    board.position.set(innerX, boardH / 2, innerZ);
    board.receiveShadow = true;
    wg.add(board);

    // Top frame band + cap — kept close to the plaster value so a side wall
    // seen from a corner-high view never draws a hard black stripe across
    // the scene.
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(trimSize[0] || 0.07, bandH, trimSize[2] === 0.05 ? 0.07 : trimSize[2] || 0.07),
      mat('#4a3b2c', { roughness: 0.85 }),
    );
    band.position.set(innerX, height - bandH / 2, innerZ);
    wg.add(band);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(def.size[0] + 0.02, 0.05, def.size[2] + 0.02),
      mat('#3a2d21', { roughness: 0.9 }),
    );
    cap.position.set(def.pos[0], height + 0.025, def.pos[2]);
    wg.add(cap);

    group.add(wg);
    walls.push({
      key: def.key,
      group: wg,
      normal: new THREE.Vector3(...def.normal),
      center: new THREE.Vector3(def.pos[0], height / 2, def.pos[2]),
    });
  }

  const wallGroupOf = (key) => walls.find((w) => w.key === key).group;

  // ── night window (back wall) ─────────────────────────────────────────────
  {
    const wg = wallGroupOf('back');
    const { x, y, w, h } = SCENERY.window;
    const faceZ = -halfD;
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({
        map: makeNightWindowTexture(THREE),
        color: '#9aa4b2',
        emissive: '#93a0b4',
        emissiveIntensity: 0.38,
        roughness: 0.4,
        metalness: 0,
      }),
    );
    glass.material.emissiveMap = glass.material.map;
    glass.position.set(x, y, faceZ + 0.008);
    wg.add(glass);

    const frameMat = mat(WOOD_MID, { roughness: 0.7 });
    const fT = 0.055; // frame thickness
    const fD = 0.07; // frame protrusion
    const pieces = [
      [w + fT * 2, fT, fD, x, y + h / 2 + fT / 2, faceZ + fD / 2],
      [w + fT * 2, fT, fD, x, y - h / 2 - fT / 2, faceZ + fD / 2],
      [fT, h, fD, x - w / 2 - fT / 2, y, faceZ + fD / 2],
      [fT, h, fD, x + w / 2 + fT / 2, y, faceZ + fD / 2],
      [0.022, h, 0.03, x, y, faceZ + 0.018], // vertical mullion
      [w, 0.022, 0.03, x, y + 0.08, faceZ + 0.018], // horizontal mullion
    ];
    for (const [sw, sh, sd, px, py, pz] of pieces) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), frameMat);
      p.position.set(px, py, pz);
      p.castShadow = true;
      wg.add(p);
    }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.035, 0.13), frameMat);
    sill.position.set(x, y - h / 2 - fT - 0.017, faceZ + 0.065);
    sill.castShadow = true;
    wg.add(sill);
  }

  // ── wall shelf with books and a jar (west wall) ──────────────────────────
  {
    const wg = wallGroupOf('west');
    const faceX = -halfW;
    const { y, z } = SCENERY.shelf;
    const plankMat = mat(WOOD_MID, { roughness: 0.7 });
    const heights = [y, y - 0.34];
    for (const py of heights) {
      const plank = solid(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.032, 0.82), plankMat));
      plank.position.set(faceX + 0.12, py, z);
      wg.add(plank);
      for (const bz of [z - 0.3, z + 0.3]) {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.03), mat(WOOD_DARK));
        bracket.position.set(faceX + 0.09, py - 0.04, bz);
        wg.add(bracket);
      }
    }
    // books on the upper plank — quiet spine colours (ivory / wood / ink)
    const spines = ['#b3a284', '#4a3628', '#23180f', '#6b4a35'];
    spines.forEach((color, i) => {
      const bh = 0.15 + (i % 2) * 0.035;
      const book = solid(new THREE.Mesh(new THREE.BoxGeometry(0.13, bh, 0.036), mat(color, { roughness: 0.85 })));
      book.position.set(faceX + 0.115, y + 0.016 + bh / 2, z - 0.24 + i * 0.052);
      wg.add(book);
    });
    // ceramic jar + a lying book on the lower plank
    const jar = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.11, 18), mat(IVORY, { roughness: 0.35 })));
    jar.position.set(faceX + 0.115, y - 0.34 + 0.016 + 0.055, z + 0.2);
    wg.add(jar);
    const lying = solid(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.1), mat('#4a3628', { roughness: 0.85 })));
    lying.position.set(faceX + 0.115, y - 0.34 + 0.016 + 0.015, z - 0.14);
    wg.add(lying);
  }

  // ── low table with a book and jar (freestanding, back-left) ─────────────
  {
    const { x, z } = SCENERY.table;
    const top = solid(new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.05, 0.42, 3, 0.02), mat(WOOD_WARM, { roughness: 0.62 })));
    top.position.set(x, 0.42, z);
    group.add(top);
    for (const [lx, lz] of [[-0.32, -0.15], [0.32, -0.15], [-0.32, 0.15], [0.32, 0.15]]) {
      const leg = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.4, 12), mat(WOOD_DARK, { roughness: 0.7 })));
      leg.position.set(x + lx, 0.2, z + lz);
      group.add(leg);
    }
    const under = solid(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.028, 0.32), mat(WOOD_MID, { roughness: 0.75 })));
    under.position.set(x, 0.16, z);
    group.add(under);
    const book = solid(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.12), mat('#b3a284', { roughness: 0.85 })));
    book.position.set(x - 0.16, 0.46, z + 0.04);
    book.rotation.y = 0.32;
    group.add(book);
    const cup = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.07, 16), mat(IVORY, { roughness: 0.35 })));
    cup.position.set(x + 0.2, 0.48, z - 0.06);
    group.add(cup);
    group.add(ground(0.46, x, z, 0.6));
  }

  // ── warm floor lamp (freestanding, back-right; the key light's motivation)
  {
    const { x, z, shadeY } = SCENERY.lamp;
    const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.165, 0.03, 26), mat(WOOD_DARK, { roughness: 0.7 })));
    base.position.set(x, 0.015, z);
    const pole = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, shadeY - 0.16, 14), mat('#3a2a1d', { roughness: 0.6 })));
    pole.position.set(x, (shadeY - 0.16) / 2 + 0.03, z);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.195, 0.3, 26, 1, true),
      mat(IVORY_SHADE, {
        roughness: 0.85,
        emissive: '#c07a35',
        emissiveIntensity: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    shade.position.set(x, shadeY, z);
    group.add(base, pole, shade, ground(0.24, x, z, 0.6));
  }

  // ── round rug under the room's heart ─────────────────────────────────────
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 56),
    mat('#a89584', { map: makeRugTexture(THREE), roughness: 0.98, transparent: true }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.12, 0.006, 0.42);
  rug.receiveShadow = true;
  group.add(rug);

  // ── cat bed at the cat anchor — the rig (catRig.js) rests on this pad ────
  {
    const { x, z } = CAT_ANCHOR.position;
    const base = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.36, 0.07, 32), mat(FABRIC_BED, { roughness: 1 })));
    base.position.set(x, 0.035, z);
    const rim = solid(new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.082, 14, 40), mat(FABRIC_BED_RIM, { roughness: 1 })));
    rim.rotation.x = -Math.PI / 2;
    rim.scale.z = 0.72; // local z = world height after the flat rotation — a low bolster, not a ring
    rim.position.set(x, 0.082, z);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.03, 28), mat(FABRIC_BED_PAD, { roughness: 1 }));
    pad.position.set(x, 0.08, z);
    pad.receiveShadow = true;
    group.add(base, rim, pad);
  }

  // ── floor cushion by the east wall — warm beige, reads soft against walnut
  {
    const { x, z } = SCENERY.cushion;
    const body = solid(new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.13, 0.38, 4, 0.055), mat('#7a6248', { roughness: 1 })));
    body.position.set(x, 0.065, z);
    group.add(body, ground(0.3, x, z, 0.55));
  }

  return { group, floor, walls };
}
