/*
 * PetRoomV2 — the LIVING pet room (Slice 3, design EG-11/12/13). A real 4:3 scene built from
 * the approved transparent V2 sprites over the clean walnut plate:
 *   - room-clean.webp as the 4:3 background (the scene is genuinely 4:3 — .pet-room--scene);
 *   - the food station (feeder-empty ↔ feeder-full) at the active-room feeder geometry;
 *   - placed transparent decor at normalized floor points (never over the cat / feeder);
 *   - the canonical white kitten, driven by the ONE companion state machine (useCompanion):
 *     it blinks + breathes at rest, walks with real gait frames + translation, reacts to
 *     쓰다듬기, and does the causal feed sequence.
 *
 * This is NOT the pinned still-composite PetRoomEditor; the kitten here really moves, because
 * it has approved multi-frame gait art. Theme + decor persist through useRoomV2 (own store).
 */
import { useRef, useState } from 'react';
import { catSprite, propSprite, ROOM_CLEAN } from '../constants/companionAssets.js';
import { FEEDER, SAFE_ZONES, ROOM_THEMES_V2, clamp01, isFloorDecor } from '../constants/roomV2.js';

// The props the room's own 꾸미기 tray can place. A base set is always available; 장난감 쥐
// opens with the 씩씩한 탐험가 form (Lv.6) and 오두막 is a 황금 리그 reward (dc.html EG-13 tray).
const TRAY = [
  { id: 'bed', name: '포근한 방석', minLevel: 1 },
  { id: 'rug', name: '둥근 러그', minLevel: 1 },
  { id: 'plant', name: '초록 화분', minLevel: 1 },
  { id: 'lamp', name: '종이 랜턴', minLevel: 1 },
  { id: 'yarn', name: '실뭉치', minLevel: 1 },
  { id: 'mouse', name: '장난감 쥐', minLevel: 6, gate: 'Lv.6' },
  { id: 'house', name: '오두막', minLevel: 99, gate: '황금 리그' },
];

// A positioned transparent sprite whose FOOT (bottom-centre) sits at the normalized (x,y).
// A `floor` prop (the rug) lies flat on the floor: it is drawn BENEATH the cat and feeder
// (fixed low z) with a flatter, contact-only shadow, so it can sit under the cat without
// occluding it. Everything else keeps depth ordering by its foot's y.
function RoomSprite({ id, x, y, w = 0.18, cls = '', z, floor = false, onPointerDown, selected }) {
  const src = propSprite(id);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={`pr-sprite ${floor ? 'pr-sprite--floor ' : ''}${cls}`}
      data-selected={selected ? 'true' : undefined}
      draggable={false}
      style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, zIndex: floor ? 2 : (z ?? Math.round(y * 100)) }}
      onPointerDown={onPointerDown}
    />
  );
}

