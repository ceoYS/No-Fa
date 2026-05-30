import { useEffect, useMemo, useState } from 'react';
import PetRoomPreview from '../components/PetRoomPreview.jsx';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';
import { summarizeRules } from '../constants/discipline.js';
import { buildDayRecords, daySummary } from '../constants/recentDays.js';
import { RESOURCE } from '../constants/rewards.js';

const DAY_MS = 86400000;

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hh = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return { days, hh, mm, ss };
}

// Room Warmth band (§0.5.10 D) — shown as a word, never a number. A light inline
// derivation; the full warmth index lands with the domains/ refactor.
function warmthBand(summary, relapsed) {
  if (relapsed || summary.missed > 0) return '잔잔함';
  if (summary.keeping > 0) return '안정';
  return '잔잔함';
}

export default function HomeScreen({
  onNavigate,
  rules = [],
  abstinenceStartMs = Date.now(),
  longestDays = 0,
  onRelapse,
  onStartSlipReflection,
  todayRecord = null,
  emberShards = 0,
  placements = [],
  activeRoomTheme = 'empty',
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hh, mm, ss } = formatElapsed(now - abstinenceStartMs);
  const bestDays = Math.max(longestDays, days);

  const summary = useMemo(() => summarizeRules(rules), [rules]);
  const recentDays = useMemo(
    () => buildDayRecords({ rules, todayRecord, abstinence: { startMs: abstinenceStartMs, now } }, 7),
    // now ticks every second; only rebuild the ledger when the day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, todayRecord, abstinenceStartMs, Math.floor(now / DAY_MS)],
  );
  const [selectedDay, setSelectedDay] = useState(recentDays.length - 1);
  const relapsedToday = todayRecord?.abstinenceState === 'relapse';

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 지키는 중이에요</p>
          <h1 className="screen-title">절제 시간</h1>
        </div>
      </header>

      <section className="abstinence-timer-card" aria-label="현재 절제 경과 시간">
        <div className="abstinence-timer-row">
          <span className="abstinence-timer-days">{days}일</span>
          <span className="abstinence-timer-clock" aria-label={`${hh}시간 ${mm}분 ${ss}초`}>
            {hh}:{mm}:{ss}
          </span>
        </div>
        <div className="abstinence-timer-meta">
          <span className="hairline-note">마지막 시작 이후 이어가는 중</span>
          <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>최장 {bestDays}일</span>
        </div>
        <p className="abstinence-timer-help">
          작은 잔불은 아직 꺼지지 않았어요. 흔들려도 다시 이어갈 수 있어요.
        </p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">오늘의 규율 점검</span>
          <button
            type="button"
            className="text-quiet"
            style={{ fontSize: 'var(--fs-small)' }}
            onClick={() => onNavigate('discipline')}
          >
            규율 편집
          </button>
        </div>
        <p className="discipline-summary">
          {rules.length === 0
            ? '아직 정한 규율이 없어요. 규율을 추가해 보세요.'
            : `오늘 ${summary.total}개 중 ${summary.keeping}개를 지키는 중이에요.`}
        </p>
        {summary.missed > 0 ? (
          <p className="hairline-note">
            못 지킨 규율 {summary.missed}개 — 가볍게 복기하면 다음이 쉬워져요.
          </p>
        ) : null}
        {summary.unrecorded > 0 ? (
          <p className="hairline-note">아직 고르지 않은 규율 {summary.unrecorded}개가 있어요.</p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('checkin')}
        >
          오늘 규율 점검하기
        </button>
      </section>

      <section className="card">
        <span className="card-label">무너졌거나, 흔들렸다면</span>
        <p className="hairline-note">
          무너진 날도 끝이 아니에요. 차분히 다시 시작하고, 무엇이 계기였는지 한 번 돌아봐요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onRelapse?.()}
          >
            무너졌어요 · 다시 시작
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onStartSlipReflection?.(null)}
          >
            오늘 복기하기
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">못 참을 것 같다면</span>
          <span className="pill pill-moss" style={{ fontSize: 'var(--fs-small)' }}>잠깐 멈춤</span>
        </div>
        <p className="hairline-note">충동이 강할 때는 5분만 같이 버텨봐요. 파도처럼 약해질 수 있어요.</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('urge')}
        >
          못 참을 것 같아요
        </button>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">최근 기록</span>
          <button
            type="button"
            className="text-quiet"
            style={{ fontSize: 'var(--fs-small)' }}
            onClick={() => onNavigate('calendar')}
          >
            전체 보기
          </button>
        </div>
        <EmberCalendarStrip
          days={recentDays}
          selectedIndex={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <p className="hairline-note" aria-live="polite">
          {daySummary(recentDays[selectedDay])}
        </p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">함께 버티는 중</span>
          <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>동행</span>
        </div>
        <p className="discipline-summary">같은 목표로 하루를 버티는 사람들이 함께하고 있어요.</p>
        <p className="hairline-note">혼자가 아니에요. 같이 가는 사람들이 곁에 있어요.</p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">고양이의 방</span>
          <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>
            {RESOURCE.name} {emberShards}{RESOURCE.unit}
          </span>
        </div>
        <PetRoomPreview
          theme={activeRoomTheme}
          placements={placements}
          tone={relapsedToday ? 'dim' : 'steady'}
          variant="compact"
          label="잔불 곁의 흰 고양이 방"
        />
        <p className="hairline-note text-quiet">
          {relapsedToday
            ? '잔불이 잠깐 약해졌어요. 다시 이어가면 곧 따뜻해져요.'
            : `방 온기 · ${warmthBand(summary, relapsedToday)} · 오늘의 절제가 방을 데우고 있어요.`}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('reward')}
        >
          고양이 방 꾸미기
        </button>
      </section>
    </div>
  );
}
