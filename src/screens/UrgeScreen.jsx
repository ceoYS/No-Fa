import { useEffect, useRef, useState } from 'react';

// Real "delay the choice" alternatives (urge loop). Each is a concrete, offline
// action that buys time; completing one returns to the breathing timer with a calm
// note. No 잔불 조각 is granted here — only the once-per-day crisisHeld 마치기 earns,
// so opening alternatives can never farm shards.
const ALT_ACTIONS = [
  { id: 'water', label: '물 한 잔 마시기' },
  { id: 'phone_down', label: '휴대폰 내려놓기' },
  { id: 'breathe', label: '10번 천천히 숨쉬기' },
  { id: 'stand', label: '자리에서 일어나기' },
];

// C1 — guided 5분 위기 대응 루틴. An honest, text/action-only walkthrough (no fake
// video/audio, no fake durable history): breathe → step away from the trigger →
// move the body briefly → pick one safe replacement action → finish. The final step
// reuses the SAME once-per-day crisisHeld 마치기 (onCrisisHeld) as the breath timer,
// so the routine cannot farm 잔불 조각 and claims no separate saved log. Step 4 reuses
// ALT_ACTIONS so the "choose a replacement" copy stays a concrete, real choice.
const ROUTINE_STEPS = [
  { id: 'breathe', title: '숨 고르기', body: '눈을 감고 천천히 네 번 숨을 쉬어요.\n들이쉬고… 길게 내쉬고.' },
  {
    id: 'step_away',
    title: '자극에서 한 걸음 떨어지기',
    body: '지금 있는 자리에서 잠깐 벗어나요.\n다른 방, 창가, 현관 — 어디든 좋아요.',
  },
  {
    id: 'move',
    title: '몸을 짧게 움직이기',
    body: '제자리에서 30초만 움직여요.\n가벼운 스트레칭이나 제자리 걷기면 충분해요.',
  },
  {
    id: 'replace',
    title: '짧은 대체 행동 하나 고르기',
    body: '지금 할 수 있는 행동 하나를 골라요.\n작아도 괜찮아요.',
  },
  { id: 'done', title: '위기 루틴 완료', body: '5분을 넘기는 이 선택이 가장 큰 한 걸음이에요.' },
];

// 잠깐 멈춤은 "5분 지연 도구"다 (refocus memo §2 — 충동 멈추기). 타이머는 5분(300초)
// 에서 0까지 카운트다운하고, 다 채우면 마치기를 권한다. 5분은 강제 종료가 아니라
// 권장 고비일 뿐이라 멈췄다가 다시 이어가도 된다.
const TARGET_SECONDS = 300;

// C3 — optional one-line reflection on the crisis read-back ("오늘 나에게 남길 한마디").
// Capped to match the check-in 한 줄 메모 (CheckinScreen NOTE_MAX = 140): the line is
// carried into that field and persists ONLY when the user finishes the check-in, so the
// caps must agree or the carried text would clip on the next screen.
const REFLECT_MAX = 140;

