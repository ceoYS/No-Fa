import { useState } from 'react';
import { KIND_LABEL, matchSignals } from '../constants/shield.js';

/*
 * SafeBrowserScreen — Shield "안전 브라우저 실험" (PoC, prototype-only).
 *
 * HONESTY NOTE: This is NOT a web browser. It opens NOTHING — no network request,
 * no iframe, no external navigation, no real browsing. It only compares a harmless
 * test phrase the user types against the risk signals they already planned (held in
 * memory) and, on a match, demonstrates the intended "keep this at a distance →
 * 잠깐 멈춤" hand-off entirely inside the app. It never asks the user to find or
 * paste a risky real site (that search is itself a relapse trigger). Real blocking
 * lives in a future P1 engine (browser extension / native), not here. The matched
 * copy says "멀리 두기로 정했어요" — a demo of intent, never a claim that a real site
 * was blocked. Guard #31 pins: routes to urge on match, opens no external link.
 */

const MATCHED_TITLE = '이 신호는 멀리 두기로 정했어요.';
const MATCHED_BODY = '지금은 열지 않고 5분만 늦춰볼까요?';
const NO_MATCH = '이 실험에서는 실제 웹을 열지 않아요.';

export default function SafeBrowserScreen({ onNavigate, blocklist = [] }) {
  const [text, setText] = useState('');
  // null = input view; otherwise { matched: [...] } after a check.
  const [result, setResult] = useState(null);

  const ready = text.trim().length > 0;
  const run = () => {
    if (!ready) return;
    setResult({ matched: matchSignals(blocklist, text) });
  };
  const reset = () => setResult(null);

  const matched = result?.matched ?? [];
  const isMatch = matched.length > 0;

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">앱 안에서만 실험 가능</p>
          <h1 className="screen-title">안전 브라우저 실험</h1>
        </div>
      </header>

      <section className="card">
        <p className="hairline-note shield-safety-note">
          실험용이에요. 실제 웹은 열지 않고, 입력한 글자를 내가 정한 위험 신호와 비교만 해요.
          위험한 사이트를 직접 찾아 적지 마세요.
        </p>
      </section>

      {result === null ? (
        <section className="card">
          <span className="card-label">테스트해 보기</span>
          <p className="hairline-note text-quiet">
            피하고 싶은 신호(예: 숏폼, 늦은 밤)를 적고 ‘열어 보기’를 눌러요. 내가 멀리
            두기로 한 신호와 닿으면, 열지 않고 잠깐 멈춤으로 이어줘요.
          </p>
          <input
            type="text"
            className="sheet-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="테스트할 문구를 적어요"
            maxLength={80}
          />
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!ready}
            style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={run}
          >
            열어 보기
          </button>
          {blocklist.length === 0 ? (
            <p className="hairline-note text-quiet">
              아직 정해둔 위험 신호가 없어요. 실드에서 신호를 먼저 정하면 더 잘 비교돼요.
            </p>
          ) : null}
        </section>
      ) : isMatch ? (
        <section className="card shield-interstitial" role="status" aria-live="polite">
          <span className="pill shield-tag">멈춤 권유</span>
          <h2 className="shield-interstitial-title">{MATCHED_TITLE}</h2>
          <p className="hairline-note">{MATCHED_BODY}</p>
          <ul className="shield-entry-list">
            {matched.map((e) => (
              <li className="shield-entry-row" key={e.id}>
                <span className="pill shield-tag shield-kind-tag">{KIND_LABEL[e.kind]}</span>
                <span className="shield-entry-label">{e.label}</span>
              </li>
            ))}
          </ul>
          <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onNavigate('urge')}
            >
              잠깐 멈춤으로 가기
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={reset}>
              돌아가기
            </button>
          </div>
        </section>
      ) : (
        <section className="card" role="status" aria-live="polite">
          <span className="card-label">결과</span>
          <p className="hairline-note">{NO_MATCH}</p>
          <p className="hairline-note text-quiet">
            내가 정한 위험 신호와 닿지 않았어요. 그래도 이 화면은 실제 웹을 열지 않아요.
          </p>
          <button type="button" className="btn btn-ghost btn-block" onClick={reset}>
            다시 해 보기
          </button>
        </section>
      )}

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('shield')}
      >
        실드로 돌아가기
      </button>
    </div>
  );
}
