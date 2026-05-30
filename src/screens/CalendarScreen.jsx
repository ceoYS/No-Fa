import { useMemo, useState } from 'react';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';
import { BADGE_LABEL, listBadges } from '../constants/discipline.js';
import {
  buildDayRecords,
  rangeDays,
  RANGE_OPTIONS,
  CALENDAR_LEGEND,
  CALENDAR_LABEL,
} from '../constants/recentDays.js';

const ABSTINENCE_TEXT = {
  clean: '이어가는 중',
  relapse: '다시 시작한 날',
  unknown: '기록 전',
};

export default function CalendarScreen({
  onNavigate,
  rules = [],
  abstinenceStartMs = Date.now(),
  todayRecord = null,
}) {
  const now = Date.now();
  const [rangeId, setRangeId] = useState('7d');
  const [detail, setDetail] = useState(null);

  const days = useMemo(
    () =>
      buildDayRecords(
        { rules, todayRecord, abstinence: { startMs: abstinenceStartMs, now } },
        rangeDays(rangeId, now),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, todayRecord, abstinenceStartMs, rangeId],
  );
  const [selected, setSelected] = useState(days.length - 1);

  const openDay = (i) => {
    setSelected(i);
    setDetail(days[i] ?? null);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">패턴이 보이기 시작했어요</p>
          <h1 className="screen-title">최근 기록</h1>
        </div>
        <span className="pill pill-ember">{RANGE_OPTIONS.find((o) => o.id === rangeId)?.label}</span>
      </header>

      <p className="screen-subtitle">
        날짜를 누르면 그 날의 기록을 자세히 볼 수 있어요. 절제 상태, 규율, 복기까지 한 곳에서요.
      </p>

      <div className="range-row" role="group" aria-label="기간 선택">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="chip range-chip"
            data-selected={rangeId === opt.id}
            onClick={() => {
              setRangeId(opt.id);
              setSelected(rangeDays(opt.id, now) - 1);
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <section className="card">
        <span className="card-label">{RANGE_OPTIONS.find((o) => o.id === rangeId)?.label}</span>
        <EmberCalendarStrip days={days} selectedIndex={selected} onSelectDay={openDay} />

        <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          {CALENDAR_LEGEND.map((state) => (
            <Legend key={state} state={state} text={CALENDAR_LABEL[state]} />
          ))}
        </div>
      </section>

      <section className="card">
        <span className="card-label">이 기록을 보는 방법</span>
        <ul className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <li className="hairline-note">· 날짜를 누르면 그 날 절제 상태·규율·복기·다음 행동을 볼 수 있어요.</li>
          <li className="hairline-note">· 다시 시작한 날도 빨강 없이 따뜻한 톤으로 남겨요.</li>
          <li className="hairline-note">· 복기한 날은 못 지킨 뒤 다시 돌아본 날이에요.</li>
        </ul>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>

      {detail ? <DayDetailSheet day={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function Legend({ state, text }) {
  return (
    <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>
      <span aria-hidden="true" className="legend-dot" data-tone={state} />
      {text}
    </span>
  );
}

function DayDetailSheet({ day, onClose }) {
  const badges = listBadges(day.badges);
  const hasCounts = day.keptCount + day.heldCount + day.missedCount > 0;
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="그 날의 기록">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">{day.dateLabel}</h2>

        <div className="day-detail-row">
          <span className="card-label">절제 상태</span>
          <span className={`pill ${day.abstinenceState === 'relapse' ? 'pill-ember' : 'pill-moss'}`}>
            {ABSTINENCE_TEXT[day.abstinenceState] ?? '기록 전'}
            {day.streakDay > 0 ? ` · ${day.streakDay}일째` : ''}
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
            <span className="card-label">오늘의 체크인</span>
            <p className="discipline-summary">
              {[
                day.checkin.moodLabel ? `기분 ${day.checkin.moodLabel}` : null,
                day.checkin.urge != null ? `충동 ${day.checkin.urge}/5` : null,
              ]
                .filter(Boolean)
                .join(' · ') || '체크인을 남겼어요.'}
            </p>
            {day.checkin.triggers && day.checkin.triggers.length > 0 ? (
              <div className="sheet-chip-grid">
                {day.checkin.triggers.map((t) => (
                  <span key={t} className="chip" data-selected="false">{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

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

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
