import { useMemo, useState } from 'react';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { BADGE_LABEL, listBadges, summarizeRules } from '../constants/discipline.js';

// RC-2A: 기록 is now a REAL monthly calendar (year/month grid), not a rolling N-day strip.
// Every day cell maps to an actual calendar date; the dot/record is read ONLY from the
// real localStorage ledger (today from the live record, past days from checkinLedger) —
// empty days stay empty and no past record is ever fabricated. Week starts on Sunday.
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const ABSTINENCE_TEXT = {
  clean: '이어가는 중',
  relapse: '다시 시작한 날',
  unknown: '기록 전',
};

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function CalendarScreen({
  onNavigate,
  onCheckinFromRecord,
  rules = [],
  todayRecord = null,
  checkinLedger = null,
}) {
  const now = Date.now();
  const todayKey = startOfDay(now);
  const ledger = checkinLedger ?? {};

  const [view, setView] = useState(() => {
    const d = new Date(now);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [detail, setDetail] = useState(null);
  useDismissOnEscape(detail !== null, () => setDetail(null));

  // The single source of a day's record: today reads the live record, every other day
  // reads the rolling ledger by its dateMs. A day with no saved entry returns null — we
  // never invent one (no seeded/sample history).
  const recordFor = (dateMs) => {
    if (dateMs === todayKey) return todayRecord?.checkin ?? ledger[dateMs] ?? null;
    return ledger[dateMs] ?? null;
  };
  // Real has-any signal across all saved days (drives the honest empty state).
  const hasAnyCheckin = Object.keys(ledger).length > 0 || !!todayRecord?.checkin;

  // Build the month grid: leading weekday blanks + the real days of this month.
  const cells = useMemo(() => {
    const lead = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < lead; i += 1) out.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateMs = startOfDay(new Date(view.year, view.month, d).getTime());
      out.push({
        d,
        dateMs,
        isToday: dateMs === todayKey,
        isFuture: dateMs > todayKey,
        hasRecord: !!recordFor(dateMs),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.year, view.month, checkinLedger, todayRecord, todayKey]);

  // RC-5 records usefulness: HONEST recognition of how many days the user actually recorded.
  // monthRecordCount counts the saved-record days in the VIEWED month (read straight off the
  // same cells the grid renders, so it can never disagree with the dots). totalRecordCount
  // counts every saved day all-time (ledger keys, plus today if it is saved live but not yet
  // mirrored into the ledger). Both are pure counts of REAL entries — an empty month/history
  // reads 0, and nothing is fabricated. This is recognition, never a streak/insight claim.
  const monthRecordCount = cells.filter((cell) => cell && cell.hasRecord).length;
  const totalRecordCount =
    Object.keys(ledger).length + (todayRecord?.checkin && !ledger[todayKey] ? 1 : 0);

  const goPrevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const goNextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));
  const goPrevYear = () => setView((v) => ({ ...v, year: v.year - 1 }));
  const goNextYear = () => setView((v) => ({ ...v, year: v.year + 1 }));

  // Build the full day record for the detail sheet from REAL data only. Past days carry
  // no fabricated discipline counts (those were never stored) — only today's are live.
  const buildDay = (dateMs) => {
    const date = new Date(dateMs);
    const wd = WEEKDAYS[date.getDay()];
    const isToday = dateMs === todayKey;
    const checkin = recordFor(dateMs);
    // RC-4 honesty: per-day abstinence state is only known for TODAY (the live todayRecord).
    // Past days were never stored with an abstinence state, so we do NOT synthesise one from
    // the current run start — an unrecorded past day reads 기록 전 (unknown), never a fabricated
    // 이어가는 중 streak. The live running streak is shown on the Home timer, not invented here.
    const abstinenceState = isToday ? todayRecord?.abstinenceState ?? 'unknown' : 'unknown';
    const s = isToday ? summarizeRules(rules) : { kept: 0, held: 0, missed: 0 };
    return {
      dateMs,
      dateLabel: `${date.getMonth() + 1}월 ${date.getDate()}일 (${wd})${isToday ? ' · 오늘' : ''}`,
      isToday,
      abstinenceState,
      keptCount: s.kept,
      heldCount: s.held,
      missedCount: s.missed,
      failureReason: isToday ? todayRecord?.failureReason ?? null : null,
      triggers: isToday ? todayRecord?.triggers ?? [] : checkin?.triggers ?? [],
      reflection: isToday ? todayRecord?.reflection ?? null : null,
      nextAction: isToday ? todayRecord?.nextAction ?? null : null,
      badges: isToday ? todayRecord?.badges ?? {} : {},
      checkin,
    };
  };

  const openDay = (dateMs) => setDetail(buildDay(dateMs));

  const monthLabel = `${view.year}년 ${view.month + 1}월`;
  const cur = new Date(now);
  const atCurrentMonth = view.year === cur.getFullYear() && view.month === cur.getMonth();

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">하루하루 남긴 기록이에요</p>
          <h1 className="screen-title">기록</h1>
        </div>
      </header>

      <p className="screen-subtitle">
        날짜를 누르면 그 날 남긴 글을 볼 수 있어요. 기록이 없는 날은 비어 있어요.
      </p>

      {/* 월간 달력 — 실제 달력 기반. 이전/다음 달, 이전/다음 연도로 이동한다. */}
      <section className="card month-calendar">
        <div className="month-nav" role="group" aria-label="달 이동">
          <button type="button" className="month-nav-btn" aria-label="이전 연도" onClick={goPrevYear}>
            «
          </button>
          <button type="button" className="month-nav-btn" aria-label="이전 달" onClick={goPrevMonth}>
            ‹
          </button>
          <span className="month-nav-label" aria-live="polite">{monthLabel}</span>
          <button type="button" className="month-nav-btn" aria-label="다음 달" onClick={goNextMonth}>
            ›
          </button>
          <button type="button" className="month-nav-btn" aria-label="다음 연도" onClick={goNextYear}>
            »
          </button>
        </div>

        {!atCurrentMonth ? (
          <button
            type="button"
            className="btn btn-ghost btn-block month-today-btn"
            onClick={() => setView({ year: cur.getFullYear(), month: cur.getMonth() })}
          >
            이번 달로
          </button>
        ) : null}

        <div className="month-weekdays" aria-hidden="true">
          {WEEKDAYS.map((w) => (
            <span key={w} className="month-weekday">{w}</span>
          ))}
        </div>

        <div className="month-grid" role="grid" aria-label={`${monthLabel} 기록 달력`}>
          {cells.map((cell, i) =>
            cell === null ? (
              <span key={`blank-${i}`} className="month-cell month-cell-empty" aria-hidden="true" />
            ) : (
              <button
                key={cell.dateMs}
                type="button"
                className="month-cell"
                data-today={cell.isToday}
                data-has-record={cell.hasRecord}
                aria-label={`${view.month + 1}월 ${cell.d}일${cell.isToday ? ' 오늘' : ''} ${cell.hasRecord ? '기록 있음' : '기록 없음'}`}
                onClick={() => openDay(cell.dateMs)}
              >
                <span className="month-cell-num">{cell.d}</span>
                {cell.hasRecord ? <span className="month-cell-dot" aria-hidden="true" /> : null}
              </button>
            ),
          )}
        </div>
      </section>

      {totalRecordCount > 0 ? (
        <section className="card month-summary">
          <span className="card-label">기록한 날</span>
          <div className="month-summary-row">
            <div className="month-summary-stat">
              <span className="month-summary-num">{monthRecordCount}</span>
              <span className="hairline-note">이 달 기록한 날</span>
            </div>
            <div className="month-summary-stat">
              <span className="month-summary-num">{totalRecordCount}</span>
              <span className="hairline-note">지금까지 기록한 날</span>
            </div>
          </div>
          <p className="hairline-note">실제로 기록한 날만 세어요. 없는 기록은 만들지 않아요.</p>
        </section>
      ) : null}

      {!hasAnyCheckin ? (
        <section className="card calendar-empty">
          <span className="card-label">아직 남긴 기록이 없어요</span>
          <p className="hairline-note">
            오늘 기록부터 시작하면, 달력의 그 날짜에 그날의 글이 차곡차곡 쌓여요.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('checkin')}
          >
            오늘 기록하기
          </button>
        </section>
      ) : null}

      <section className="card">
        <span className="card-label">이 기록을 보는 방법</span>
        <ul className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <li className="hairline-note">· 점이 있는 날짜에는 그 날 남긴 글이 있어요. 눌러서 볼 수 있어요.</li>
          <li className="hairline-note">· 오늘은 테두리로 표시돼요. 화살표로 이전/다음 달과 연도를 넘겨봐요.</li>
          <li className="hairline-note">· 기록이 없는 날은 비어 있어요. 없는 기록을 지어내지 않아요.</li>
        </ul>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>

      {detail ? (
        <DayDetailSheet
          day={detail}
          onClose={() => setDetail(null)}
          onNavigate={onNavigate}
          onCheckinFromRecord={onCheckinFromRecord}
        />
      ) : null}
    </div>
  );
}

