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

export default function UrgeScreen({ onNavigate, onCrisisHeld }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState('breath'); // 'breath' | 'alt'
  const [altNote, setAltNote] = useState(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  // Completing an alternative returns to the breath timer with a calm note. It
  // does not start the timer or grant anything — it just buys time honestly.
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
        <span className="pill pill-moss">잠깐 멈춤</span>
      </header>

      <header className="screen-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="screen-title">지금 충동을 멈춰요</h1>
          <p className="screen-subtitle" style={{ marginTop: 'var(--sp-2)' }}>
            지금은 선택을 늦추는 시간이에요. 5분만 같이 버텨봐요.
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
            <p className="urge-hint">
              5분만 지나도 강도는 조금 내려갈 수 있어요.
              <br />호흡에 맞춰 천천히 같이 버텨봐요.
            </p>
          </div>

          {altNote ? (
            <p className="hairline-note" aria-live="polite" style={{ textAlign: 'center' }}>
              {altNote}
            </p>
          ) : null}

          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {!running ? (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setRunning(true)}
              >
                5분 같이 버티기
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => (onCrisisHeld ? onCrisisHeld() : onNavigate('reward'))}
              >
                오늘도 함께 버텼어요 · 마치기
              </button>
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
