import { useRef, useState } from 'react';

// Honest protection setup (C19, clarified in RC-6). NoF cannot perform OS/browser-level
// blocking from the web app itself, so this screen is NOT a blocker — it is the user's OWN
// coping plan in their own words: when they tend to wobble, the situation they want to avoid,
// and the replacement action to reach for instead. RC-6 states that scope explicitly up front
// (it does not automatically block anything, and it does not lock the whole device or other
// apps), and adds a "지금 할 수 있는 행동" card that routes only to EXISTING flows — 잠깐 멈춤 and
// 오늘 기록 — plus a "이 기기 Chrome 차단" card that points to the REAL protection path: a
// separately-installed NoF Chrome extension (extensions/chrome-shield) that can guide a saved
// risky site to 잠깐 멈춤 in THIS Chrome browser. That card is honest that the app does not yet
// auto-detect the extension and that the reach is browser-scoped, not device-wide. The plan is
// surfaced in 잠깐 멈춤 (C21) so it shows up exactly when it is needed. No automatic blocking, no
// AI, no cloud — just what the user chose to write down. Guards #63/#67/#82 pin this.
export default function ProtectionScreen({ onNavigate, protectionPlan = null, onSaveProtectionPlan }) {
  const [triggerTime, setTriggerTime] = useState(protectionPlan?.triggerTime ?? '');
  const [situation, setSituation] = useState(protectionPlan?.situation ?? '');
  const [altAction, setAltAction] = useState(protectionPlan?.altAction ?? '');
  const [justSaved, setJustSaved] = useState(false);
  const [justCleared, setJustCleared] = useState(false);
  // "보호 문장 다시 보기" target — scrolls the plan area (the saved card if present, else the
  // editor) into view. A real DOM scroll, never a fake navigation.
  const planRef = useRef(null);

  const onEdit = (setter) => (e) => {
    setter(e.target.value.slice(0, 120));
    setJustSaved(false);
    setJustCleared(false);
  };
  const hasAny = [triggerTime, situation, altAction].some((v) => v.trim().length > 0);

  const save = () => {
    onSaveProtectionPlan?.({
      triggerTime: triggerTime.trim(),
      situation: situation.trim(),
      altAction: altAction.trim(),
    });
    setJustSaved(true);
    setJustCleared(false);
  };

  // C34 — explicit "계획 비우기" action. Routes through the SAME saveProtectionPlan handler
  // with all-blank fields, which normalizes an all-empty save to null (no empty husk persisted),
  // so the cleared plan is dropped from the localStorage-only bundle on this device only. It also
  // empties the on-screen fields so the form returns to its blank state. This is NOT a blocker
  // and clears nothing off-device — there is no account and no cloud.
  const clearPlan = () => {
    onSaveProtectionPlan?.({ triggerTime: '', situation: '', altAction: '' });
    setTriggerTime('');
    setSituation('');
    setAltAction('');
    setJustSaved(false);
    setJustCleared(true);
  };

  const scrollToPlan = () =>
    planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">흔들리는 순간을 미리 적어둬요</p>
          <h1 className="screen-title">보호 설정</h1>
        </div>
        <span className="pill shield-tag">나의 계획</span>
      </header>

      <p className="screen-subtitle">
        어떤 순간에 흔들리는지 적어두세요. 위기 때 바로 볼 대체 행동을 정해요. 적어둔 계획은
        잠깐 멈춤에서 다시 보여줘요.
      </p>

      {/* RC-6 — honest scope, stated before anything else. This is a self-opened protection
          plan, not an automatic or device-wide blocker. The disclaimer is phrased as a plain
          negation on purpose: the bare auto-block claim token stays forbidden (guards
          #63/#67/#68 + the QA B21 sweep read it as a claim), so we say the same thing without it. */}
      <section className="card protection-scope">
        <div className="card-row">
          <span className="card-label">이 화면이 하는 일</span>
        </div>
        <p className="hairline-note">
          지금은 내가 정한 보호 문장을 위기 때 바로 열어보는 보호 계획이에요.
        </p>
        <p className="hairline-note text-quiet">
          무언가를 자동으로 막아주지는 않아요. 이 기기 전체나 다른 앱도 막지 않아요.
        </p>
        <p className="hairline-note text-quiet">
          내가 직접 여는 보호 화면이라, 흔들릴 때 스스로 펼쳐 봐요.
        </p>
      </section>

      {/* RC-6 — what you can actually do right now during an urge. Every action routes to an
          EXISTING flow (no new fake feature): 잠깐 멈춤, 오늘 기록, and re-reading my plan. */}
      <section className="card protection-actions">
        <span className="card-label">지금 할 수 있는 행동</span>
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
            onClick={scrollToPlan}
          >
            {protectionPlan ? '보호 문장 다시 보기' : '보호 문장 적으러 가기'}
          </button>
        </div>
      </section>

      <div ref={planRef}>
        {/* C20 — durable local plan read-back. When a plan is already saved it is restored
            into the fields below (on mount) and shown here, proving it survived a reload.
            The disclosure stays explicit: this is local-only, this device only. */}
        {protectionPlan ? (
          <section className="card protection-saved">
            <div className="card-row">
              <span className="card-label">저장된 보호 설정</span>
              <span className="pill pill-moss" style={{ fontSize: 'var(--fs-small)' }}>저장됨</span>
            </div>
            {protectionPlan.triggerTime ? (
              <p className="hairline-note">트리거 시간대 · {protectionPlan.triggerTime}</p>
            ) : null}
            {protectionPlan.situation ? (
              <p className="hairline-note">피하고 싶은 상황 · {protectionPlan.situation}</p>
            ) : null}
            {protectionPlan.altAction ? (
              <p className="hairline-note">대체 행동 · {protectionPlan.altAction}</p>
            ) : null}
            <p className="hairline-note text-quiet">이 설정은 이 기기에만 저장돼요.</p>

            {/* C35 — saved plan return path: jump straight to 잠깐 멈춤 where this plan is
                surfaced, plus C34's explicit clear action right where the saved plan lives. */}
            <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => onNavigate('urge')}
              >
                잠깐 멈춤에서 확인하기
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block protection-clear-btn"
                onClick={clearPlan}
              >
                계획 비우기
              </button>
            </div>
            <p className="hairline-note text-quiet">계획 비우기는 이 기기에 저장된 보호 설정만 지워요.</p>
          </section>
        ) : (
          /* C35 — empty state. When no plan is saved yet, say plainly what to write and what it
             unlocks downstream (잠깐 멈춤 read-back). Also acknowledges a just-completed clear. */
          <section className="card protection-empty">
            <span className="card-label">아직 보호 설정이 없어요</span>
            <p className="hairline-note">
              흔들리는 시간대와 대체 행동을 적어두면, 잠깐 멈춤에서 다시 볼 수 있어요.
            </p>
            {justCleared ? (
              <p className="hairline-note text-quiet" aria-live="polite">
                보호 설정을 비웠어요. 이 기기에 저장된 보호 설정만 지웠어요.
              </p>
            ) : null}
          </section>
        )}

        <section className="card">
          <label className="field-label" htmlFor="protect-time">트리거 시간대</label>
          <input
            id="protect-time"
            type="text"
            className="sheet-input"
            value={triggerTime}
            onChange={onEdit(setTriggerTime)}
            placeholder="예: 밤 11시 이후, 주말 오후"
            maxLength={120}
          />

          <label className="field-label" htmlFor="protect-situation">피하고 싶은 상황</label>
          <textarea
            id="protect-situation"
            className="sheet-input reflect-input"
            value={situation}
            onChange={onEdit(setSituation)}
            placeholder="예: 잠자리에서 휴대폰을 들 때"
            maxLength={120}
            rows={2}
          />

          <label className="field-label" htmlFor="protect-alt">위기 때 할 대체 행동</label>
          <textarea
            id="protect-alt"
            className="sheet-input reflect-input"
            value={altAction}
            onChange={onEdit(setAltAction)}
            placeholder="예: 물 한 잔 마시고 거실로 나가기"
            maxLength={120}
            rows={2}
          />
        </section>
      </div>

      <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!hasAny}
          style={hasAny ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
          onClick={save}
        >
          보호 설정 저장
        </button>
        {justSaved ? (
          <p className="hairline-note" aria-live="polite" style={{ textAlign: 'center' }}>
            보호 설정이 저장됐어요. 이 기기에만 저장돼요. 잠깐 멈춤에서 다시 볼 수 있어요.
          </p>
        ) : null}
      </div>

      {/* RC-6 (corrected) — the REAL protection path: a separately-installed NoF Chrome
          extension. Honest about the boundary — it can guide a saved risky site to 잠깐 멈춤 in
          THIS Chrome browser, it is NOT device-wide / other-app blocking, and the app does not
          yet auto-detect whether the extension is connected. Routes to the real 차단 테스트 screen
          (shieldExtension), never a toy preview. */}
      <section className="card protection-chrome-block">
        <div className="card-row">
          <span className="card-label">이 기기 Chrome 차단</span>
          <span className="pill shield-tag">Chrome 확장</span>
        </div>
        <p className="hairline-note">
          Chrome 확장을 연결하면 저장한 위험 사이트를 열 때 NoF 잠깐 멈춤으로 안내할 수 있어요.
        </p>
        <p className="hairline-note text-quiet">
          아직 기기 전체나 다른 앱까지 막는 기능은 아니에요. 이 Chrome 브라우저에서 먼저 작동해요.
        </p>
        <p className="hairline-note text-quiet">
          확장 연결 상태는 아직 자동 확인하지 않아요. 연결 후 차단 테스트로 확인해요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('shieldExtension')}
          >
            차단 테스트하기
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
