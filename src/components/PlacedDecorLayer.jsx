import { resolveItemAsset } from '../constants/petAssets.js';
import { ITEM_BY_ID } from '../constants/roomItems.js';

/*
 * PlacedDecorLayer — the ONE placed-decor representation, shared by the editing
 * surface (PetRoomDecorator) and the normal room view (PetRoomEditor).
 *
 * WHY IT EXISTS (Founder P1 closeout): placing an item and pressing 배치 마치기 used
 * to make the item vanish from the room — the screen only claimed the arrangement
 * was still saved. A saved-count sentence is not placement. The same persisted
 * placements now render in both modes, from this one module, so the object the user
 * put down is still the object they see.
 *
 * HONESTY MODEL (unchanged): the decor art is opaque rectangular crops, NOT
 * transparent alpha sprites — petAssets keeps every spriteReady:false and nothing
 * here raises it. This layer does not claim a seamless composite; it feathers the
 * honest crop into a soft disc with a contact shadow, which is the best available v0
 * representation of "that object is in the room". Transparent alpha decor art stays
 * a later asset refinement, and until it lands the crop is what it is.
 *
 * VIEW MODE CARRIES NO EDITING CHROME: no name label, no outline, no bounding box,
 * no drag handle, and pointer-events:none so the room's own tap target still works.
 * Every editing affordance lives in PetRoomDecorator, behind 아이템 배치하기.
 */

/*
 * PLACED look. A placed item used to render as a small crop under an always-on dark
 * name pill — against the finished room art the crop nearly vanished and the LABEL
 * became the object, so the room read as a finished painting with debug stickers on
 * it. This treatment drops the label and lets the object carry itself: a larger crop,
 * a much softer feather so no rectangular surface edge survives, and a real contact
 * shadow so it sits on the floor instead of floating over it. components.css is a
 * pinned canonical authority (K2D-1K-A2/A3), so these are inline overrides of the
 * existing .room-card rules — no stylesheet change.
 */
export const PLACED_IMG_STYLE = Object.freeze({
  // Only a little larger than the 54px stylesheet size. The source crops are wide
  // landscape photos squared off by object-fit:cover, so scaling them up makes the
  // blob read MORE like a pasted disc, not less — and a 76px disc dropped on the
  // cushion's default spot climbed over the cat's face.
  width: 64,
  height: 64,
  // Feathered well inside the crop (was 66%/72%) — the opaque art's own edge and the
  // little patch of floor baked into it fade out before they can read as a boundary.
  WebkitMaskImage: 'radial-gradient(circle at 50% 46%, #000 40%, rgba(0,0,0,0.55) 60%, transparent 76%)',
  maskImage: 'radial-gradient(circle at 50% 46%, #000 40%, rgba(0,0,0,0.55) 60%, transparent 76%)',
  // Contact shadow: tight and low, so the object reads as resting ON the room floor.
  filter: 'drop-shadow(0 6px 7px rgba(22, 13, 6, 0.55)) saturate(1.05)',
});

// While an item is selected for moving/removing it needs SOME affordance, but the
// stylesheet's 2px square outline drew a box around a feathered circle — the exact
// "bounding" feel Founder called out. A warm halo follows the object's own shape.
// EDIT MODE ONLY: nothing in the normal room view ever uses this.
export const SELECTED_IMG_STYLE = Object.freeze({
  ...PLACED_IMG_STYLE,
  outline: 'none',
  filter:
    'drop-shadow(0 6px 7px rgba(22, 13, 6, 0.55)) drop-shadow(0 0 5px rgba(247, 194, 122, 0.95)) saturate(1.05)',
});

/*
 * Read-only placed decor for the normal room view. Same coordinates, same crops and
 * the same feathered treatment as edit mode — the objects simply stop being handles.
 * Returns the plain cards so the caller can drop them straight into its stage.
 */
export default function PlacedDecorLayer({ placements = [] }) {
  const ordered = [...placements]
    .filter((p) => ITEM_BY_ID[p.itemId])
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  if (ordered.length === 0) return null;
  return (
    <>
      {ordered.map((p) => {
        const item = ITEM_BY_ID[p.itemId];
        const src = resolveItemAsset(item.assetId);
        if (!src) return null;
        return (
          <div
            key={p.itemId}
            className="room-card"
            data-item={p.itemId}
            data-placed-view="1"
            aria-hidden="true"
            style={{
              // The same normalized-percent expression PetRoomDecorator places by, so
              // an object does not shift by a pixel across 배치 마치기.
              left: `${(p.x ?? 0.5) * 100}%`,
              top: `${(p.y ?? 0.6) * 100}%`,
              zIndex: (p.z ?? 1) + 3,
              pointerEvents: 'none',
            }}
          >
            <span className="room-card-face">
              <img
                className="room-card-img"
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                style={PLACED_IMG_STYLE}
              />
            </span>
          </div>
        );
      })}
    </>
  );
}
