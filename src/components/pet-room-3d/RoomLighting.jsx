/*
 * RoomLighting — the light rig for the full 3D pet room.
 *
 * Four sources, each motivated by something visible in the shell:
 *   1. low warm ambient + hemisphere so ink shadows never crush to black,
 *   2. an amber key spot from the lamp corner — the one real shadow caster
 *      (soft PCF, 1024 map, cheap enough for mobile GPUs),
 *   3. a warm point light sitting inside the floor lamp's shade,
 *   4. a faint cool directional fill from the night window, which keeps the
 *      palette from collapsing into a single orange and separates materials.
 *
 * three r155+ physical lighting: spot/point intensity is candela-like and
 * falls off with `decay`, so values are tuned for this ~3.6 m room.
 */
import { CAT_ANCHOR, SCENERY } from './roomDomain.js';

export function buildRoomLighting(THREE) {
  const group = new THREE.Group();
  group.name = 'room-lighting';

  // B-3: the walls moved from deep brown to warm ivory, so they now bounce
  // real light — the flat fills back off a step to keep the ember mood.
  group.add(new THREE.AmbientLight('#3d3126', 0.66));
  group.add(new THREE.HemisphereLight('#2e2419', '#4a3728', 0.6));

  // Amber key light from the lamp corner — the shadow caster.
  const key = new THREE.SpotLight('#ffc08a', 22);
  key.position.set(SCENERY.lamp.x + 0.2, 2.5, SCENERY.lamp.z + 1.7);
  key.angle = 1.05;
  key.penumbra = 0.85;
  key.decay = 1.25;
  key.distance = 0;
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  key.shadow.camera.near = 0.4;
  key.shadow.camera.far = 9;
  key.target.position.set(CAT_ANCHOR.position.x + 0.05, 0, CAT_ANCHOR.position.z - 0.25);
  group.add(key);
  group.add(key.target);

  // Warm pool from inside the floor lamp's shade.
  const lamp = new THREE.PointLight('#ffb36b', 4.5, 3.8, 1.7);
  lamp.position.set(SCENERY.lamp.x, SCENERY.lamp.shadeY + 0.03, SCENERY.lamp.z);
  group.add(lamp);

  // Faint cool night fill from the window — restrained, no shadow.
  const window = new THREE.DirectionalLight('#7e8ea4', 0.34);
  window.position.set(SCENERY.window.x, 2.1, -2.8);
  window.target.position.set(0, 0.5, 0.6);
  group.add(window);
  group.add(window.target);

  // Soft neutral-warm corner fill opposite the lamp, so the far quadrant
  // keeps readable depth instead of dropping to pure black (B-3: nudged up —
  // at min-zoom/high-pitch poses the far corner was crushing to near-black).
  const fill = new THREE.PointLight('#a98963', 2.2, 7, 2);
  fill.position.set(-1.15, 2.15, 1.05);
  group.add(fill);

  // Faint second fill low over the back-west corner for the same reason; no
  // shadows, tiny reach — it only keeps the darkest floor readable.
  const cornerFill = new THREE.PointLight('#8d7458', 1.1, 4.5, 2);
  cornerFill.position.set(-1.2, 1.5, -0.9);
  group.add(cornerFill);

  return { group };
}
