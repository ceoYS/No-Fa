/*
 * KittenHub — EG-05 내 고양이 허브. The progression home: a room preview that leads INTO
 * the pet room, the kitten's level / growth form / XP-toward-next-form, the unlocked
 * accessories (equip toggle — separate from unlock), what the kitten can do at this form,
 * and entries to the growth roadmap and the weekly league. Ported from the frozen design.
 *
 * Honesty: every number is read from the real Personal XP store; the room preview is a
 * still frame (a real sprite), never an animated claim. Nothing here fakes a capability.
 */
import { catSprite, ROOM_CLEAN } from '../constants/companionAssets.js';
import { EVOLUTION_ACCESSORIES } from '../constants/progression.js';

// What the kitten can do, gated by the numeric level the growth form carries (dc.html
// behaviors). 기본 = always available; the rest open at their form's level.
const BEHAVIORS = [
  { t: '낮잠 · 그루밍', minLevel: 1, base: true },
  { t: '쓰다듬기 반응', minLevel: 3 },
  { t: '실뭉치 놀이', minLevel: 4 },
  { t: '창가 구경', minLevel: 6 },
  { t: '밤 산책', minLevel: 9 },
];

export default function KittenHub({
  kittenName = '루미',
  level = 1,
  form,
  nextForm = null,
  progress = { total: 0, target: 1, remaining: 0, pct: 0, maxed: false },
  accessories = [],
  equippedAccessories = [],
  daysTogether = 0,
  onEnterRoom,
  onGrowth,
  onLeague,
  onToggleAccessory,
}) {
  const maxed = !!progress.maxed;
  return (
    <div className="v2-screen">
      <div className="eg-h2" style={{ fontSize: 20 }}>내 고양이</div>

      {/* Room preview → enter the pet room */}
      <button type="button" className="eg-hub-room" onClick={() => onEnterRoom?.()} aria-label="방으로 들어가기">
        <img className="eg-hub-room-bg" src={ROOM_CLEAN} alt="고양이 방" />
        <img className="eg-hub-room-cat eg-anim-breathe" src={catSprite('walk-2') ?? catSprite('idle')} alt="" aria-hidden="true" />
        <span className="eg-hub-room-enter">방으로 들어가기 →</span>
      </button>

      {/* Kitten summary — LV / form / XP toward next form */}
      <div className="eg-card">
        <div className="eg-hero-row">
          <span className="eg-lv-chip">LV.{level}</span>
          <b className="eg-form-name">{kittenName} · {form?.name}</b>
          <span className="eg-sub" style={{ marginLeft: 'auto', fontWeight: 700 }}>
            {maxed ? `${progress.total} XP` : `${progress.total}/${progress.target}`}
          </span>
        </div>
        <div className="eg-xpbar" style={{ marginTop: 9 }}>
          <div className="eg-xpbar-fill" style={{ width: `${Math.round(progress.pct * 100)}%` }} />
        </div>
        <div className="eg-xp-meta" style={{ marginTop: 8, fontSize: 11, color: 'var(--eg-muted)' }}>
          <span>함께한 지 {daysTogether}일</span>
          <span>
            {maxed ? '최고 성장 단계' : <>다음 성장: <b style={{ color: 'var(--eg-ember-light)' }}>{nextForm?.name}</b></>}
          </span>
        </div>
      </div>

      {/* Accessories — unlocked = monotonic; equip is a separate toggle (registry §5) */}
      <div className="eg-section-label">장식</div>
      <div className="eg-acc-row">
        {EVOLUTION_ACCESSORIES.map((a) => {
          const unlocked = accessories.includes(a.id);
          const on = equippedAccessories.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              className="eg-acc-chip"
              data-unlocked={unlocked}
              data-on={on}
              aria-pressed={on}
              disabled={!unlocked}
              onClick={() => unlocked && onToggleAccessory?.(a.id)}
            >
              {a.name}
              <span className="eg-acc-state">{!unlocked ? '잠김' : on ? '착용 중' : '착용'}</span>
            </button>
          );
        })}
      </div>

      {/* What the kitten can do at this form */}
      <div className="eg-section-label">할 수 있는 것</div>
      <div className="eg-behavior-list">
        {BEHAVIORS.map((b) => {
          const open = level >= b.minLevel;
          return (
            <div className="eg-behavior" data-open={open} key={b.t}>
              <span className="eg-behavior-dot" aria-hidden="true" />
              <span className="eg-behavior-t">{b.t}</span>
              <span className="eg-behavior-tag">
                {b.base ? '기본' : open ? '해금됨' : `Lv.${b.minLevel} 잠김`}
              </span>
            </div>
          );
        })}
      </div>

      <button type="button" className="eg-cta" onClick={() => onGrowth?.()}>성장 로드맵 보기</button>
      <button type="button" className="eg-secbtn" onClick={() => onLeague?.()}>커뮤니티 (리그·광장·영감)</button>
    </div>
  );
}
