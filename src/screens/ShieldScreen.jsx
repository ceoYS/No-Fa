import { useState } from 'react';
import {
  BLOCK_KINDS,
  KIND_LABEL,
  KIND_HELP,
  TEMPLATE_SUGGESTIONS,
  summarizeBlocklist,
  entriesForCounter,
} from '../constants/shield.js';

/*
 * ShieldScreen — 차단 설정 / NoF 실드 (준비 중) + 위험 신호 계획(P0.5).
 *
 * HONESTY NOTE: NoF has NO content-blocking engine yet. This screen never blocks
 * anything. The planner below only *authors abstract risk signals* — categories,
 * search-temptation signals, app/SNS kinds, and risky situations a user wants to
 * keep at a distance later — which a future P1 engine (browser extension / NoF
 * safe browser) maps to app-curated block packs. It must never ask the user to
 * hunt for or paste a risky site (that search is itself a relapse trigger), claims
 * nothing is being blocked, ships no functional toggle (a dead switch would read as
 * fake blocking), and carries a visible "이 목록은 아직 차단에 쓰이지 않아요" banner
 * plus a safety note telling users not to go looking for risky sites themselves.
 * SNS image mosaic stays P3 research only. No shame copy; tone matches
 * 규율 = 내가 정한 기준, not 처벌. Guards #29/#30 pin these invariants.
 */

const PLANNED_LAYERS = [
  {
    name: '브라우저 확장 (Chrome)',
    desc: '실제 브라우저 차단은 Chrome 확장 프로그램을 따로 설치해야 동작해요. 지금은 데스크톱용 테스트 단계예요.',
    phase: '1단계',
  },
  {
    name: 'NoF 안전 브라우저',
    desc: '앱 안에서 위험한 곳을 열지 않는 자체 브라우저예요. 지금은 앱 안 실험만 돼요.',
    phase: '앱 안에서만 실험 가능',
  },
  {
    name: 'iOS·Android 기기 차단',
    desc: 'Screen Time·FamilyControls, VPN·DNS 필터로 기기 전체를 보호하는 방향이에요.',
    phase: '2단계',
  },
];

const PLANNING_BANNER = '이 목록은 아직 차단에 쓰이지 않아요. 준비 중인 계획 목록이에요.';
const SAFETY_NOTE = '위험한 사이트를 직접 찾아 적지 마세요. 카테고리와 키워드 신호만 정해도 충분해요.';
const PLANNER_NOT_ENFORCED = '지금 입력한 신호는 아직 실제 차단에 쓰이지 않아요.';
const REAL_BLOCK_WHERE = '실제 차단은 Safe Browser 또는 브라우저 확장 단계에서 동작해요.';
const UNLINKED = '__unlinked__';

