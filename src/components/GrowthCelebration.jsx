/*
 * GrowthCelebration — EG-07 성장 축하. A full-screen modal shown ONCE when the kitten
 * crosses a growth-form threshold (progression.js). Ported from the frozen design:
 *   - a single radial glow behind the evolution asset — NO confetti, NO coins;
 *   - the new form name + the behaviours/props this form unlocks;
 *   - "방에서 만나기" (→ acknowledge + enter room) and "나중에" (→ acknowledge + close).
 *
 * It grants NO bonus XP or score — the growth already happened from real records. Both
 * buttons acknowledge the crossing durably (useProgression), so it never replays.
 */
import { catSprite } from '../constants/companionAssets.js';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';

export default function GrowthCelebration({ form, kittenName = '루미', onAcknowledge, onGoRoom }) {
  useDismissOnEscape(true, () => onAcknowledge?.());
  if (!form) return null;
  const unlocks = String(form.unlock || '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <div className="eg-celebrate-backdrop" role="dialog" aria-modal="true" aria-label={`${form.name} 성장 축하`}>
      <div className="eg-celebrate-card">
        <div className="eg-celebrate-eyebrow">LV.{form.level} 달성</div>
        <div className="eg-celebrate-catwrap">
          <span className="eg-celebrate-glow" aria-hidden="true" />
          <img
            className="eg-celebrate-cat eg-anim-breathe"
            src={catSprite(form.asset) ?? catSprite('idle')}
            alt={`성장한 ${kittenName}`}
            loading="eager"
            decoding="async"
          />
        </div>
        <div className="eg-celebrate-title">
          {kittenName}가<br />
          {form.name}가 되었어요
        </div>
        <p className="eg-celebrate-sub">매일의 기록이 만든 변화예요</p>

        {unlocks.length > 0 ? (
          <div className="eg-celebrate-unlocks">
            {unlocks.map((u) => (
              <div className="eg-celebrate-unlock" key={u}>
                <b>새로 열림</b>
                <span>{u}</span>
              </div>
            ))}
          </div>
        ) : null}

        <button type="button" className="eg-cta" style={{ marginTop: 16 }} onClick={() => onGoRoom?.()}>
          방에서 만나기
        </button>
        <button type="button" className="eg-celebrate-later" onClick={() => onAcknowledge?.()}>
          나중에
        </button>
      </div>
    </div>
  );
}
