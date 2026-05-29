import { CatFigure } from './EmberCat.jsx';
import { RoomToken } from './PetRoomEditor.jsx';
import {
  isItemSpriteReady,
  petStageArtReady,
  resolvePetStageRoomAsset,
  shouldUsePetSceneMode,
} from '../constants/petAssets.js';
import { ITEM_BY_ID } from '../constants/roomItems.js';

/*
 * PetRoomPreview — read-only room stage (PRD §0.6.9), used on Home. Mirrors the
 * editor's asset-first rendering as static, non-interactive tokens (no drag).
 * Art-pending mode: while the room or cat art is missing it shows one clean
 * compact pending card. Scene mode uses the finished room image by itself until
 * transparent cat/item sprites are available.
 *
 * Props:
 *   theme       — room theme id (drives the room background asset)
 *   placements  — [{ itemId, x, y, scale, z }]
 *   tone        — 'steady' | 'dim' | 'bright'
 *   variant     — 'default' | 'compact'
 *   catMotion   — cat motion state (default 'idle')
 *   label       — accessible label for the stage
 */
export default function PetRoomPreview({
  theme = 'empty',
  placements = [],
  tone = 'steady',
  variant = 'default',
  catMotion = 'idle',
  label,
  sceneMode,
}) {
  const resolvedSceneMode = sceneMode ?? shouldUsePetSceneMode({ catState: catMotion });
  const roomSrc = resolvePetStageRoomAsset({ theme, sceneMode: resolvedSceneMode });
  const artReady = petStageArtReady({ theme, catState: catMotion, sceneMode: resolvedSceneMode });
  const stageClass = [
    'pet-stage',
    'pet-room',
    resolvedSceneMode && 'pet-room--scene',
    !artReady && 'pet-room--pending',
    tone === 'dim' && 'pet-stage--dim',
    tone === 'bright' && 'pet-stage--bright',
    variant === 'compact' && 'pet-stage--compact',
  ]
    .filter(Boolean)
    .join(' ');

  const ordered = [...placements]
    .filter((p) => ITEM_BY_ID[p.itemId] && isItemSpriteReady(ITEM_BY_ID[p.itemId].assetId))
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

  return (
    <div className={stageClass} data-theme={theme} role="img" aria-label={label ?? '고양이 방 미리보기'}>
      {artReady ? (
        <>
          <img className="room-img" src={roomSrc} alt="" loading="lazy" decoding="async" />
          {resolvedSceneMode ? null : (
            <>
              <div className="pet-stage-floor" />

              <CatFigure motionState={catMotion} label={label} />

              {ordered.map((p) => (
                <RoomToken key={p.itemId} item={ITEM_BY_ID[p.itemId]} placement={p} interactive={false} />
              ))}

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
  );
}
