/*
 * EmberCat — pet stage component.
 *
 * Image contract (no real assets committed in P0):
 *   - Pass `imageSrc` (e.g. "/assets/pets/white_kitten_main.webp") to render a real cat image.
 *   - If `imageSrc` is omitted/falsy, falls back to the inline SVG silhouette placeholder.
 *   - Real images use `object-fit: contain` and `object-position: bottom center` so screen
 *     code does not need to change when approved assets land.
 *
 * Expected future asset paths (added later via a deliberate asset-approval step,
 * not by accident — see docs/PET_CUSTOMIZATION_SPEC.md §11):
 *   /assets/pets/white_kitten_main.webp
 *   /assets/pets/black_guardian.webp
 *   /assets/pets/gray_mentor.webp
 *   /assets/pets/brown_loaf.webp
 *   /assets/rooms/ember_room_empty.webp
 *   /assets/rooms/ember_room_with_kitten.webp
 *
 * Direction: soft cream/white kitten (PRD §0.5, PET_CUSTOMIZATION_SPEC §10).
 *
 * Variant `tone`:
 *   - "steady" : ember breathes warmly (default)
 *   - "dim"    : room slightly cooler (missed routine) — pet never harmed
 *   - "bright" : reward state
 *
 * Variant `variant`:
 *   - "default" : 5:4 stage
 *   - "compact" : 16:9 stage, smaller pet (for Home secondary use)
 */

const FALLBACK_LABEL = '잔불 곁의 흰 고양이';

export default function EmberCat({
  tone = 'steady',
  label,
  imageSrc,
  variant = 'default',
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
    <div className={stageClass} role="img" aria-label={label ?? FALLBACK_LABEL}>
      <div className="pet-stage-floor" />
      {imageSrc ? (
        <img
          className="pet-cat-img"
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <CatSilhouette />
      )}
      <div className={tone === 'dim' ? 'pet-ember pet-ember--low' : 'pet-ember'} />
    </div>
  );
}

function CatSilhouette() {
  return (
    <svg
      className="pet-cat-svg"
      viewBox="0 0 200 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="catBody" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fbf6ec" />
          <stop offset="55%" stopColor="#f1e7d3" />
          <stop offset="100%" stopColor="#c9bfa9" />
        </radialGradient>
        <radialGradient id="catEarInner" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#f5cdb3" />
          <stop offset="100%" stopColor="#d6a98c" />
        </radialGradient>
        <radialGradient id="catEye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde4c2" />
          <stop offset="60%" stopColor="#f5a45a" />
          <stop offset="100%" stopColor="#b96b2a" />
        </radialGradient>
      </defs>
      {/* sitting kitten silhouette — soft cream (placeholder only) */}
      <path
        fill="url(#catBody)"
        d="M62 56c-5-14 3-30 18-32 12-2 19 6 22 14 4-7 12-14 23-12 16 3 22 20 16 33 9 6 14 18 14 32 0 24-18 38-50 38S55 115 55 91c0-15 5-27 14-33-4-1-6-1-7-2Z"
      />
      <path fill="#efe2c7" d="M70 38c2-6 7-12 14-13 1 7-3 14-9 18-3-1-5-3-5-5Z" />
      <path fill="url(#catEarInner)" d="M74 36c1-3 4-7 9-9 0 4-2 9-6 12-2-1-3-2-3-3Z" />
      <path fill="#efe2c7" d="M132 38c-2-6-7-12-14-13-1 7 3 14 9 18 3-1 5-3 5-5Z" />
      <path fill="url(#catEarInner)" d="M128 36c-1-3-4-7-9-9 0 4 2 9 6 12 2-1 3-2 3-3Z" />
      <ellipse cx="84" cy="80" rx="4" ry="5" fill="url(#catEye)" opacity="0.85" />
      <ellipse cx="118" cy="80" rx="4" ry="5" fill="url(#catEye)" opacity="0.85" />
      <path d="M99 92c0 2 1 3 2 3s2-1 2-3-2-3-2-3-2 1-2 3Z" fill="#d6a98c" opacity="0.75" />
      <circle cx="152" cy="140" r="3.5" fill="url(#catEye)" opacity="0.7" />
    </svg>
  );
}
