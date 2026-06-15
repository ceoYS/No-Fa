import { useEffect, useMemo, useState } from 'react';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { summarizeRules, linkedRules, STATUS_LABEL, STATUS_PILL } from '../constants/discipline.js';
import { nextLockedMilestone } from '../constants/rewards.js';
import { msToDateValue, msToTimeValue, dateTimeToMs } from '../utils/datetime.js';

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hh = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return { days, hh, mm, ss };
}

// RC-2A: Home is deliberately reduced to a status surface — the abstinence timer and
// the active discipline counters, plus the two in-the-moment actions (잠깐 멈춤 / 오늘
// 기록). The old daily-action hub, first-run guidance, saved-summary, room preview and
// records strip were removed from Home; those features stay reachable via the bottom
// nav and the compact 관리 links below (records → 기록 tab, room/shield/protection/reset).
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
  onStartOwnRun,
  onRelapse,
  onStartSlipReflection,
  onResetLocalData,
}) {
  const [now, setNow] = useState(Date.now());
  // 재발/리셋은 절대 즉시 실행되지 않는다 (refocus memo §2/§6): 다시 시작 버튼은
  // 확인 시트를 열 뿐, 실제 onRelapse()는 시트에서 한 번 더 확인해야 호출된다.
  const [confirmRestart, setConfirmRestart] = useState(false);
  useDismissOnEscape(confirmRestart, () => setConfirmRestart(false));
  // 데이터 초기화 (C25): a destructive local-data reset also goes through a confirm sheet —
  // it never wipes on a single tap. The real onResetLocalData() is called only from the sheet.
  const [confirmReset, setConfirmReset] = useState(false);
  useDismissOnEscape(confirmReset, () => setConfirmReset(false));
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

  // RC-4 first-run honesty: a cleared install seeds 예시 SAMPLE counters so a new user can
  // see the app's shape. They are clearly labelled and never counted as the user's own — the
  // hero/card 최장 record is hidden while a counter is a sample, and a one-tap 내 기록으로 시작
  // (onStartOwnRun) converts every sample into a real run from now.
  const heroIsSample = !!selectedCounter?.isSample;
  const hasSample = counters.some((c) => c.isSample);

  // Honest forward target — the next abstinence milestone day, framed as a goal
  // (never a "reward to chase"; rewards stay a by-product of the work). Past every
  // milestone there is no false target, just a calm "최장 기록" note.
  const nextGoal = nextLockedMilestone(days);
  const goalRemaining = nextGoal ? Math.max(0, nextGoal.day - days) : 0;
  const goalPct = nextGoal ? Math.min(100, Math.round((days / nextGoal.day) * 100)) : 100;

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
          {!heroIsSample ? (
            <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>
              최장 {bestDays}일
            </span>
          ) : (
            <span className="pill sample-pill" style={{ fontSize: 'var(--fs-small)' }}>
              예시
            </span>
          )}
          <span className="hairline-note">
            {heroIsSample
              ? '예시 기록이에요. 아래에서 내 기록으로 시작할 수 있어요.'
              : nextGoal
                ? `다음 목표 ${nextGoal.day}일까지 ${goalRemaining}일`
                : '최장 기록을 새로 쓰는 중이에요'}
          </span>
        </div>
      </section>

      {/* RC-4 first-run honesty: when 예시 sample counters are present, a short honest notice
          (not the removed RC-2A onboarding dashboard) explains they are samples and offers a
          one-tap start of the user's own run. The per-counter 편집 sheet sets a real start
          date/time. The notice disappears once no samples remain. */}
      {hasSample ? (
        <section className="card sample-banner" aria-label="예시 카운터 안내">
          <span className="card-label">지금 보이는 기록은 예시예요</span>
          <p className="hairline-note">
            처음 둘러보기 쉽도록 예시 카운터를 넣어놨어요. ‘내 기록으로 시작’을 누르면 지금부터 0일째로
            새로 시작하고, 예시 표시는 사라져요. 시작일을 직접 정하려면 카운터 편집에서 바꿀 수 있어요.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onStartOwnRun?.()}
          >
            내 기록으로 시작
          </button>
        </section>
      ) : null}

      {/* 2) 홈에서 바로 할 수 있는 두 행동만 — 위기엔 잠깐 멈춤(urge), 하루는 오늘 기록(checkin).
          데일리 허브·첫 사용 안내·저장 확인 카드는 RC-2A에서 제거했다(홈은 상태 화면). */}
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
            오늘 기록하기
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

      {/* 4) 절제 카운터 목록 (R-10: 제목 '절제 시간'과 같은 어휘 계열) — 여러 절제를
          한눈에. 카드를 누르면 히어로 타이머가 바뀐다 */}
      <section className="home-counters">
        <div className="card-row">
          <p className="section-eyebrow">절제 카운터</p>
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
                aria-label={`${c.name} — 절제 중 ${el.days}일 ${el.hh}:${el.mm}:${el.ss}`}
                onClick={() => onSelectCounter?.(c.id)}
              >
                <div className="counter-card-head">
                  <span className="counter-card-name">{c.name}</span>
                  <span className="counter-card-status">{c.isSample ? '예시 · 지금까지' : '절제 중 · 지금까지'}</span>
                </div>
                {/* RC-1: every counter ticks live to the second (not just the hero) — the
                    1초 now 틱이 카드를 다시 그려, 모든 절제 항목이 실시간으로 흐른다. */}
                <div className="counter-card-time">
                  {el.days}일 {el.hh}:{el.mm}:{el.ss}
                </div>
                <div className="counter-mini-progress" aria-hidden="true">
                  <span className="counter-mini-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="counter-card-meta">
                  <span className="hairline-note">목표 {c.targetDays}일</span>
                  <span className="hairline-note">규율 {linkedCount}개</span>
                  {!c.isSample ? (
                    <span className="hairline-note">최장 {Math.max(c.longestDays ?? 0, el.days)}일</span>
                  ) : (
                    <span className="hairline-note text-quiet">예시 기록</span>
                  )}
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

      {/* 5) 관리 · 바로가기 (RC-2A 홈 다이어트) — 최근 기록 / 고양이 방 / 보호 설정 등 보조
          화면을 길게 깔린 카드 대신 짧은 링크 한 줄씩으로 모았다. 최근 기록은 하단 탭 ‘기록’으로
          옮겼고, 라우트·기능은 그대로 두고 홈에서의 노출만 줄였다. 데이터 초기화는 확인 시트를
          거치며, 계정/클라우드 없이 이 기기 저장분만 지운다는 사실을 그대로 밝힌다. */}
      <section className="card home-manage" aria-label="관리 바로가기">
        <span className="card-label">관리</span>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('reward')}
          >
            고양이 방 꾸미기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('protection')}
          >
            보호 설정 적기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('shield')}
          >
            차단 설정 (준비 중)
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            aria-haspopup="dialog"
            onClick={() => setConfirmReset(true)}
          >
            이 기기의 기록 지우기
          </button>
        </div>
        <p className="hairline-note text-quiet">
          기록은 이 기기에만 저장돼요. 계정이나 클라우드는 없어요. 최근 기록은 하단 ‘기록’ 탭에서 봐요.
        </p>
      </section>

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

      {/* 데이터 초기화 확인 시트 — 즉시 삭제 금지. 실제 onResetLocalData()는 여기서만 호출된다. */}
      {confirmReset ? (
        <div className="sheet-backdrop" onClick={() => setConfirmReset(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="데이터 초기화 확인"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" aria-hidden="true" />
            <h2 className="sheet-title">정말 이 기기의 기록을 지울까요?</h2>
            <p className="sheet-help">
              오늘 기록, 최근 기록, 보호 설정이 모두 지워져요. 이 기기에 저장된 것만 지우고, 계정이나
              클라우드는 건드리지 않아요. 되돌릴 수 없어요.
            </p>
            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setConfirmReset(false);
                  onResetLocalData?.();
                }}
              >
                기록 지우기
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
// 시작 시각은 날짜+시간 입력을 합쳐 startMs로 만든다. 미래 시각은 App에서 now로
// 클램프되고, 빈/0 목표는 30일로 보정된다 — 두 보정 모두 시트가 입력 시점에
// 인라인으로 예고한다 (R-12: 무언 보정 금지). HomeScreen의 1초 틱이 이 시트도
// 리렌더하므로 미래 여부 판정은 시간이 흐르면 자연히 풀린다.
function AddCounterSheet({ onCancel, onSubmit }) {
  const now = Date.now();
  const [name, setName] = useState('');
  const [date, setDate] = useState(msToDateValue(now));
  const [time, setTime] = useState(msToTimeValue(now));
  const [target, setTarget] = useState('30');
  const ready = name.trim().length > 0 && !!date;
  const startInFuture = !!date && dateTimeToMs(date, time) > Date.now();
  const targetDefaults = !(parseInt(target, 10) > 0);

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="카운터 추가"
        onClick={(e) => e.stopPropagation()}
      >
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
          placeholder="예: 콘텐츠 절제, SNS 줄이기"
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
        {startInFuture ? (
          <p className="hairline-note sheet-correction-note" role="status">
            아직 오지 않은 시각이라, 저장하면 시작 시점을 지금으로 맞춰요.
          </p>
        ) : null}

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
        {targetDefaults ? (
          <p className="hairline-note sheet-correction-note" role="status">
            목표를 비워 두면 30일로 저장돼요.
          </p>
        ) : null}

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
// R-12: 추가 시트와 같은 보정 예고 — 단, 편집의 빈/0 목표는 30일이 아니라
// 기존 목표 유지(App.editCounter가 invalid 목표를 무시)라서 문구가 다르다.
function EditCounterSheet({ counter, onCancel, onSubmit }) {
  // RC-4: a 예시 sample has no real start yet, so default its pickers to NOW (an honest start)
  // rather than the sample offset — editing a sample is the user setting their real start.
  const base = counter?.isSample ? Date.now() : (counter?.startMs ?? Date.now());
  const [name, setName] = useState(counter?.name ?? '');
  const [date, setDate] = useState(msToDateValue(base));
  const [time, setTime] = useState(msToTimeValue(base));
  const [target, setTarget] = useState(String(counter?.targetDays ?? 30));
  if (!counter) return null;
  const ready = name.trim().length > 0 && !!date;
  const startInFuture = !!date && dateTimeToMs(date, time) > Date.now();
  const targetKeepsCurrent = !(parseInt(target, 10) > 0);

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="카운터 편집"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">카운터 편집</h2>
        <p className="sheet-help">
          {counter.isSample
            ? '예시 카운터예요. 시작 시각을 정하면 내 기록이 돼요.'
            : '시작 시각을 바로잡거나 이름·목표를 바꿀 수 있어요.'}
        </p>

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
        {startInFuture ? (
          <p className="hairline-note sheet-correction-note" role="status">
            아직 오지 않은 시각이라, 저장하면 시작 시점을 지금으로 맞춰요.
          </p>
        ) : null}

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
        {targetKeepsCurrent ? (
          <p className="hairline-note sheet-correction-note" role="status">
            목표를 비워 두면 지금 목표 그대로 유지돼요.
          </p>
        ) : null}

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
