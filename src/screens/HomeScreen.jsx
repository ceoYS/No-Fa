import { useEffect, useMemo, useState } from 'react';
import PetRoomPreview from '../components/PetRoomPreview.jsx';
import EmberCalendarStrip from '../components/EmberCalendarStrip.jsx';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { summarizeRules, linkedRules, STATUS_LABEL, STATUS_PILL } from '../constants/discipline.js';
import { buildDayRecords, daySummary } from '../constants/recentDays.js';
import { RESOURCE, nextLockedMilestone } from '../constants/rewards.js';
import { msToDateValue, msToTimeValue, dateTimeToMs } from '../utils/datetime.js';

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
  counters = [],
  selectedCounterId = null,
  selectedCounterName = '',
  onSelectCounter,
  onAddCounter,
  onEditCounter,
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
  // 카운터 추가 / 편집 시트 (counter-management). Esc로 닫힌다.
  const [addCounterOpen, setAddCounterOpen] = useState(false);
  const [editCounterOpen, setEditCounterOpen] = useState(false);
  useDismissOnEscape(addCounterOpen || editCounterOpen, () => {
    setAddCounterOpen(false);
    setEditCounterOpen(false);
  });
  const selectedCounter = counters.find((c) => c.id === selectedCounterId) ?? counters[0] ?? null;

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

  // Rules linked to the currently-selected counter (rule↔counter link). This is a
  // TODAY rule-status view — kept separate from the counter's elapsed time, which
  // the hero/cards above already show. A rule slip never moves the timer.
  const counterRules = useMemo(
    () => linkedRules(rules, selectedCounter?.id),
    [rules, selectedCounter?.id],
  );
  const counterRuleSummary = useMemo(() => summarizeRules(counterRules), [counterRules]);

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
        <h2 className="timer-hero-name">{selectedCounterName || '절제'}</h2>
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
            못 참을 것 같아요
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

      {/* 4) 금욕 카운터 목록 — 여러 절제를 한눈에. 카드를 누르면 히어로 타이머가 바뀐다 */}
      <section className="home-counters">
        <div className="card-row">
          <p className="section-eyebrow">금욕 카운터</p>
          <button type="button" className="btn-add" onClick={() => setAddCounterOpen(true)}>
            + 카운터 추가
          </button>
        </div>
        <div className="counter-list">
          {counters.map((c) => {
            const el = formatElapsed(now - c.startMs);
            const pct = c.targetDays > 0 ? Math.min(100, Math.round((el.days / c.targetDays) * 100)) : 0;
            const selected = c.id === (selectedCounter?.id ?? selectedCounterId);
            const linkedCount = rules.filter((r) => r.counterId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                className="counter-card"
                data-selected={selected}
                aria-pressed={selected}
                aria-label={`${c.name} — ${el.days}일 ${el.hh}:${el.mm}`}
                onClick={() => onSelectCounter?.(c.id)}
              >
                <div className="counter-card-head">
                  <span className="counter-card-name">{c.name}</span>
                </div>
                <div className="counter-card-time">
                  {el.days}일 {el.hh}:{el.mm}
                </div>
                <div className="counter-mini-progress" aria-hidden="true">
                  <span className="counter-mini-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="counter-card-meta">
                  <span className="hairline-note">목표 {c.targetDays}일</span>
                  <span className="hairline-note">규율 {linkedCount}개</span>
                  <span className="hairline-note">최장 {Math.max(c.longestDays ?? 0, el.days)}일</span>
                </div>
              </button>
            );
          })}
        </div>
        {selectedCounter ? (
          <section className="card linked-rules-card">
            <div className="card-row">
              <span className="card-label">‘{selectedCounter.name}’에 연결된 규율</span>
              <button
                type="button"
                className="text-quiet"
                style={{ fontSize: 'var(--fs-small)' }}
                onClick={() => onNavigate('discipline')}
              >
                규율 편집
              </button>
            </div>
            {counterRules.length === 0 ? (
              <p className="hairline-note">
                아직 이 카운터에 연결된 규율이 없어요. ‘나의 규율’에서 더할 수 있어요.
              </p>
            ) : (
              <>
                <p className="discipline-summary">
                  오늘 {counterRuleSummary.total}개 중 {counterRuleSummary.keeping}개를 지키는 중이에요.
                </p>
                <ul className="linked-rule-list">
                  {counterRules.map((r) => (
                    <li className="linked-rule-row" key={r.id}>
                      <span className="linked-rule-label">{r.label}</span>
                      <span
                        className={`pill ${STATUS_PILL[r.status] ?? 'pill'} linked-rule-status`}
                      >
                        {STATUS_LABEL[r.status] ?? '미정'}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="hairline-note text-quiet">
              규율은 절제 시간을 돕는 보조 약속이에요. 못 지켜도 타이머는 그대로 이어가요.
            </p>
          </section>
        ) : null}

        {selectedCounter ? (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setEditCounterOpen(true)}
          >
            ‘{selectedCounter.name}’ 카운터 편집
          </button>
        ) : null}
      </section>

      {/* 5) 보조 영역 — 규율 / 최근 기록 / 고양이 방은 한 단계 아래로 묶는다 */}
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
              {selectedCounterName ? `‘${selectedCounterName}’ ` : ''}절제 시간만 0으로 돌아가요. 다른
              카운터는 그대로 이어가요. 무너진 순간을 탓하지 않아요.
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
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmRelapse}>
                기록하고 다시 시작
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addCounterOpen ? (
        <AddCounterSheet
          onCancel={() => setAddCounterOpen(false)}
          onSubmit={(payload) => {
            onAddCounter?.(payload);
            setAddCounterOpen(false);
          }}
        />
      ) : null}

      {editCounterOpen && selectedCounter ? (
        <EditCounterSheet
          counter={selectedCounter}
          onCancel={() => setEditCounterOpen(false)}
          onSubmit={(payload) => {
            onEditCounter?.(selectedCounter.id, payload);
            setEditCounterOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

// 카운터 추가 시트 (counter-management): 이름 / 시작 일 / 시작 시간 / 목표 일수.
// 시작 시각은 날짜+시간 입력을 합쳐 startMs로 만든다. 미래 시각은 App에서 now로 클램프.
function AddCounterSheet({ onCancel, onSubmit }) {
  const now = Date.now();
  const [name, setName] = useState('');
  const [date, setDate] = useState(msToDateValue(now));
  const [time, setTime] = useState(msToTimeValue(now));
  const [target, setTarget] = useState('30');
  const ready = name.trim().length > 0 && !!date;

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="카운터 추가">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">새 카운터 추가</h2>
        <p className="sheet-help">새로 이어갈 절제를 하나 추가해요.</p>

        <label className="field-label" htmlFor="add-counter-name">이름</label>
        <input
          id="add-counter-name"
          type="text"
          className="sheet-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 금딸, SNS 줄이기"
          maxLength={40}
          autoFocus
        />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label" htmlFor="add-counter-date">시작 일</label>
            <input
              id="add-counter-date"
              type="date"
              className="sheet-input"
              value={date}
              max={msToDateValue(now)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field-col">
            <label className="field-label" htmlFor="add-counter-time">시작 시간</label>
            <input
              id="add-counter-time"
              type="time"
              className="sheet-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="add-counter-target">목표 일수</label>
        <input
          id="add-counter-target"
          type="number"
          min="1"
          max="3650"
          className="sheet-input"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={submit}
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}

// 카운터 편집 시트 (counter-management): 같은 필드를 선택한 카운터 값으로 채워
// 수정한다. 저장/취소만 제공하며, 이번 라운드에는 카운터 삭제가 없다.
function EditCounterSheet({ counter, onCancel, onSubmit }) {
  const [name, setName] = useState(counter?.name ?? '');
  const [date, setDate] = useState(msToDateValue(counter?.startMs ?? Date.now()));
  const [time, setTime] = useState(msToTimeValue(counter?.startMs ?? Date.now()));
  const [target, setTarget] = useState(String(counter?.targetDays ?? 30));
  if (!counter) return null;
  const ready = name.trim().length > 0 && !!date;

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="카운터 편집">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">카운터 편집</h2>
        <p className="sheet-help">시작 시각을 바로잡거나 이름·목표를 바꿀 수 있어요.</p>

        <label className="field-label" htmlFor="edit-counter-name">이름</label>
        <input
          id="edit-counter-name"
          type="text"
          className="sheet-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
        />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label" htmlFor="edit-counter-date">시작 일</label>
            <input
              id="edit-counter-date"
              type="date"
              className="sheet-input"
              value={date}
              max={msToDateValue(Date.now())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field-col">
            <label className="field-label" htmlFor="edit-counter-time">시작 시간</label>
            <input
              id="edit-counter-time"
              type="time"
              className="sheet-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <label className="field-label" htmlFor="edit-counter-target">목표 일수</label>
        <input
          id="edit-counter-target"
          type="number"
          min="1"
          max="3650"
          className="sheet-input"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={submit}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