export default function PetRoomV2({
  companion,
  kittenName = '루미',
  emberShards = 0,
  level = 1,
  theme,
  themeId = 'walnut',
  onSetTheme,
  allowSnow = false,
  decor = [],
  onAddDecor,
  onPlaceDecor,
  onRemoveDecor,
  onTapCat,
  onPlayToy,
}) {
  const sceneRef = useRef(null);
  const dragRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(null);

  const { pos, facing, pose, moving, moveDur, feederFull, hearts, toy, phase, requestMsg, sleeping, tap, playChase, attend } = companion;

  // Cursor / touch ATTENTION (Founder blocker 2A): report the pointer's normalized x to the
  // companion so the kitten notices where you are (facing + a look), and may step closer after a
  // dwell. View mode only — a decor drag in 꾸미기 must not double as attention.
  const trackPointer = (e) => {
    if (editing) return;
    const el = sceneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    attend?.((e.clientX - r.left) / r.width);
  };

  // Tap the kitten → a real affectionate reaction (companion.tap plays an approved pose + hearts).
  // onTapCat lets the host add a gesture-gated side effect (a soft meow); the motion is companion's.
  const tapCat = () => {
    if (editing) return;
    tap?.();
    onTapCat?.();
  };
  // 놀아주기 → the kitten really walks to a fresh safe floor spot and pounces (companion.playChase).
  const wiggleToy = () => {
    if (editing) return;
    playChase?.();
    onPlayToy?.();
  };

  // Pointer drag for a placed decor prop — normalized to the 4:3 scene rect, clamped and
  // rejected inside a safe zone (the cat / feeder stay uncovered). Same honest normalized
  // placement model the room has always used.
  const startDrag = (id) => (e) => {
    if (!editing) return;
    setSelected(id);
    e.preventDefault();
    const el = sceneRef.current;
    if (!el) return;
    dragRef.current = id;
    const move = (ev) => {
      const r = el.getBoundingClientRect();
      const nx = clamp01((ev.clientX - r.left) / r.width);
      const ny = clamp01((ev.clientY - r.top) / r.height);
      onPlaceDecor?.(id, nx, ny);
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const catW = 0.24; // cat width as a fraction of the 4:3 scene width
  const showBlink = pose === 'idle';

  return (
    <div className="pet-room-v2-wrap">
      <div
        ref={sceneRef}
        className={`pet-room--scene pet-room-v2 pet-room-grade--${theme?.grade ?? 'walnut'}${editing ? ' pet-room-v2--editing' : ''}`}
        aria-label={`${kittenName}의 방`}
        onPointerMove={trackPointer}
        onPointerDown={trackPointer}
      >
        <img className="pr-plate" src={ROOM_CLEAN} alt="고양이 방" />
        <div className="pr-grade" aria-hidden="true" />

        {/* header overlay */}
        <div className="pr-topbar">
          <div>
            <div className="pr-topbar-eyebrow">함께 지나온 시간이 머무는 곳</div>
            <div className="pr-topbar-title">{kittenName}의 방</div>
          </div>
          <span className="pr-shard">잔불 조각 {emberShards}</span>
        </div>

        {/* food station (active-room feeder geometry) — empty ↔ full is a real sprite swap */}
        <RoomSprite id={feederFull ? 'feeder-full' : 'feeder-empty'} x={FEEDER.x} y={FEEDER.y} w={FEEDER.w} cls="pr-feeder" />

        {/* placed decor — the rug lays flat under the cat (wider, low z); other props stand */}
        {decor.map((d) => {
          const floor = isFloorDecor(d.id);
          return (
            <RoomSprite
              key={d.id}
              id={d.id}
              x={d.x}
              y={d.y}
              w={floor ? 0.34 : 0.2}
              floor={floor}
              selected={editing && selected === d.id}
              onPointerDown={startDrag(d.id)}
            />
          );
        })}

        {/* toy target — a small marker on the floor the kitten is chasing (놀아주기). Drawn just
            under the cat's depth so the pounce reads as landing on it. Real: it only exists while
            companion is in its play phase, and clears when the cat settles. */}
        {toy ? (
          <span
            className="pr-toy"
            aria-hidden="true"
            style={{ left: `${toy.x * 100}%`, top: `${toy.y * 100}%`, zIndex: Math.round(toy.y * 100) }}
          />
        ) : null}

        {/* the living kitten */}
        <div
          className="pr-cat-wrap"
          style={{
            left: `${pos.x * 100}%`,
            top: `${pos.y * 100}%`,
            width: `${catW * 100}%`,
            transition: moving ? `left ${moveDur}s linear, top ${moveDur}s linear` : 'none',
            zIndex: Math.round(pos.y * 100) + 1,
          }}
        >
          <span className="pr-cat-shadow" aria-hidden="true" />
          <div className="pr-cat-flip" style={{ transform: `scaleX(${facing})` }}>
            <img className={`pr-cat eg-anim-breathe${sleeping ? ' pr-cat--sleep' : ''}`} src={catSprite(pose) ?? catSprite('idle')} alt={kittenName} />
            {showBlink ? (
              <>
                <img className="pr-cat pr-blink pr-blink-half" src={catSprite('blink-half')} alt="" aria-hidden="true" />
                <img className="pr-cat pr-blink pr-blink-closed" src={catSprite('blink-closed')} alt="" aria-hidden="true" />
              </>
            ) : null}
          </div>
          {hearts ? <span className="pr-hearts" aria-hidden="true">♥</span> : null}
          {sleeping ? <span className="pr-zzz" aria-hidden="true">Zzz…</span> : null}
          {/* Food request bubble (Founder blocker 2D) — a real, rate-limited ask; the copy is the
              companion's own hunger state, never a guilt line. */}
          {phase === 'hungry' && requestMsg ? (
            <span className="pr-food-bubble" role="status">{requestMsg}</span>
          ) : null}
          {/* Tapping the kitten is a real gesture → companion.tap(). A transparent, accessible
              button rides with the cat; disabled during 꾸미기 so a decor drag never triggers it. */}
          {!editing ? (
            <button
              type="button"
              className="pr-cat-hit"
              aria-label={`${kittenName} 쓰다듬기`}
              onClick={tapCat}
            />
          ) : null}
        </div>

        {/* decorate overlay — safe-zone hints (EG-13) */}
        {editing ? (
          <>
            {SAFE_ZONES.map((z) => (
              <span
                key={z.label}
                className="pr-safezone"
                style={{ left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.r * 2 * 100}%` }}
              />
            ))}
            <div className="pr-editing-tag">꾸미기 모드 · 고양이·급식기 주변은 안전영역</div>
          </>
        ) : null}
      </div>

      {/* theme picker (persists via useRoomV2 → survives reload) */}
      <div className="pr-theme-row" role="group" aria-label="방 테마">
        {ROOM_THEMES_V2.map((t) => {
          const locked = t.reward && !allowSnow;
          const active = themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="pr-theme-chip"
              data-active={active}
              disabled={locked}
              aria-pressed={active}
              onClick={() => !locked && onSetTheme?.(t.id)}
              title={locked ? `${t.reward} 보상으로 열려요` : undefined}
            >
              {t.name}
              {locked ? <span className="pr-theme-lock"> · {t.reward}</span> : null}
            </button>
          );
        })}
      </div>

      {/* room controls */}
      {editing ? (
        <div className="pr-tray">
          <div className="pr-tray-scroll">
            {TRAY.map((p) => {
              const placed = decor.some((d) => d.id === p.id);
              const locked = level < p.minLevel;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="pr-tray-item"
                  data-placed={placed}
                  disabled={locked}
                  onClick={() => (placed ? onRemoveDecor?.(p.id) : onAddDecor?.(p.id))}
                  title={locked ? `${p.gate} 해금` : undefined}
                >
                  {propSprite(p.id) ? <img src={propSprite(p.id)} alt="" aria-hidden="true" /> : null}
                  <span className="pr-tray-name">{p.name}</span>
                  <span className="pr-tray-tag">{locked ? p.gate : placed ? '치우기' : '놓기'}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="eg-cta" onClick={() => { setEditing(false); setSelected(null); }}>
            배치 마치기
          </button>
        </div>
      ) : (
        <div className="pr-play-row">
          <button type="button" className="eg-secbtn pr-play-btn" onClick={wiggleToy}>
            놀아주기 · 장난감
          </button>
          <button type="button" className="eg-secbtn pr-decorate-btn" onClick={() => setEditing(true)}>
            방 꾸미기 · 소품 배치
          </button>
        </div>
      )}
      {phase === 'feedApproach' || phase === 'feedEat' || phase === 'feedNotice' ? (
        <p className="pr-status" aria-live="polite">고양이가 급식기로 다가가고 있어요.</p>
      ) : phase === 'play' ? (
        <p className="pr-status" aria-live="polite">고양이가 장난감을 쫓아가고 있어요.</p>
      ) : phase === 'hungry' ? (
        <p className="pr-status" aria-live="polite">{requestMsg ?? '고양이가 간식을 기다려요.'}</p>
      ) : sleeping ? (
        <p className="pr-status" aria-live="polite">고양이가 곤히 자고 있어요. 톡 누르면 깨어나요.</p>
      ) : phase === 'greet' ? (
        <p className="pr-status" aria-live="polite">고양이가 당신을 반겨요.</p>
      ) : null}
    </div>
  );
}