export default function ShieldScreen({
  onNavigate,
  counters = [],
  rules = [],
  blocklist = [],
  onAddBlockEntry,
  onRemoveBlockEntry,
}) {
  const [kind, setKind] = useState('category');
  const [label, setLabel] = useState('');
  const [linkedCounterId, setLinkedCounterId] = useState(null);

  const summary = summarizeBlocklist(blocklist);

  // Group planned signals by linked counter, plus a trailing unlinked bucket.
  const groups = [
    ...counters.map((c) => ({
      id: c.id,
      name: c.name,
      entries: entriesForCounter(blocklist, c.id),
    })),
    {
      id: UNLINKED,
      name: '연결 안 된 신호',
      entries: blocklist.filter(
        (e) => !e.counterId || !counters.some((c) => c.id === e.counterId),
      ),
    },
  ];
  const visibleGroups = groups.filter((g) => g.entries.length > 0);

  const ready = label.trim().length > 0;
  const submit = () => {
    if (!ready) return;
    onAddBlockEntry?.({ kind, label, counterId: linkedCounterId });
    setLabel('');
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">유혹을 멀리 두는 보호막</p>
          <h1 className="screen-title">NoF 실드</h1>
        </div>
      </header>

      {/* RC-1 copy diet (feedback #5): one short, clear status — does it work yet? what is
          this screen for now? — instead of a wall of meta-explanation. */}
      <section className="card shield-status">
        <div className="card-row">
          <span className="card-label">차단 설정</span>
          <span className="pill shield-tag">준비 중</span>
        </div>
        <p className="hairline-note">
          아직 실제 차단은 제공하지 않아요. 지금은 멀리 둘 신호를 미리 적어두는 단계예요.
        </p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">위험 신호 미리 정하기</span>
          <span className="pill shield-tag">{summary.total}개</span>
        </div>
        {/* R-6: one consolidated disclosure block — the banner line leads, the
            enforcement context follows quietly. The safety note moved inline
            beside the input it protects. Guards #29–31 pin all four strings. */}
        <div className="shield-honesty-block">
          <p className="hairline-note shield-honesty-lead">{PLANNING_BANNER}</p>
          <p className="hairline-note text-quiet">
            {PLANNER_NOT_ENFORCED} {REAL_BLOCK_WHERE}
          </p>
        </div>

        <div className="shield-kind-row" role="group" aria-label="신호 종류 고르기">
          {BLOCK_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="chip"
              data-selected={kind === k}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="hairline-note text-quiet">{KIND_HELP[kind]}</p>

        <div className="sheet-chip-grid">
          {TEMPLATE_SUGGESTIONS[kind].map((s) => (
            <button key={s} type="button" className="chip" onClick={() => setLabel(s)}>
              {s}
            </button>
          ))}
        </div>

        <p className="hairline-note shield-safety-note">{SAFETY_NOTE}</p>
        <input
          type="text"
          className="sheet-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="피하고 싶은 검색 신호나 상황을 적어요"
          maxLength={60}
        />

        {counters.length > 0 ? (
          <>
            <p className="hairline-note text-quiet">어떤 절제와 연결할까요? (선택)</p>
            <div className="sheet-chip-grid">
              {counters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  data-selected={linkedCounterId === c.id}
                  aria-pressed={linkedCounterId === c.id}
                  onClick={() =>
                    setLinkedCounterId((cur) => (cur === c.id ? null : c.id))
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!ready}
          style={ready ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
          onClick={submit}
        >
          신호 더하기
        </button>
      </section>

      <section className="card">
        <span className="card-label">정해둔 신호</span>
        {blocklist.length === 0 ? (
          <p className="hairline-note">
            아직 정해둔 신호가 없어요. 위에서 멀리 둘 신호를 하나씩 더해 보세요.
          </p>
        ) : (
          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {visibleGroups.map((g) => (
              <div className="shield-group" key={g.id}>
                <span className="shield-group-name">{g.name}</span>
                <ul className="shield-entry-list">
                  {g.entries.map((e) => (
                    <li className="shield-entry-row" key={e.id}>
                      <span className="pill shield-tag shield-kind-tag">{KIND_LABEL[e.kind]}</span>
                      <span className="shield-entry-label">{e.label}</span>
                      <button
                        type="button"
                        className="shield-entry-remove"
                        aria-label={`${e.label} 목록에서 치우기`}
                        onClick={() => onRemoveBlockEntry?.(e.id)}
                      >
                        치우기
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className="hairline-note text-quiet">
          이 신호는 실드가 준비되면 그대로 옮겨와 쓸 거예요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">앞으로 연결될 보호 방식</span>
        <p className="hairline-note text-quiet">
          아래는 켜는 버튼이 아니라, 앞으로 어떤 순서로 보호를 잇는지 보여주는 로드맵이에요.
        </p>
        <ul className="shield-roadmap" role="list">
          {PLANNED_LAYERS.map((l) => (
            <li className="shield-roadmap-item" key={l.name}>
              <span className="shield-roadmap-phase">{l.phase}</span>
              <span className="shield-roadmap-text">
                <span className="shield-roadmap-name">{l.name}</span>
                <span className="shield-roadmap-desc">{l.desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="hairline-note text-quiet">
          SNS 이미지를 흐리게 가리는 방법은 아직 연구 단계예요. 잘 되는 척하지 않고,
          확실해질 때 추가할게요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">안전 브라우저 실험</span>
        <p className="hairline-note">
          앱 안에서만 동작하는 실험이에요. 실제 웹은 열지 않고, 내가 정한 위험 신호와
          닿는지 비교해 ‘잠깐 멈춤’으로 이어줘요.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('shieldBrowser')}
        >
          안전 브라우저 실험 열기
        </button>
      </section>

      <section className="card">
        <span className="card-label">실제 차단 테스트 (Chrome 확장)</span>
        <p className="hairline-note">
          여기 정해둔 신호는 아직 계획이에요. 실제로 막히는지 확인하는 테스트는 따로
          설치하는 Chrome 확장에서만 동작해요. 해롭지 않은 테스트 신호 하나로만 확인해요.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('shieldExtension')}
        >
          Chrome 확장으로 실제 차단 테스트하기
        </button>
      </section>

      {/* RC-1 copy diet: the long "how shield connects to NoF" 4-bullet future-explainer
          was removed — it added reading load without telling the user what to do now. The
          "still usable" reassurance is kept as a single 잠깐 멈춤 CTA. */}
      <section className="card">
        <span className="card-label">실드가 준비되는 동안</span>
        <p className="hairline-note">
          차단이 아직 없어도, 충동을 흘려보내는 잠깐 멈춤은 지금도 쓸 수 있어요.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => onNavigate('urge')}
        >
          못 참을 것 같아요 · 잠깐 멈춤
        </button>
      </section>

      <p className="hairline-note text-quiet shield-privacy">
        실드는 기기 안에서만 동작하도록 설계해요. 무엇을 봤는지 서버로 보내지 않아요.
      </p>

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
