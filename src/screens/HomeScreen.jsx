import { useEffect, useMemo, useState } from 'react';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import { summarizeRules, linkedRules } from '../constants/discipline.js';
import { msToDateValue, msToTimeValue, dateTimeToMs } from '../utils/datetime.js';
import { useProgression } from '../hooks/useProgression.js';
import { useLeague } from '../hooks/useLeague.js';
import KittenHero from '../components/KittenHero.jsx';
import LeaguePreview from '../components/LeaguePreview.jsx';
import { requestRoomView } from '../lib/roomNav.js';

function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hh = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return { days, hh, mm, ss };
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function koreanDate(ms) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;
}

const ITEM_DOTS = ['var(--eg-calm, #9ab3a3)', 'var(--eg-ember-light, #f58a5f)', 'var(--eg-xp, #f2a33a)'];

/*
 * HomeScreen — V2 EG-01/04 (Ember Graphite). Hierarchy: white-kitten hero → today's
 * primary action → XP/next growth → weekly-league standing → secondary flows. The old
 * v13 timer hero is REPLACED (registry: v13 timer-home → V2 kitten+XP home), but every
 * proven capability is PRESERVED and reachable: the live per-counter timers + full
 * multi-counter management, the 예시 first-run honesty, slip/restart (confirm sheet),
 * linked rules, and the 관리 group. Both safety paths stay one tap away (오늘 기록 →
 * checkin, 잠깐 멈춤 → urge). Nothing here fakes a capability.
 */
