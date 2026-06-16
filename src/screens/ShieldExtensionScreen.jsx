/*
 * ShieldExtensionScreen — "실제 차단 테스트" 안내 + RC-9 "3분 보호 설정" (Chrome 확장 PoC).
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
 *
 * RC-9 adds a guided "3분 보호 설정" stepper that ORCHESTRATES the already-proven RC-7
 * (real PING connection) + RC-8 (real SET_BLOCK_RULES dynamic rule) pieces into one
 * short flow: 위험 신호 정리 → Chrome 확장 연결 → 차단 규칙 반영 → 차단 테스트. It adds NO new
 * engine — it only links the existing cards below. Every step state is DERIVED from real
 * state (a concrete value typed, a real PING answer, a real ok:true from SET_BLOCK_RULES),
 * so it can never mark connected / rule-applied / complete without the real response. The
 * test step never claims the redirect happened — the app cannot observe a navigation in
 * another tab — it shows what to open and what success looks like. RC-9 guards pin this.
 */

import { useRef, useState } from 'react';
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
  // RC-9 — real-state flags the guided stepper reads. ruleApplied flips true ONLY inside the
  // real SET_BLOCK_RULES ok:true branch (and resets to false on every failed/empty send), and
  // testGuided flips true only after the user opens the test guidance. Neither is ever set
  // optimistically, so the stepper can never show connected / applied / complete it did not earn.
  const [ruleApplied, setRuleApplied] = useState(false);
  const [testGuided, setTestGuided] = useState(false);

  // Real DOM anchors so the guided stepper's "바로 가기" buttons can scroll the user to the
  // matching card below (a real scrollIntoView, never a fake navigation).
  const connectRef = useRef(null);
  const blockRef = useRef(null);
  const testRef = useRef(null);

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
  // would fake blocking. Success copy renders ONLY when the extension answers ok:true; the
  // ruleApplied flag (read by the guided stepper) is gated on that same real ok response.
  const sendBlock = async () => {
    const id = saveExtensionId(extId);
    setExtId(id);
    const value = blockValue.trim();
    if (!value) {
      setBlockMsg('차단 테스트용 값을 먼저 적어요. 예: example.com');
      setRuleApplied(false);
      return;
    }
    setBlockMsg('이 브라우저 차단 규칙으로 보내는 중이에요…');
    const res = await sendBlockRules(id, [value]);
    if (res && res.ok) {
      setRuleApplied(true);
      setBlockMsg(
        `이 Chrome 브라우저에 차단 규칙 ${res.count}개를 반영했어요. 주소창에 "${value}" 가 든 주소를 열면 잠깐 멈춤으로 이어져요.`,
      );
    } else {
      setRuleApplied(false);
      setBlockMsg('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.');
    }
  };

  // RC-9 — reveal the test guidance built around the user's OWN value. We never claim the
  // redirect happened (the app cannot observe a navigation in another tab); we show what to
  // open and what success looks like. Enabled only once a concrete value exists.
  const showTestGuide = () => {
    setTestGuided(blockValue.trim().length > 0);
  };

  const scrollTo = (ref, focusSel) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (focusSel) {
      const el = ref.current?.querySelector(focusSel);
      if (el) setTimeout(() => el.focus(), 320);
    }
  };

  // RC-9 guided steps — each `done` is DERIVED from real state, never set optimistically:
  // a concrete value typed, a real PING (conn.state === 'connected'), a real ok:true
  // (ruleApplied), and the user opening the test guidance (testGuided).
  const steps = [
    {
      key: 'signal',
      name: '위험 신호 정리',
      desc: '차단 테스트용 값을 하나 정해요.',
      done: blockValue.trim().length > 0,
      doneLabel: '입력됨',
      go: () => scrollTo(blockRef, '#block-test-value'),
    },
    {
      key: 'connect',
      name: 'Chrome 확장 연결',
      desc: '확장 ID를 넣고 연결을 확인해요.',
      done: conn.state === 'connected',
      doneLabel: '연결됨',
      go: () => scrollTo(connectRef, '#ext-id'),
    },
    {
      key: 'rule',
      name: '차단 규칙 반영',
      desc: '연결된 확장에 차단 규칙을 보내요.',
      done: ruleApplied,
      doneLabel: '규칙 반영됨',
      go: () => scrollTo(blockRef),
    },
    {
      key: 'test',
      name: '차단 테스트',
      desc: '정한 값이 든 주소를 열어 잠깐 멈춤으로 가는지 확인해요.',
      done: testGuided,
      doneLabel: '테스트 안내됨',
      go: showTestGuide,
    },
  ];

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

      {/* RC-9 — "3분 보호 설정" guided stepper. Orchestrates the proven RC-7 + RC-8 cards below
          into one short flow. Each step state is DERIVED from real state (value typed / real
          PING / real ok:true / test guidance opened), so it never marks connected, rule-applied,
          or complete without the real response. Honest scope is stated up front, and 잠깐 멈춤 /
          오늘 기록 next actions are always available — not gated behind completion. */}
      <section className="card shield-guided">
        <div className="card-row">
          <span className="card-label">3분 보호 설정</span>
          <span className="pill shield-tag">이 기기 Chrome 차단</span>
        </div>
        <p className="hairline-note">저장한 위험 신호부터 차단 테스트까지 순서대로 한 번 해봐요.</p>
        <p className="hairline-note">이 Chrome 브라우저에서 먼저 작동해요.</p>
        <p className="hairline-note text-quiet">기기 전체나 다른 앱까지 막는 기능은 아니에요.</p>

        <ol className="shield-steps">
          {steps.map((s, i) => (
            <li className="shield-step" key={s.key} data-done={s.done}>
              <span className="shield-step-index" aria-hidden="true">{s.done ? '✓' : i + 1}</span>
              <span className="shield-step-body">
                <span className="shield-step-name">{s.name}</span>
                <span className="shield-step-desc">{s.desc}</span>
                <span className="shield-step-status" aria-live="polite">
                  {s.done ? s.doneLabel : '준비 전'}
                </span>
              </span>
              <button type="button" className="btn btn-ghost shield-step-go" onClick={s.go}>
                {s.key === 'test' ? '테스트 방법 보기' : '바로 가기'}
              </button>
            </li>
          ))}
        </ol>

        {testGuided ? (
          <div className="shield-test-guide" aria-live="polite">
            <p className="hairline-note">
              주소창에 <code>{blockValue.trim()}</code> 가 들어간 주소를 열어요.
            </p>
            <p className="hairline-note text-quiet">
              예시(해롭지 않은 테스트 주소): <code>{TEST_EXAMPLE}</code>
            </p>
            <p className="hairline-note text-quiet">
              NoF 잠깐 멈춤 화면으로 이동하면 성공이에요. 평범한 곳은 그대로 열려요.
            </p>
            <p className="hairline-note text-quiet">
              앱은 다른 탭에서 일어난 이동을 자동으로 확인하지 못해요. 직접 열어 확인해요.
            </p>
            <p className="hairline-note shield-safety-note">
              위험한 사이트를 직접 찾지 마세요. 위 테스트 주소면 충분해요.
            </p>
          </div>
        ) : null}

        {/* RC-11 — single honest 완료 (F) state. Gated on BOTH a real connection
            (conn.state === 'connected', a real PING) AND a real rule (ruleApplied, a real
            SET_BLOCK_RULES ok:true). It never renders on first paint, so the screen can't
            claim "설정 완료" it did not earn. */}
        {conn.state === 'connected' && ruleApplied ? (
          <p className="hairline-note" aria-live="polite">
            설정 완료 — 이 Chrome 브라우저에서 차단 테스트를 할 수 있어요. 정한 값이 든 주소가 잠깐 멈춤으로 이어져요.
          </p>
        ) : (
          <p className="hairline-note text-quiet">
            아직 설정 전이에요. 연결 확인과 차단 규칙 반영을 모두 마치면 완료돼요.
          </p>
        )}

        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('urge')}
          >
            잠깐 멈춤 열기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('checkin')}
          >
            오늘 기록으로 남기기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('shield')}
          >
            위험 신호 수정하기
          </button>
        </div>
      </section>

      {/* RC-11 — compressed, honest extension setup. Replaces the bare install card with one
          clear 준비 → 설치 → ID 복사 orientation, so the highest-friction step (pasting the 32-자
          ID) is continuous with where the ID is produced. It states the install KIND honestly: this
          is the developer 압축해제(언팩) load, NOT a Chrome 웹 스토어 install, and the unpacked ID is
          NOT a fixed production id. Text only — no network, no scheme literal other than chrome://,
          no fake completion. The real connect/rule/test mechanics stay in the cards below. */}
      <section className="card shield-ext-setup">
        <div className="card-row">
          <span className="card-label">Chrome 확장 준비</span>
          <span className="pill shield-tag">압축해제 설치</span>
        </div>
        <p className="hairline-note">Chrome 확장을 준비해요.</p>
        <p className="hairline-note text-quiet">지금은 개발자용 압축해제 설치 방식이에요.</p>
        <p className="hairline-note text-quiet">Chrome 웹 스토어 설치는 아직 아니에요.</p>

        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <p className="hairline-note">
            1. Chrome 주소창에 <code>chrome://extensions</code> 를 열어요.
          </p>
          <p className="hairline-note">
            2. 오른쪽 위 <strong>개발자 모드</strong>를 켜요.
          </p>
          <p className="hairline-note">
            3. <strong>압축해제된 확장 프로그램 로드</strong>로
            <code>extensions/chrome-shield</code> 폴더를 선택해요.
          </p>
          <p className="hairline-note">
            4. 확장 카드에 보이는 확장 ID를 복사해요. 아래 연결 칸에 붙여넣어요.
          </p>
        </div>
        <p className="hairline-note text-quiet">
          이 폴더는 이 프로젝트 안에 들어 있어요. 따로 내려받을 필요는 없어요.
        </p>
        <p className="hairline-note text-quiet">
          압축해제 확장은 ID가 고정되지 않아요. 다시 로드하면 바뀔 수 있어, 그때는 다시 붙여넣어요.
        </p>
      </section>

      {/* RC-7 — REAL app↔extension connection. A normal web page cannot discover an
          unpacked extension's id, so the user pastes it (saved locally on this device).
          연결 확인 sends a real PING; the screen shows 연결됨 ONLY when that PING actually
          answers. With no extension answering it stays honestly 아직 연결되지 않았어요 — it
          never fakes a link. Browser-scoped: this Chrome only, never device-wide / other apps. */}
      <section className="card shield-ext-connect" ref={connectRef}>
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
      <section className="card shield-ext-block" ref={blockRef}>
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

      <section className="card" ref={testRef}>
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