function DayDetailSheet({ day, onClose, onNavigate, onCheckinFromRecord }) {
  const badges = listBadges(day.badges);
  const hasCounts = day.keptCount + day.heldCount + day.missedCount > 0;
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="그 날의 기록">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">{day.dateLabel}</h2>

        <div className="day-detail-row">
          <span className="card-label">절제 상태</span>
          <span
            className={`pill ${
              day.abstinenceState === 'relapse'
                ? 'pill-ember'
                : day.abstinenceState === 'clean'
                  ? 'pill-moss'
                  : ''
            }`}
          >
            {ABSTINENCE_TEXT[day.abstinenceState] ?? '기록 전'}
          </span>
        </div>

        <div className="day-detail-block">
          <span className="card-label">규율</span>
          {hasCounts ? (
            <p className="discipline-summary">
              지킴 {day.keptCount} · 버팀 {day.heldCount} · 못 지킴 {day.missedCount}
            </p>
          ) : (
            <p className="hairline-note">그 날 규율 기록은 없어요.</p>
          )}
        </div>

        {day.checkin ? (
          <div className="day-detail-block">
            <span className="card-label">{day.isToday ? '오늘의 기록' : '그날의 기록'}</span>
            <p className="discipline-summary">
              {[
                day.checkin.moodLabel ? `기분 ${day.checkin.moodLabel}` : null,
                day.checkin.urge != null ? `충동 ${day.checkin.urge}/5` : null,
              ]
                .filter(Boolean)
                .join(' · ') || '기록을 남겼어요.'}
            </p>
            {day.checkin.triggers && day.checkin.triggers.length > 0 ? (
              <div className="sheet-chip-grid">
                {day.checkin.triggers.map((t) => (
                  <span key={t} className="chip" data-selected="false">{t}</span>
                ))}
              </div>
            ) : null}
            {day.checkin.note || day.checkin.promise || day.checkin.resolve ? (
              <div className="day-detail-block day-detail-written">
                <span className="card-label">쓴 내용</span>
                {day.checkin.note ? (
                  <div className="day-detail-block">
                    <span className="card-label">{day.isToday ? '오늘 회고' : '회고'}</span>
                    <p className="day-detail-reflection">“{day.checkin.note}”</p>
                  </div>
                ) : null}
                {day.checkin.promise ? (
                  <div className="day-detail-block">
                    <span className="card-label">{day.isToday ? '나와의 약속' : '약속'}</span>
                    <p className="day-detail-reflection">“{day.checkin.promise}”</p>
                  </div>
                ) : null}
                {day.checkin.resolve ? (
                  <div className="day-detail-block">
                    <span className="card-label">{day.isToday ? '오늘의 다짐' : '다짐'}</span>
                    <p className="day-detail-reflection">“{day.checkin.resolve}”</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <p className="hairline-note">
              {day.isToday
                ? '오늘 남긴 기록이에요. 고치려면 오늘 기록에서 바꿀 수 있어요.'
                : '지난 기록은 그대로 보관돼요. 여기서는 보기만 해요.'}
            </p>
          </div>
        ) : day.isToday ? (
          <div className="day-detail-block">
            <span className="card-label">오늘의 기록</span>
            <p className="hairline-note">
              아직 오늘 기록을 남기지 않았어요. 아래 ‘오늘 기록하기’로 이어서 1분이면 남길 수 있어요.
            </p>
          </div>
        ) : (
          <div className="day-detail-block">
            <span className="card-label">그날의 기록</span>
            <p className="hairline-note">이 날에는 남긴 기록이 없어요.</p>
          </div>
        )}

        {day.failureReason ? (
          <div className="day-detail-block">
            <span className="card-label">그 날의 흐름</span>
            <p className="discipline-summary">{day.failureReason}</p>
          </div>
        ) : null}

        {day.triggers && day.triggers.length > 0 ? (
          <div className="day-detail-block">
            <span className="card-label">계기</span>
            <div className="sheet-chip-grid">
              {day.triggers.map((t) => (
                <span key={t} className="chip" data-selected="false">{t}</span>
              ))}
            </div>
          </div>
        ) : null}

        {day.reflection ? (
          <div className="day-detail-block">
            <span className="card-label">복기</span>
            <p className="day-detail-reflection">“{day.reflection}”</p>
          </div>
        ) : null}

        {day.nextAction ? (
          <div className="day-detail-block">
            <span className="card-label">다음 행동</span>
            <p className="discipline-summary">{day.nextAction}</p>
          </div>
        ) : null}

        {badges.length > 0 ? (
          <div className="badge-row">
            {badges.map((key) => (
              <span key={key} className="badge">{BADGE_LABEL[key]}</span>
            ))}
          </div>
        ) : null}

        {onNavigate ? (
          <div className="day-detail-block day-detail-recovery">
            <span className="card-label">다음 행동</span>
            <p className="hairline-note">
              기록은 그대로 두고, 오늘 할 수 있는 행동으로 이어가요. 지난 글이 오늘로 옮겨지지 않아요.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => (onCheckinFromRecord ? onCheckinFromRecord() : onNavigate('checkin'))}
            >
              오늘 기록으로 이어가기
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => onNavigate('urge')}
            >
              잠깐 멈춤
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => onNavigate('protection')}
            >
              보호 계획 확인
            </button>
          </div>
        ) : null}

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
