/*
 * EmberCat — pet stage component (asset-first).
 *
 * The mascot is the approved premium white-kitten art (PRD §0.5,
 * PET_CUSTOMIZATION_SPEC §10). No art is committed yet, so resolveCatAsset()
 * returns null and CatFigure renders a clean neutral "art pending" skeleton —
 * never a fake SVG/emoji mascot. The moment the approved .webp frames are
 * registered present in petAssets.js, the same code paints real art.
 *
 * Motion: pass `motionState` to drive both the frame (resolveCatAsset) and a CSS
 * hook class. The pet is never harmed — `sad_soft` is a soft, calm look (a dimmed
 * room after a slip), never illness/injury/death.
 *
 *   idle | blink | happy | sleep | sad_soft | wave | tap
 *
 * `tone`:    steady (default) | dim (room cooler) | bright (reward)
 * `variant`: default (5:4) | compact (16:9, smaller — Home secondary use)
 */

import { resolveCatAsset } from '../constants/petAssets.js';

const MOTION_CLASS = {
  idle: 'pet-cat--idle',
  blink: 'pet-cat--idle',
  happy: 'pet-cat--happy',
  sleep: 'pet-cat--sleep',
  sad_soft: 'pet-cat--sad-soft',
  wave: 'pet-cat--wave',
  tap: 'pet-cat--tap',
};

// Just the cat element — real art when present, neutral skeleton otherwise.
// Reused inside the room stages so the cat never duplicates the stage chrome.
export function CatFigure({ motionState = 'idle', label }) {
  const src = resolveCatAsset(motionState);
  const motionClass = MOTION_CLASS[motionState] ?? 'pet-cat--idle';

  if (src) {
    return (
      <img
        className={`pet-cat-img ${motionClass}`}
        src={src}
        alt={label ?? ''}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`pet-cat-skeleton ${motionClass}`} role="img" aria-label={label ?? '고양이 아트 적용 전'}>
      <span className="pet-cat-skeleton-mark" aria-hidden="true" />
      <span className="pet-cat-skeleton-text">고양이 아트 적용 전</span>
    </div>
  );
}

export default function EmberCat({
  tone = 'steady',
  label,
  variant = 'default',
  motionState = 'idle',
  className,
}) {
  const stageClass = [
    'pet-stage',
    tone === 'dim' && 'pet-stage--dim',
    tone === 'bright' && 'pet-stage--bright',
    variant === 'compact' && 'pet-stage--compact',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={stageClass} role="img" aria-label={label ?? '잔불 곁의 흰 고양이'}>
      <div className="pet-stage-floor" />
      <CatFigure motionState={motionState} label={label} />
      <div className={tone === 'dim' ? 'pet-ember pet-ember--low' : 'pet-ember'} />
    </div>
  );
}
