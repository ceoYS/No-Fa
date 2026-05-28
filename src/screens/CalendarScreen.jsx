import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';

const SAMPLE_WEEK = ['steady', 'steady', 'quiet', 'steady', 'steady', 'unmarked', 'unmarked'];

/* 6 weeks of placeholder tones — month view is a deferred placeholder per
 * FAILENDAR_TO_NOF_ADAPTATION §4 (P0 emphasizes the 7-day mini-strip).
 */
const MONTH_TONES = [
  null, null, 'steady', 'steady', 'quiet', 'steady', 'steady',
  'steady', 'quiet', 'steady', 'steady', 'steady', 'quiet', 'steady',
  'steady', 'steady', 'steady', 'quiet', 'steady', 'steady', 'steady',
  'quiet', 'steady', 'steady', 'steady', 'steady', 'quiet', 'steady',
  'steady', 'steady', 'unmarked', 'unmarked', 'unmarked', 'unmarked', 'unmarked',
];

export default function CalendarScreen({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">패턴이 보이기 시작했어요</p>
          <h1 className="screen-title">잔불 캘린더</h1>
        </div>
        <span className="pill pill-ember">최근 7일</span>
      </header>

      <p className="screen-subtitle">
        흔들린 날도 따뜻한 톤으로 남겨요. 빨강 표시는 없어요.
      </p>

      <section className="card">
        <span className="card-label">최근 7일</span>
        <EmberCalendarStrip days={SAMPLE_WEEK} todayIndex={4} />
        <div className="row" style={{ flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
          <Legend tone="steady" text="이어온 날" />
          <Legend tone="quiet" text="조용해진 날" />
          <Legend tone="unmarked" text="아직" />
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">이번 달 (보기 전용)</span>
          <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
            P1
          </span>
        </div>
        <div className="calendar-month" aria-label="이번 달 잔불 캘린더 (개발 예정)">
          {MONTH_TONES.map((tone, i) => (
            <div
              key={i}
              className="calendar-day"
              data-tone={tone ?? 'none'}
            >
              {tone ? i - 1 : ''}
            </div>
          ))}
          <div className="calendar-deferred">
            월/주 전체 보기는 P1에서 열려요. 지금은 7일 스트립으로 충분해요.
          </div>
        </div>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}

function Legend({ tone, text }) {
  return (
    <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          display: 'inline-block',
          background:
            tone === 'steady'
              ? 'radial-gradient(circle, #fcd49a, #f5a45a 70%)'
              : tone === 'quiet'
                ? 'radial-gradient(circle, #8a6a4a, #6b4a28 70%)'
                : 'transparent',
          border: tone === 'unmarked' ? '1px dashed #4d4843' : 'none',
        }}
      />
      {text}
    </span>
  );
}
