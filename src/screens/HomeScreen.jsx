import { useEffect, useMemo, useRef, useState } from 'react';
import EmberCat from '../components/EmberCat.jsx';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';

const SAMPLE_WEEK = ['steady', 'steady', 'quiet', 'steady', 'steady', 'unmarked', 'unmarked'];

const SEED_OFFSET_MS =
  12 * 86400 * 1000 + 3 * 3600 * 1000 + 24 * 60 * 1000 + 18 * 1000;

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

export default function HomeScreen({ onNavigate, rules = [] }) {
  const startRef = useRef(Date.now() - SEED_OFFSET_MS);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hh, mm, ss } = formatElapsed(now - startRef.current);

  const { keepingCount, needsCheckCount, preview } = useMemo(() => {
    const keeping = rules.filter((r) => r.status === '지키는 중' || r.status === '이번 주 실천');
    const needsCheck = rules.filter((r) => r.status === '오늘 확인 필요');
    return {
      keepingCount: keeping.length,
      needsCheckCount: needsCheck.length,
      preview: rules.slice(0, 2),
    };
  }, [rules]);

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 지키는 중이에요</p>
          <h1 className="screen-title">절제 시간</h1>
        </div>
      </header>

      <section
        className="abstinence-timer-card"
        aria-label="현재 절제 경과 시간"
      >
        <div className="abstinence-timer-row">
          <span className="abstinence-timer-days">{days}일</span>
          <span
            className="abstinence-timer-clock"
            aria-label={`${hh}시간 ${mm}분 ${ss}초`}
          >
            {hh}:{mm}:{ss}
          </span>
        </div>
        <p className="abstinence-timer-help">
          작은 잔불은 아직 꺼지지 않았어요. 흔들려도 다시 이어갈 수 있어요.
        </p>
      </section>

      <EmberCat tone="steady" label="잔불 곁의 흰 고양이" />

      <section className="card">
        <div className="card-row">
          <span className="card-label">절제 기록</span>
          <span className="text-muted" style={{ fontSize: 'var(--fs-small)' }}>
            최근 기록
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
        <div className="protect-grid">
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
        <p className="discipline-summary">
          {rules.length === 0
            ? '아직 정한 규율이 없어요. 규율을 추가해 보세요.'
            : `오늘 ${rules.length}개 중 ${keepingCount}개를 지키는 중이에요.`}
        </p>
        {needsCheckCount > 0 ? (
          <p className="hairline-note">{needsCheckCount}개는 오늘 확인이 필요해요.</p>
        ) : null}
        {preview.length > 0 ? (
          <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
            {preview.map((rule) => (
              <div className="rule-row" key={rule.id}>
                <span className="rule-label">{rule.label}</span>
                <span className="pill pill-moss rule-status">{rule.status}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">오늘의 방 온기</span>
          <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>
            안정
          </span>
        </div>
        <p className="hairline-note">
          규율 2개 유지 · 회복 행동 1회 · 체크인 완료
        </p>
        <p className="hairline-note text-quiet">
          고양이는 편안히 쉬는 중이에요.
        </p>
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
