import { useEffect, useRef, useState } from 'react';
import { resolveItemAsset, resolveRoomAsset } from '../constants/petAssets.js';
import { DECOR_ITEMS } from '../constants/roomItems.js';

/*
 * PetPlacementEditor — the practical "배치 편집" mode (PRD §0.6.9).
 *
 * HONESTY NOTE: the current item art is NOT transparent overlay sprites
 * (petAssets.js keeps every `spriteReady: false`). The finished-room scene mode
 * is the honest default view. This editor is an explicit, opt-in *placement
 * preview*: it lets you arrange owned items by dragging real-but-rectangular item
 * images over a plain room. It is clearly labelled as an MVP preview and never
 * claims to be the final decorated room — that waits on approved transparent
 * sprites. No `spriteReady` flag is flipped to reach this mode.
 *
 * Drag: Pointer Events (mouse + touch). The dragged token follows the pointer
 * live via a local position; the move is committed to App state once on drop, so
 * the placement z-order isn't inflated by every intermediate move.
 */

const PAD = 0.1; // keep token centres inside the stage edges
const clamp01 = (v) => Math.min(1 - PAD, Math.max(PAD, v));

export default function PetPlacementEditor({
  theme = 'empty',
  placements = [],
  ownedItems = [],
  onMove,
  onReset,
  onDone,
  label = '아이템 배치 미리보기',
}) {
  const stageRef = useRef(null);
  const dragRef = useRef(null); // { itemId }
  const [draggingId, setDraggingId] = useState(null);
  // Live position of the token currently being dragged: { itemId, x, y }.
  const [livePos, setLivePos] = useState(null);
  // Stable refs to the live drag listeners so add/remove always use identical
  // references and a drag is ALWAYS cleaned up — on drop, pointercancel, or unmount.
  const moveListener = useRef(null);
  const upListener = useRef(null);

  const detach = () => {
    if (moveListener.current) window.removeEventListener('pointermove', moveListener.current);
    if (upListener.current) {
      window.removeEventListener('pointerup', upListener.current);
      window.removeEventListener('pointercancel', upListener.current);
    }
    moveListener.current = null;
    upListener.current = null;
  };

  // Remove any lingering window listeners if the editor unmounts mid-drag.
  useEffect(() => detach, []);

  const roomSrc = resolveRoomAsset(theme);
  const placementOf = (itemId) => placements.find((p) => p.itemId === itemId) ?? null;

  // Owned decor become movable stand-in tokens. Un-placed items sit at their
  // default spot so they are visible and draggable from the start.
  const tokens = DECOR_ITEMS.filter((it) => ownedItems.includes(it.id)).map((it) => {
    const placement = placementOf(it.id);
    return {
      item: it,
      x: placement?.x ?? it.defaultPlacement?.x ?? 0.5,
      y: placement?.y ?? it.defaultPlacement?.y ?? 0.62,
      scale: placement?.scale ?? it.defaultPlacement?.scale ?? 1,
      z: placement?.z ?? 0,
    };
  });

  const normalize = (clientX, clientY) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    };
  };

  const startDrag = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    detach(); // defensively clear any prior drag's listeners
    dragRef.current = { itemId };
    setDraggingId(itemId);
    const start = normalize(e.clientX, e.clientY);
    if (start) setLivePos({ itemId, x: start.x, y: start.y });

    const onPointerMove = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;
      const pos = normalize(ev.clientX, ev.clientY);
      if (pos) setLivePos({ itemId: drag.itemId, x: pos.x, y: pos.y });
    };
    const onPointerUp = (ev) => {
      const drag = dragRef.current;
      dragRef.current = null;
      detach();
      setDraggingId(null);
      setLivePos(null);
      if (!drag) return;
      // A cancelled gesture keeps the item at its last committed spot.
      if (ev.type === 'pointercancel') return;
      const pos = normalize(ev.clientX, ev.clientY);
      if (pos) onMove?.(drag.itemId, pos.x, pos.y);
    };

    moveListener.current = onPointerMove;
    upListener.current = onPointerUp;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <div className="placement-editor">
      <div
        ref={stageRef}
        className="pet-stage pet-room placement-stage"
        data-theme={theme}
        role="group"
        aria-label={label}
      >
        {roomSrc ? <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" /> : null}

        {tokens
          .slice()
          .sort((a, b) => a.z - b.z)
          .map(({ item, x, y, scale }) => {
            const live = draggingId === item.id && livePos ? livePos : { x, y };
            const src = resolveItemAsset(item.assetId);
            return (
              <button
                key={item.id}
                type="button"
                className="placement-token"
                data-dragging={draggingId === item.id}
                style={{
                  left: `${live.x * 100}%`,
                  top: `${live.y * 100}%`,
                  '--scale': scale,
                  zIndex: draggingId === item.id ? 50 : 1,
                }}
                onPointerDown={(e) => startDrag(item.id, e)}
                aria-label={`${item.name} · 끌어서 옮기기`}
              >
                {src ? (
                  <img className="placement-token-img" src={src} alt="" draggable={false} />
                ) : (
                  <span className="placement-token-pending" aria-hidden="true" />
                )}
              </button>
            );
          })}

        {tokens.length === 0 ? (
          <div className="placement-empty">
            <p className="placement-empty-copy">
              배치할 아이템이 아직 없어요. 상점에서 아이템을 데려오면 여기에서 옮길 수 있어요.
            </p>
          </div>
        ) : null}
      </div>

      <p className="placement-note">
        배치 미리보기 (MVP) · 지금 보이는 건 임시 사각 이미지예요. 투명 아이템 아트가 준비되면
        정식 꾸미기로 전환돼요. 끌어서 위치만 미리 잡아볼 수 있어요.
      </p>

      <div className="placement-actions">
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          초기화
        </button>
        <button type="button" className="btn btn-primary" onClick={onDone}>
          배치 완료
        </button>
      </div>
    </div>
  );
}
