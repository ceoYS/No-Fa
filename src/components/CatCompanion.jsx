/*
 * CatCompanion — the canonical single-cat layer (v13 Final Handoff,
 * NOF_V13_P0_IMPLEMENTATION_CUTLINE §6).
 *
 * One CSS-shape cat, exactly as drawn in the v13 design source's
 * catCompanion() helper: a 52×62 base composition (tail arc, body, paws,
 * head, ears — front_idle adds eyes/nose), scaled via transform. The root
 * carries data-layer="cat-companion" — the future QA gate counts this
 * selector and expects at most one per screen.
 *
 * HONESTY (prime directive): this is a static illustration. It never moves,
 * eats, or reacts on its own, and nothing here claims it does.
 */

const BASE_W = 52;
const BASE_H = 62;

// Shape recipe per v13 variant. front_idle = facing us (eyes + nose visible),
// side_waiting = sitting sideways (no face marks). Colors come from the design:
// dark room cat #1E2328, cream pause cat #E7DCC6.
export default function CatCompanion({
  variant = 'side_waiting',
  color = '#1E2328',
  eyeColor = '#5C4A26',
  height = 54,
  style,
}) {
  const scale = (height / BASE_H) || 1;
  const width = Math.round(BASE_W * scale);
  return (
    <div
      data-layer="cat-companion"
      data-variant={variant}
      aria-hidden="true"
      style={{
        position: 'relative',
        width,
        height,
        pointerEvents: 'none',
        flex: 'none',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: BASE_W,
          height: BASE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* tail */}
        <div
          style={{
            position: 'absolute',
            right: -6,
            bottom: -1,
            width: 27,
            height: 27,
            border: `7px solid ${color}`,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            transform: 'rotate(-6deg)',
          }}
        />
        {/* body */}
        <div
          style={{
            position: 'absolute',
            left: 7,
            bottom: 0,
            width: 38,
            height: 43,
            background: color,
            borderRadius: '50% 50% 42% 42% / 62% 62% 40% 40%',
          }}
        />
        {/* paws */}
        <div style={{ position: 'absolute', left: 15, bottom: 0, width: 9, height: 9, background: color, borderRadius: '50% 50% 40% 40%' }} />
        <div style={{ position: 'absolute', left: 27, bottom: 0, width: 9, height: 9, background: color, borderRadius: '50% 50% 40% 40%' }} />
        {/* head */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 5,
            width: 28,
            height: 26,
            background: color,
            borderRadius: '52% 52% 48% 48% / 56% 56% 44% 44%',
          }}
        />
        {/* ears */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 0,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: `15px solid ${color}`,
            transform: 'rotate(-20deg)',
            transformOrigin: '50% 100%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 0,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: `15px solid ${color}`,
            transform: 'rotate(20deg)',
            transformOrigin: '50% 100%',
          }}
        />
        {variant === 'front_idle' ? (
          <>
            {/* eyes + nose — only the front-facing variant shows a face */}
            <div style={{ position: 'absolute', left: 18, top: 15, width: 4, height: 5.6, background: eyeColor, borderRadius: '50%', transform: 'rotate(-10deg)' }} />
            <div style={{ position: 'absolute', left: 30, top: 15, width: 4, height: 5.6, background: eyeColor, borderRadius: '50%', transform: 'rotate(10deg)' }} />
            <div style={{ position: 'absolute', left: 24.6, top: 22.4, width: 3, height: 2.4, background: 'rgba(86,64,44,.7)', borderRadius: '50% 50% 60% 60%' }} />
          </>
        ) : null}
      </div>
    </div>
  );
}
