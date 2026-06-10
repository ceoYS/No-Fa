import { useState } from 'react';
import { resolveRoomAsset, resolveCatAsset } from '../constants/petAssets.js';
import { THEME_BY_ID } from '../constants/roomItems.js';

/*
 * PetSceneViewer — Scene Mode v1 (PRD §0.6.9, scene-mode guardrails).
 *
 * A static viewer over the approved finished art: pick a room mood and a cat
 * pose, see each as ONE finished image. The room art and the cat art are both
 * opaque illustrations, so they are shown as two separate framed images and
 * never composited (pasting opaque art together is exactly the dishonesty
 * scene mode exists to avoid).
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

// Cat poses — each maps to one approved illustration; captions describe the
// artwork only (no live-reaction or feeling claims, per R-8).
const POSE_VIEWS = [
  { id: 'main', label: '기본', caption: '잔불 곁의 기본 모습이에요.' },
  { id: 'happy', label: '기쁨', caption: '기뻐하는 모습이에요.' },
  { id: 'sleep', label: '휴식', caption: '포근히 잠든 모습이에요.' },
];

export default function PetSceneViewer({ ownedItems = [] }) {
  const [roomId, setRoomId] = useState(ROOM_VIEWS[0].id);
  const [poseId, setPoseId] = useState(POSE_VIEWS[0].id);

  const room = ROOM_VIEWS.find((v) => v.id === roomId) ?? ROOM_VIEWS[0];
  const pose = POSE_VIEWS.find((v) => v.id === poseId) ?? POSE_VIEWS[0];
  const roomSrc = resolveRoomAsset(room.id);
  const poseSrc = resolveCatAsset(pose.id);
  // Ownership note only applies to views that are actually sold as room themes;
  // cost === 0 mirrors the shop's owned rule so the seeded default never reads
  // as locked.
  const roomTheme = THEME_BY_ID[room.id];
  const roomOwned = roomTheme ? ownedItems.includes(roomTheme.id) || roomTheme.cost === 0 : true;

  return (
    <section className="card scene-viewer">
      <div className="card-row">
        <span className="card-label">장면 보기</span>
        <span className="pill" style={{ fontSize: 'var(--fs-micro)' }}>그림 모드</span>
      </div>
      <p className="hairline-note">
        미리 그려둔 장면을 한 장씩 보는 모드예요. 고양이와 방은 움직이지 않고,
        보기 선택은 저장되지 않아요.
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

      <div className="scene-viewer-block">
        {poseSrc ? (
          <img className="scene-viewer-pose" src={poseSrc} alt={`고양이 ${pose.label} 모습`} loading="lazy" decoding="async" />
        ) : (
          <p className="hairline-note">이 모습 그림은 아직 연결 전이에요.</p>
        )}
        <p className="hairline-note text-quiet scene-viewer-caption" aria-live="polite">{pose.caption}</p>
        <div className="sheet-chip-grid" role="group" aria-label="고양이 모습 고르기">
          {POSE_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className="chip"
              data-selected={poseId === v.id}
              aria-pressed={poseId === v.id}
              onClick={() => setPoseId(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
