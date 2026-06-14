import { useRef, useState } from 'react';
import { resolveItemAsset, resolveRoomSceneAsset } from '../constants/petAssets.js';
import { ITEM_BY_ID } from '../constants/roomItems.js';

/*
 * PetRoomDecorator — the REAL room-decorating surface (PRD §0.6.9, RC-2B).
 *
 * HONESTY MODEL: the decor art is rectangular, non-transparent crops, NOT
 * transparent overlay sprites (petAssets keeps every spriteReady:false). So a
 * placed item is shown as a deliberately FRAMED, LABELLED card — never pasted as
 * if it were a seamless sprite composited into the scene. A framed card is an
 * honest "you put this here" token, so real placement needs no fake sprite claim.
 *
 * Placement is coordinate-based: every card sits at a normalized (x, y) fraction
 * of the stage, so the layout survives the 390px mobile form factor. Coordinates
 * are persisted by App (placements → saveState), so a reload keeps the room.
 *
 * Two ways to place from the tray (both real, both touch + mouse):
 *   - tap an item   → it lands at its catalogue default spot (the click path)
 *   - drag an item  → it lands where the pointer is released on the stage
 * Pointer Events drive the drag (the stage sets touch-action:none so a drag never
 * scrolls the page). Repositioning an already-placed card lands in the next commit.
 */

const PAD = 0.1; // keep card centres inside the stage edges (normalized)
const TAP_SLOP = 6; // px of travel under which a press is a tap, not a drag

const clamp01 = (v) => Math.min(1 - PAD, Math.max(PAD, v));

// Honest framed item card — the real (rectangular) art as a thumbnail plus the
// item name. Clearly a card, not a transparent sprite pretending to be in-scene.
function ItemCardFace({ item, className = 'room-card-face' }) {
  const src = resolveItemAsset(item.assetId);
  return (
    <span className={className}>
      {src ? (
        <img className="room-card-img" src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="room-card-pending" aria-hidden="true" />
      )}
      <span className="room-card-name">{item.name}</span>
    </span>
  );
}

