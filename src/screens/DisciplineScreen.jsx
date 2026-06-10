import { useEffect, useMemo, useState } from 'react';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { msToDateValue, msToTimeValue, dateTimeToMs } from '../utils/datetime.js';
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
 *
 * Rule↔counter link: each rule may be attached to an abstinence counter as a
 * *secondary commitment* (never the timer). The 규율 추가 sheet links the new rule
 * to an existing counter or creates a counter alongside it; the list can be
 * filtered/grouped by counter. Group summaries report TODAY's rule status only —
 * never elapsed time, which belongs to the counter, not the rule.
 */
const UNLINKED_GROUP_ID = '__unlinked__';

export default function DisciplineScreen({
  onNavigate,
  rules = [],
  categories = [],
  counters = [],
  selectedCounterId = null,
  onAddRule,
  onAddCategory,
  onSetRuleStatus,
  onStartSlipReflection,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [statusEditId, setStatusEditId] = useState(null);
  // Counter filter: null = 전체 (grouped), a counter id, or the unlinked group.
  const [filterCounterId, setFilterCounterId] = useState(null);

  // Esc dismisses whichever sheet (규율 추가 / 상태 변경) is open.
  useDismissOnEscape(addOpen || statusEditId !== null, () => {
    setAddOpen(false);
    setStatusEditId(null);
  });

  const summary = useMemo(() => summarizeRules(rules), [rules]);

  // Group rules by their linked counter, in counter order, plus a trailing
  // "연결 안 된 규율" bucket for rules with no (or a stale) counterId.
  const groups = useMemo(() => {
    const counterIds = new Set(counters.map((c) => c.id));
    const byCounter = counters.map((c) => ({
      id: c.id,
      name: c.name,
      rules: rules.filter((r) => r.counterId === c.id),
    }));
    const unlinked = rules.filter((r) => !r.counterId || !counterIds.has(r.counterId));
    return [
      ...byCounter,
      { id: UNLINKED_GROUP_ID, name: '연결 안 된 규율', rules: unlinked },
    ];
  }, [counters, rules]);

  const hasUnlinked = groups[groups.length - 1].rules.length > 0;
  // 전체 view shows only non-empty groups; a picked filter shows just that group
  // (even when empty, so the user sees "아직 없어요" for it).
  const visibleGroups =
    filterCounterId === null
      ? groups.filter((g) => g.rules.length > 0)
      : groups.filter((g) => g.id === filterCounterId);

  const renderRuleCard = (rule) => {
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
        </div>
      </div>
    );
  };

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

        {/* 카운터별 보기 — 규율을 연결된 절제 카운터로 묶어 보거나 거른다. 요약은
            오늘의 규율 상태만 센다(경과 시간 아님). */}
        {counters.length > 0 ? (
          <div className="rule-filter-row" role="group" aria-label="카운터별 보기">
            <button
              type="button"
              className="chip rule-filter-chip"
              data-selected={filterCounterId === null}
              aria-pressed={filterCounterId === null}
              onClick={() => setFilterCounterId(null)}
            >
              전체
            </button>
            {counters.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip rule-filter-chip"
                data-selected={filterCounterId === c.id}
                aria-pressed={filterCounterId === c.id}
                onClick={() => setFilterCounterId(c.id)}
              >
                {c.name}
              </button>
            ))}
            {hasUnlinked ? (
              <button
                type="button"
                className="chip rule-filter-chip"
                data-selected={filterCounterId === UNLINKED_GROUP_ID}
                aria-pressed={filterCounterId === UNLINKED_GROUP_ID}
                onClick={() => setFilterCounterId(UNLINKED_GROUP_ID)}
              >
                연결 안 됨
              </button>
            ) : null}
          </div>
        ) : null}

        {rules.length === 0 ? (
          <p className="hairline-note">
            아직 정한 규율이 없어요. 위의 “규율 추가”로 시작해 보세요.
          </p>
        ) : visibleGroups.length === 0 ? (
          <p className="hairline-note">이 카운터에 연결된 규율이 아직 없어요.</p>
        ) : (
          <div className="stack" style={{ '--gap': 'var(--sp-4)' }}>
            {visibleGroups.map((group) => {
              const gs = summarizeRules(group.rules);
              return (
                <div className="rule-group" key={group.id}>
                  <div className="rule-group-head">
                    <span className="rule-group-name">{group.name}</span>
                    {group.rules.length > 0 ? (
                      <span className="pill pill-moss rule-group-summary">
                        오늘 {gs.total}개 중 {gs.keeping}개 지키는 중
                      </span>
                    ) : null}
                  </div>
                  {group.rules.length === 0 ? (
                    <p className="hairline-note">이 카운터에 연결된 규율이 아직 없어요.</p>
                  ) : (
                    <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
                      {group.rules.map(renderRuleCard)}
                    </div>
                  )}
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
          <li className="hairline-note">· 규율은 절제 카운터에 연결되는 보조 약속이에요. 못 지켜도 절제 시간(타이머)은 리셋되지 않아요.</li>
          <li className="hairline-note">· 못 지킨 날은 가볍게 복기하면 “복기 완료” 같은 표시가 붙어요.</li>
          <li className="hairline-note">· 규율 카테고리는 직접 추가할 수 있어요. 편집·알림 연동은 다음 단계에서 준비하고 있어요.</li>
          <li className="hairline-note">· 규율은 나와의 약속이라 유지돼요. 삭제는 아직 지원하지 않고, 수정 기능은 다음 단계에서 다듬을게요.</li>
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
          counters={counters}
          selectedCounterId={selectedCounterId}
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
    </div>
  );
}

function StatusSheet({ rule, onCancel, onPick }) {
  if (!rule) return null;
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="규율 상태 변경"
        onClick={(e) => e.stopPropagation()}
      >
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
              aria-pressed={rule.status === status}
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

// 규율 추가 시트 — 규율 라벨 + 카테고리 + 연결할 절제 카운터.
// 카운터는 기존 카운터 연결 / 연결 안 함 / "새 카운터도 함께 만들기" 중 하나.
// 새 카운터를 고르면 이름·시작 일·시작 시간·목표 일수를 입력해 규율과 함께 만든다.
function AddRuleSheet({ categories, counters, selectedCounterId, onAddCategory, onCancel, onSubmit }) {
  const now = Date.now();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  // counter link: 'existing' | 'none' | 'new'
  const [counterMode, setCounterMode] = useState(counters.length > 0 ? 'existing' : 'new');
  const [linkedCounterId, setLinkedCounterId] = useState(
    selectedCounterId ?? counters[0]?.id ?? null,
  );
  // new-counter sub-form
  const [ncName, setNcName] = useState('');
  // The counter name auto-suggests from the rule label, but only until the user
  // edits it themselves — ncNameTouched latches on first manual edit so the
  // suggestion never overwrites what they typed.
  const [ncNameTouched, setNcNameTouched] = useState(false);
  const [ncDate, setNcDate] = useState(msToDateValue(now));
  const [ncTime, setNcTime] = useState(msToTimeValue(now));
  const [ncTarget, setNcTarget] = useState('30');

  // While making a new counter and the name field is still untouched, mirror the
  // rule label into it as a non-destructive suggestion (e.g. 규율 "밤에 SNS 줄이기"
  // → 카운터 이름 제안). Stops the moment the user types in the name field.
  useEffect(() => {
    if (counterMode === 'new' && !ncNameTouched) {
      setNcName(label);
    }
  }, [label, counterMode, ncNameTouched]);

  const newCounterReady = ncName.trim().length > 0 && !!ncDate;
  const ready = label.trim().length > 0 && (counterMode !== 'new' || newCounterReady);

  const submit = () => {
    let finalCategory = category;
    if (customOpen && customText.trim()) {
      finalCategory = onAddCategory?.(customText) ?? customText.trim();
    }
    if (counterMode === 'new') {
      onSubmit({
        label,
        category: finalCategory,
        newCounter: {
          name: ncName,
          startMs: dateTimeToMs(ncDate, ncTime),
          targetDays: parseInt(ncTarget, 10),
        },
      });
    } else {
      onSubmit({
        label,
        category: finalCategory,
        counterId: counterMode === 'existing' ? linkedCounterId ?? null : null,
      });
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="새 규율 추가"
        onClick={(e) => e.stopPropagation()}
      >
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
              aria-pressed={category === c && !customOpen}
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
            aria-pressed={customOpen}
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

        {/* 연결할 절제 카운터 — 규율은 카운터를 돕는 보조 약속이에요. */}
        <p className="sheet-help">연결할 절제 카운터 — 이 규율이 어떤 절제를 도울까요?</p>
        <div className="sheet-chip-grid">
          {counters.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              data-selected={counterMode === 'existing' && linkedCounterId === c.id}
              aria-pressed={counterMode === 'existing' && linkedCounterId === c.id}
              onClick={() => {
                setCounterMode('existing');
                setLinkedCounterId(c.id);
              }}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            data-selected={counterMode === 'none'}
            aria-pressed={counterMode === 'none'}
            onClick={() => setCounterMode('none')}
          >
            연결 안 함
          </button>
          <button
            type="button"
            className="chip"
            data-selected={counterMode === 'new'}
            aria-pressed={counterMode === 'new'}
            onClick={() => setCounterMode('new')}
          >
            새 카운터도 함께 만들기
          </button>
        </div>

        {counterMode === 'new' ? (
          <div className="new-counter-form">
            <label className="field-label" htmlFor="add-rule-counter-name">새 카운터 이름</label>
            <input
              id="add-rule-counter-name"
              type="text"
              className="sheet-input"
              value={ncName}
              onChange={(e) => {
                setNcName(e.target.value);
                setNcNameTouched(true);
              }}
              placeholder="예: 콘텐츠 절제, SNS 줄이기"
              maxLength={40}
            />
            <div className="field-row">
              <div className="field-col">
                <label className="field-label" htmlFor="add-rule-counter-date">시작 일</label>
                <input
                  id="add-rule-counter-date"
                  type="date"
                  className="sheet-input"
                  value={ncDate}
                  max={msToDateValue(now)}
                  onChange={(e) => setNcDate(e.target.value)}
                />
              </div>
              <div className="field-col">
                <label className="field-label" htmlFor="add-rule-counter-time">시작 시간</label>
                <input
                  id="add-rule-counter-time"
                  type="time"
                  className="sheet-input"
                  value={ncTime}
                  onChange={(e) => setNcTime(e.target.value)}
                />
              </div>
            </div>
            <label className="field-label" htmlFor="add-rule-counter-target">목표 일수</label>
            <input
              id="add-rule-counter-target"
              type="number"
              min="1"
              max="3650"
              className="sheet-input"
              value={ncTarget}
              onChange={(e) => setNcTarget(e.target.value)}
            />
          </div>
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
