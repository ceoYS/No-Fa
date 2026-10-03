/*
 * WeeklyLeague — EG-09 주간 리그. The anonymous weekly ladder: this week's tier, the
 * promotion distance (top 5 promote), ~6 nearby anonymous rows with the user's own row
 * highlighted, and the calm reassurance that missing a day only rests the rank (relegation
 * only after 2 idle weeks). Ported from the frozen design. Everything is LOCAL and
 * deterministic (league.js) — no network, no real people, no shaming.
 */
const DAY_MS = 86400000;

// Community scaffold (Founder P1-G) — EXAMPLE encouragement lines, NOT posts from real people.
// The UI marks them 예시 · 준비 중 and offers no post box, because a real encouragement community
// (and a way to post) does not exist yet and must not be faked. Warm, anonymous, non-shaming.
const COMMUNITY_SAMPLES = Object.freeze([
  '오늘도 잘 버텼어요. 우리 같이 가요.',
  '힘든 밤이 지나면 아침이 꼭 와요.',
  '숫자보다 오늘 하루가 더 소중해요.',
]);

// Days left until the week resets (Sunday night = the next week boundary).
function daysLeft(weekStart) {
  const end = (weekStart ?? 0) + 7 * DAY_MS;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
}

export default function WeeklyLeague({ league, onBack, onLadder }) {
  const { tier, nextTier, nearby = [], myRank, toPromote, promoteRank, score, week, resetLabel } = league;
  const left = daysLeft(week);
  const inPromo = toPromote <= 0;
  const promoLine = inPromo
    ? '승급권 안에 있어요'
    : `승급까지 ${toPromote} XP`;
  const promoSub = nextTier
    ? `상위 ${promoteRank}명이 ${nextTier.name} 리그로 올라가요`
    : '이미 최상위 리그예요 · 이 주의 참여를 이어가요';
  // Honest progress toward the promotion line: my score / (my score + the gap to the line).
  const pct = inPromo ? 1 : Math.max(0.04, Math.min(1, score / Math.max(1, score + toPromote)));

  return (
    <div className="v2-screen eg-league-screen">
      <div className="eg-topbar" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="eg-h2" style={{ fontSize: 20 }}>{tier.name} 리그</div>
          <div className="eg-sub" style={{ marginTop: 2 }}>이번 주 XP로 겨뤄요 · {resetLabel} 리셋 · 남은 {left}일</div>
        </div>
        <span className="eg-league-badge" style={{ marginLeft: 'auto' }}>{tier.name}</span>
      </div>

      <div className="eg-promo-card">
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 12.5, color: 'var(--eg-ember-light)' }}>{promoLine}</b>
          <div className="eg-sub" style={{ marginTop: 2 }}>{promoSub}</div>
        </div>
        <div className="eg-promo-bar"><div className="eg-promo-fill" style={{ width: `${Math.round(pct * 100)}%` }} /></div>
      </div>

      <div className="eg-league-list">
        <div className="eg-league-list-head">
          <span>내 주변 순위</span>
          <span style={{ marginLeft: 'auto' }}>이번 주 XP</span>
        </div>
        {nearby.map((r) => (
          <div className="eg-league-list-row" data-me={r.isMe} key={`${r.rank}-${r.name}`}>
            <span className="eg-lrow-rank">{r.rank}</span>
            <span className="eg-lrow-av" aria-hidden="true" />
            <b className="eg-lrow-name">{r.isMe ? '나' : r.name}</b>
            <span className="eg-lrow-xp">{r.score} XP</span>
          </div>
        ))}
        <div className="eg-league-cut">— {promoteRank}위까지 승급선 · 위가 {nextTier ? `${nextTier.name} 리그행` : '최상위'} —</div>
      </div>

      {/* Honest note: the surrounding rows are a deterministic LOCAL field, not live players. */}
      <p className="eg-league-demo-note">지금 주변 순위는 예시로 채워진 연습 리그예요 · 실제 참가자 매칭은 준비 중이에요</p>

      <div className="eg-league-reassure">
        <b>하루 놓쳐도 순위만 잠시 쉬어가요.</b> 강등은 2주 연속 미참여에만 · 익명이라 아무도 나를 몰라요.
      </div>

      {/* Community scaffold (P1-G) — clearly marked 예시 · 준비 중, no post box (nothing faked). */}
      <section className="eg-community">
        <div className="eg-community-head">
          <span className="eg-community-title">함께 걷는 응원</span>
          <span className="eg-community-badge">예시 · 준비 중</span>
        </div>
        <ul className="eg-community-list">
          {COMMUNITY_SAMPLES.map((m) => (
            <li className="eg-community-item" key={m}>{m}</li>
          ))}
        </ul>
        <p className="eg-community-note">실제 응원 커뮤니티는 준비 중이에요. 지금은 예시 문장을 보여드려요.</p>
      </section>

      <button type="button" className="eg-secbtn" onClick={() => onLadder?.()}>리그 사다리 · XP 얻는 법</button>
      <button type="button" className="eg-secbtn" onClick={() => onBack?.()}>돌아가기</button>
    </div>
  );
}