export default function PetRoomDecorator({
  theme = 'empty',
  placements = [],
  ownedDecor = [],
  editable = false,
  reacting = false,
  onPlace,
  onMove,
  onRemove,
  onDone,
  onCatTap,
  label,
}) {
  const stageRef = useRef(null);
  const dragRef = useRef(null); // { mode:'tray'|'move', id, item?, startX, startY, moved }
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState(null); // tray drag ghost { item, x, y } in client px
  const [livePos, setLivePos] = useState(null); // live normalized pos of the card being moved
  const [selectedId, setSelectedId] = useState(null);

  const placedIds = new Set(placements.map((p) => p.itemId));
  const trayItems = ownedDecor.filter((it) => !placedIds.has(it.id));
  const roomSrc = resolveRoomSceneAsset(theme);

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
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
    setGhost(null);
    setLivePos(null);
    if (!drag) return;

    if (drag.mode === 'tray') {
      if (!drag.moved) return; // no travel → the click handler tap-places it
      suppressClick.current = true; // a real drag committed → don't ALSO tap-place
      const pos = normalizeFromClient(e.clientX, e.clientY);
      if (pos && pos.inside) onPlace?.(drag.id, pos.x, pos.y);
      return;
    }
    // mode 'move' — repositioning an already-placed card.
    if (!drag.moved) {
      setSelectedId((cur) => (cur === drag.id ? null : drag.id)); // a tap selects / deselects
      return;
    }
    const pos = normalizeFromClient(e.clientX, e.clientY);
    if (pos) onMove?.(drag.id, pos.x, pos.y); // clamped → never falls off the stage
  };

  const onDragMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > TAP_SLOP) drag.moved = true;
    if (drag.mode === 'tray') {
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
      return;
    }
    const pos = normalizeFromClient(e.clientX, e.clientY); // live-follow the moving card
    if (pos) setLivePos({ id: drag.id, x: pos.x, y: pos.y });
  };

  const beginTrayDrag = (item, e) => {
    if (!editable) return;
    suppressClick.current = false;
    dragRef.current = { mode: 'tray', id: item.id, item, startX: e.clientX, startY: e.clientY, moved: false };
    setGhost({ item, x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag);
  };

  // Reposition a placed card (mouse + touch). A press with no travel is a tap → it
  // selects the card (revealing 보관함으로 치우기); a press that travels moves it live.
  const beginCardDrag = (placement, e) => {
    if (!editable) return;
    e.preventDefault();
    dragRef.current = { mode: 'move', id: placement.itemId, startX: e.clientX, startY: e.clientY, moved: false };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag);
  };

  // Tap-to-place (also the keyboard / click path the QA harness drives): drop the
  // item at its catalogue default spot, or the stage centre if it has none.
  const tapPlace = (item) => {
    if (!editable) return;
    if (suppressClick.current) {
      suppressClick.current = false;
      return; // this click trailed a real drag that already committed
    }
    const d = item.defaultPlacement;
    onPlace?.(item.id, clamp01(d?.x ?? 0.5), clamp01(d?.y ?? 0.62));
  };

  const stageClass = [
    'pet-stage',
    'room-decorator-stage',
    editable && 'is-editing',
    reacting && 'is-reacting',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="room-decorator">
      <div
        ref={stageRef}
        className={stageClass}
        data-theme={theme}
        role={editable ? 'group' : 'img'}
        aria-label={label ?? '고양이 방'}
      >
        {roomSrc ? (
          <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" />
        ) : null}

        {placements.map((p) => {
          const item = ITEM_BY_ID[p.itemId];
          if (!item) return null;
          const live = livePos && livePos.id === p.itemId ? livePos : null;
          const x = live ? live.x : p.x ?? 0.5;
          const y = live ? live.y : p.y ?? 0.6;
          const style = { left: `${x * 100}%`, top: `${y * 100}%`, zIndex: (p.z ?? 1) + 3 };
          if (!editable) {
            return (
              <div key={p.itemId} className="room-card" style={style} data-item={p.itemId}>
                <ItemCardFace item={item} />
              </div>
            );
          }
          const cls = `room-card${selectedId === p.itemId ? ' is-selected' : ''}${live ? ' is-dragging' : ''}`;
          return (
            <button
              key={p.itemId}
              type="button"
              className={cls}
              style={style}
              data-item={p.itemId}
              aria-label={`${item.name} · 끌어서 옮기기`}
              aria-pressed={selectedId === p.itemId}
              onPointerDown={(e) => beginCardDrag(p, e)}
            >
              <ItemCardFace item={item} />
            </button>
          );
        })}

        {!editable && onCatTap ? (
          <button type="button" className="pet-room-scene-tap" onClick={onCatTap} aria-label="고양이 방 쓰다듬기" />
        ) : null}
      </div>

      {editable ? (
        <>
          <p className="room-decorator-help" aria-live="polite">
            아이템을 눌러 방에 놓거나, 끌어서 원하는 자리에 놓아보세요. 놓인 카드는 다시 끌어 옮길 수 있어요.
          </p>
          {selectedId && placedIds.has(selectedId) ? (
            <div className="room-select-bar">
              <span className="room-select-name">{ITEM_BY_ID[selectedId]?.name} 선택됨</span>
              <div className="room-select-actions">
                <button
                  type="button"
                  className="room-select-btn"
                  onClick={() => {
                    onRemove?.(selectedId);
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
                  role="listitem"
                  aria-label={`${it.name} 방에 놓기`}
                  onPointerDown={(e) => beginTrayDrag(it, e)}
                  onClick={() => tapPlace(it)}
                >
                  <ItemCardFace item={it} className="room-tray-face" />
                </button>
              ))
            )}
          </div>
          <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
            배치 마치기
          </button>
        </>
      ) : null}

      {ghost ? (
        <div className="room-card-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <ItemCardFace item={ghost.item} className="room-card-face room-card-face--ghost" />
        </div>
      ) : null}
    </div>
  );
}
