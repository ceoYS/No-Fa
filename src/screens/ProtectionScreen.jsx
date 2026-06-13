import { useState } from 'react';

// Honest protection setup (C19). NoF cannot perform OS/browser-level blocking from a
// web app, so this is NOT a blocker — it is the user's OWN coping plan in their own
// words: when they tend to wobble, the situation they want to avoid, and the
// replacement action to reach for instead. The plan is surfaced in 잠깐 멈춤 (C21) so
// it shows up exactly when it is needed. No automatic blocking, no AI suggestion, no
// cloud — just what the user chose to write down.
export default function ProtectionScreen({ onNavigate, protectionPlan = null, onSaveProtectionPlan }) {
  const [triggerTime, setTriggerTime] = useState(protectionPlan?.triggerTime ?? '');
  const [situation, setSituation] = useState(protectionPlan?.situation ?? '');
  const [altAction, setAltAction] = useState(protectionPlan?.altAction ?? '');
  const [justSaved, setJustSaved] = useState(false);

  const onEdit = (setter) => (e) => {
    setter(e.target.value.slice(0, 120));
    setJustSaved(false);
  };
  const hasAny = [triggerTime, situation, altAction].some((v) => v.trim().length > 0);

  const save = () => {
    onSaveProtectionPlan?.({
      triggerTime: triggerTime.trim(),
      situation: situation.trim(),
      altAction: altAction.trim(),
    });
    setJustSaved(true);
  };

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
            보호 설정을 적어뒀어요. 잠깐 멈춤에서 다시 볼 수 있어요.
          </p>
        ) : null}
      </div>

      <section className="card">
        <span className="card-label">위기 때는 이렇게</span>
        <p className="hairline-note">
          흔들릴 때는 먼저 잠깐 멈춤을 눌러요. 위에 적어둔 대체 행동을 거기서 같이 보여줘요.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => onNavigate('urge')}
        >
          잠깐 멈춤으로 가기
        </button>
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
