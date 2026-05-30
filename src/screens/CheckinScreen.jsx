import { useState } from 'react';
import { CHECKIN_TAP } from '../constants/discipline.js';

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

export default function CheckinScreen({ onNavigate, rules = [], onSetRuleStatus, onCompleteCheckin }) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(null);
  const [triggers, setTriggers] = useState([]);
  const [urge, setUrge] = useState(null);

  const toggleTrigger = (id) =>
    setTriggers((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const step1Ready = mood && urge !== null;

  // Resolve the step-1 selections to human-readable labels and hand them up so the
  // app can persist them into today's record. Resolving ids → labels here keeps the
  // records/calendar layer from importing this screen's chip definitions.
  const finishCheckin = () => {
    if (!onCompleteCheckin) {
      onNavigate('reward');
      return;
    }
    const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? null;
    const triggerLabels = triggers
      .map((id) => TRIGGERS.find((t) => t.id === id)?.label)
      .filter(Boolean);
    onCompleteCheckin({ moodLabel, urge, triggers: triggerLabels });
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘 어땠어요?</p>
          <h1 className="screen-title">1분 체크인</h1>
        </div>
        <span className="pill">{step} / 2</span>
      </header>

      {step === 1 ? (
        <>
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
            disabled={!step1Ready}
            style={step1Ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={() => setStep(2)}
          >
            다음 · 오늘의 규율 점검
          </button>
        </>
      ) : (
        <>
          <p className="screen-subtitle">
            마지막으로 오늘 규율을 가볍게 점검해요. 고르지 않은 규율은 그대로 둬도 괜찮아요.
          </p>

          <section className="card">
            <span className="card-label">오늘의 규율 점검</span>
            {rules.length === 0 ? (
              <p className="hairline-note">
                아직 정한 규율이 없어요. “나의 규율”에서 먼저 만들어 보세요.
              </p>
            ) : (
              <div className="stack" style={{ '--gap': 'var(--sp-4)' }}>
                {rules.map((rule) => (
                  <div className="checkin-rule" key={rule.id}>
                    <span className="rule-label">{rule.label}</span>
                    <div className="checkin-tap-row">
                      {CHECKIN_TAP.map((opt) => (
                        <button
                          key={opt.status}
                          type="button"
                          className="checkin-tap"
                          data-selected={rule.status === opt.status}
                          onClick={() => onSetRuleStatus?.(rule.id, opt.status)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={finishCheckin}
            >
              체크인 완료 · 방이 조금 더 따뜻해져요
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setStep(1)}
            >
              이전으로
            </button>
          </div>
        </>
      )}
    </div>
  );
}
