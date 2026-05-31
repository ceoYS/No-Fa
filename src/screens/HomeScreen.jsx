import { useEffect, useMemo, useState } from 'react';
import PetRoomPreview from '../components/PetRoomPreview.jsx';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { summarizeRules } from '../constants/discipline.js';
import { buildDayRecords, daySummary } from '../constants/recentDays.js';
import { RESOURCE, nextLockedMilestone } from '../constants/rewards.js';

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
  // 재발/리셋은 절대 즉시 실행되지 않는다 (refocus memo §2/§6): 다시 시작 버튼은
  // 확인 시트를 열 뿐, 실제 onRelapse()는 시트에서 한 번 더 확인해야 호출된다.
  const [confirmRestart, setConfirmRestart] = useState(false);
  useDismissOnEscape(confirmRestart, () => setConfirmRestart(false));

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hh, mm, ss } = formatElapsed(now - abstinenceStartMs);
  const bestDays = Math.max(longestDays, days);

  // Honest forward target — the next abstinence milestone day, framed as a goal
  // (never a "reward to chase"; rewards stay a by-product of the work). Past every
  // milestone there is no false target, just a calm "최장 기록" note.
  const nextGoal = nextLockedMilestone(days);
  const goalRemaining = nextGoal ? Math.max(0, nextGoal.day - days) : 0;
  const goalPct = nextGoal ? Math.min(100, Math.round((days / nextGoal.day) * 100)) : 100;

  const summary = useMemo(() => summarizeRules(rules), [rules]);
  const recentDays = useMemo(
    () => buildDayRecords({ rules, todayRecord, abstinence: { startMs: abstinenceStartMs, now } }, 7),
    // now ticks every second; only rebuild the ledger when the day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, todayRecord, abstinenceStartMs, Math.floor(now / DAY_MS)],
  );
  const [selectedDay, setSelectedDay] = useState(recentDays.length - 1);
  const relapsedToday = todayRecord?.abstinenceState === 'relapse';

  const confirmRelapse = () => {
    setConfirmRestart(false);
    onRelapse?.();
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 지키는 중이에요</p>
          <h1 className="screen-title">절제 시간</h1>
        </div>
      </header>

      {/* 1) 절제 경과 시간 히어로 — 첫 화면에서 가장 크게 보이는 핵심 정보 */}
      <section className="abstinence-timer-card timer-hero" aria-label="현재 절제 경과 시간">
        <p className="timer-hero-eyebrow">마지막 시작 이후 이어가는 중</p>
        <div className="timer-hero-days">
          <span className="timer-hero-days-num">{days}</span>
          <span className="timer-hero-days-unit">일</span>
        </div>
        <div className="timer-hero-clock" aria-label={`${hh}시간 ${mm}분 ${ss}초`}>
          {hh}:{mm}:{ss}
        </div>

        {nextGoal ? (
          <div className="timer-progress" aria-hidden="true">
            <span className="timer-progress-fill" style={{ width: `${goalPct}%` }} />
          </div>
        ) : null}

        <div className="timer-hero-meta">
          <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>
            최장 {bestDays}일
          </span>
          <span className="hairline-note">
            {nextGoal ? `다음 목표 ${nextGoal.day}일까지 ${goalRemaining}일` : '최장 기록을 새로 쓰는 중이에요'}
          </span>
        </div>

        <p className="abstinence-timer-help">
          작은 잔불은 아직 꺼지지 않았어요. 흔들려도 다시 이어갈 수 있어요.
        </p>
      </section>

      {/* 2) 위기 대응 CTA — 히어로 바로 아래, 가장 누르기 쉬운 위치 */}
      <section className="home-crisis">
        <p className="home-crisis-eyebrow">못 참을 것 같다면</p>
        <div className="home-hero-actions stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            onClick={() => onNavigate('urge')}
          >
            지금 충동 멈추기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('checkin')}
          >
            오늘 상태 남기기
          </button>
        </div>
      </section>

      {/* 3) 무너졌거나 흔들렸을 때 — 다시 시작은 반드시 확인 시트를 거친다 */}
      <section className="card home-restart">
        <span className="card-label">무너졌거나, 흔들렸다면</span>
        <p className="hairline-note">
          무너진 날도 끝이 아니에요. 차분히 다시 시작점을 찍고, 무엇이 계기였는지 함께 돌아봐요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setConfirmRestart(true)}
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

      {/* 4) 보조 영역 — 규율 / 최근 기록 / 고양이 방은 한 단계 아래로 묶는다 */}
      <div className="home-secondary stack" style={{ '--gap': 'var(--sp-3)' }}>
        <p className="section-eyebrow">오늘의 흐름</p>

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

      {/* 재발 확인 시트 — 즉시 리셋 금지. 실제 onRelapse()는 여기서만 호출된다. */}
      {confirmRestart ? (
        <div className="sheet-backdrop" onClick={() => setConfirmRestart(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="다시 시작 확인"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <h2 className="sheet-title">정말 다시 시작할까요?</h2>
            <p className="sheet-help">
              지금 멈추면 절제 시간이 0으로 돌아가요. 무너진 순간을 탓하지 않아요.
            </p>

            <div className="restart-summary">
              <div className="restart-summary-row">
                <span className="restart-summary-label">이번 기록</span>
                <span className="restart-summary-value">
                  {days}일 {hh}:{mm}
                </span>
              </div>
              <div className="restart-summary-row">
                <span className="restart-summary-label">최장 기록</span>
                <span className="restart-summary-value">{bestDays}일</span>
              </div>
            </div>

            <p className="restart-reassure">기록은 끝이 아니라 다음 시작점이에요.</p>

            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmRestart(false)}>
                아직은 괜찮아요
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmRelapse}>
                네, 다시 시작할게요
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
