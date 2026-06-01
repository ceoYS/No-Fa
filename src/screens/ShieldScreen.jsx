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
 * ShieldScreen — 차단 설정 / NoF 실드 (준비 중) + 차단 목록 계획(P0.5).
 *
 * HONESTY NOTE: NoF has NO content-blocking engine yet. This screen never blocks
 * anything. The planner below only *authors a plan list* — the domains / keywords /
 * app categories a user wants to mute later — which a future P1 engine (browser
 * extension / NoF safe browser) will consume. It must not claim any site / search /
 * app is being blocked, ships no functional toggle (a dead switch would read as
 * fake blocking), and carries a visible "이 목록은 아직 차단에 쓰이지 않아요" banner.
 * It explains the planned layers (extension / safe browser / native iOS·Android),
 * how Shield will connect to counters · rules · 잠깐 멈춤 · records, and points to
 * the tools that already work today. SNS image mosaic stays P3 research only. No
 * shame copy; the tone matches 규율 = 내가 정한 기준, not 처벌. Guards #29/#30 pin
 * these invariants.
 */

const PLANNED_LAYERS = [
  {
    name: '브라우저 확장 (Chrome 등)',
    desc: 'PC 브라우저에서 주소·검색을 먼저 거르는 가장 빠른 길이에요.',
    phase: '1단계',
  },
  {
    name: 'NoF 안전 브라우저',
    desc: '앱 안에서 위험한 주소를 열지 않는 자체 브라우저를 검토하고 있어요.',
    phase: '1단계',
  },
  {
    name: 'iOS·Android 기기 차단',
    desc: 'Screen Time·FamilyControls, VPN·DNS 필터로 기기 전체를 보호하는 방향이에요.',
    phase: '2단계',
  },
];

const PLANNING_BANNER = '이 목록은 아직 차단에 쓰이지 않아요. 준비 중인 계획 목록이에요.';
const UNLINKED = '__unlinked__';

export default function ShieldScreen({
  onNavigate,
  counters = [],
  rules = [],
  blocklist = [],
  onAddBlockEntry,
  onRemoveBlockEntry,
}) {
  const [kind, setKind] = useState('domain');
  const [label, setLabel] = useState('');
  const [linkedCounterId, setLinkedCounterId] = useState(null);

  const summary = summarizeBlocklist(blocklist);

  // Group planned entries by linked counter, plus a trailing unlinked bucket.
  const groups = [
    ...counters.map((c) => ({
      id: c.id,
      name: c.name,
      entries: entriesForCounter(blocklist, c.id),
    })),
    {
      id: UNLINKED,
      name: '연결 안 된 목록',
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

      <section className="card shield-status">
        <div className="card-row">
          <span className="card-label">차단 설정</span>
          <span className="pill shield-tag">준비 중</span>
        </div>
        <p className="hairline-note">
          NoF 실드는 자극적인 사이트와 검색을 멀리 두도록 돕는 보호막이에요.
          아직 실제 차단은 제공하지 않아요. 준비가 되면 이곳에서 켤 수 있게 할게요.
        </p>
        <p className="hairline-note text-quiet">
          지금 켜고 끄는 스위치를 두지 않은 건, 동작하지 않는 기능을 켜진 것처럼 보이게
          하고 싶지 않아서예요.
        </p>
      </section>

      <section className="card">
        <div className="card-row">
          <span className="card-label">멀리 둘 목록 미리 적기</span>
          <span className="pill shield-tag">{summary.total}개</span>
        </div>
        <p className="hairline-note shield-planner-banner">{PLANNING_BANNER}</p>

        <div className="shield-kind-row" role="group" aria-label="목록 종류 고르기">
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

        <input
          type="text"
          className="sheet-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="멀리 둘 사이트·검색어·앱 종류를 적어요"
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
          목록에 더하기
        </button>
      </section>

      <section className="card">
        <span className="card-label">적어둔 목록</span>
        {blocklist.length === 0 ? (
          <p className="hairline-note">
            아직 적어둔 항목이 없어요. 위에서 멀리 둘 것을 하나씩 더해 보세요.
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
          이 목록은 실드가 준비되면 그대로 옮겨와 쓸 거예요. 지금은 아무것도 차단하지 않아요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">어떻게 막을지 준비하고 있어요</span>
        <ul className="shield-list">
          {PLANNED_LAYERS.map((l) => (
            <li className="shield-row" key={l.name}>
              <span className="shield-dot" aria-hidden="true" />
              <span className="shield-row-text">
                <span className="shield-row-name">{l.name}</span>
                <span className="shield-row-desc">{l.desc}</span>
              </span>
              <span className="pill shield-tag">{l.phase}</span>
            </li>
          ))}
        </ul>
        <p className="hairline-note text-quiet">
          SNS 이미지를 흐리게 가리는 방법은 아직 연구 단계예요. 잘 되는 척하지 않고,
          확실해질 때 추가할게요.
        </p>
      </section>

      <section className="card">
        <span className="card-label">실드와 NoF가 이어지는 방식</span>
        <p className="hairline-note">
          실드는 따로 도는 기능이 아니라, 지금 쓰는 절제 도구와 연결돼요.
        </p>
        <ul className="shield-link-list">
          <li className="hairline-note">· 금욕 카운터({counters.length}개)별로 무엇을 멀리 둘지 적어둘 수 있어요.</li>
          <li className="hairline-note">· 규율({rules.length}개)에 ‘이 사이트 안 열기’ 같은 약속을 이어붙이게 할 거예요.</li>
          <li className="hairline-note">· 차단에 막힌 순간엔 ‘잠깐 멈춤’ 5분으로 바로 이어지게 할 거예요.</li>
          <li className="hairline-note">· 멀리 둔 순간들을 기록에 남겨 흐름을 돌아보게 할 거예요.</li>
        </ul>
      </section>

      <section className="card">
        <span className="card-label">실드가 준비되는 동안</span>
        <p className="hairline-note">
          차단이 아직 없어도, 충동을 흘려보내는 도구는 지금도 쓸 수 있어요.
        </p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate('urge')}
          >
            못 참을 것 같아요 · 잠깐 멈춤
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => onNavigate('discipline')}
          >
            규율로 기준 정하기
          </button>
        </div>
      </section>

      <p className="hairline-note text-quiet shield-privacy">
        실드는 기기 안에서만 동작하도록 설계할 거예요. 무엇을 봤는지 서버로 보내지 않는
        것을 기본 원칙으로 준비하고 있어요.
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
