import { useState } from 'react';
import { CHECKIN_TAP } from '../constants/discipline.js';

const MOODS = [
  { id: 'calm', emoji: '🌙', label: '차분함' },
  { id: 'tired', emoji: '🫧', label: '피곤함' },
  { id: 'restless', emoji: '🌫', label: '뒤숭숭함' },
  { id: 'okay', emoji: '🍵', label: '괜찮음' },
];

const TRIGGERS = [
  { id: 'boredom', label: '지루함' },
  { id: 'stress', label: '스트레스' },
  { id: 'loneliness', label: '외로움' },
  { id: 'night', label: '밤 시간' },
  { id: 'routine_break', label: '루틴 무너짐' },
  { id: 'none', label: '특별히 없음' },
];

const URGE_SCALE = [1, 2, 3, 4, 5];

// Free-text note cap. Short by design — a journal line, not an essay — so the
// saved record stays glanceable and the textarea never grows into the bottom nav.
const NOTE_MAX = 140;

// Reverse-resolve persisted labels back to chip ids. Today's saved check-in stores
// human-readable labels (so the records/calendar layer never imports this screen's
// chip maps); when the user re-opens to edit, we map those labels back to ids to
// prefill the form. An unknown label simply drops — the form just starts unselected.
const moodIdFromLabel = (label) => MOODS.find((m) => m.label === label)?.id ?? null;
const triggerIdsFromLabels = (labels = []) =>
  labels.map((l) => TRIGGERS.find((t) => t.label === l)?.id).filter(Boolean);

