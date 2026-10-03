/*
 * KittenHero — the Ember Graphite hero (EG-01/04): the white kitten as the brightest
 * object, with LV chip, growth-form name, XP bar, and next-growth line. The XP bar is
 * measured toward the NEXT FORM threshold (dc.html: "385/450" · "다음 성장까지 65 XP").
 * The pose is a REAL sprite swap (idle → happy), never a fake motion claim. Reused by
 * Home; a smaller variant sits in the Kitten Hub.
 */
import { catSprite } from '../constants/companionAssets.js';

export default function KittenHero({
  kittenName = '루미',
  level = 1,
  formName = '',
  progress = { total: 0, target: 1, remaining: 0, pct: 0, maxed: false },
  todayXp = null,
  nextName = null,
  pose = 'idle',
  size = 'lg',
}) {
  const src = catSprite(pose) ?? catSprite('idle');
  const maxed = !!progress.maxed;
  return (
    <div className="eg-hero">
      <div className="eg-hero-row">
        <span className="eg-lv-chip">LV.{level}</span>
        <span className="eg-form-name">{formName}</span>
        {todayXp != null && (
          <span className={`eg-today-xp${todayXp > 0 ? '' : ' eg-today-xp--zero'}`}>
            오늘 +{todayXp} XP
          </span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="eg-xp-meta">
          <span>
            {maxed ? `${progress.total} XP` : `${progress.total} / ${progress.target} XP`}
          </span>
          <span>{maxed ? '최고 성장 단계' : `다음 성장까지 ${progress.remaining} XP`}</span>
        </div>
        <div className="eg-xpbar">
          <div className="eg-xpbar-fill" style={{ width: `${Math.round(progress.pct * 100)}%` }} />
        </div>
        {nextName && !maxed ? (
          <div className="eg-next">
            다음 성장: <b>{nextName}</b>
          </div>
        ) : null}
      </div>
      <img
        className={`eg-hero-cat${size === 'sm' ? ' eg-hero-cat--sm' : ''} eg-anim-breathe`}
        src={src}
        alt={kittenName}
        loading="eager"
        decoding="async"
        style={{ aspectRatio: '1 / 1' }}
      />
    </div>
  );
}
