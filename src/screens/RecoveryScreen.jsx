import { useState } from 'react';
import EmberCat from '../components/EmberCat.jsx';

const REASONS = [
  { id: 'late_night', label: '늦은 밤 시간' },
  { id: 'stress', label: '스트레스' },
  { id: 'boredom', label: '지루함' },
  { id: 'loneliness', label: '외로움' },
  { id: 'routine_break', label: '루틴이 무너짐' },
  { id: 'not_sure', label: '잘 모르겠어요' },
];

const NEXT_STEPS = [
  '내일 위험 시간대에 잠깐 멈춤 알림 켜기',
  '루틴이 무너진 시간을 한 줄로 메모',
  '잔불 캘린더에서 이번 주 패턴 살피기',
];

export default function RecoveryScreen({ onNavigate }) {
  const [reason, setReason] = useState(null);

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">회복은 다시 시작하는 일이에요</p>
          <h1 className="screen-title">흔들렸어도 끝난 건 아니에요</h1>
        </div>
        <span className="pill pill-moss">회복 루트</span>
      </header>

      <EmberCat tone="dim" label="잠시 조용해진 펫 — 회복 시 다시 잔불이 켜져요" />

      <p className="screen-subtitle">
        기록은 우리가 걸어온 노력의 나이테입니다. 포기하지 않고 계속 시도하는 게 가장 중요해요.
      </p>

      <section className="card">
        <span className="card-label">오늘 어떤 흐름이 있었어요?</span>
        <div className="chip-grid">
          {REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="chip"
              data-selected={reason === r.id}
              onClick={() => setReason(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="hairline-note">enum으로만 기록돼요. 자유 서술은 받지 않아요.</p>
      </section>

      <section className="card">
        <span className="card-label">다음 한 걸음</span>
        <div className="stack" style={{ '--gap': 'var(--sp-1)' }}>
          {NEXT_STEPS.map((step, i) => (
            <div className="recovery-step" key={i}>
              <div className="recovery-step-num">{i + 1}</div>
              <div className="recovery-step-body">
                <span className="recovery-step-title">{step}</span>
                <span className="recovery-step-meta">선택 사항</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => onNavigate('reward')}
      >
        회복 루틴 시작하기
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        나중에 할게요
      </button>
    </div>
  );
}
