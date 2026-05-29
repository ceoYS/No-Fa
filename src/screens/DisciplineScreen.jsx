import { useMemo, useState } from 'react';
import {
  STATUS_LABEL,
  STATUS_PILL,
  STATUS_HELP,
  SELECTABLE_ORDER,
  BADGE_LABEL,
  listBadges,
  summarizeRules,
} from '../constants/discipline.js';

/*
 * DisciplineScreen — 나의 규율 (PRD §0.5.9 + §0.6.2 / §0.6.7).
 *
 * Per-row state input is the v2 3-state (지켰어요 / 위기였지만 버텼어요 / 못 지켰어요).
 * Badges (복기 완료 / 회복 루틴 완료 / 다음 행동 작성 완료) are post-action only — never
 * directly picked. A `못 지켰어요` row offers an optional, light reflection CTA
 * (§0.6.6); the timer is never reset by a rule slip (§0.6.3). Categories are an
 * editable tag set (§0.6.7) seeded from suggestions. State lifted to App;
 * in-memory only.
 */
export default function DisciplineScreen({
  onNavigate,
  rules = [],
  categories = [],
  onAddRule,
  onAddCategory,
  onDeleteRule,
  onSetRuleStatus,
  onStartSlipReflection,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [statusEditId, setStatusEditId] = useState(null);

  const summary = useMemo(() => summarizeRules(rules), [rules]);

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">내가 정한 기준</p>
          <h1 className="screen-title">나의 규율</h1>
        </div>
        <button type="button" className="btn-add" onClick={() => setAddOpen(true)}>
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
          {summary.missed > 0
            ? `못 지킨 규율 ${summary.missed}개 — 가볍게 복기해 볼 수 있어요.`
            : '오늘 못 지킨 규율은 없어요.'}
        </p>
        {summary.unrecorded > 0 ? (
          <p className="hairline-note">아직 오늘 상태를 고르지 않은 규율 {summary.unrecorded}개</p>
        ) : null}
      </section>

      <section className="card">
        <span className="card-label">오늘의 규율 상태</span>
        {rules.length === 0 ? (
          <p className="hairline-note">
            아직 정한 규율이 없어요. 위의 “규율 추가”로 시작해 보세요.
          </p>
        ) : (
          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {rules.map((rule) => {
              const badges = listBadges(rule.badges);
              return (
                <div className="rule-card" key={rule.id}>
                  <div className="rule-card-head">
                    <span className="rule-label">{rule.label}</span>
                    <button
                      type="button"
                      className={`pill ${STATUS_PILL[rule.status] ?? 'pill'} rule-status rule-status-btn`}
                      onClick={() => setStatusEditId(rule.id)}
                      aria-label={
                        STATUS_LABEL[rule.status]
                          ? `${rule.label} 상태 바꾸기 — 지금은 ${STATUS_LABEL[rule.status]}`
                          : `${rule.label} 오늘 상태 고르기`
                      }
                    >
                      {STATUS_LABEL[rule.status] ?? '오늘 상태 고르기'}
                    </button>
                  </div>
                  <p className="hairline-note">
                    {STATUS_HELP[rule.status] ?? '아직 오늘 상태를 고르지 않았어요.'}
                  </p>
                  {badges.length > 0 ? (
                    <div className="badge-row">
                      {badges.map((key) => (
                        <span key={key} className="badge">{BADGE_LABEL[key]}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="rule-card-actions">
                    {rule.status === 'missed' && !rule.badges?.reflected ? (
                      <button
                        type="button"
                        className="btn-recover"
                        onClick={() => onStartSlipReflection?.(rule.id)}
                      >
                        복기하기
                      </button>
                    ) : null}
                    {rule.category ? <span className="rule-category">{rule.category}</span> : null}
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
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <span className="card-label">규율을 다루는 방식</span>
        <ul className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <li className="hairline-note">· 상태 칩을 누르면 지켰어요 · 위기였지만 버텼어요 · 못 지켰어요 중에서 고를 수 있어요.</li>
          <li className="hairline-note">· 못 지킨 날은 가볍게 복기하면 “복기 완료” 같은 표시가 붙어요.</li>
          <li className="hairline-note">· 규율 카테고리는 직접 추가할 수 있어요. 편집·알림 연동은 다음 단계에서 준비하고 있어요.</li>
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
          categories={categories}
          onAddCategory={onAddCategory}
          onCancel={() => setAddOpen(false)}
          onSubmit={(payload) => {
            onAddRule?.(payload);
            setAddOpen(false);
          }}
        />
      ) : null}

      {statusEditId ? (
        <StatusSheet
          rule={rules.find((r) => r.id === statusEditId)}
          onCancel={() => setStatusEditId(null)}
          onPick={(status) => {
            const id = statusEditId;
            setStatusEditId(null);
            onSetRuleStatus?.(id, status);
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

function StatusSheet({ rule, onCancel, onPick }) {
  if (!rule) return null;
  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="규율 상태 변경"
    >
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">오늘 이 규율은 어땠어요?</h2>
        <p className="sheet-help">“{rule.label}”</p>
        <div className="status-option-list">
          {SELECTABLE_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              className="status-option"
              data-selected={rule.status === status}
              onClick={() => onPick(status)}
            >
              <span className={`pill ${STATUS_PILL[status]} status-option-pill`}>
                {STATUS_LABEL[status]}
              </span>
              <span className="status-option-help">{STATUS_HELP[status]}</span>
            </button>
          ))}
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRuleSheet({ categories, onAddCategory, onCancel, onSubmit }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const ready = label.trim().length > 0;

  const submit = () => {
    let finalCategory = category;
    if (customOpen && customText.trim()) {
      finalCategory = onAddCategory?.(customText) ?? customText.trim();
    }
    onSubmit({ label, category: finalCategory });
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="새 규율 추가">
      <div className="sheet">
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">새 규율 추가</h2>
        <p className="sheet-help">내가 지키고 싶은 기준을 짧게 적어주세요.</p>
        <input
          type="text"
          className="sheet-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 밤 11시 이후 침대에서 휴대폰 보지 않기"
          maxLength={80}
          autoFocus
        />
        <p className="sheet-help">카테고리 (선택) — 직접 추가할 수 있어요.</p>
        <div className="sheet-chip-grid">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-selected={category === c && !customOpen}
              onClick={() => {
                setCustomOpen(false);
                setCategory((cur) => (cur === c ? null : c));
              }}
            >
              {c}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            data-selected={customOpen}
            onClick={() => {
              setCustomOpen((v) => !v);
              setCategory(null);
            }}
          >
            직접 입력
          </button>
        </div>
        {customOpen ? (
          <input
            type="text"
            className="sheet-input"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="새 카테고리 이름"
            maxLength={20}
          />
        ) : null}
        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!ready}
            style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={submit}
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
        <p className="hairline-note">삭제해도 언제든 다시 추가할 수 있어요.</p>
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
