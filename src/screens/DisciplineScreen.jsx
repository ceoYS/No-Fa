import { useMemo, useState } from 'react';

const STATUS_TONE = {
  '지키는 중': 'pill-moss',
  '이번 주 실천': 'pill-ember',
  '오늘 확인 필요': 'pill',
};

const CATEGORIES = ['밤 시간', '충동', '검색', 'SNS/숏폼', '수면'];

/*
 * DisciplineScreen — P0.1 prototype add/delete controls.
 *
 * State is lifted to App.jsx (see INITIAL_RULES) so Home summary stays in sync.
 * In-memory only. No backend, no localStorage. Production persistence,
 * full editor, templates, and reminder integration remain P1 (PRD §0.5.9).
 */
export default function DisciplineScreen({
  onNavigate,
  rules = [],
  onAddRule,
  onDeleteRule,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const summary = useMemo(() => {
    const keeping = rules.filter(
      (r) => r.status === '지키는 중' || r.status === '이번 주 실천',
    ).length;
    const needsCheck = rules.filter((r) => r.status === '오늘 확인 필요').length;
    return { total: rules.length, keeping, needsCheck };
  }, [rules]);

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">내가 정한 기준</p>
          <h1 className="screen-title">나의 규율</h1>
        </div>
        <button
          type="button"
          className="btn-add"
          onClick={() => setAddOpen(true)}
        >
          + 규율 추가
        </button>
      </header>

      <p className="screen-subtitle">
        규율은 나를 벌주기 위한 약속이 아니라, 내가 지키고 싶은 기준입니다.
      </p>

      <section className="card">
        <div className="card-row">
          <span className="card-label">오늘의 요약</span>
          <span className="pill pill-moss">
            {summary.total}개 중 {summary.keeping}개 지키는 중
          </span>
        </div>
        <p className="discipline-summary">
          {summary.needsCheck > 0
            ? `${summary.needsCheck}개는 오늘 확인이 필요해요. 깎이는 점수는 없어요.`
            : '오늘 확인이 필요한 규율은 없어요.'}
        </p>
        <p className="hairline-note">
          방 온기: 안정 · 회복 행동 1회 · 체크인 완료
        </p>
      </section>

      <section className="card">
        <span className="card-label">오늘의 규율 상태</span>
        {rules.length === 0 ? (
          <p className="hairline-note">
            아직 정한 규율이 없어요. 위의 “규율 추가”로 시작해 보세요.
          </p>
        ) : (
          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {rules.map((rule) => (
              <div className="rule-card" key={rule.id}>
                <div className="rule-card-head">
                  <span className="rule-label">{rule.label}</span>
                  <span
                    className={`pill ${STATUS_TONE[rule.status] ?? 'pill'} rule-status`}
                  >
                    {rule.status}
                  </span>
                </div>
                {rule.note ? <p className="hairline-note">{rule.note}</p> : null}
                <div className="rule-card-actions">
                  <button
                    type="button"
                    className="btn-delete"
                    aria-label={`${rule.label} 규율 삭제`}
                    onClick={() => setConfirmDeleteId(rule.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <span className="card-label">규율을 다루는 방식</span>
        <ul className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <li className="hairline-note">· 흔들린 날도 깎이거나 점수로 표시하지 않아요.</li>
          <li className="hairline-note">· 추가·삭제는 지금 화면에서 가볍게 해볼 수 있어요. (프로토타입)</li>
          <li className="hairline-note">· 규율 편집·템플릿·알림 연동은 다음 단계에서 열어요. (P1)</li>
        </ul>
      </section>

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        홈으로 돌아가기
      </button>

      {addOpen ? (
        <AddRuleSheet
          onCancel={() => setAddOpen(false)}
          onSubmit={(payload) => {
            onAddRule?.(payload);
            setAddOpen(false);
          }}
        />
      ) : null}

      {confirmDeleteId ? (
        <ConfirmDeleteSheet
          rule={rules.find((r) => r.id === confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            onDeleteRule?.(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function AddRuleSheet({ onCancel, onSubmit }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState(null);
  const ready = label.trim().length > 0;

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="새 규율 추가">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">새 규율 추가</h2>
        <p className="sheet-help">
          내가 지키고 싶은 기준을 짧게 적어주세요.
        </p>
        <input
          type="text"
          className="sheet-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 밤 11시 이후 침대에서 휴대폰 보지 않기"
          maxLength={80}
          autoFocus
        />
        <div className="sheet-chip-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-selected={category === c}
              onClick={() => setCategory((cur) => (cur === c ? null : c))}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="sheet-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={() => onSubmit({ label, category })}
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteSheet({ rule, onCancel, onConfirm }) {
  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="규율 삭제 확인"
    >
      <div className="sheet sheet-compact">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">이 규율을 삭제할까요?</h2>
        {rule ? <p className="sheet-help">“{rule.label}”</p> : null}
        <p className="hairline-note">
          삭제해도 언제든 다시 추가할 수 있어요.
        </p>
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
