/*
 * LeaguePreview — the Home weekly-league status (EG-04 row). Neutral, non-shaming copy
 * only: 현재 N위 · 승급권까지 N XP · 이번 주 XP — never "뒤처졌다 / 하위권 / 약하다".
 *
 * Honesty: when `onOpen` is not provided this renders as a STATIC status card (no
 * chevron, not a button) — it never pretends to navigate to a screen that isn't built
 * yet. The full weekly-league screen wires `onOpen` in a later slice.
 */
export default function LeaguePreview({
  tierName = '불씨',
  myRank = 1,
  toPromote = 0,
  promoteRank = 5,
  resetLabel = '일요일 밤',
  onOpen = null,
}) {
  const line =
    toPromote > 0 ? `승급권(${promoteRank}위)까지 ${toPromote} XP` : '승급권 안에 있어요';
  const inner = (
    <>
      <span className="eg-league-badge">{tierName}</span>
      <span style={{ flex: 1 }}>
        <span className="eg-league-name">
          {tierName} 리그 {myRank}위
        </span>
        <span className="eg-sub" style={{ display: 'block', marginTop: 1 }}>
          {line} · {resetLabel} 리셋
        </span>
      </span>
      {onOpen ? <span className="eg-league-chevron">→</span> : null}
    </>
  );
  if (onOpen) {
    return (
      <button type="button" className="eg-league" onClick={onOpen}>
        {inner}
      </button>
    );
  }
  return (
    <div className="eg-league" role="group" aria-label={`이번 주 리그 · ${tierName} ${myRank}위`}>
      {inner}
    </div>
  );
}
