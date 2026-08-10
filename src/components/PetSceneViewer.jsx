import { useState } from 'react';
import { resolveRoomAsset } from '../constants/petAssets.js';
import { THEME_BY_ID } from '../constants/roomItems.js';

/*
 * PetSceneViewer — Scene Mode v1 (PRD §0.6.9, scene-mode guardrails).
 *
 * PetSceneViewer keeps the room preset gallery (static viewers over the approved
 * finished room art). The cat's three-state control lives here too as the small
 * CatStateSelector, which drives the LIVE in-room cat layer (PetRoomEditor) — it
 * replaced the earlier large three-image preview. Room preset art is opaque
 * illustration, so it is never composited as if a transparent sprite.
 *
 * Honesty contract (pinned by guard #45):
 *   - the header copy says these are pre-drawn presets, nothing moves, and the
 *     view choice is not saved (component state only — refresh resets it);
 *   - art resolves through the petAssets registry, never hardcoded paths;
 *   - no drag/placement affordance of any kind, no cat feeling/motion claims —
 *     captions describe the artwork ("잠든 모습"), not a live reaction.
 *
 * Room moods not yet owned as shop themes stay viewable here as an honest
 * preview, labeled so it never reads as already-unlocked decoration. Owned
 * follows the shop's semantics (CatalogCard / App.chooseRoomTheme): a cost-0
 * seeded theme counts as owned even when an older persisted ownedItems list
 * predates theme seeding — the default room must never read as 미보유.
 */

// Room moods — named for what the finished art actually shows.
const ROOM_VIEWS = [
  { id: 'empty', label: '기본 방', caption: '잔불이 은은한 기본 방이에요.' },
  { id: 'cozy', label: '온기 있는 방', caption: '포근하게 데워진 방이에요.' },
  { id: 'night', label: '조용한 밤 방', caption: '깊고 차분한 밤의 방이에요.' },
];

// C2-B-R1C — the three canonical cat states shown in the ACTUAL room. This small,
// product-like selector drives the LIVE in-room cat layer (PetRoomEditor), replacing
// the earlier large three-image preview workaround. DEFAULT keeps the canonical idle
// (+ blink); 기쁨 / 휴식 swap to the Founder-approved pose cutouts in place. Captions
// describe the chosen look only; the choice is view-only component state (not saved)
// and the cat stays a static composite, so nothing here claims a live reaction (R-8).
export const CAT_STATE_VIEWS = [
  { id: 'default', label: '기본', caption: '잔불 곁에 앉은 기본 모습이에요.' },
  { id: 'happy', label: '기쁨', caption: '밝게 웃으며 앉은 기쁨 모습이에요.' },
  { id: 'rest', label: '휴식', caption: '몸을 둥글게 말고 쉬는 휴식 모습이에요.' },
];

export function CatStateSelector({ value = 'default', onChange }) {
  const view = CAT_STATE_VIEWS.find((v) => v.id === value) ?? CAT_STATE_VIEWS[0];

  return (
    <div className="cat-state-selector" role="group" aria-label="고양이 모습 고르기">
      <p className="hairline-note">고양이 모습 — 기본 · 기쁨 · 휴식</p>
      <div className="sheet-chip-grid">
        {CAT_STATE_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="chip"
            data-cat-state={v.id}
            data-selected={value === v.id}
            aria-pressed={value === v.id}
            onClick={() => onChange?.(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="hairline-note text-quiet" aria-live="polite">
        {view.caption} 위 고양이 방에 바로 보여요. 이 선택은 저장되지 않아요.
      </p>
    </div>
  );
}

export default function PetSceneViewer({ ownedItems = [] }) {
  const [roomId, setRoomId] = useState(ROOM_VIEWS[0].id);

  const room = ROOM_VIEWS.find((v) => v.id === roomId) ?? ROOM_VIEWS[0];
  const roomSrc = resolveRoomAsset(room.id);
  // Ownership note only applies to views that are actually sold as room themes;
  // cost === 0 mirrors the shop's owned rule so the seeded default never reads
  // as locked.
  const roomTheme = THEME_BY_ID[room.id];
  const roomOwned = roomTheme ? ownedItems.includes(roomTheme.id) || roomTheme.cost === 0 : true;

  return (
    <section className="card scene-viewer">
      <div className="card-row">
        <span className="card-label">방 장면 보기</span>
        <span className="pill" style={{ fontSize: 'var(--fs-micro)' }}>그림 모드</span>
      </div>
      <p className="hairline-note">
        미리 그려둔 방을 한 장씩 보는 모드예요. 장면은 움직이지 않고, 보기 선택은 저장되지 않아요.
      </p>

      <div className="scene-viewer-block">
        {roomSrc ? (
          <img className="scene-viewer-room" src={roomSrc} alt={`${room.label} 장면`} loading="lazy" decoding="async" />
        ) : (
          <p className="hairline-note">이 방 그림은 아직 연결 전이에요.</p>
        )}
        <p className="hairline-note text-quiet scene-viewer-caption" aria-live="polite">
          {room.caption}
          {!roomOwned ? ' 방 테마로는 아직 미보유 — 여기서는 미리 보기만 돼요.' : ''}
        </p>
        <div className="sheet-chip-grid" role="group" aria-label="방 분위기 고르기">
          {ROOM_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="chip"
              data-selected={roomId === v.id}
              aria-pressed={roomId === v.id}
              onClick={() => setRoomId(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

    </section>
  );
}
