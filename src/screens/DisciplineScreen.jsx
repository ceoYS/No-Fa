const RULES = [
  {
    id: 'night_phone',
    label: '밤 11시 이후 침대에서 휴대폰 보지 않기',
    status: '지키는 중',
    note: '오늘 밤 기준 아직 잘 지키고 있어요',
  },
  {
    id: 'pause_first',
    label: '충동이 오면 5분 멈춤 먼저 누르기',
    status: '이번 주 실천',
    note: '이번 주 4회 사용',
  },
  {
    id: 'no_stim_search',
    label: '자극 검색하지 않기',
    status: '지키는 중',
    note: '보호 모드가 함께 돕고 있어요',
  },
  {
    id: 'short_form',
    label: 'SNS/숏폼은 하루 15분까지만',
    status: '오늘 확인 필요',
    note: '오늘 17분 — 잠깐 멈춰볼까요?',
  },
  {
    id: 'phone_off_desk',
    label: '잠들기 전 휴대폰은 책상 위에 두기',
    status: '지키는 중',
    note: '어제도 책상 위에 뒀어요',
  },
  {
    id: 'lonely_swap',
    label: '외로울 때 바로 검색하지 않고 대체 행동 1개 하기',
    status: '이번 주 실천',
    note: '이번 주 2회 대체 행동 선택',
  },
];

const STATUS_TONE = {
  '지키는 중': 'pill-moss',
  '이번 주 실천': 'pill-ember',
  '오늘 확인 필요': 'pill',
};

export default function DisciplineScreen({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">내가 정한 기준</p>
          <h1 className="screen-title">나의 규율</h1>
        </div>
        <span className="pill pill-moss">비공개</span>
      </header>

      <p className="screen-subtitle">
        규율은 나를 벌주기 위한 약속이 아니라, 내가 지키고 싶은 기준입니다.
      </p>

      <section className="card">
        <span className="card-label">오늘의 규율 상태</span>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
          {RULES.map((rule) => (
            <div className="rule-card" key={rule.id}>
              <div className="rule-card-head">
                <span className="rule-label">{rule.label}</span>
                <span className={`pill ${STATUS_TONE[rule.status] ?? 'pill'} rule-status`}>
                  {rule.status}
                </span>
              </div>
              <p className="hairline-note">{rule.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="card-label">규율을 다루는 방식</span>
        <ul className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <li className="hairline-note">· 규율은 비공개로 저장돼요. 누구에게도 자동 공유되지 않아요.</li>
          <li className="hairline-note">· 흔들린 날도 깎이거나 점수로 표시하지 않아요.</li>
          <li className="hairline-note">· 규율 편집과 템플릿은 다음 단계에서 열어요. (P1)</li>
        </ul>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
