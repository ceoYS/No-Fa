/*
 * LeagueLadder — EG-10 리그 사다리 · XP 안내. The five tiers (top → bottom) with each
 * tier's weekly reward, and "이번 주 XP를 얻는 법" (the eligible actions and their points).
 * Ported from the frozen design. Copy stays neutral: the note is explicit that the numbers
 * and promotion cuts are tunable placeholders, and that participation — not streak length —
 * makes the rank.
 */
import { LEAGUE_TIERS } from '../constants/league.js';
import { XP_SOURCES } from '../constants/progression.js';

// Weekly reward copy per tier (dc.html ladder). Cosmetic only — earned by a week's
// participation, never bought.
const TIER_REWARD = {
  white: '시즌 한정 방 테마 · 특별 소품',
  gold: '잔불 조각 60 + 한정 소품',
  silver: '잔불 조각 40 + 소품 1',
  coal: '잔불 조각 20',
  ember: '시작 리그',
};

// "이번 주 XP를 얻는 법" — the eligible actions (dc.html earnRows), with the design's
// frequency hints. Points mirror the XP source values.
const EARN_HINT = {
  goalSuccess: '',
  record: ' (매일 1회)',
  crisisOvercome: ' (잠깐 멈춤 완료)',
  recoveryReturn: ' (다음날 1회 보너스)',
  futureDiary: '',
};

export default function LeagueLadder({ league, onBack }) {
  const curId = league?.tier?.id;
  const nextId = league?.nextTier?.id ?? null;
  // Top tier first.
  const tiers = [...LEAGUE_TIERS].reverse();
  return (
    <div className="v2-screen eg-ladder">
      <div className="eg-topbar">
        <button type="button" className="eg-back" onClick={() => onBack?.()} aria-label="뒤로">←</button>
        <b style={{ fontSize: 17 }}>리그 사다리</b>
      </div>

      <div className="eg-ladder-list">
        {tiers.map((t, i) => {
          const tag = t.id === curId ? '현재' : t.id === nextId ? '승급 목표' : i === 0 ? '최상위' : '';
          return (
            <div className="eg-ladder-row" data-current={t.id === curId} data-target={t.id === nextId} key={t.id}>
              <span className={`eg-tier-chip eg-tier-chip--${t.id}`} aria-hidden="true" />
              <div style={{ flex: 1 }}>
                <b className="eg-ladder-name">{t.name}</b>
                <div className="eg-sub" style={{ marginTop: 1 }}>{TIER_REWARD[t.id]}</div>
              </div>
              {tag ? <span className="eg-ladder-tag">{tag}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="eg-section-label">이번 주 XP를 얻는 법</div>
      <div className="eg-earn-table">
        {Object.values(XP_SOURCES).map((s) => (
          <div className="eg-earn-row" key={s.id}>
            <span>{s.label}{EARN_HINT[s.id] ?? ''}</span>
            <b style={{ marginLeft: 'auto', color: 'var(--eg-ember-light)' }}>+{s.xp}</b>
          </div>
        ))}
      </div>

      <p className="eg-sub" style={{ textAlign: 'center', lineHeight: 1.6, marginTop: 4 }}>
        스트릭 길이가 아니라 이번 주의 참여가 순위를 만들어요<br />
        — 오래 쉬어도 공평하게 시작 · 수치·승급 컷은 조정 가능한 값이에요
      </p>
      <button type="button" className="eg-secbtn" onClick={() => onBack?.()}>돌아가기</button>
    </div>
  );
}
