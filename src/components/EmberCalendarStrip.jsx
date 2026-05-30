import { CALENDAR_LABEL } from '../constants/recentDays.js';

/*
 * EmberCalendarStrip — last-7-day mini strip.
 * Dot states (PRD §0.5.3.2): kept / recovered / needs_check / untracked.
 * Tone is a warmth spectrum, never a red/green binary or a "failure" label.
 * When `onSelectDay` is provided the dots render as buttons (tap → one-line
 * summary in the parent); otherwise they are static list items.
 *
 * `days`: array of { label, state, isToday } (see buildDayRecords).
 */
export default function EmberCalendarStrip({
  days,
  selectedIndex = null,
  onSelectDay,
  label = '최근 7일 기록',
}) {
  const interactive = typeof onSelectDay === 'function';

  return (
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
            aria-label={`${day.label}요일 ${CALENDAR_LABEL[day.state]} 요약 보기`}
            onClick={() => onSelectDay(i)}
          >
            {inner}
          </button>
        ) : (
          <div key={i} role="listitem" className="ember-strip-day" {...dataAttrs}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
