import { useEffect, useMemo, useState } from 'react';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { summarizeRules, linkedRules } from '../constants/discipline.js';
import { nextLockedMilestone } from '../constants/rewards.js';
import { msToDateValue, msToTimeValue, dateTimeToMs } from '../utils/datetime.js';
import CatCompanion from '../components/CatCompanion.jsx';

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hh = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return { days, hh, mm, ss };
}

// v13 item-dot palette (design screen 09: green/bronze dots on the restraint
// rows, bronze on the hero). Purely decorative rotation — no status meaning.
const ITEM_DOTS = ['var(--moss-300)', 'var(--accent-ember)', 'var(--tint-caution-text)'];

/*
 * HomeScreen — v13 Final Handoff home-primary (screen 09, + 79 empty / 80 first-use).
 *
 * Structure follows the design source: NoF app bar → ink hero card (selected
 * counter, 58px tabular timer, 절제 경과, milestone strip) → 잠깐 멈춤 / 오늘 기록
 * → 흔들림 기록 link → 절제 항목 list (row cards, tap to pin as hero) → 내 방
 * preview (room scene + canonical CatCompanion + real streak/milestone copy).
 * Every number is real state (counters/startMs/milestones); samples keep their
 * 예시 honesty labels and the one-tap 내 기록으로 시작.
 */
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
  // hero 최장/대표 framing is replaced by an 예시 chip while a counter is a sample, and a
  // one-tap 내 기록으로 시작 (onStartOwnRun) converts every sample into a real run from now.
  const heroIsSample = !!selectedCounter?.isSample;
  const hasSample = counters.some((c) => c.isSample);

  // Honest forward target — the next abstinence milestone day, framed as a goal
  // (never a "reward to chase"; rewards stay a by-product of the work). Past every
  // milestone there is no false target, just a calm "최장 기록" note.
  const nextGoal = nextLockedMilestone(days);
  const goalRemaining = nextGoal ? Math.max(0, nextGoal.day - days) : 0;
  const goalPct = nextGoal ? Math.min(100, Math.round((days / nextGoal.day) * 100)) : 100;

  // Rules linked to the currently-selected counter (rule↔counter link) — shown as a
  // compact flat row (v13 grammar) that opens 나의 규율. A rule slip never moves the timer.
  const counterRules = useMemo(
    () => linkedRules(rules, selectedCounter?.id),
    [rules, selectedCounter?.id],
  );
  const counterRuleSummary = useMemo(() => summarizeRules(counterRules), [counterRules]);

  const otherCounters = counters.filter((c) => c.id !== (selectedCounter?.id ?? selectedCounterId));

  const confirmRelapse = () => {
    setConfirmRestart(false);
    onRelapse?.();
  };

  // v13 screen 79 (home-empty): honest empty state when no restraint items exist.
  if (counters.length === 0) {
    return (
      <div className="screen v13-empty-screen">
        <div className="v13-appbar">
          <h1 className="v13-appbar-title">NoF</h1>
          <span className="v13-appbar-right">무료</span>
        </div>
        <div className="v13-empty-body">
          <div className="v13-empty-glyph" aria-hidden="true" />
          <h2 className="v13-empty-title">아직 절제 항목이 없어요</h2>
          <p className="v13-empty-lead">멀리 둘 항목을 하나만 골라도 시작할 수 있어요</p>
        </div>
        <div className="v13-ctas">
          <button type="button" className="v13-cta" onClick={() => setAddCounterOpen(true)}>
            첫 항목 추가
          </button>
        </div>
        {addCounterOpen ? (
          <AddCounterSheet
            onCancel={() => setAddCounterOpen(false)}
            onSubmit={(payload) => {
              onAddCounter?.(payload);
              setAddCounterOpen(false);
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="screen v13-home">
      <div className="v13-appbar">
        <h1 className="v13-appbar-title">NoF</h1>
        <span className="v13-appbar-right">무료</span>
      </div>

      {/* 1) Ink hero — the selected counter's live elapsed time (v13 hero card) */}
      <section className="v13-card v13-card--ink v13-hero" aria-label="현재 절제 경과 시간">
        <div className="v13-glow" aria-hidden="true" />
        <div className="v13-hero-inner">
          <div className="v13-between">
            <span className="v13-hero-name-row">
              <span className="v13-dot" style={{ background: 'var(--accent-ember)' }} aria-hidden="true" />
              <span className="v13-hero-name">{selectedCounterName || '절제'}</span>
            </span>
            {heroIsSample ? (
              <span className="v13-chip v13-chip--hero">예시</span>
            ) : (
              <span className="v13-chip v13-chip--hero">대표 · 고정</span>
            )}
          </div>

          <div
            className="v13-timer v13-hero-timer"
            aria-label={`${days}일 ${hh}시간 ${mm}분 ${ss}초 경과`}
          >
            <span className="v13-hero-days">
              {days}
              <span className="v13-hero-days-unit">일</span>
            </span>
            <span>
              {hh}:{mm}:{ss}
            </span>
          </div>
          <div className="v13-lbl v13-hero-caption">절제 경과</div>

          <div className="v13-hero-milestone">
            {nextGoal ? (
              <>
                <div className="v13-between">
                  <span className="v13-hero-milestone-label">다음 보상 마디까지</span>
                  <span className="v13-hero-milestone-value">
                    {nextGoal.day}일 · {goalRemaining}일 남음
                  </span>
                </div>
                <div className="v13-bar-track v13-bar-track--ink" aria-hidden="true">
                  <span className="v13-bar-fill" style={{ width: `${goalPct}%` }} />
                </div>
              </>
            ) : !heroIsSample ? (
              <div className="v13-between">
                <span className="v13-hero-milestone-label">최장 기록을 새로 쓰는 중이에요</span>
                <span className="v13-hero-milestone-value">최장 {bestDays}일</span>
              </div>
            ) : (
              // RC-4: a 예시 sample never shows an earned-looking 최장 record.
              <div className="v13-between">
                <span className="v13-hero-milestone-label">예시 기록이에요</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RC-4 first-run honesty: 예시 notice + one-tap own-run start (v13 warm card). */}
      {hasSample ? (
        <section className="v13-card v13-card--warm" aria-label="예시 카운터 안내">
          <p className="v13-warm-lead">
            지금 보이는 기록은 예시예요. ‘내 기록으로 시작’을 누르면 지금부터 0일째로 새로 시작해요.
          </p>
          <button type="button" className="v13-cta v13-cta--sm" onClick={() => onStartOwnRun?.()}>
            내 기록으로 시작
          </button>
        </section>
      ) : null}

      {/* 2) The two in-the-moment actions (v13: 잠깐 멈춤 primary · 오늘 기록 secondary) */}
      <div className="v13-action-row">
        <button type="button" className="v13-cta" style={{ flex: 2 }} onClick={() => onNavigate('urge')}>
          잠깐 멈춤
        </button>
        <button
          type="button"
          className="v13-secbtn"
          style={{ flex: 1 }}
          onClick={() => onNavigate('checkin')}
        >
          오늘 기록
        </button>
      </div>

      {/* 3) Slip / restart entries — v13 흔들림 기록 link. 다시 시작 still confirms in a sheet. */}
      <div className="v13-link-row">
        <button type="button" className="v13-quiet-link" onClick={() => onStartSlipReflection?.(null)}>
          흔들림 기록
        </button>
        <button type="button" className="v13-quiet-link" onClick={() => setConfirmRestart(true)}>
          무너졌어요 · 다시 시작
        </button>
      </div>

      {/* 4) 절제 항목 리스트 (v13 row cards) — tap pins the item as the hero timer */}
      <div className="v13-between v13-section-head">
        <span className="v13-lbl">절제 항목 · {counters.length}개 관리 중</span>
        <button type="button" className="v13-chip v13-chip--acc" onClick={() => setAddCounterOpen(true)}>
          추가
        </button>
      </div>

      {otherCounters.map((c, i) => {
        const el = formatElapsed(now - c.startMs);
        return (
          <button
            key={c.id}
            type="button"
            className="v13-card v13-card--row v13-item-row"
            aria-label={`${c.name} — 절제 중 ${el.days}일 ${el.hh}:${el.mm} — 대표로 선택`}
            onClick={() => onSelectCounter?.(c.id)}
          >
            <span
              className="v13-dot"
              style={{ background: ITEM_DOTS[i % ITEM_DOTS.length] }}
              aria-hidden="true"
            />
            <span className="v13-item-row-body">
              <span className="v13-item-row-name">
                {c.name}
                {c.isSample ? <span className="v13-item-row-sample"> · 예시</span> : null}
              </span>
              <span className="v13-item-row-time">
                {el.days}일 {el.hh}:{el.mm}
              </span>
            </span>
          </button>
        );
      })}

      {/* Rules linked to the hero counter — compact flat row into 나의 규율 */}
      <button
        type="button"
        className="v13-card v13-card--flat v13-flat-row"
        onClick={() => onNavigate('discipline')}
      >
        <span className="v13-muted">
          {counterRules.length > 0
            ? `연결된 규율 · 오늘 ${counterRuleSummary.total}개 중 ${counterRuleSummary.keeping}개 지키는 중`
            : '연결된 규율 없음 · 나의 규율에서 더할 수 있어요'}
        </span>
        <span className="v13-muted v13-muted--acc">나의 규율</span>
      </button>

      {selectedCounter ? (
        <button
          type="button"
          className="v13-quiet-link v13-edit-link"
          onClick={() => setEditCounterOpen(true)}
        >
          ‘{selectedCounter.name}’ 카운터 편집
        </button>
      ) : null}

      {/* 5) 내 방 미리보기 (v13 room preview) — real streak + real next milestone copy,
          canonical CatCompanion (cutline §6). The scene shapes are the v13 illustration. */}
      <button
        type="button"
        className="v13-room-preview"
        aria-label={`내 방 열기 — ${days}일째 함께`}
        onClick={() => onNavigate('reward')}
      >
        <span className="v13-room" aria-hidden="true">
          <span className="v13-room-window" />
          <span className="v13-room-floor" />
          <span className="v13-room-rug" />
          <span className="v13-room-cushion" />
          <span className="v13-room-sprout v13-room-sprout--l" />
          <span className="v13-room-sprout v13-room-sprout--r" />
          <span className="v13-room-shelf" />
          <span className="v13-room-plant" />
          <span className="v13-room-lampstand" />
          <span className="v13-room-lampglow" />
          <CatCompanion
            variant="side_waiting"
            color="#1E2328"
            height={42}
            style={{ position: 'absolute', left: '15%', bottom: '8%' }}
          />
        </span>
        <span className="v13-room-overlay">
          <span className="v13-room-overlay-text">
            <span className="v13-room-title">내 방 · {days}일째 함께</span>
            <span className="v13-room-sub">
              {nextGoal ? `${nextGoal.label} 보상까지 ${goalRemaining}일` : '지금까지의 보상이 모두 열렸어요'}
            </span>
          </span>
          <span className="v13-chip v13-chip--acc">들어가기</span>
        </span>
      </button>

      {/* 6) 관리 rows — 보호/차단/설정 + destructive local reset (confirm sheet).
          The blocking row keeps its 준비 중 honesty label (in-app planner enforces nothing). */}
      <div className="v13-between v13-section-head">
        <span className="v13-lbl">관리</span>
      </div>
      <div className="v13-manage-group">
        <button type="button" className="v13-card v13-card--row v13-manage-row" onClick={() => onNavigate('protection')}>
          <span>보호 설정</span>
          <span className="v13-muted">›</span>
        </button>
        <button type="button" className="v13-card v13-card--row v13-manage-row" onClick={() => onNavigate('shield')}>
          <span>차단 설정 (준비 중)</span>
          <span className="v13-muted">›</span>
        </button>
        <button type="button" className="v13-card v13-card--row v13-manage-row" onClick={() => onNavigate('settings')}>
          <span>설정 · 언어</span>
          <span className="v13-muted">›</span>
        </button>
        <button
          type="button"
          className="v13-card v13-card--row v13-manage-row"
          aria-haspopup="dialog"
          onClick={() => setConfirmReset(true)}
        >
          <span>이 기기의 기록 지우기</span>
          <span className="v13-muted">›</span>
        </button>
      </div>
      <p className="hairline-note text-quiet v13-manage-note">
        기록은 이 기기에만 저장돼요. 계정이나 클라우드는 없어요.
      </p>

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
          onCancel={() => {
            setEditCounterOpen(false);
          }}
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
