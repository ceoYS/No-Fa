import { resolveRoomSceneAsset } from '../constants/petAssets.js';
import { DECOR_ITEMS } from '../constants/roomItems.js';

/*
 * PetPlacementEditor — 배치 계획(준비 중) view (PRD §0.6.9).
 *
 * HONESTY NOTE: the current decor art is rectangular, non-transparent crops, not
 * overlay sprites (petAssets.js keeps every `spriteReady: false`). Dragging those
 * images over the room reads as broken stickers, so this mode does NOT overlay any
 * item image on the scene. It is an inventory / position-planning placeholder: it
 * shows the finished room and the owned-item list, and states plainly that real
 * placement arrives once transparent item images are ready. No `spriteReady` flag
 * is flipped to reach this mode.
 */

const PLACEMENT_PENDING_COPY = '배치 기능은 투명 아이템 이미지가 준비되면 제공돼요.';

export default function PetPlacementEditor({
  theme = 'empty',
  ownedItems = [],
  onDone,
  label = '아이템 배치 계획',
}) {
  // The finished composite cat-room image — never a plain room with pasted crops.
  const roomSrc = resolveRoomSceneAsset(theme);
  const owned = DECOR_ITEMS.filter((it) => ownedItems.includes(it.id));

  return (
    <div className="placement-editor">
      <div
        className="pet-stage pet-room pet-room--scene placement-stage"
        data-theme={theme}
        role="img"
        aria-label={label}
      >
        {roomSrc ? <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" /> : null}
      </div>

      <p className="placement-note">{PLACEMENT_PENDING_COPY}</p>

      <section className="placement-plan">
        <span className="card-label">보유 아이템</span>
        {owned.length === 0 ? (
          <p className="hairline-note">
            아직 가진 아이템이 없어요. 상점에서 아이템을 데려오면 여기에 모여요.
          </p>
        ) : (
          <ul className="placement-plan-list">
            {owned.map((it) => (
              <li className="placement-plan-row" key={it.id}>
                <span className="placement-plan-dot" aria-hidden="true" />
                <span className="placement-plan-name">{it.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="placement-actions">
        <button type="button" className="btn btn-primary btn-block" onClick={onDone}>
          돌아가기
        </button>
      </div>
    </div>
  );
}
