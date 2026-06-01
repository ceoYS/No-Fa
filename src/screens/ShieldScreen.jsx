/*
 * ShieldScreen — 차단 설정 / NoF 실드 (준비 중).
 *
 * HONESTY NOTE: NoF has NO content-blocking engine yet. This screen is a product
 * placeholder, never a working blocker. It must not claim any site / search / app
 * is being blocked, and it ships no functional toggle — a switch that does nothing
 * would read as fake blocking. It explains what Shield will do, the planned layers
 * (browser extension / NoF safe browser / native iOS·Android), how Shield will
 * connect to counters · rules · 잠깐 멈춤 · records, and points to the tools that
 * already work today. Real blocking is a later phase — see docs/NOF_SHIELD_*.md
 * (P1 extension/safe-browser, P2 native, P3 SNS mosaic research). No shame copy;
 * the tone matches 규율 = 내가 정한 기준, not 처벌.
 */

const PLANNED_BLOCKS = [
  {
    name: '성인 사이트·도메인 차단',
    desc: '알려진 자극적 사이트와 도메인을 멀리 둘 수 있게 준비하고 있어요.',
  },
  {
    name: '자극적인 검색어 차단',
    desc: '검색창에서 위험한 키워드를 흐리게 만드는 방향을 준비하고 있어요.',
  },
  {
    name: '앱·SNS 위험 줄이기',
    desc: '자극으로 이어지기 쉬운 앱·SNS 진입을 늦추는 방법을 살펴보고 있어요.',
  },
];

const PLANNED_LAYERS = [
  {
    name: '브라우저 확장 (Chrome 등)',
    desc: 'PC 브라우저에서 주소·검색을 먼저 거르는 가장 빠른 길이에요.',
    phase: '1단계',
  },
  {
    name: 'NoF 안전 브라우저',
    desc: '앱 안에서 위험한 주소를 열지 않는 자체 브라우저를 검토하고 있어요.',
    phase: '1단계',
  },
  {
    name: 'iOS·Android 기기 차단',
    desc: 'Screen Time·FamilyControls, VPN·DNS 필터로 기기 전체를 보호하는 방향이에요.',
    phase: '2단계',
  },
];

export default function ShieldScreen({ onNavigate, counters = [], rules = [] }) {
  const counterCount = counters.length;
  const ruleCount = rules.length;

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">유혹을 멀리 두는 보호막</p>
          <h1 className="screen-title">NoF 실드</h1>
        </div>
      </header>

      <section className="card shield-status">
        <div className="card-row">
          <span className="card-label">차단 설정</span>
          <span className="pill shield-tag">준비 중</span>
        </div>
        <p className="hairline-note">
          NoF 실드는 자극적인 사이트와 검색을 멀리 두도록 돕는 보호막이에요.
          아직 실제 차단은 제공하지 않아요. 준비가 되면 이곳에서 켤 수 있게 할게요.
        </p>
        <p className="hairline-note text-quiet">
          지금 켜고 끄는 스위치를 두지 않은 건, 동작하지 않는 기능을 켜진 것처럼 보이게
          하고 싶지 않아서예요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">실드가 도와줄 것들</span>
        <ul className="shield-list">
          {PLANNED_BLOCKS.map((b) => (
            <li className="shield-row" key={b.name}>
              <span className="shield-dot" aria-hidden="true" />
              <span className="shield-row-text">
                <span className="shield-row-name">{b.name}</span>
                <span className="shield-row-desc">{b.desc}</span>
              </span>
              <span className="pill shield-tag">준비 중</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <span className="card-label">어떻게 막을지 준비하고 있어요</span>
        <ul className="shield-list">
          {PLANNED_LAYERS.map((l) => (
            <li className="shield-row" key={l.name}>
              <span className="shield-dot" aria-hidden="true" />
              <span className="shield-row-text">
                <span className="shield-row-name">{l.name}</span>
                <span className="shield-row-desc">{l.desc}</span>
              </span>
              <span className="pill shield-tag">{l.phase}</span>
            </li>
          ))}
        </ul>
        <p className="hairline-note text-quiet">
          SNS 이미지를 흐리게 가리는 방법은 아직 연구 단계예요. 잘 되는 척하지 않고,
          확실해질 때 추가할게요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">실드와 NoF가 이어지는 방식</span>
        <p className="hairline-note">
          실드는 따로 도는 기능이 아니라, 지금 쓰는 절제 도구와 연결돼요.
        </p>
        <ul className="shield-link-list">
          <li className="hairline-note">· 금욕 카운터({counterCount}개)별로 무엇을 멀리 둘지 정하게 할 거예요.</li>
          <li className="hairline-note">· 규율({ruleCount}개)에 ‘이 사이트 안 열기’ 같은 약속을 이어붙이게 할 거예요.</li>
          <li className="hairline-note">· 차단에 막힌 순간엔 ‘잠깐 멈춤’ 5분으로 바로 이어지게 할 거예요.</li>
          <li className="hairline-note">· 멀리 둔 순간들을 기록에 남겨 흐름을 돌아보게 할 거예요.</li>
        </ul>
      </section>

      <section className="card">
        <span className="card-label">실드가 준비되는 동안</span>
        <p className="hairline-note">
          차단이 아직 없어도, 충동을 흘려보내는 도구는 지금도 쓸 수 있어요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('urge')}
          >
            못 참을 것 같아요 · 잠깐 멈춤
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('discipline')}
          >
            규율로 기준 정하기
          </button>
        </div>
      </section>

      <p className="hairline-note text-quiet shield-privacy">
        실드는 기기 안에서만 동작하도록 설계할 거예요. 무엇을 봤는지 서버로 보내지 않는
        것을 기본 원칙으로 준비하고 있어요.
      </p>

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
