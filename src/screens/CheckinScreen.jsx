import { useState } from 'react';

const MOODS = [
  { id: 'calm', emoji: '🌙', label: '차분함' },
  { id: 'tired', emoji: '🫧', label: '피곤함' },
  { id: 'restless', emoji: '🌫', label: '뒤숭숭함' },
  { id: 'okay', emoji: '🍵', label: '괜찮음' },
];

const TRIGGERS = [
  { id: 'boredom', label: '지루함' },
  { id: 'stress', label: '스트레스' },
  { id: 'loneliness', label: '외로움' },
  { id: 'night', label: '밤 시간' },
  { id: 'routine_break', label: '루틴 무너짐' },
  { id: 'none', label: '특별히 없음' },
];

const URGE_SCALE = [1, 2, 3, 4, 5];

export default function CheckinScreen({ onNavigate }) {
  const [mood, setMood] = useState(null);
  const [triggers, setTriggers] = useState([]);
  const [urge, setUrge] = useState(null);

  const toggleTrigger = (id) =>
    setTriggers((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const ready = mood && urge !== null;

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘 어땠어요?</p>
          <h1 className="screen-title">1분 체크인</h1>
        </div>
        <span className="pill">1 / 3</span>
      </header>

      <p className="screen-subtitle">
        자유로 적지 않아도 돼요. 답을 골라주세요. 공유하지 않는 한 기록은 밖으로 나가지 않아요.
      </p>

      <section className="card">
        <span className="card-label">오늘 기분</span>
        <div className="chip-grid">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="chip"
              data-selected={mood === m.id}
              onClick={() => setMood(m.id)}
            >
              <span className="chip-emoji">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="card-label">오늘 트리거 (복수 선택)</span>
        <div className="chip-grid">
          {TRIGGERS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip"
              data-selected={triggers.includes(t.id)}
              onClick={() => toggleTrigger(t.id)}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">충동 강도</span>
          <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
            1 약함 · 5 강함
          </span>
        </div>
        <div className="scale-row">
          {URGE_SCALE.map((n) => (
            <button
              key={n}
              type="button"
              className="scale-cell"
              data-selected={urge === n}
              onClick={() => setUrge(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!ready}
        style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
        onClick={() => onNavigate('reward')}
      >
        체크인 완료 · 방이 조금 더 따뜻해져요
      </button>
    </div>
  );
}
