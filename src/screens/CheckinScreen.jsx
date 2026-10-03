import { useEffect, useState } from 'react';
import { CHECKIN_TAP } from '../constants/discipline.js';
import { useProgression } from '../hooks/useProgression.js';
import { useLeague } from '../hooks/useLeague.js';
import { computeLeagueContribution } from '../constants/league.js';
import { requestRoomView } from '../lib/roomNav.js';
import XpResult from '../components/XpResult.jsx';

const MOODS = [
  { id: 'calm', emoji: '🌙', label: '차분함' },
  { id: 'tired', emoji: '🫧', label: '피곤함' },
  { id: 'restless', emoji: '🌫', label: '뒤숭숭함' },
  { id: 'excited', emoji: '🌸', label: '설레임' },
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

// V2 day-state (EG-02): a single honest self-report of how today went, each mapped to a
// real XP source (progression.js). It is an ADDITIVE XP input — the record's gate stays
// the user's own writing (회고/약속/다짐), RC-1 writing-first.
const DAY_STATES = [
  { id: 'kept', label: '목표를 지켰어요', xp: 25, help: '오늘의 절제 목표 성공' },
  { id: 'overcame', label: '흔들렸지만 이겨냈어요', xp: 20, help: '위기가 있었지만 넘겼어요 · 잠깐 멈춤 완료' },
  { id: 'hard', label: '어려운 하루였어요', xp: 20, help: '그래도 남기는 기록이 +20 · 내일 돌아오면 복귀 +15' },
];

const RETRO_MAX = 200;
const PROMISE_MAX = 100;
const RESOLVE_MAX = 100;
const FUTURE_MAX = 120;

const moodIdFromLabel = (label) => MOODS.find((m) => m.label === label)?.id ?? null;
const triggerIdsFromLabels = (labels = []) =>
  labels.map((l) => TRIGGERS.find((t) => t.label === l)?.id).filter(Boolean);

/*
 * CheckinScreen — V2 오늘 기록 (EG-02) + 기록 결과 (EG-03), Ember Graphite. The proven
 * writing-first 2-step flow is PRESERVED (회고/약속/다짐 are the primary fields and the gate;
 * step 2 is 오늘의 규율 점검; the saved read-back is unchanged). The V2 additions are the
 * 3-state day selector + 미래의 나에게 한 줄, which drive a REAL XP award — the sum of the
 * day's actual actions, never a hard-coded +75 — feeding an itemized XP result with a visible
 * white-kitten reaction. Personal XP + weekly League Score update in their own stores; the
 * check-in text still persists through the existing onCompleteCheckin path.
 */
export default function CheckinScreen({
  onNavigate,
  rules = [],
  onSetRuleStatus,
  onCompleteCheckin,
  todayRecord = null,
  checkinNoteDraft = null,
  checkinContext = null,
  onConsumeCheckinContext,
  crisisHeldToday = false,
  onSaveFutureDiary,
  fromShield = false,
}) {
  const [fromRecord] = useState(checkinContext === 'record');
  useEffect(() => {
    if (checkinContext) onConsumeCheckinContext?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedCheckin = todayRecord?.checkin ?? null;
  const { preview, award, kittenName } = useProgression();
  const league = useLeague();

  const [editing, setEditing] = useState(() => !savedCheckin);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState(null);
  const [dayState, setDayState] = useState(null);
  const [futureLine, setFutureLine] = useState('');
  const [note, setNote] = useState(() => savedCheckin?.note ?? checkinNoteDraft ?? '');
  const [promise, setPromise] = useState(() => savedCheckin?.promise ?? '');
  const [resolve, setResolve] = useState(() => savedCheckin?.resolve ?? '');
  const [mood, setMood] = useState(() => moodIdFromLabel(savedCheckin?.moodLabel));
  const [triggers, setTriggers] = useState(() => triggerIdsFromLabels(savedCheckin?.triggers));
  const [urge, setUrge] = useState(() => (typeof savedCheckin?.urge === 'number' ? savedCheckin.urge : null));

  const toggleTrigger = (id) =>
    setTriggers((t) => {
      if (t.includes(id)) return t.filter((x) => x !== id);
      if (id === 'none') return ['none'];
      return [...t.filter((x) => x !== 'none'), id];
    });

  // The gate is the user's OWN writing (RC-1): at least one of 회고/약속/다짐 has text.
  const step1Ready = [note, promise, resolve].some((v) => v.trim().length > 0);

  // The day's REAL completed actions — one source of truth for both the EG-03 preview and
  // the commit, so the number shown equals the number granted.
  const buildActions = () => ({
    record: true,
    goalSuccess: dayState === 'kept',
    crisisOvercome: dayState === 'overcame' || !!crisisHeldToday,
    futureDiary: futureLine.trim().length > 0,
  });

  // Commit the check-in text through the existing App path (also navigates to the room).
  const finishCheckin = () => {
    if (!onCompleteCheckin) {
      onNavigate('reward');
      return;
    }
    const moodLabel = MOODS.find((m) => m.id === mood)?.label ?? null;
    const triggerLabels = triggers.map((id) => TRIGGERS.find((t) => t.id === id)?.label).filter(Boolean);
    onCompleteCheckin({
      moodLabel,
      urge,
      triggers: triggerLabels,
      note: note.trim(),
      promise: promise.trim(),
      resolve: resolve.trim(),
    });
  };

  // Step 2 "기록하기": show the itemized result as a PREVIEW only. NOTHING is persisted
  // yet — Personal XP, the league contribution, the future line, AND the Today Record all
  // commit together on the result CTA (commitAndGo), so an interruption on EG-03 leaves no
  // orphan reward (closeout #1: TODAY RECORD COMMITTED ↔ PERSONAL XP AWARD COMMITTED).
  const handleFinish = () => {
    setResult(preview(buildActions(), { dayState }));
  };

  // The single completion transaction (record ↔ reward are inseparable). Runs entirely in
  // one handler: award Personal XP + add the league contribution (its OWN calculator,
  // capped) durably, save the future line, then commit the Today Record (which navigates).
  // The reward writes persist synchronously, so they survive the navigation-driven unmount.
  const commitAndGo = (dest) => {
    const actions = buildActions();
    // Personal XP — durable, anti-farm, and +복귀 when returning after a hard day (the store
    // knows yesterday's hardness). The view's grantedIds are exactly what was awarded today.
    const view = award(actions, { dayState });
    // League — its OWN independent calculator (never the Personal XP total), fed the SAME
    // granted set so the two economies stay consistent, then bounded by the daily cap.
    league.addScore(computeLeagueContribution(view.grantedIds).total);
    if (futureLine.trim()) onSaveFutureDiary?.({ idealDay: futureLine.trim() });
    // "루미 보러 가기" lands in the actual room (EG-11); the App commit navigates to the 내 방
    // screen, and this intent makes it open the room view rather than the hub landing.
    if (dest === 'room') requestRoomView('room');
    finishCheckin(); // commit the Today Record + navigate to the 내 방 screen
    if (dest === 'home') onNavigate?.('home'); // last-wins → home
  };

  if (result) {
    return (
      <XpResult
        result={result}
        kittenName={kittenName}
        onGoRoom={() => commitAndGo('room')}
        secondaryLabel="홈으로"
        onSecondary={() => commitAndGo('home')}
      />
    );
  }

  // Saved-state read-back — today is already logged (Ember Graphite).
  if (!editing && savedCheckin) {
    const summaryTriggers = Array.isArray(savedCheckin.triggers) ? savedCheckin.triggers : [];
    const hasState =
      savedCheckin.moodLabel || typeof savedCheckin.urge === 'number' || summaryTriggers.length > 0;
    return (
      <div className="v2-screen eg-form">
        <header className="screen-header">
          <div>
            <p className="eg-eyebrow">오늘 기록</p>
            <h1 className="screen-title" style={{ marginTop: 6 }}>오늘의 기록</h1>
          </div>
          <span className="pill pill-moss">완료</span>
        </header>
        <p className="screen-subtitle">오늘 내가 쓴 글이에요. 이 기기에만 저장돼요. 언제든 다시 고칠 수 있어요.</p>
        {fromShield ? <p className="hairline-note">방금 멈춘 시간을 오늘 기록으로 남길 수 있어요.</p> : null}

        <section className="card checkin-saved-confirm">
          <span className="card-label">오늘 기록이 저장됐어요</span>
          <p className="hairline-note">최근 기록에서 내가 쓴 글을 다시 볼 수 있어요. 오늘은 여기까지 해도 충분해요.</p>
        </section>

        <section className="card">
          {savedCheckin.note ? (
            <div className="day-detail-block"><span className="card-label">오늘 회고</span><p className="day-detail-reflection">“{savedCheckin.note}”</p></div>
          ) : null}
          {savedCheckin.promise ? (
            <div className="day-detail-block"><span className="card-label">나와의 약속</span><p className="day-detail-reflection">“{savedCheckin.promise}”</p></div>
          ) : null}
          {savedCheckin.resolve ? (
            <div className="day-detail-block"><span className="card-label">오늘의 다짐</span><p className="day-detail-reflection">“{savedCheckin.resolve}”</p></div>
          ) : null}
          {!savedCheckin.note && !savedCheckin.promise && !savedCheckin.resolve ? (
            <p className="hairline-note">오늘은 글 없이 상태만 남겼어요.</p>
          ) : null}
        </section>

        {hasState ? (
          <section className="card">
            <span className="card-label">오늘 상태</span>
            <div className="card-row"><span className="card-label">오늘 기분</span><span className="discipline-summary">{savedCheckin.moodLabel ?? '기록 안 함'}</span></div>
            <div className="card-row"><span className="card-label">충동 강도</span><span className="discipline-summary">{typeof savedCheckin.urge === 'number' ? `${savedCheckin.urge} / 5` : '기록 안 함'}</span></div>
            {summaryTriggers.length > 0 ? (
              <div className="day-detail-block"><span className="card-label">오늘 트리거</span><div className="sheet-chip-grid">{summaryTriggers.map((t) => (<span key={t} className="chip" data-selected="false">{t}</span>))}</div></div>
            ) : null}
          </section>
        ) : null}

        <button type="button" className="eg-cta" onClick={() => onNavigate('calendar')}>최근 기록 보기</button>
        <button type="button" className="eg-secbtn" onClick={() => { setEditing(true); setStep(1); }}>오늘 기록 고치기</button>
        <p className="hairline-note" style={{ textAlign: 'center' }}>이 기기에만 저장돼요. 밖으로 공유되지 않아요.</p>
        <button type="button" className="eg-secbtn" onClick={() => onNavigate('home')}>홈으로</button>
      </div>
    );
  }

  return (
    <div className="v2-screen eg-form">
      <header className="screen-header">
        <div>
          <p className="eg-eyebrow">오늘 기록</p>
          <h1 className="screen-title" style={{ marginTop: 6, lineHeight: 1.3 }}>
            {step === 1 ? <>오늘 하루,<br />어떻게 지나갔나요?</> : '오늘의 규율 점검'}
          </h1>
        </div>
        <span className="pill">{step} / 2</span>
      </header>

      {step === 1 ? (
        <>
          {fromShield ? <p className="hairline-note">방금 멈춘 시간을 오늘 기록으로 남길 수 있어요.</p> : null}
          {fromRecord ? (
            <section className="card"><span className="card-label">그날의 기록을 참고해 오늘 한 줄을 남겨볼까요?</span><p className="hairline-note">기록은 그대로 두고, 오늘 기록으로 이어가요.</p></section>
          ) : null}

          {/* 3-state day selector — each maps to a real XP source (additive) */}
          {DAY_STATES.map((s) => (
            <button key={s.id} type="button" className="eg-state-card" aria-pressed={dayState === s.id} onClick={() => setDayState((cur) => (cur === s.id ? null : s.id))}>
              <div className="eg-state-head">
                <span className="eg-state-dot" aria-hidden="true" />
                <span className="eg-state-label">{s.label}</span>
                <span className="eg-state-xp">+{s.xp} XP</span>
              </div>
              <div className="eg-state-help">{s.help}</div>
            </button>
          ))}

          {/* 미래의 나에게 한 줄 (+10 XP · saved to the future diary) */}
          <div className="eg-diary-card">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <b style={{ fontSize: 13, color: 'var(--eg-text)' }}>미래의 나에게 한 줄</b>
              <span className="eg-state-xp" style={{ marginLeft: 'auto' }}>+10 XP</span>
            </div>
            <textarea className="eg-diary-input" value={futureLine} onChange={(e) => setFutureLine(e.target.value.slice(0, FUTURE_MAX))} placeholder="내일 아침의 나는 오늘의 내가 고마울 거야…" maxLength={FUTURE_MAX} rows={2} aria-label="미래의 나에게 한 줄" />
          </div>

          <p className="screen-subtitle">내가 쓴 글이 가장 큰 힘이 돼요. 한 가지만 적어도 충분해요. 이 기기에만 저장되고 밖으로 공유되지 않아요.</p>

          <section className="card">
            <div className="card-row"><span className="card-label">오늘 회고</span><span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>{note.length}/{RETRO_MAX}</span></div>
            <textarea className="sheet-input reflect-input" value={note} onChange={(e) => setNote(e.target.value.slice(0, RETRO_MAX))} placeholder="오늘 하루는 어땠나요? 떠오르는 대로 적어요." maxLength={RETRO_MAX} rows={3} aria-label="오늘 회고" />
          </section>
          <section className="card">
            <div className="card-row"><span className="card-label">나와의 약속</span><span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>{promise.length}/{PROMISE_MAX}</span></div>
            <textarea className="sheet-input reflect-input" value={promise} onChange={(e) => setPromise(e.target.value.slice(0, PROMISE_MAX))} placeholder="나와 지키고 싶은 약속을 한 줄로 적어요. 비워둬도 괜찮아요." maxLength={PROMISE_MAX} rows={2} aria-label="나와의 약속" />
          </section>
          <section className="card">
            <div className="card-row"><span className="card-label">오늘의 다짐</span><span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>{resolve.length}/{RESOLVE_MAX}</span></div>
            <textarea className="sheet-input reflect-input" value={resolve} onChange={(e) => setResolve(e.target.value.slice(0, RESOLVE_MAX))} placeholder="오늘의 다짐을 한 줄로 적어요. 비워둬도 괜찮아요." maxLength={RESOLVE_MAX} rows={2} aria-label="오늘의 다짐" />
            <p className="hairline-note">내가 쓴 글은 이 기기에만 저장돼요. 밖으로 공유되지 않아요.</p>
          </section>

          <section className="card">
            <span className="card-label">오늘 상태 (선택)</span>
            <p className="hairline-note text-quiet">남기고 싶으면 골라요. 비워둬도 글만으로 충분해요.</p>
            <div className="chip-grid" style={{ marginTop: 'var(--sp-2)' }}>
              {MOODS.map((m) => (
                <button key={m.id} type="button" className="chip" data-selected={mood === m.id} aria-pressed={mood === m.id} onClick={() => setMood((cur) => (cur === m.id ? null : m.id))}>
                  <span className="chip-emoji">{m.emoji}</span><span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="card-row" style={{ marginTop: 'var(--sp-3)' }}><span className="card-label">충동 강도</span><span className="text-quiet" style={{ fontSize: 'var(--fs-small)' }}>1 약함 · 5 강함</span></div>
            <div className="scale-row">
              {URGE_SCALE.map((n) => (
                <button key={n} type="button" className="scale-cell" data-selected={urge === n} aria-pressed={urge === n} aria-label={`충동 강도 ${n}`} onClick={() => setUrge((cur) => (cur === n ? null : n))}>{n}</button>
              ))}
            </div>
            <div className="day-detail-block" style={{ marginTop: 'var(--sp-3)' }}>
              <span className="card-label">오늘 트리거 (복수 선택)</span>
              <div className="chip-grid">
                {TRIGGERS.map((t) => (
                  <button key={t.id} type="button" className="chip" data-selected={triggers.includes(t.id)} aria-pressed={triggers.includes(t.id)} onClick={() => toggleTrigger(t.id)}><span>{t.label}</span></button>
                ))}
              </div>
            </div>
          </section>

          <button type="button" className="eg-cta" disabled={!step1Ready} style={step1Ready ? undefined : { opacity: 0.5, pointerEvents: 'none' }} onClick={() => setStep(2)}>
            다음 · 오늘의 규율 점검
          </button>
          {!step1Ready ? (
            <p className="hairline-note" style={{ textAlign: 'center' }}>회고·약속·다짐 중 한 가지만 적어도 다음으로 넘어갈 수 있어요.</p>
          ) : null}
        </>
      ) : (
        <>
          <p className="screen-subtitle">마지막으로 오늘 규율을 가볍게 점검해요. 고르지 않은 규율은 그대로 둬도 괜찮아요.</p>
          <section className="card">
            <span className="card-label">오늘의 규율 점검</span>
            {rules.length === 0 ? (
              <p className="hairline-note">아직 정한 규율이 없어요. “나의 규율”에서 먼저 만들어 보세요.</p>
            ) : (
              <div className="stack" style={{ '--gap': 'var(--sp-4)' }}>
                {rules.map((rule) => (
                  <div className="checkin-rule" key={rule.id}>
                    <span className="rule-label">{rule.label}</span>
                    <div className="checkin-tap-row">
                      {CHECKIN_TAP.map((opt) => (
                        <button key={opt.status} type="button" className="checkin-tap" data-selected={rule.status === opt.status} aria-pressed={rule.status === opt.status} onClick={() => onSetRuleStatus?.(rule.id, opt.status)}>{opt.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="hairline-note" style={{ textAlign: 'center' }}>기록만 해도 +20 XP · {kittenName}가 기다리고 있어요</p>
          <button type="button" className="eg-cta" onClick={handleFinish}>기록하기</button>
          <button type="button" className="eg-secbtn" onClick={() => setStep(1)}>이전으로</button>
        </>
      )}
    </div>
  );
}
