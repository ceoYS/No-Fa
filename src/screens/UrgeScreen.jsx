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

// 잠깐 멈춤은 "5분 지연 도구"다 (refocus memo §2 — 충동 멈추기). 타이머는 5분(300초)
// 에서 0까지 카운트다운하고, 다 채우면 마치기를 권한다. 5분은 강제 종료가 아니라
// 권장 고비일 뿐이라 멈췄다가 다시 이어가도 된다.
const TARGET_SECONDS = 300;

// Urge는 "지금 선택한 카운터"의 충동을 함께 넘기는 도구다 (counter-management). 어떤
// 절제를 붙잡고 있는지 selectedCounterName으로 보여줘 맥락을 잃지 않게 한다.
export default function UrgeScreen({ onNavigate, onCrisisHeld, selectedCounterName = '' }) {
  const [remaining, setRemaining] = useState(TARGET_SECONDS);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [view, setView] = useState('breath'); // 'breath' | 'alt'
  const [altNote, setAltNote] = useState(null);
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

      {view === 'breath' ? (
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
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setView('alt')}
            >
              대체 활동 해보기
            </button>
          </div>
        </>
      ) : (
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
      )}
    </div>
  );
}
