import { useEffect, useRef, useState } from 'react';
import EmberCat from '../components/EmberCat.jsx';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';

const SAMPLE_WEEK = ['steady', 'steady', 'quiet', 'steady', 'steady', 'unmarked', 'unmarked'];

const SEED_OFFSET_MS =
  12 * 86400 * 1000 + 3 * 3600 * 1000 + 24 * 60 * 1000 + 18 * 1000;

const DISCIPLINE_PREVIEW = [
  { id: 'night_phone', label: '밤 11시 이후 침대에서 휴대폰 보지 않기', status: '오늘 아직 지키는 중' },
  { id: 'pause_first', label: '충동이 오면 5분 멈춤 먼저 누르기', status: '이번 주 4회 실천' },
  { id: 'no_stim_search', label: '자극 검색하지 않기', status: '보호 모드 켜짐' },
];

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return { days, hh, mm, ss };
}

export default function HomeScreen({ onNavigate }) {
  const startRef = useRef(Date.now() - SEED_OFFSET_MS);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hh, mm, ss } = formatElapsed(now - startRef.current);

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 지키는 중이에요</p>
          <h1 className="screen-title abstain-title">
            <span className="abstain-num">{days}</span>일{' '}
            <span className="abstain-num">{hh}</span>시간{' '}
            <span className="abstain-num">{mm}</span>분{' '}
            <span className="abstain-num">{ss}</span>초째 절제 중
          </h1>
        </div>
      </header>

      <p className="screen-subtitle">
        작은 잔불은 아직 꺼지지 않았어요. 흔들려도 다시 이어갈 수 있어요.
      </p>

      <EmberCat tone="steady" label="잔불 곁의 흰 고양이" />

      <section className="card">
        <div className="card-row">
          <span className="card-label">절제 기록</span>
          <span className="text-muted" style={{ fontSize: 'var(--fs-small)' }}>
            나만 보는 기록
          </span>
        </div>
        <div className="streak">
          <div>
            <div className="streak-value">12</div>
            <div className="streak-label">현재 절제일</div>
          </div>
          <div className="streak-divider" />
          <div>
            <div className="streak-value">27</div>
            <div className="streak-label">최장 기록</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">오늘 보호한 자극</span>
          <span className="pill pill-moss" style={{ fontSize: 'var(--fs-small)' }}>
            보호 모드
          </span>
        </div>
        <div className="protect-row">
          <div className="protect-cell">
            <div className="protect-value">24</div>
            <div className="protect-label">이미지</div>
          </div>
          <div className="protect-cell">
            <div className="protect-value">3</div>
            <div className="protect-label">영상</div>
          </div>
        </div>
        <p className="hairline-note">
          보호 모드가 자극 콘텐츠를 조용히 막았어요.
        </p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">나의 규율</span>
          <button
            type="button"
            className="text-quiet"
            style={{ fontSize: 'var(--fs-small)' }}
            onClick={() => onNavigate('discipline')}
          >
            규율 보기
          </button>
        </div>
        <p className="screen-subtitle" style={{ marginTop: 0 }}>
          내가 정한 기준을 오늘도 지키는 중이에요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          {DISCIPLINE_PREVIEW.map((rule) => (
            <div className="rule-row" key={rule.id}>
              <span className="rule-label">{rule.label}</span>
              <span className="pill pill-moss rule-status">{rule.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">최근 7일 기록</span>
          <button
            type="button"
            className="text-quiet"
            style={{ fontSize: 'var(--fs-small)' }}
            onClick={() => onNavigate('calendar')}
          >
            전체 보기
          </button>
        </div>
        <EmberCalendarStrip days={SAMPLE_WEEK} todayIndex={4} />
        <p className="hairline-note">
          흔들린 날도 기록하면, 나만의 위험 패턴이 보여요.
        </p>
      </section>

      <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('checkin')}
        >
          오늘 상태 기록하기
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('urge')}
        >
          충동 멈추기
        </button>
      </div>
    </div>
  );
}
