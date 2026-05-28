/*
 * EmberCalendarStrip — last-7-day mini strip.
 * Tones:
 *   - "steady"   : check-in or protective action present
 *   - "quiet"    : urge/shaky day — pet quietens; NOT a failure-red
 *   - "unmarked" : no record yet
 * Forbidden: binary red/green, "failure" labels, level judgement.
 */

const DEFAULT_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function EmberCalendarStrip({ days, labels = DEFAULT_LABELS, todayIndex = 6 }) {
  return (
    <div className="ember-strip" role="list" aria-label="최근 7일 잔불 캘린더">
      {days.map((tone, i) => (
        <div
          key={i}
          role="listitem"
          className="ember-strip-day"
          data-tone={tone}
          data-today={i === todayIndex ? 'true' : 'false'}
        >
          <span className="ember-strip-label">{labels[i]}</span>
          <span className="ember-strip-dot" />
        </div>
      ))}
    </div>
  );
}