export default function CheckinScreen({
  onNavigate,
  rules = [],
  onSetRuleStatus,
  onCompleteCheckin,
  todayRecord = null,
  checkinNoteDraft = null,
}) {
  // Today's already-saved check-in, restored by App only for the current calendar
  // day (§0.6.5). When it exists we open on a calm saved-summary read-back instead
  // of a blank form, so re-opening 체크인 never erases what was already logged.
  const savedCheckin = todayRecord?.checkin ?? null;

  // editing=false shows the saved summary; true runs the capture flow. First-ever
  // open today (no saved record) goes straight into the form.
  const [editing, setEditing] = useState(() => !savedCheckin);
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(() => moodIdFromLabel(savedCheckin?.moodLabel));
  const [triggers, setTriggers] = useState(() => triggerIdsFromLabels(savedCheckin?.triggers));
  const [urge, setUrge] = useState(() => (typeof savedCheckin?.urge === 'number' ? savedCheckin.urge : null));
  // Seed the note from today's saved check-in if present; otherwise prefill the one-line
  // reflection carried from the crisis read-back (C3) so 체크인으로 이어가기 doesn't drop it.
  const [note, setNote] = useState(() => savedCheckin?.note ?? checkinNoteDraft ?? '');

  // '특별히 없음'(none) is mutually exclusive: picking it clears the others, and
  // picking any real trigger clears 'none'. Keeps the saved record honest — no
  // "특별히 없음 + 스트레스" contradiction lands in today's check-in.
  const toggleTrigger = (id) =>
    setTriggers((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id);
      if (id === 'none') return ['none'];
      return [...t.filter((x) => x !== 'none'), id];
    });

  const step1Ready = mood && urge !== null;

  // Resolve the step-1 selections to human-readable labels and hand them up so the
  // app can persist them into today's record. Resolving ids → labels here keeps the
  // records/calendar layer from importing this screen's chip definitions. The note
  // is a trimmed free-text line (optional) saved alongside the structured fields.
  const finishCheckin = () => {
    if (!onCompleteCheckin) {
      onNavigate('reward');
      return;
    }
    const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? null;
    const triggerLabels = triggers
      .map((id) => TRIGGERS.find((t) => t.id === id)?.label)
      .filter(Boolean);
    onCompleteCheckin({ moodLabel, urge, triggers: triggerLabels, note: note.trim() });
  };

  // Saved-state summary — today is already logged. A calm read-back of what was
  // saved, with one affordance to re-open and edit it. The local-only storage is
  // disclosed plainly here too: nothing about this leaves the device.
  if (!editing && savedCheckin) {
    const summaryTriggers = Array.isArray(savedCheckin.triggers) ? savedCheckin.triggers : [];
    return (
      <div className="screen">
        <header className="screen-header">
          <div>
            <p className="screen-greeting">오늘 기록을 남겼어요</p>
            <h1 className="screen-title">오늘의 체크인</h1>
          </div>
          <span className="pill pill-moss">완료</span>
        </header>

        <p className="screen-subtitle">
          오늘 남긴 기록이에요. 이 기기에만 저장돼요. 언제든 다시 고칠 수 있어요.
        </p>

        <section className="card">
          <div className="card-row">
            <span className="card-label">오늘 기분</span>
            <span className="discipline-summary">{savedCheckin.moodLabel ?? '기록 안 함'}</span>
          </div>
          <div className="card-row">
            <span className="card-label">충동 강도</span>
            <span className="discipline-summary">
              {typeof savedCheckin.urge === 'number' ? `${savedCheckin.urge} / 5` : '기록 안 함'}
            </span>
          </div>
          <div className="day-detail-block">
            <span className="card-label">오늘 트리거</span>
            {summaryTriggers.length > 0 ? (
              <div className="sheet-chip-grid">
                {summaryTriggers.map((t) => (
                  <span key={t} className="chip" data-selected="false">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="hairline-note">고른 트리거가 없어요.</p>
            )}
          </div>
          {savedCheckin.note ? (
            <div className="day-detail-block">
              <span className="card-label">한 줄 메모</span>
              <p className="day-detail-reflection">“{savedCheckin.note}”</p>
            </div>
          ) : null}
        </section>

        <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              setEditing(true);
              setStep(1);
            }}
          >
            오늘 기록 고치기
          </button>
          <p className="hairline-note" style={{ textAlign: 'center' }}>
            이 기기에만 저장돼요. 밖으로 공유되지 않아요.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('home')}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘 상태 남기기</p>
          <h1 className="screen-title">1분 기록</h1>
        </div>
        <span className="pill">{step} / 2</span>
      </header>

      {step === 1 ? (
        <>
          <p className="screen-subtitle">
            패턴을 보기 위한 개인 기록이에요. 이 기기에만 저장되고 밖으로 공유되지 않아요. 답을 골라주면 돼요.
          </p>

          <section className="card">
            <span className="card-label">오늘 기분</span>
            <div className="chip-grid">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="chip"
                  data-selected={mood === m.id}
                  aria-pressed={mood === m.id}
                  onClick={() => setMood(m.id)}
                >
                  <span className="chip-emoji">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <span className="card-label">오늘 트리거 (복수 선택)</span>
            <div className="chip-grid">
              {TRIGGERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="chip"
                  data-selected={triggers.includes(t.id)}
                  aria-pressed={triggers.includes(t.id)}
                  onClick={() => toggleTrigger(t.id)}
                >
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-row">
              <span className="card-label">충동 강도</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                1 약함 · 5 강함
              </span>
            </div>
            <div className="scale-row">
              {URGE_SCALE.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="scale-cell"
                  data-selected={urge === n}
                  aria-pressed={urge === n}
                  aria-label={`충동 강도 ${n}`}
                  onClick={() => setUrge(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-row">
              <span className="card-label">한 줄 메모 (선택)</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                {note.length}/{NOTE_MAX}
              </span>
            </div>
            <textarea
              className="sheet-input reflect-input"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder="오늘 떠오른 생각을 한 줄로 남겨도 좋아요. 비워둬도 괜찮아요."
              maxLength={NOTE_MAX}
              rows={2}
              aria-label="오늘 한 줄 메모"
            />
            <p className="hairline-note">이 기기에만 저장돼요. 밖으로 공유되지 않아요.</p>
          </section>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!step1Ready}
            style={step1Ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
            onClick={() => setStep(2)}
          >
            다음 · 오늘의 규율 점검
          </button>
        </>
      ) : (
        <>
          <p className="screen-subtitle">
            마지막으로 오늘 규율을 가볍게 점검해요. 고르지 않은 규율은 그대로 둬도 괜찮아요.
          </p>

          <section className="card">
            <span className="card-label">오늘의 규율 점검</span>
            {rules.length === 0 ? (
              <p className="hairline-note">
                아직 정한 규율이 없어요. “나의 규율”에서 먼저 만들어 보세요.
              </p>
            ) : (
              <div className="stack" style={{ '--gap': 'var(--sp-4)' }}>
                {rules.map((rule) => (
                  <div className="checkin-rule" key={rule.id}>
                    <span className="rule-label">{rule.label}</span>
                    <div className="checkin-tap-row">
                      {CHECKIN_TAP.map((opt) => (
                        <button
                          key={opt.status}
                          type="button"
                          className="checkin-tap"
                          data-selected={rule.status === opt.status}
                          aria-pressed={rule.status === opt.status}
                          onClick={() => onSetRuleStatus?.(rule.id, opt.status)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={finishCheckin}
            >
              오늘 기록 마치기
            </button>
            <p className="hairline-note" style={{ textAlign: 'center' }}>
              오늘을 기록하면 잔불이 조금 더 따뜻해져요. 기록은 이 기기에만 저장돼요.
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setStep(1)}
            >
              이전으로
            </button>
          </div>
        </>
      )}
    </div>
  );
}
