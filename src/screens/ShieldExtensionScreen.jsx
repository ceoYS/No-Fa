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

import { useState } from 'react';
import {
  pingExtension,
  sendTestSignal,
  sendBlockRules,
  getSavedExtensionId,
  saveExtensionId,
} from '../lib/chromeExtensionBridge.js';

const TEST_SIGNAL = 'nof-test-risk-signal';
const TEST_EXAMPLE = 'https://example.com/?q=nof-test-risk-signal';
// IANA-reserved harmless test domain, written scheme-less on purpose: guard #37 allows the
// scheme literal ONLY inside TEST_EXAMPLE above, so the RC-8 send field uses a bare host.
const TEST_DOMAIN = 'example.com';

// Map a bridge error code to an honest Korean next step. Never claims a connection.
function reasonText(error) {
  switch (error) {
    case 'no_chrome_runtime':
      return 'Chrome 확장을 쓸 수 있는 환경이 아니에요. Chrome에서 확장을 설치한 뒤 다시 시도해요.';
    case 'no_extension_id':
      return '확장 ID를 먼저 붙여넣어요.';
    default:
      return '확장이 응답하지 않아요. 확장을 설치하고 새로고침한 뒤 다시 시도해요.';
  }
}

export default function ShieldExtensionScreen({ onNavigate, blocklist = [] }) {
  const [extId, setExtId] = useState(() => getSavedExtensionId());
  // conn.state: 'idle' | 'checking' | 'connected' | 'failed'. '연결됨' renders ONLY in the
  // 'connected' branch, reachable only after a real PING actually answers — never faked.
  const [conn, setConn] = useState({ state: 'idle', detail: '' });
  const [testMsg, setTestMsg] = useState('');
  // RC-8 — the user's concrete test value sent to this browser's real block rules. Defaults
  // to the harmless reserved domain; the result message renders success ONLY behind res.ok.
  const [blockValue, setBlockValue] = useState(TEST_DOMAIN);
  const [blockMsg, setBlockMsg] = useState('');

  const checkConnection = async () => {
    const id = saveExtensionId(extId);
    setExtId(id);
    setTestMsg('');
    setConn({ state: 'checking', detail: '' });
    const res = await pingExtension(id);
    if (res && res.ok) {
      setConn({ state: 'connected', detail: [res.name, res.version].filter(Boolean).join(' ') });
    } else {
      setConn({ state: 'failed', detail: reasonText(res && res.error) });
    }
  };

  const sendTest = async () => {
    const id = saveExtensionId(extId);
    setExtId(id);
    setTestMsg('테스트 신호를 보내는 중이에요…');
    const res = await sendTestSignal(id);
    if (res && res.ok) {
      setTestMsg('확장에 테스트 신호를 보냈어요. 설치한 Chrome에서 아래 테스트 예시를 열면 잠깐 멈춤으로 이어져요.');
    } else {
      setTestMsg('아직 연결되지 않아 테스트 신호를 보내지 못했어요. 먼저 연결 확인을 눌러요.');
    }
  };

  // RC-8 — push the user's concrete test value to THIS Chrome's real declarativeNetRequest
  // dynamic rules. Saved 위험 신호 stay abstract reminders (category/situation), so they are
  // surfaced as a COUNT only and never sent here as if a label were a browser rule — that
  // would fake blocking. Success copy renders ONLY when the extension answers ok:true.
  const sendBlock = async () => {
    const id = saveExtensionId(extId);
    setExtId(id);
    const value = blockValue.trim();
    if (!value) {
      setBlockMsg('차단 테스트용 값을 먼저 적어요. 예: example.com');
      return;
    }
    setBlockMsg('이 브라우저 차단 규칙으로 보내는 중이에요…');
    const res = await sendBlockRules(id, [value]);
    if (res && res.ok) {
      setBlockMsg(
        `이 Chrome 브라우저에 차단 규칙 ${res.count}개를 반영했어요. 주소창에 "${value}" 가 든 주소를 열면 잠깐 멈춤으로 이어져요.`,
      );
    } else {
      setBlockMsg('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.');
    }
  };

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
          테스트용 Chrome 확장이 맡아요. 둘은 아직 자동으로 이어져 있지 않아요.
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

      {/* RC-7 — REAL app↔extension connection. A normal web page cannot discover an
          unpacked extension's id, so the user pastes it (saved locally on this device).
          연결 확인 sends a real PING; the screen shows 연결됨 ONLY when that PING actually
          answers. With no extension answering it stays honestly 아직 연결되지 않았어요 — it
          never fakes a link. Browser-scoped: this Chrome only, never device-wide / other apps. */}
      <section className="card shield-ext-connect">
        <div className="card-row">
          <span className="card-label">Chrome 확장 연결</span>
          <span className="pill shield-tag">이 기기 Chrome 차단</span>
        </div>
        <p className="hairline-note">이 Chrome 브라우저에서 먼저 작동해요.</p>
        <p className="hairline-note text-quiet">기기 전체나 다른 앱까지 막는 기능은 아니에요.</p>

        <label className="field-label" htmlFor="ext-id">확장 ID</label>
        <input
          id="ext-id"
          type="text"
          className="sheet-input"
          value={extId}
          onChange={(e) => setExtId(e.target.value.trim())}
          placeholder="개발자 모드에서 보이는 32자 ID"
          maxLength={64}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="hairline-note text-quiet">확장 ID를 붙여넣어 연결을 확인해요.</p>

        {conn.state === 'connected' ? (
          <p className="hairline-note" aria-live="polite">
            이 Chrome 확장과 연결됨{conn.detail ? ` · ${conn.detail}` : ''}.
          </p>
        ) : conn.state === 'checking' ? (
          <p className="hairline-note text-quiet" aria-live="polite">연결 확인 중이에요…</p>
        ) : conn.state === 'failed' ? (
          <p className="hairline-note text-quiet" aria-live="polite">
            아직 연결되지 않았어요. {conn.detail}
          </p>
        ) : (
          <p className="hairline-note text-quiet">
            아직 연결되지 않았어요. 확장 ID를 붙여넣고 연결 확인을 눌러요.
          </p>
        )}

        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button type="button" className="btn btn-primary btn-block" onClick={checkConnection}>
            연결 확인
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={sendTest}>
            테스트 신호 보내기
          </button>
        </div>
        {testMsg ? (
          <p className="hairline-note text-quiet" aria-live="polite">{testMsg}</p>
        ) : null}
        <p className="hairline-note shield-safety-note">
          연결 상태는 실제 응답으로만 확인해요. 응답이 없으면 연결됐다고 표시하지 않아요.
        </p>
      </section>

      {/* RC-8 — saved-signal / test-value → REAL dynamic block rule. A connected user sends a
          concrete value (default the reserved harmless example.com) through SET_BLOCK_RULES; the
          extension installs a declarativeNetRequest dynamic rule and a matching top-level
          navigation redirects to the in-app 잠깐 멈춤. Saved 위험 신호 are abstract reminders
          (category/situation), so they are surfaced as a COUNT only — never sent as if an
          abstract label were a browser rule (that would fake blocking). The success line renders
          ONLY when the extension answers ok:true; otherwise it stays honestly not-connected. */}
      <section className="card shield-ext-block">
        <div className="card-row">
          <span className="card-label">브라우저 차단 규칙 반영</span>
          <span className="pill shield-tag">이 기기 Chrome 차단</span>
        </div>
        <p className="hairline-note">
          연결된 확장에 차단 테스트용 값을 보내면, 이 Chrome 브라우저에서 그 값이 든 주소가
          잠깐 멈춤으로 이어져요.
        </p>
        <p className="hairline-note text-quiet">
          저장한 위험 신호 {blocklist.length}개는 기억용이에요. 카테고리·상황 같은 신호는
          그대로 브라우저 규칙이 되지 않아, 아래 차단 테스트용 값으로 실제로 막히는지 확인해요.
        </p>

        <label className="field-label" htmlFor="block-test-value">차단 테스트용 값</label>
        <input
          id="block-test-value"
          type="text"
          className="sheet-input"
          value={blockValue}
          onChange={(e) => setBlockValue(e.target.value.trim())}
          placeholder="example.com"
          maxLength={120}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="hairline-note text-quiet">
          이 값은 내가 직접 적는 테스트용 신호예요. 미리 만들어 둔 차단 목록이 아니에요.
        </p>

        <button type="button" className="btn btn-primary btn-block" onClick={sendBlock}>
          이 브라우저 차단 규칙에 반영
        </button>
        {blockMsg ? (
          <p className="hairline-note text-quiet" aria-live="polite">{blockMsg}</p>
        ) : null}
        <p className="hairline-note shield-safety-note">
          연결된 확장이 실제로 응답할 때만 규칙을 반영해요. 응답이 없으면 반영했다고 표시하지 않아요.
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
