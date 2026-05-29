import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CatFigure } from './EmberCat.jsx';
import {
  isItemSpriteReady,
  resolveItemAsset,
  resolvePetStageRoomAsset,
  petStageArtReady,
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

const clamp01 = (v) => Math.min(1 - PAD, Math.max(PAD, v));

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
  const resolvedSceneMode = sceneMode ?? shouldUsePetSceneMode({ catState: catMotion });

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

  return (
    <>
      <div
        ref={stageRef}
        className={stageClass}
        data-theme={theme}
        role="group"
        aria-label={label ?? '고양이 방 편집'}
      >
        {artReady ? (
          <>
            <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" />
            {resolvedSceneMode ? (
              onCatTap ? (
                <button
                  type="button"
                  className="pet-room-scene-tap"
                  onClick={onCatTap}
                  aria-label="고양이 방 쓰다듬기"
                />
              ) : null
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
          현재는 완성된 방 이미지로 표시 중이에요. 투명 아이템 이미지가 연결되면 직접 배치할 수 있어요.
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
