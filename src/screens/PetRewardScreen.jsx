import { useMemo, useState } from 'react';
import EmberCat from '../components/EmberCat.jsx';

const INITIAL_ITEMS = [
  {
    id: 'treat',
    label: '따뜻한 간식',
    meta: '오늘 체크인으로 도착했어요',
    claimedMessage: '따뜻한 간식이 방에 놓였어요.',
    claimed: false,
  },
  {
    id: 'lamp',
    label: '잔불 램프',
    meta: '방이 한 단계 따뜻해졌어요',
    claimedMessage: '잔불 램프가 방을 조금 더 밝혔어요.',
    claimed: false,
  },
];

export default function PetRewardScreen({ onNavigate }) {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const lastClaimed = useMemo(() => {
    const claimed = items.filter((it) => it.claimed);
    return claimed.length > 0 ? claimed[claimed.length - 1] : null;
  }, [items]);

  const claim = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, claimed: true } : it)),
    );
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 함께 버텼어요</p>
          <h1 className="screen-title">
            오늘도 어제보다<br />더 나은 우리가 되었어요
          </h1>
        </div>
        <span className="pill pill-moss">오늘의 보상</span>
      </header>

      <div className="reward-stage" aria-label="오늘의 보상 — 잔불 램프 도착">
        <div className="reward-particles" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        <div className="reward-item" aria-hidden="true" />
      </div>

      <p className="screen-subtitle">
        당신의 절제 의지 덕분에 고양이가 더 따뜻하고 편안하게 일상을 보낼 수 있어요.
      </p>

      <section className="card">
        <span className="card-label">오늘의 보상이 도착했어요.</span>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          {items.map((it) => (
            <div
              className="row-between reward-row"
              data-claimed={it.claimed}
              key={it.id}
            >
              <div>
                <div style={{ color: 'var(--text-primary)' }}>{it.label}</div>
                <div className="hairline-note">{it.meta}</div>
              </div>
              <button
                type="button"
                className={`pill ${it.claimed ? 'pill-claimed' : 'pill-moss'} reward-claim-btn`}
                onClick={() => claim(it.id)}
                disabled={it.claimed}
                aria-pressed={it.claimed}
              >
                {it.claimed ? '받음' : '받기'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-raised">
        <span className="card-label">고양이의 방</span>
        <EmberCat tone="bright" label="잔불이 한 단계 더 따뜻해진 방" />
        <p className="hairline-note">
          {lastClaimed
            ? lastClaimed.claimedMessage
            : '고양이는 오늘의 절제 덕분에 더 편안한 하루를 보내요.'}
        </p>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