export default function HomeScreen({
  onNavigate,
  rules = [],
  abstinenceStartMs = Date.now(),
  longestDays = 0,
  counters = [],
  selectedCounterId = null,
  selectedCounterName = '',
  emberShards = 0,
  todayRecord = null,
  onSelectCounter,
  onAddCounter,
  onEditCounter,
  onStartOwnRun,
  onRelapse,
  onStartSlipReflection,
  onResetLocalData,
}) {
  const [now, setNow] = useState(Date.now());
  const [confirmRestart, setConfirmRestart] = useState(false);
  useDismissOnEscape(confirmRestart, () => setConfirmRestart(false));
  const [confirmReset, setConfirmReset] = useState(false);
  useDismissOnEscape(confirmReset, () => setConfirmReset(false));
  const [addCounterOpen, setAddCounterOpen] = useState(false);
  const [editCounterOpen, setEditCounterOpen] = useState(false);
  useDismissOnEscape(addCounterOpen || editCounterOpen, () => {
    setAddCounterOpen(false);
    setEditCounterOpen(false);
  });

  // V2 progression + weekly league (own-key stores; read fresh on each mount).
  const { level, progress, evolution, nextEvolution, kittenName, todayXp } = useProgression();
  const league = useLeague();

  const selectedCounter = counters.find((c) => c.id === selectedCounterId) ?? counters[0] ?? null;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Current-run elapsed — the live "I've made it this far" time, derived from the real run
  // start (the selected counter's startMs, persisted → survives reload), NOT Personal XP and
  // NOT League Score. `now` ticks every second (effect below), so the clock is live.
  const run = formatElapsed(now - abstinenceStartMs);
  const days = run.days;
  const heroIsSample = !!selectedCounter?.isSample;
  const hasSample = counters.some((c) => c.isSample);
  // Completion is proven ONLY by the committed Today Record (App bundle), never by Personal
  // XP alone — XP could exist without a committed record if a reward path were interrupted,
  // and "오늘 완료" must reflect the real record, not the reward. (closeout #2)
  const recordedToday = !!todayRecord?.checkin;

  const counterRules = useMemo(
    () => linkedRules(rules, selectedCounter?.id),
    [rules, selectedCounter?.id],
  );
  const counterRuleSummary = useMemo(() => summarizeRules(counterRules), [counterRules]);

  const confirmRelapse = () => {
    setConfirmRestart(false);
    onRelapse?.();
  };

  // Empty state (v13 screen 79) — ported to Ember Graphite; management still reachable.
  if (counters.length === 0) {
    return (
      <div className="v2-screen">
        <div className="eg-topbar">
          <span className="eg-eyebrow">NoF</span>
          <span className="eg-sub" style={{ marginLeft: 'auto' }}>무료</span>
        </div>
        <div style={{ margin: 'auto 0', textAlign: 'center' }}>
          <h2 className="eg-h2">아직 절제 항목이 없어요</h2>
          <p className="eg-sub" style={{ marginTop: 8, fontSize: 12.5 }}>
            멀리 둘 항목을 하나만 골라도 시작할 수 있어요
          </p>
        </div>
        <button type="button" className="eg-cta" onClick={() => setAddCounterOpen(true)}>
          첫 항목 추가
        </button>
        {addCounterOpen ? (
          <AddCounterSheet
            onCancel={() => setAddCounterOpen(false)}
            onSubmit={(payload) => {
              onAddCounter?.(payload);
              setAddCounterOpen(false);
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="v2-screen">
      {/* topbar: date · 함께한 지 N일 · 잔불 조각 */}
      <div className="eg-topbar">
        <div>
          <div className="eg-sub" style={{ letterSpacing: '.06em' }}>{koreanDate(now)}</div>
          <div className="eg-h2" style={{ marginTop: 2 }}>{kittenName}와 {days}일째</div>
        </div>
        <span className="eg-shard-pill" style={{ marginLeft: 'auto' }}>잔불 조각 {emberShards}</span>
      </div>

      {/* 1) white-kitten hero + LV / XP / next growth (real pose swap: idle → happy).
          Tapping the hero opens the Kitten Hub (EG-05) in the 내 방 tab. */}
      <button
        type="button"
        className="eg-home-hero eg-home-hero-btn"
        onClick={() => { requestRoomView('hub'); onNavigate('reward'); }}
        aria-label={`${kittenName} — 내 고양이 허브 열기`}
      >
        <KittenHero
          kittenName={kittenName}
          level={level}
          formName={evolution.name}
          progress={progress}
          todayXp={recordedToday ? todayXp : null}
          nextName={nextEvolution ? nextEvolution.name : null}
          pose={recordedToday ? 'happy' : 'idle'}
        />
        <span className="eg-hero-enter" aria-hidden="true">내 고양이 허브 →</span>
      </button>

      {/* 2) CURRENT-RUN STOPWATCH — the live "여기까지 왔어요" timer (Founder core). Derived from
          the real current-run start (selected counter's startMs, persisted → survives reload),
          never Personal XP and never League Score. It ticks to the second. */}
      <div className="eg-runtimer" role="group" aria-label="현재 유지 중 시간">
        <div className="eg-runtimer-top">
          <span className="eg-runtimer-label">현재 유지 중</span>
          {heroIsSample ? <span className="eg-muted" style={{ fontSize: 11, fontWeight: 700 }}>예시</span> : null}
        </div>
        <div className="eg-runtimer-clock" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <b>{run.days}</b>일 <b>{run.hh}</b>시간 <b>{run.mm}</b>분 <b>{run.ss}</b>초
        </div>
        <div className="eg-runtimer-sub">
          {selectedCounter
            ? `‘${selectedCounter.name}’ 유지 시간이에요. 지금도 계속 이어지고 있어요.`
            : '지금도 계속 이어지고 있어요.'}
        </div>
      </div>

      {/* 3) today's primary action (or a calm done state) + the crisis path */}
      {recordedToday ? (
        <div className="eg-done-banner">오늘 완료 · 내일 또 만나요</div>
      ) : (
        <button type="button" className="eg-cta" onClick={() => onNavigate('checkin')}>
          오늘 기록
        </button>
      )}
      <div className="eg-btn-row">
        <button type="button" className="eg-secbtn" onClick={() => onNavigate('urge')}>
          잠깐 멈춤
        </button>
        {recordedToday ? (
          <button type="button" className="eg-secbtn" onClick={() => onNavigate('checkin')}>
            오늘 기록 다시 보기
          </button>
        ) : (
          <button type="button" className="eg-secbtn" onClick={() => onStartSlipReflection?.(null)}>
            흔들림 기록
          </button>
        )}
      </div>
      {!recordedToday ? (
        <p className="eg-hint">
          흔들림 기록 — 참기 어려웠던 순간을 남겨요. <b>현재 유지 시간은 멈추지 않아요.</b>
        </p>
      ) : null}

      {/* 4) explicit STOP — an understandable "지금 기록을 여기서 마쳤어요" action, clearly distinct
          from 흔들림 기록 (which does NOT stop the timer). It only opens the confirm sheet — never
          an instant reset — and closing the run keeps Personal XP + growth (separate store) and
          never punishes the cat or shames the user. */}
      {selectedCounter ? (
        <button
          type="button"
          className="eg-secbtn eg-stop-run"
          onClick={() => setConfirmRestart(true)}
        >
          기록 중단
        </button>
      ) : null}

      {/* 5) weekly-league standing — neutral, non-shaming; opens the full weekly league (EG-09) */}
      <LeaguePreview
        tierName={league.tier.name}
        myRank={league.myRank}
        toPromote={league.toPromote}
        promoteRank={league.promoteRank}
        resetLabel={league.resetLabel}
        onOpen={() => { requestRoomView('league'); onNavigate('reward'); }}
      />

      {/* 4) secondary flows — real screens only (미래일기 · 고양이 방) */}
      <div className="eg-mini-row">
        <button type="button" className="eg-mini" onClick={() => onNavigate('diary')}>
          <div className="eg-mini-t">미래일기</div>
          <div className="eg-mini-d">오늘의 한 줄 +10 XP</div>
        </button>
        <button type="button" className="eg-mini" onClick={() => { requestRoomView('room'); onNavigate('reward'); }}>
          <div className="eg-mini-t">고양이 방</div>
          <div className="eg-mini-d">{kittenName}가 기다려요</div>
        </button>
      </div>

      {/* RC-4 first-run honesty: 예시 notice + one-tap own-run start */}
      {hasSample ? (
        <div className="eg-card">
          <p className="eg-sub" style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--eg-text-2)' }}>
            지금 보이는 기록은 예시예요. ‘내 기록으로 시작’을 누르면 지금부터 0일째로 새로 시작해요.
          </p>
          <button
            type="button"
            className="eg-secbtn"
            style={{ marginTop: 10 }}
            onClick={() => onStartOwnRun?.()}
          >
            내 기록으로 시작
          </button>
        </div>
      ) : null}

      {/* 5) 절제 항목 — PRESERVED multi-counter management + live per-counter timers */}
      <div className="eg-topbar eg-home-items" style={{ marginTop: 4 }}>
        <span className="eg-section-label">절제 항목 · {counters.length}개 관리 중</span>
        <button
          type="button"
          className="eg-shard-pill"
          style={{ marginLeft: 'auto', cursor: 'pointer' }}
          onClick={() => setAddCounterOpen(true)}
        >
          + 추가
        </button>
      </div>

      {counters.map((c, i) => {
        const el = formatElapsed(now - c.startMs);
        const isSel = c.id === (selectedCounter?.id ?? selectedCounterId);
        return (
          <button
            key={c.id}
            type="button"
            className="eg-card v13-item-row"
            style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
            aria-label={`${c.name} — 절제 중 ${el.days}일 ${el.hh}:${el.mm} — 대표로 선택`}
            onClick={() => onSelectCounter?.(c.id)}
          >
            <span style={{ width: 9, height: 9, borderRadius: 99, background: ITEM_DOTS[i % ITEM_DOTS.length], flex: 'none' }} aria-hidden="true" />
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--eg-text)' }}>
                {c.name}
                {c.isSample ? <span className="eg-muted" style={{ fontSize: 11 }}> · 예시</span> : null}
              </span>
              <span className="eg-sub" style={{ display: 'block', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {el.days}일 {el.hh}:{el.mm}:{el.ss}
              </span>
            </span>
            {isSel ? <span className="eg-today-xp" style={{ marginLeft: 0 }}>대표</span> : null}
          </button>
        );
      })}

      <button
        type="button"
        className="eg-card"
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
        onClick={() => onNavigate('discipline')}
      >
        <span className="eg-sub" style={{ flex: 1 }}>
          {counterRules.length > 0
            ? `연결된 규율 · 오늘 ${counterRuleSummary.total}개 중 ${counterRuleSummary.keeping}개 지키는 중`
            : '연결된 규율 없음 · 나의 규율에서 더할 수 있어요'}
        </span>
        <span className="eg-league-up">나의 규율 →</span>
      </button>

      {selectedCounter ? (
        <button
          type="button"
          className="eg-secbtn"
          style={{ background: 'transparent', border: 'none', color: 'var(--eg-muted)', padding: '4px', minHeight: 0, fontSize: 12 }}
          onClick={() => setEditCounterOpen(true)}
        >
          ‘{selectedCounter.name}’ 카운터 편집
        </button>
      ) : null}

      {/* (The explicit 기록 중단 stop action lives up top in the primary hierarchy, item 4 —
          the old faded 무너졌어요 ghost was folded into it so there is ONE clear stop.) */}

      {/* 6) 관리 group — 보호 / 차단(준비 중) / 설정 / 로컬 데이터 지우기 (confirm sheet) */}
      <div className="eg-section-label eg-home-manage" style={{ marginTop: 4 }}>관리</div>
      <div>
        <button type="button" className="eg-manage-row eg-card" onClick={() => onNavigate('protection')}>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>보호 설정</span>
          <span className="eg-muted">›</span>
        </button>
        <button type="button" className="eg-manage-row eg-card" onClick={() => onNavigate('shield')}>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>차단 설정 (준비 중)</span>
          <span className="eg-muted">›</span>
        </button>
        <button type="button" className="eg-manage-row eg-card" onClick={() => onNavigate('settings')}>
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>설정 · 언어</span>
          <span className="eg-muted">›</span>
        </button>
        <button
          type="button"
          className="eg-manage-row eg-card"
          style={{ marginBottom: 0 }}
          aria-haspopup="dialog"
          onClick={() => setConfirmReset(true)}
        >
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 700 }}>이 기기의 기록 지우기</span>
          <span className="eg-muted">›</span>
        </button>
      </div>
      <p className="eg-sub" style={{ marginTop: 2, lineHeight: 1.6 }}>
        기록은 이 기기에만 저장돼요. 계정이나 클라우드는 없어요.
      </p>

      {/* 기록 중단 확인 시트 — 즉시 리셋 금지. 실제 onRelapse()는 여기서만 호출된다. 비난 없는
          중단: 지금까지의 시간은 기록에 남고, Personal XP·성장(별도 저장소)은 그대로 유지된다. */}
      {confirmRestart ? (
        <div className="sheet-backdrop" onClick={() => setConfirmRestart(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="기록 중단 확인" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">지금 진행 중인 기록을 여기서 마칠까요?</h2>
            <p className="sheet-help">
              지금까지 이어온 시간은 기록에 남겨둘게요. {selectedCounterName ? `‘${selectedCounterName}’ ` : ''}유지
              시간만 여기서 마치고, 다른 카운터와 그동안 키운 고양이·성장은 그대로 이어가요.
            </p>
            <p className="restart-reassure">괜찮아요. 다시 시작하면 돼요. 기록은 끝이 아니라 다음 시작점이에요.</p>
            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmRestart(false)}>계속 이어가기</button>
              <button type="button" className="btn btn-primary" onClick={confirmRelapse}>여기서 중단</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 데이터 초기화 확인 시트 — 즉시 삭제 금지. */}
      {confirmReset ? (
        <div className="sheet-backdrop" onClick={() => setConfirmReset(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="데이터 초기화 확인" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" aria-hidden="true" />
            <h2 className="sheet-title">정말 이 기기의 기록을 지울까요?</h2>
            <p className="sheet-help">
              오늘 기록, 최근 기록, 보호 설정이 모두 지워져요. 이 기기에 저장된 것만 지우고, 계정이나
              클라우드는 건드리지 않아요. 되돌릴 수 없어요.
            </p>
            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>취소</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setConfirmReset(false);
                  onResetLocalData?.();
                }}
              >
                기록 지우기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addCounterOpen ? (
        <AddCounterSheet
          onCancel={() => setAddCounterOpen(false)}
          onSubmit={(payload) => {
            onAddCounter?.(payload);
            setAddCounterOpen(false);
          }}
        />
      ) : null}

      {editCounterOpen && selectedCounter ? (
        <EditCounterSheet
          counter={selectedCounter}
          onCancel={() => setEditCounterOpen(false)}
          onSubmit={(payload) => {
            onEditCounter?.(selectedCounter.id, payload);
            setEditCounterOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

// 카운터 추가 시트 (counter-management) — preserved verbatim from the v13 home.
function AddCounterSheet({ onCancel, onSubmit }) {
  const now = Date.now();
  const [name, setName] = useState('');
  const [date, setDate] = useState(msToDateValue(now));
  const [time, setTime] = useState(msToTimeValue(now));
  const [target, setTarget] = useState('30');
  const ready = name.trim().length > 0 && !!date;
  const startInFuture = !!date && dateTimeToMs(date, time) > Date.now();
  const targetDefaults = !(parseInt(target, 10) > 0);

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="카운터 추가" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">새 카운터 추가</h2>
        <p className="sheet-help">새로 이어갈 절제를 하나 추가해요.</p>

        <label className="field-label" htmlFor="add-counter-name">이름</label>
        <input id="add-counter-name" type="text" className="sheet-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 콘텐츠 절제, SNS 줄이기" maxLength={40} autoFocus />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label" htmlFor="add-counter-date">시작 일</label>
            <input id="add-counter-date" type="date" className="sheet-input" value={date} max={msToDateValue(now)} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field-col">
            <label className="field-label" htmlFor="add-counter-time">시작 시간</label>
            <input id="add-counter-time" type="time" className="sheet-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        {startInFuture ? (
          <p className="hairline-note sheet-correction-note" role="status">아직 오지 않은 시각이라, 저장하면 시작 시점을 지금으로 맞춰요.</p>
        ) : null}

        <label className="field-label" htmlFor="add-counter-target">목표 일수</label>
        <input id="add-counter-target" type="number" min="1" max="3650" className="sheet-input" value={target} onChange={(e) => setTarget(e.target.value)} />
        {targetDefaults ? (
          <p className="hairline-note sheet-correction-note" role="status">목표를 비워 두면 30일로 저장돼요.</p>
        ) : null}

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button type="button" className="btn btn-primary" disabled={!ready} style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }} onClick={submit}>추가하기</button>
        </div>
      </div>
    </div>
  );
}

// 카운터 편집 시트 (counter-management) — preserved verbatim from the v13 home.
function EditCounterSheet({ counter, onCancel, onSubmit }) {
  const base = counter?.isSample ? Date.now() : (counter?.startMs ?? Date.now());
  const [name, setName] = useState(counter?.name ?? '');
  const [date, setDate] = useState(msToDateValue(base));
  const [time, setTime] = useState(msToTimeValue(base));
  const [target, setTarget] = useState(String(counter?.targetDays ?? 30));
  if (!counter) return null;
  const ready = name.trim().length > 0 && !!date;
  const startInFuture = !!date && dateTimeToMs(date, time) > Date.now();
  const targetKeepsCurrent = !(parseInt(target, 10) > 0);

  const submit = () => {
    onSubmit({ name, startMs: dateTimeToMs(date, time), targetDays: parseInt(target, 10) });
  };

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="카운터 편집" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">카운터 편집</h2>
        <p className="sheet-help">
          {counter.isSample ? '예시 카운터예요. 시작 시각을 정하면 내 기록이 돼요.' : '시작 시각을 바로잡거나 이름·목표를 바꿀 수 있어요.'}
        </p>

        <label className="field-label" htmlFor="edit-counter-name">이름</label>
        <input id="edit-counter-name" type="text" className="sheet-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />

        <div className="field-row">
          <div className="field-col">
            <label className="field-label" htmlFor="edit-counter-date">시작 일</label>
            <input id="edit-counter-date" type="date" className="sheet-input" value={date} max={msToDateValue(Date.now())} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field-col">
            <label className="field-label" htmlFor="edit-counter-time">시작 시간</label>
            <input id="edit-counter-time" type="time" className="sheet-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        {startInFuture ? (
          <p className="hairline-note sheet-correction-note" role="status">아직 오지 않은 시각이라, 저장하면 시작 시점을 지금으로 맞춰요.</p>
        ) : null}

        <label className="field-label" htmlFor="edit-counter-target">목표 일수</label>
        <input id="edit-counter-target" type="number" min="1" max="3650" className="sheet-input" value={target} onChange={(e) => setTarget(e.target.value)} />
        {targetKeepsCurrent ? (
          <p className="hairline-note sheet-correction-note" role="status">목표를 비워 두면 지금 목표 그대로 유지돼요.</p>
        ) : null}

        <div className="sheet-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button type="button" className="btn btn-primary" disabled={!ready} style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }} onClick={submit}>저장</button>
        </div>
      </div>
    </div>
  );
}
