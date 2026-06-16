import { useEffect, useState } from 'react';
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

// RC-1: the check-in is writing-first. What the user feels meaning in is their OWN
// words, not a preset survey — so 오늘 회고 / 나와의 약속 / 오늘의 다짐 are the primary
// fields and the gate, while 오늘 상태(기분·트리거·충동) stays as an OPTIONAL secondary
// touch. 회고 keeps the persisted `note` field name so the records / home read-back and
// the 잠깐 멈춤 한마디 hand-off (checkinNoteDraft) keep flowing end-to-end unchanged.
const RETRO_MAX = 200; // 오늘 회고 — the longest field; a real diary line, still glanceable.
const PROMISE_MAX = 100; // 나와의 약속
const RESOLVE_MAX = 100; // 오늘의 다짐

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
  checkinContext = null,
  onConsumeCheckinContext,
  fromShield = false,
}) {
  // C7: a one-shot day-context flag, set when the user continued here from a record
  // detail. Captured at mount so the prompt stays stable, then cleared in App so a
  // later nav-tap into 체크인 shows no stale prompt. It carries NO past note — today's
  // note still starts only from today's saved record or the C3 reflection draft.
  const [fromRecord] = useState(checkinContext === 'record');
  useEffect(() => {
    if (checkinContext) onConsumeCheckinContext?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Today's already-saved check-in, restored by App only for the current calendar
  // day (§0.6.5). When it exists we open on a calm saved-summary read-back instead
  // of a blank form, so re-opening 체크인 never erases what was already logged.
  const savedCheckin = todayRecord?.checkin ?? null;

  // editing=false shows the saved summary; true runs the capture flow. First-ever
  // open today (no saved record) goes straight into the form.
  const [editing, setEditing] = useState(() => !savedCheckin);
  const [step, setStep] = useState(1);
  // Writing-first fields (RC-1). 회고 reuses the persisted `note`; 약속/다짐 are new.
  const [note, setNote] = useState(() => savedCheckin?.note ?? checkinNoteDraft ?? '');
  const [promise, setPromise] = useState(() => savedCheckin?.promise ?? '');
  const [resolve, setResolve] = useState(() => savedCheckin?.resolve ?? '');
  // Optional 오늘 상태 — kept, but no longer the gate.
  const [mood, setMood] = useState(() => moodIdFromLabel(savedCheckin?.moodLabel));
  const [triggers, setTriggers] = useState(() => triggerIdsFromLabels(savedCheckin?.triggers));
  const [urge, setUrge] = useState(() => (typeof savedCheckin?.urge === 'number' ? savedCheckin.urge : null));

  // '특별히 없음'(none) is mutually exclusive: picking it clears the others, and
  // picking any real trigger clears 'none'. Keeps the saved record honest — no
  // "특별히 없음 + 스트레스" contradiction lands in today's check-in.
  const toggleTrigger = (id) =>
    setTriggers((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id);
      if (id === 'none') return ['none'];
      return [...t.filter((x) => x !== 'none'), id];
    });

  // The gate is the user's OWN writing: at least one of 회고 / 약속 / 다짐 has text.
  // The optional 오늘 상태 never blocks finishing — a record made only of the user's
  // words is the whole point (RC-1 feedback #4).
  const step1Ready = [note, promise, resolve].some((v) => v.trim().length > 0);

  // Resolve the optional step-1 selections to human-readable labels and hand them up
  // with the three writing fields so the app can persist them into today's record.
  // Resolving ids → labels here keeps the records/calendar layer from importing this
  // screen's chip definitions.
  const finishCheckin = () => {
    if (!onCompleteCheckin) {
      onNavigate('reward');
      return;
    }
    const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? null;
    const triggerLabels = triggers
      .map((id) => TRIGGERS.find((t) => t.id === id)?.label)
      .filter(Boolean);
    onCompleteCheckin({
      moodLabel,
      urge,
      triggers: triggerLabels,
      note: note.trim(),
      promise: promise.trim(),
      resolve: resolve.trim(),
    });
  };

  // Saved-state summary — today is already logged. A calm read-back of what was
  // written, with one affordance to re-open and edit it. The local-only storage is
  // disclosed plainly here too: nothing about this leaves the device.
  if (!editing && savedCheckin) {
    const summaryTriggers = Array.isArray(savedCheckin.triggers) ? savedCheckin.triggers : [];
    const hasState =
      savedCheckin.moodLabel || typeof savedCheckin.urge === 'number' || summaryTriggers.length > 0;
    return (
      <div className="screen">
        <header className="screen-header">
          <div>
            <p className="screen-greeting">오늘 글을 남겼어요</p>
            <h1 className="screen-title">오늘의 기록</h1>
          </div>
          <span className="pill pill-moss">완료</span>
        </header>

        <p className="screen-subtitle">
          오늘 내가 쓴 글이에요. 이 기기에만 저장돼요. 언제든 다시 고칠 수 있어요.
        </p>

        {fromShield ? (
          <p className="hairline-note">방금 멈춘 시간을 오늘 기록으로 남길 수 있어요.</p>
        ) : null}

        <section className="card checkin-saved-confirm">
          <span className="card-label">오늘 기록이 저장됐어요</span>
          <p className="hairline-note">
            최근 기록에서 내가 쓴 글을 다시 볼 수 있어요. 오늘은 여기까지 해도 충분해요.
          </p>
        </section>

        <section className="card">
          {savedCheckin.note ? (
            <div className="day-detail-block">
              <span className="card-label">오늘 회고</span>
              <p className="day-detail-reflection">“{savedCheckin.note}”</p>
            </div>
          ) : null}
          {savedCheckin.promise ? (
            <div className="day-detail-block">
              <span className="card-label">나와의 약속</span>
              <p className="day-detail-reflection">“{savedCheckin.promise}”</p>
            </div>
          ) : null}
          {savedCheckin.resolve ? (
            <div className="day-detail-block">
              <span className="card-label">오늘의 다짐</span>
              <p className="day-detail-reflection">“{savedCheckin.resolve}”</p>
            </div>
          ) : null}
          {!savedCheckin.note && !savedCheckin.promise && !savedCheckin.resolve ? (
            <p className="hairline-note">오늘은 글 없이 상태만 남겼어요.</p>
          ) : null}
        </section>

        {hasState ? (
          <section className="card">
            <span className="card-label">오늘 상태</span>
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
            {summaryTriggers.length > 0 ? (
              <div className="day-detail-block">
                <span className="card-label">오늘 트리거</span>
                <div className="sheet-chip-grid">
                  {summaryTriggers.map((t) => (
                    <span key={t} className="chip" data-selected="false">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('calendar')}
          >
            최근 기록 보기
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
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
          <p className="screen-greeting">오늘 하루를 글로 남겨요</p>
          <h1 className="screen-title">1분 기록</h1>
        </div>
        <span className="pill">{step} / 2</span>
      </header>

      {step === 1 ? (
        <>
          <p className="screen-subtitle">
            내가 쓴 글이 가장 큰 힘이 돼요. 한 가지만 적어도 충분해요. 이 기기에만 저장되고 밖으로
            공유되지 않아요.
          </p>

          {/* RC-10 — honest continuation note when arrived from the Chrome 실드 멈춤 page
              (?from=shield&to=record). An invitation only; it never claims the app knows the
              blocked site. One-shot: App clears it on the next navigation. */}
          {fromShield ? (
            <p className="hairline-note">방금 멈춘 시간을 오늘 기록으로 남길 수 있어요.</p>
          ) : null}

          {fromRecord ? (
            <section className="card checkin-context-note">
              <span className="card-label">그날의 기록을 참고해 오늘 한 줄을 남겨볼까요?</span>
              <p className="hairline-note">기록은 그대로 두고, 오늘 기록으로 이어가요.</p>
            </section>
          ) : null}

          <section className="card">
            <div className="card-row">
              <span className="card-label">오늘 회고</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                {note.length}/{RETRO_MAX}
              </span>
            </div>
            <textarea
              className="sheet-input reflect-input"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, RETRO_MAX))}
              placeholder="오늘 하루는 어땠나요? 떠오르는 대로 적어요."
              maxLength={RETRO_MAX}
              rows={3}
              aria-label="오늘 회고"
            />
          </section>

          <section className="card">
            <div className="card-row">
              <span className="card-label">나와의 약속</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                {promise.length}/{PROMISE_MAX}
              </span>
            </div>
            <textarea
              className="sheet-input reflect-input"
              value={promise}
              onChange={(e) => setPromise(e.target.value.slice(0, PROMISE_MAX))}
              placeholder="나와 지키고 싶은 약속을 한 줄로 적어요. 비워둬도 괜찮아요."
              maxLength={PROMISE_MAX}
              rows={2}
              aria-label="나와의 약속"
            />
          </section>

          <section className="card">
            <div className="card-row">
              <span className="card-label">오늘의 다짐</span>
              <span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>
                {resolve.length}/{RESOLVE_MAX}
              </span>
            </div>
            <textarea
              className="sheet-input reflect-input"
              value={resolve}
              onChange={(e) => setResolve(e.target.value.slice(0, RESOLVE_MAX))}
              placeholder="오늘의 다짐을 한 줄로 적어요. 비워둬도 괜찮아요."
              maxLength={RESOLVE_MAX}
              rows={2}
              aria-label="오늘의 다짐"
            />
            <p className="hairline-note">내가 쓴 글은 이 기기에만 저장돼요. 밖으로 공유되지 않아요.</p>
          </section>

          <section className="card">
            <span className="card-label">오늘 상태 (선택)</span>
            <p className="hairline-note text-quiet">
              남기고 싶으면 골라요. 비워둬도 글만으로 충분해요.
            </p>
            <div className="chip-grid" style={{ marginTop: 'var(--sp-2)' }}>
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="chip"
                  data-selected={mood === m.id}
                  aria-pressed={mood === m.id}
                  onClick={() => setMood((cur) => (cur === m.id ? null : m.id))}
                >
                  <span className="chip-emoji">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="card-row" style={{ marginTop: 'var(--sp-3)' }}>
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
                  onClick={() => setUrge((cur) => (cur === n ? null : n))}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="day-detail-block" style={{ marginTop: 'var(--sp-3)' }}>
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
            </div>
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
          {!step1Ready ? (
            <p className="hairline-note" style={{ textAlign: 'center' }}>
              회고·약속·다짐 중 한 가지만 적어도 다음으로 넘어갈 수 있어요.
            </p>
          ) : null}
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
