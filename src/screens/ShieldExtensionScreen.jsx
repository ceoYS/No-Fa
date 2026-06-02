/*
 * ShieldExtensionScreen — "실제 차단 테스트" 안내 (Chrome 확장 PoC).
 *
 * HONESTY NOTE: this screen renders text only. It performs NO blocking itself and
 * makes NO network / remote-code / external-API call. Its whole job is to be honest
 * about where the boundary is: the in-app Shield list is a PLAN, and the only place a
 * real "blocked → 잠깐 멈춤" path runs is the separate, manually installed Chrome
 * extension PoC (extensions/chrome-shield), which only ever matches the harmless test
 * token `nof-test-risk-signal`. It must never list a real risky site, never use an
 * explicit term, never tell the user to go hunting for a risky site, and never claim
 * any device-wide, social-app, or whole-web blocking. The one address shown is the
 * IANA-reserved example.com carrying the harmless test token, clearly labelled as a
 * test. Guard #37 pins these invariants.
 */

const TEST_SIGNAL = 'nof-test-risk-signal';
const TEST_EXAMPLE = 'https://example.com/?q=nof-test-risk-signal';

export default function ShieldExtensionScreen({ onNavigate }) {
  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">실제로 막히는지 확인하기</p>
          <h1 className="screen-title">실제 차단 테스트</h1>
        </div>
        <span className="pill shield-tag">Chrome 확장</span>
      </header>

      <section className="card">
        <span className="card-label">먼저 솔직하게 말하면</span>
        <p className="hairline-note">앱 안 신호 목록은 아직 계획이에요.</p>
        <p className="hairline-note">실제 차단 테스트는 Chrome 확장에서만 동작해요.</p>
        <p className="hairline-note text-quiet">
          앱은 무엇을 멀리 둘지 정해두는 곳이고, 실제로 막아 보는 건 따로 설치하는
          Chrome 확장 프로토타입이 맡아요. 둘은 아직 자동으로 이어져 있지 않아요.
        </p>
        <p className="hairline-note shield-safety-note">해롭지 않은 테스트 신호만 사용해요.</p>
      </section>

      <section className="card">
        <span className="card-label">확장 설치하기 (개발자 모드)</span>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <p className="hairline-note">
            1. Chrome에서 <code>chrome://extensions</code> 를 열어요.
          </p>
          <p className="hairline-note">
            2. 오른쪽 위 <strong>개발자 모드</strong>를 켜요.
          </p>
          <p className="hairline-note">
            3. <strong>압축해제된 확장 프로그램 로드</strong>를 눌러
            <code>extensions/chrome-shield</code> 폴더를 골라요.
          </p>
        </div>
        <p className="hairline-note text-quiet">
          이 폴더는 이 프로젝트 안에 들어 있어요. 따로 내려받을 필요는 없어요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">회사·조직 PC라면 (정책 제한)</span>
        <p className="hairline-note">
          회사/조직에서 관리하는 브라우저에서는 확장 설치가 정책으로 막힐 수 있어요.
        </p>
        <p className="hairline-note">
          이 경우 이 PC에서는 실제 차단 테스트를 완료할 수 없어요.
        </p>
        <p className="hairline-note text-quiet">
          정책을 우회하지 말고, 허용된 개인 PC 또는 비관리 브라우저에서만 테스트하세요.
        </p>
        <p className="hairline-note text-quiet">
          설치가 막혔다고 NoF가 잘못된 건 아니에요. 브라우저 정책이 막은 것뿐이에요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">테스트해 보기</span>
        <p className="hairline-note">
          확장을 켠 뒤, 막히는 흐름은 아래 <strong>해롭지 않은 테스트 신호</strong>로만
          확인해요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <p className="hairline-note">
            · 테스트 신호: <code>{TEST_SIGNAL}</code>
          </p>
          <p className="hairline-note">
            · 테스트 예시(해롭지 않은 예시예요): <code>{TEST_EXAMPLE}</code>
          </p>
        </div>
        <p className="hairline-note text-quiet">
          이 예시를 브라우저 주소창에 넣으면, 그 페이지가 열리지 않고 NoF “잠깐 멈춤”
          화면으로 이어져요. 평범한 곳은 그대로 열려요 — 막는 건 이 테스트 신호 하나뿐이에요.
        </p>
        <p className="hairline-note shield-safety-note">
          위험한 사이트를 직접 찾지 마세요. 위 테스트 신호 하나면 충분해요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">이 테스트의 한계</span>
        <ul className="shield-link-list">
          <li className="hairline-note">· 이 테스트는 Chrome 데스크톱에서만 동작해요.</li>
          <li className="hairline-note">· 앱이 직접 브라우징을 막지는 않아요. 막는 건 확장이에요.</li>
          <li className="hairline-note">· 시크릿 창이나 확장을 끄면 우회돼요. 벽이 아니라 마찰이에요.</li>
          <li className="hairline-note">· 무엇을 봤는지는 어디로도 보내지 않아요. 전부 기기 안에서만 처리돼요.</li>
        </ul>
      </section>

      <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('shield')}
        >
          실드로 돌아가기
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('home')}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