// Urge는 "지금 선택한 카운터"의 충동을 함께 넘기는 도구다 (counter-management). 어떤
// 절제를 붙잡고 있는지 selectedCounterName으로 보여줘 맥락을 잃지 않게 한다.
export default function UrgeScreen({ onNavigate, onCrisisHeld, onStashCheckinNote, selectedCounterName = '' }) {
  const [remaining, setRemaining] = useState(TARGET_SECONDS);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [view, setView] = useState('breath'); // 'breath' | 'alt' | 'routine'
  const [altNote, setAltNote] = useState(null);
  // C1 guided routine progress — transient, in-the-moment only (never persisted).
  const [routineStep, setRoutineStep] = useState(0);
  const [routinePick, setRoutinePick] = useState(null);
  // C3 reflection line typed on the read-back. Transient like the routine steps; it is
  // NOT saved here — 체크인으로 이어가기 carries it into the check-in note, which persists
  // it only when that check-in is finished.
  const [reflectNote, setReflectNote] = useState('');
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(tickRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(tickRef.current);
  }, [running]);

  // Stop the clock once the 5-minute target is reached (the count holds at 00:00).
  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const elapsed = TARGET_SECONDS - remaining;
  const progress = Math.min(100, Math.round((elapsed / TARGET_SECONDS) * 100));
  const reachedTarget = remaining === 0;

  const start = () => {
    setStarted(true);
    setRunning(true);
  };

  // Completing an alternative returns to the breath timer with a calm note. It
  // does not start the timer or grant anything — it just buys time honestly, and
  // it must NOT route home (the urge loop keeps the user in the delay tool).
  const completeAlt = (action) => {
    setAltNote(`${action.label} · 잠깐 다녀왔어요. 지금 이 시간을 넘기는 게 가장 큰 한 걸음이에요.`);
    setView('breath');
  };

  // Open the guided routine from the start (step 0, no replacement picked yet).
  const openRoutine = () => {
    setRoutineStep(0);
    setRoutinePick(null);
    setView('routine');
  };

  const step = ROUTINE_STEPS[routineStep];
  const isLastStep = routineStep === ROUTINE_STEPS.length - 1;
  const replaceStepNeedsPick = step.id === 'replace' && !routinePick;
  // C2 read-back: surface the replacement the user actually chose (honest summary,
  // not a fabricated history — it reflects this in-memory routine only).
  const pickedLabel = ALT_ACTIONS.find((a) => a.id === routinePick)?.label ?? '';

  return (
    <div className="screen" style={{ gap: 'var(--sp-3)' }}>
      <header className="screen-header">
        <button
          type="button"
          className="text-quiet"
          style={{ fontSize: 'var(--fs-small)' }}
          onClick={() => onNavigate('home')}
        >
          ← 닫기
        </button>
        <span className="pill pill-moss">잠깐 멈춤 · 5분</span>
      </header>

      <header className="screen-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="screen-title">지금 충동을 멈춰요</h1>
          <p className="screen-subtitle" style={{ marginTop: 'var(--sp-2)' }}>
            {selectedCounterName ? `‘${selectedCounterName}’ — ` : ''}지금은 결정하지 않고, 선택을 5분만
            늦추는 시간이에요. 같이 버텨봐요.
          </p>
        </div>
      </header>

      {view === 'routine' ? (
        <>
          <p className="screen-subtitle" style={{ marginTop: 0 }}>
            지금은 5분만 버티면 됩니다. 한 단계씩 같이 해봐요.
          </p>

          <section className="card">
            <div className="card-row">
              <span className="card-label">{step.title}</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                단계 {routineStep + 1} / {ROUTINE_STEPS.length}
              </span>
            </div>

            <div
              className="urge-progress"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={ROUTINE_STEPS.length}
              aria-valuenow={routineStep + 1}
              aria-label="5분 루틴 진행"
              style={{ marginTop: 'var(--sp-2)' }}
            >
              <span
                className="urge-progress-fill"
                style={{ width: `${((routineStep + 1) / ROUTINE_STEPS.length) * 100}%` }}
              />
            </div>

            <p className="urge-hint" style={{ maxWidth: 'none', marginTop: 'var(--sp-3)' }}>
              {step.body}
            </p>

            {step.id === 'replace' ? (
              <div className="chip-grid" style={{ marginTop: 'var(--sp-2)' }}>
                {ALT_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="chip"
                    data-selected={routinePick === a.id}
                    aria-pressed={routinePick === a.id}
                    onClick={() => setRoutinePick(a.id)}
                  >
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

          </section>

          {isLastStep ? (
            <>
              <section className="card">
                <span className="card-label">방금 해낸 것</span>
                <ul className="recap-list">
                  <li>5분 위기 루틴을 끝냈어요</li>
                  <li>자극에서 한 걸음 떨어졌어요</li>
                  <li>안전한 대체 행동을 골랐어요{pickedLabel ? ` — ${pickedLabel}` : ''}</li>
                </ul>
                <p className="hairline-note" style={{ marginTop: 'var(--sp-3)' }}>
                  세부 단계 진행은 저장하지 않아요. 마치기를 누르면 오늘 완료로 기록돼요.
                </p>
              </section>

              <section className="card">
                <div className="card-row">
                  <span className="card-label">오늘 나에게 남길 한마디</span>
                  <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                    {reflectNote.length}/{REFLECT_MAX}
                  </span>
                </div>
                <textarea
                  className="sheet-input reflect-input"
                  value={reflectNote}
                  onChange={(e) => setReflectNote(e.target.value.slice(0, REFLECT_MAX))}
                  placeholder="방금 버틴 흐름을 한 줄로 남겨볼까요? 비워둬도 괜찮아요."
                  maxLength={REFLECT_MAX}
                  rows={2}
                  aria-label="오늘 나에게 남길 한마디"
                />
                <p className="hairline-note">
                  ‘체크인으로 이어가기’를 누르면 이 한 줄을 가져가서, 체크인을 마치면 오늘 기록에 저장돼요. 저장 전에는 이 화면에만 남아요.
                </p>
              </section>

              <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => onCrisisHeld?.()}
                >
                  완료했어요 · 마치기
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => {
                    const line = reflectNote.trim();
                    if (line) onStashCheckinNote?.(line);
                    onNavigate('checkin');
                  }}
                >
                  체크인으로 이어가기
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => onNavigate('home')}
                >
                  다시 하루로 돌아가기
                </button>
              </div>
            </>
          ) : (
            <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={replaceStepNeedsPick}
                onClick={() =>
                  setRoutineStep((s) => Math.min(s + 1, ROUTINE_STEPS.length - 1))
                }
              >
                다음
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  if (routineStep === 0) setView('breath');
                  else setRoutineStep((s) => Math.max(s - 1, 0));
                }}
              >
                {routineStep === 0 ? '호흡으로 돌아가기' : '이전 단계'}
              </button>
            </div>
          )}
        </>
      ) : view === 'alt' ? (
        <>
          <section className="card">
            <span className="card-label">잠깐 다른 행동으로 시간을 벌어요</span>
            <p className="hairline-note">
              하나만 골라 지금 해봐요. 끝나면 다시 돌아와 남은 시간을 넘겨요.
            </p>
            <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
              {ALT_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => completeAlt(a)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => setView('breath')}
          >
            호흡으로 돌아가기
          </button>
        </>
      ) : (
        <>
          <div className="urge-stage">
            <div className="urge-breath" aria-hidden="true">
              <div className="urge-breath-core" />
            </div>
            <div className="urge-timer">
              {mm}:{ss}
            </div>
            <div
              className="urge-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={TARGET_SECONDS}
              aria-valuenow={elapsed}
              aria-label="5분 목표 진행"
            >
              <span className="urge-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="urge-hint">
              {!started
                ? '5분만 흘려보내도 충동의 강도는 조금 내려가요.\n준비되면 5분 같이 버티기를 눌러요.'
                : reachedTarget
                ? '5분을 잘 넘겼어요. 이 고비를 잘 넘기고 있어요.\n준비되면 마치기를 눌러요.'
                : running
                ? '천천히 숨을 고르면서 시간을 흘려보내요.\n급하게 결정하지 않아도 괜찮아요.'
                : '잠깐 멈췄어요. 준비되면 다시 이어가요.'}
            </p>
          </div>

          {altNote ? (
            <p className="hairline-note" aria-live="polite" style={{ textAlign: 'center' }}>
              {altNote}
            </p>
          ) : null}

          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {!started ? (
              <button type="button" className="btn btn-primary btn-block" onClick={start}>
                5분 같이 버티기
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => onCrisisHeld?.()}
                >
                  {reachedTarget ? '5분을 잘 넘겼어요 · 마치기' : '오늘도 함께 버텼어요 · 마치기'}
                </button>
                {!reachedTarget ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    onClick={() => setRunning((r) => !r)}
                  >
                    {running ? '잠깐 멈춤' : '다시 이어가기'}
                  </button>
                ) : null}
                {/* C13 — 잠깐 멈춤을 넘긴 순간을 오늘 체크인으로 이어가는 연결. 마치기와
                    나란히 두어 위기 직후 곧장 한 줄을 남기게 한다. 여기서는 저장하지 않고
                    체크인 화면으로만 잇는다 — 저장은 체크인을 마쳐야 일어난다. */}
                <p className="hairline-note" style={{ textAlign: 'center' }}>
                  방금 넘긴 순간을 오늘 기록으로 남겨볼까요? 체크인을 마치면 오늘 기록에 저장돼요.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => onNavigate('checkin')}
                >
                  오늘 체크인에 한 줄 남기기
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={openRoutine}
            >
              5분 루틴 따라가기
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setView('alt')}
            >
              대체 활동 해보기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
