import EmberCat from '../components/EmberCat.jsx';

const ITEMS = [
  { id: 'treat', label: '따뜻한 간식', meta: '오늘 체크인으로 도착했어요' },
  { id: 'lamp', label: '잔불 램프', meta: '방이 한 단계 따뜻해졌어요' },
];

export default function PetRewardScreen({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘도 함께 버텼어요</p>
          <h1 className="screen-title">오늘도 어제보다 더 나은 우리가 되었어요.</h1>
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
          {ITEMS.map((it) => (
            <div className="row-between" key={it.id}>
              <div>
                <div style={{ color: 'var(--text-primary)' }}>{it.label}</div>
                <div className="hairline-note">{it.meta}</div>
              </div>
              <span className="pill pill-moss">받기</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-raised">
        <span className="card-label">고양이의 방</span>
        <EmberCat tone="bright" label="잔불이 한 단계 더 따뜻해진 방" />
        <p className="hairline-note">
          고양이는 오늘의 절제 덕분에 더 편안한 하루를 보내요.
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
