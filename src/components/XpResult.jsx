/*
 * XpResult — the record-result surface (EG-03). Shows the REAL earned XP: an itemized
 * breakdown that is always the sum of the day's actual actions (never a fixed +75), the
 * level bar, and a visible white-kitten reaction (celebrate pose — a real sprite swap).
 *
 * Honesty: if nothing new was earned (the day's XP was already granted), it says so
 * plainly instead of celebrating a fake +0.
 */
import { catSprite } from '../constants/companionAssets.js';

export default function XpResult({
  result,
  kittenName = '루미',
  onGoRoom,
  onSecondary,
  secondaryLabel = '홈으로',
}) {
  const earned = result.total > 0;
  return (
    <div className="v2-screen v2-screen--glow" style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 210, margin: '6px auto 0' }}>
        <img
          className="eg-anim-breathe"
          src={catSprite(earned ? 'celebrate' : 'idle')}
          alt={kittenName}
          loading="eager"
          decoding="async"
          style={{ display: 'block', width: '100%', aspectRatio: '1 / 1' }}
        />
        {earned ? <div className="eg-anim-float eg-float-xp">+XP</div> : null}
      </div>

      <div className="eg-eyebrow" style={{ marginTop: 4 }}>오늘의 기록 완료</div>
      <div className="eg-total" style={{ marginTop: 6 }}>+{result.total} XP</div>
      <div style={{ fontSize: 13, color: 'var(--eg-text-2)', fontWeight: 600, marginTop: 4 }}>
        {earned
          ? `${kittenName}가 오늘의 나를 기억할 거예요`
          : '오늘 기록은 저장됐어요 · 오늘 몫은 이미 채웠어요'}
      </div>

      {earned ? (
        <div className="eg-breakdown" style={{ marginTop: 16 }}>
          {result.rows.map((r) => (
            <div className="eg-brow" key={r.id}>
              <span className="eg-brow-k">{r.label}</span>
              <span className="eg-brow-v">+{r.xp} XP</span>
            </div>
          ))}
          <div className="eg-brow eg-brow--total">
            <span className="eg-brow-k">합계 — 이 날 선택한 행동의 합</span>
            <span className="eg-brow-v">= {result.total} XP</span>
          </div>
        </div>
      ) : null}

      <div className="eg-card" style={{ marginTop: 12, textAlign: 'left' }}>
        <div className="eg-xp-meta">
          <span>
            LV.{result.afterLevel} {result.afterEvolution.name}
          </span>
          <span>
            {result.afterProgress.maxed
              ? `${result.afterProgress.total} XP`
              : `${result.afterProgress.total} / ${result.afterProgress.target} XP`}
          </span>
        </div>
        <div className="eg-xpbar">
          <div
            className="eg-xpbar-fill"
            style={{ width: `${Math.round(result.afterProgress.pct * 100)}%` }}
          />
        </div>
        <div className="eg-next">
          {result.afterProgress.maxed
            ? '최고 성장 단계에 도달했어요'
            : <>다음 성장까지 <b>{result.afterProgress.remaining} XP</b></>}
        </div>
      </div>

      {result.leveledUp ? (
        <div className="eg-levelup">
          {result.afterEvolution.name} 성장 · {kittenName}가 한 뼘 자랐어요
        </div>
      ) : null}

      <div className="eg-btn-row" style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button type="button" className="eg-secbtn" onClick={onSecondary}>
          {secondaryLabel}
        </button>
        <button type="button" className="eg-cta" onClick={onGoRoom}>
          {kittenName} 보러 가기
        </button>
      </div>
    </div>
  );
}
