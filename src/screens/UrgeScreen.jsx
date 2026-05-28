import { useEffect, useRef, useState } from 'react';

export default function UrgeScreen({ onNavigate }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(tickRef.current);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

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
            5분만 넘기면 파도처럼 약해질 수 있어요.
          </p>
        </div>
      </header>

      <div className="urge-stage">
        <div className="urge-breath" aria-hidden="true">
          <div className="urge-breath-core" />
        </div>
        <div className="urge-timer">
          {mm}:{ss}
        </div>
        <p className="urge-hint">
          지금은 선택을 늦추는 시간이에요.
          <br />호흡에 맞춰 5분만 같이 버텨봐요.
        </p>
      </div>

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
            onClick={() => onNavigate('reward')}
          >
            오늘도 함께 버텼어요 · 마치기
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('home')}
        >
          대체 활동 해보기
        </button>
      </div>
    </div>
  );
}
