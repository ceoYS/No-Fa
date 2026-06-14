import { CALENDAR_LABEL, CALENDAR_LEGEND } from '../constants/recentDays.js';

/*
 * EmberCalendarStrip — last-7-day mini strip.
 * Dot states (PRD §0.5.3.2): kept / recovered / needs_check / untracked.
 * Tone is a warmth spectrum, never a red/green binary or a "failure" label.
 * When `onSelectDay` is provided the dots render as buttons (tap → one-line
 * summary in the parent); otherwise they are static list items.
 *
 * `days`: array of { label, dateLabel, state, isToday } (see buildDayRecords).
 *
 * R-14: each dot carries a full accessible name (date + state, e.g. "6월 13일
 * (금) · 오늘 지킨 날 요약 보기") so the warmth tone is never guess-only. Pass
 * `legend` to render the dot-state key inline beneath the strip — Home renders
 * the strip without the surrounding explainer 최근 기록 has, so it opts in here.
 */
export default function EmberCalendarStrip({
  days,
  selectedIndex = null,
  onSelectDay,
  label = '최근 7일 기록',
  legend = false,
}) {
  const interactive = typeof onSelectDay === 'function';

  return (
    <>
      <div
        className="ember-strip"
        role={interactive ? 'group' : 'list'}
        aria-label={label}
      >
        {days.map((day, i) => {
          const selected = i === selectedIndex;
          const dataAttrs = {
            'data-tone': day.state,
            'data-today': day.isToday ? 'true' : 'false',
            'data-selected': selected ? 'true' : 'false',
          };
          // R-14: name the dot by its date + warmth state, not just the weekday.
          const stateLabel = CALENDAR_LABEL[day.state] ?? '기록';
          const dayName = day.dateLabel ?? `${day.label}요일`;
          const inner = (
            <>
              <span className="ember-strip-label">{day.label}</span>
              <span className="ember-strip-dot" />
            </>
          );

          return interactive ? (
            <button
              key={i}
              type="button"
              className="ember-strip-day"
              {...dataAttrs}
              aria-pressed={selected}
              aria-label={`${dayName} ${stateLabel} 요약 보기`}
              onClick={() => onSelectDay(i)}
            >
              {inner}
            </button>
          ) : (
            <div
              key={i}
              role="listitem"
              className="ember-strip-day"
              aria-label={`${dayName} ${stateLabel}`}
              {...dataAttrs}
            >
              {inner}
            </div>
          );
        })}
      </div>
      {legend ? (
        <div
          className="row"
          role="list"
          aria-label="기록 표시 안내"
          style={{ flexWrap: 'wrap', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}
        >
          {CALENDAR_LEGEND.map((state) => (
            <span
              key={state}
              role="listitem"
              className="pill"
              style={{ fontSize: 'var(--fs-small)' }}
            >
              <span aria-hidden="true" className="legend-dot" data-tone={state} />
              {CALENDAR_LABEL[state]}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
