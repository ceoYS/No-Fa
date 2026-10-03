import { useEffect, useState } from 'react';
import {
  BLOCK_KINDS,
  KIND_LABEL,
  KIND_HELP,
  TEMPLATE_SUGGESTIONS,
  summarizeBlocklist,
  entriesForCounter,
} from '../constants/shield.js';
import { getSavedExtensionId, getExtensionStatus } from '../lib/chromeExtensionBridge.js';

/*
 * ShieldScreen — NoF 실드 (보호 대시보드). V2 Ember Graphite rebuild (Founder blocker 1): the
 * screen was still wearing the old light/form prototype (.screen/.card/.btn); it is now the same
 * V2 system as the rest of the app, restructured into a clear protection dashboard —
 *   [현재 보호 상태] → [내가 피하고 싶은 신호] → [잠깐 멈춤] → [앞으로 연결될 보호 방식] → [고급 보호]
 * — each capability marked honestly 작동 중 / 실험 / 준비 중.
 *
 * HONESTY NOTE (unchanged, prime directive): NoF has NO content-blocking engine yet. This screen
 * never blocks anything. The planner below only *authors abstract risk signals* — categories,
 * search-temptation signals, app/SNS kinds, and risky situations a user wants to keep at a
 * distance later — which a future engine (browser extension / NoF safe browser) maps to
 * app-curated block packs. It never asks the user to hunt for or paste a risky site, claims
 * nothing is being blocked, ships no functional toggle (a dead switch would read as fake
 * blocking), and carries the visible "이 목록은 아직 차단에 쓰이지 않아요" banner plus a safety
 * note. Device-wide / SNS-image-blur / auto adult-site blocking are labelled 준비 중, never faked.
 * SNS image mosaic stays research only. No shame copy. Guards #29/#30/#31/#32 pin these
 * invariants — the honesty strings below are kept verbatim.
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

// Guard-pinned honesty strings (kept verbatim across the V2 rebuild).
const NO_BLOCK_YET = '아직 실제 차단은 제공하지 않아요.';
const PLANNING_BANNER = '이 목록은 아직 차단에 쓰이지 않아요. 준비 중인 계획 목록이에요.';
const SAFETY_NOTE = '위험한 사이트를 직접 찾아 적지 마세요. 카테고리와 키워드 신호만 정해도 충분해요.';
const PLANNER_NOT_ENFORCED = '지금 입력한 신호는 아직 실제 차단에 쓰이지 않아요.';
const REAL_BLOCK_WHERE = '실제 차단은 Safe Browser 또는 브라우저 확장 단계에서 동작해요.';
const UNLINKED = '__unlinked__';

// Honest current-protection states. `on` = genuinely works now (all local), `exp` = in-app /
// separately-installed experiment, `soon` = not built yet. Nothing here is a fake toggle.
const STATUS = {
  on: { label: '작동 중', cls: 'on' },
  exp: { label: '실험', cls: 'exp' },
  soon: { label: '준비 중', cls: 'soon' },
};

// The genuinely-advanced protections that are NOT built yet — each 준비 중, never faked.
const ADVANCED = ['휴대폰 전체·다른 앱 차단', 'SNS 이미지 흐리게 가리기', '성인 사이트 자동 차단'];

function StateChip({ status }) {
  const s = STATUS[status];
  return <span className={`shield-state-chip shield-state-chip--${s.cls}`}>{s.label}</span>;
}

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

  // Real Chrome-protection status (Founder blocker 6A + P0 기본 보호). NEVER inferred from storage
  // alone: a saved extension id is only a stored value, so we actually GET_STATUS-ping the extension
  // and trust only a genuine structured reply (the bridge enforces a real timeout + lastError check).
  // No saved id, no reply, or a runtime without the extension → honestly '연결 안 됨' (disconnected).
  // The whole reply is kept so the card can show the REAL 기본 보호 state (bundled on/off, list type,
  // rule counts) — read-only here; managing modes/allow list lives on the 실제 차단 테스트 screen,
  // which is the only Shield surface allowed to speak in concrete terms.
  const [chromeGuard, setChromeGuard] = useState({ state: 'disconnected', status: null });
  useEffect(() => {
    const extId = getSavedExtensionId();
    if (!extId) {
      setChromeGuard({ state: 'disconnected', status: null });
      return;
    }
    let alive = true;
    setChromeGuard({ state: 'checking', status: null });
    getExtensionStatus(extId).then((res) => {
      if (!alive) return;
      if (res && res.ok) {
        setChromeGuard({ state: 'connected', status: res });
      } else {
        setChromeGuard({ state: 'disconnected', status: null });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Honest, derived-from-real-reply protection summary. Every number below comes from the actual
  // GET_STATUS reply — nothing is claimed without a real extension answer. The bundled 기본 보호
  // list is currently a FIXTURE (test list), so when it is on we say so plainly and never claim it
  // blocks real 성인 사이트.
  const st = chromeGuard.status;
  const bundledOn = !!st?.defaultProtection;
  const listIsFixture = st?.bundled?.listType !== 'production';
  const bundledCount = st?.bundled?.domainCount ?? 0;
  const userBlockCount = st?.userBlockCount ?? 0;
  const allowlistCount = st?.allowlistCount ?? 0;
  const appliedCount = (bundledOn ? bundledCount : 0) + userBlockCount;

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
    <div className="v2-screen">
      {/* header */}
      <div className="eg-topbar">
        <div>
          <div className="eg-eyebrow">NoF SHIELD</div>
          <h1 className="eg-title" style={{ marginTop: 3 }}>NoF 실드</h1>
          <p className="eg-sub" style={{ marginTop: 5, lineHeight: 1.5 }}>
            나를 자극에서 한 번 더 멀리 두는 보호막
          </p>
        </div>
      </div>

      {/* 1) 현재 보호 상태 — the REAL Chrome-protection state leads (derived from an actual
          extension ping, never a static claim), then the honestly-working local pause, then the
          in-app Safe Browser experiment. Founder blocker 6A: no faked "작동 중" for browser blocking. */}
      <div className="eg-section-label">현재 보호 상태</div>

      {/* Chrome 브라우저 보호 — status derived from a real GET_STATUS ping (see effect above) */}
      <div className="eg-card shield-state-row">
        <div className="shield-state-head">
          <span className="shield-state-name">Chrome 브라우저 보호</span>
          {chromeGuard.state === 'connected' ? (
            <span className="shield-state-chip shield-state-chip--on">연결됨</span>
          ) : chromeGuard.state === 'checking' ? (
            <span className="shield-state-chip shield-state-chip--exp">확인 중</span>
          ) : (
            <span className="shield-state-chip shield-state-chip--soon">연결 안 됨</span>
          )}
        </div>
        {chromeGuard.state === 'connected' ? (
          <>
            <p className="shield-state-desc">이 Chrome 브라우저에 확장이 연결됐어요.</p>
            {bundledOn ? (
              <p className="shield-state-desc">
                기본 보호가 켜져 있어요{listIsFixture ? ' (테스트 목록)' : ''} · 차단 규칙{' '}
                {appliedCount}개 적용됨{allowlistCount > 0 ? ` · 허용 ${allowlistCount}개` : ''}.
              </p>
            ) : userBlockCount > 0 ? (
              <p className="shield-state-desc">
                내가 확인한 차단 규칙 {userBlockCount}개가 적용됐어요
                {allowlistCount > 0 ? ` · 허용 ${allowlistCount}개` : ''}.
              </p>
            ) : (
              <p className="shield-state-desc">
                아직 켜진 기본 보호가 없어요. 아래 ‘실제 차단 테스트’에서 기본 보호를 켤 수 있어요.
              </p>
            )}
            {bundledOn && listIsFixture ? (
              <p className="shield-state-desc text-quiet">
                지금 기본 보호 목록은 엔진 확인용 테스트 목록이라, 실제 성인 사이트를 막는다고는
                말하지 않아요.
              </p>
            ) : null}
            <button
              type="button"
              className="eg-secbtn"
              style={{ marginTop: 10 }}
              onClick={() => onNavigate('shieldExtension')}
            >
              기본 보호 설정 열기
            </button>
          </>
        ) : (
          <>
            <p className="shield-state-desc">
              실제 브라우저 차단은 Chrome 확장 프로그램을 따로 설치해야 동작해요. Chrome 확장을
              연결하면 이 브라우저에서 기본 보호와 내가 지정한 위험 신호를 막을 수 있어요.
            </p>
            <button
              type="button"
              className="eg-secbtn"
              style={{ marginTop: 10 }}
              onClick={() => onNavigate('shieldExtension')}
            >
              Chrome 확장 연결하기
            </button>
          </>
        )}
      </div>

      {/* 앱 안 잠깐 멈춤 — genuinely works right now, all on this device. It does NOT block sites;
          it slows my own urge. That is honestly 작동 중. */}
      <div className="eg-card shield-state-row">
        <div className="shield-state-head">
          <span className="shield-state-name">앱 안 잠깐 멈춤</span>
          <StateChip status="on" />
        </div>
        <p className="shield-state-desc">
          멀리 둘 위험 신호를 미리 적어두고, 충동이 올 때 잠깐 멈춤으로 흘려보내요. 모두 이 기기
          안에서 동작해요. 사이트를 막지는 않고, 내 충동을 한 번 더 늦춰줘요.
        </p>
      </div>

      <div className="eg-card shield-state-row">
        <div className="shield-state-head">
          <span className="shield-state-name">안전 브라우저 실험</span>
          <StateChip status="exp" />
        </div>
        <p className="shield-state-desc">
          앱 안에서만 동작하는 실험이에요. 실제 웹은 열지 않고, 내가 정한 위험 신호와 닿는지 비교해
          ‘잠깐 멈춤’으로 이어줘요.
        </p>
        <button
          type="button"
          className="eg-secbtn"
          style={{ marginTop: 10 }}
          onClick={() => onNavigate('shieldBrowser')}
        >
          안전 브라우저 실험 열기
        </button>
      </div>

      {/* 2) 내가 피하고 싶은 신호 — the non-enforcing planner (local only) */}
      <div className="eg-topbar" style={{ marginTop: 4 }}>
        <span className="eg-section-label">내가 피하고 싶은 신호</span>
        <span className="eg-shard-pill" style={{ marginLeft: 'auto' }}>{summary.total}개</span>
      </div>

      <div className="eg-card">
        {/* one consolidated honesty block — the banner leads, enforcement context follows */}
        <div className="shield-honesty-block">
          <p className="shield-honesty-lead">{PLANNING_BANNER}</p>
          <p className="eg-sub" style={{ marginTop: 4, lineHeight: 1.6 }}>
            {PLANNER_NOT_ENFORCED} {REAL_BLOCK_WHERE}
          </p>
        </div>

        <div className="shield-kind-row" role="group" aria-label="신호 종류 고르기">
          {BLOCK_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="shield-chip"
              data-selected={kind === k}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="eg-sub" style={{ marginTop: 8, lineHeight: 1.6 }}>{KIND_HELP[kind]}</p>

        <div className="shield-suggest-grid">
          {TEMPLATE_SUGGESTIONS[kind].map((s) => (
            <button key={s} type="button" className="shield-chip" onClick={() => setLabel(s)}>
              {s}
            </button>
          ))}
        </div>

        <p className="shield-safety-note">{SAFETY_NOTE}</p>
        <input
          type="text"
          className="shield-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="피하고 싶은 검색 신호나 상황을 적어요"
          maxLength={60}
        />

        {counters.length > 0 ? (
          <>
            <p className="eg-sub" style={{ marginTop: 10 }}>어떤 절제와 연결할까요? (선택)</p>
            <div className="shield-suggest-grid">
              {counters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="shield-chip"
                  data-selected={linkedCounterId === c.id}
                  aria-pressed={linkedCounterId === c.id}
                  onClick={() => setLinkedCounterId((cur) => (cur === c.id ? null : c.id))}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <button
          type="button"
          className="eg-cta"
          style={{ marginTop: 12 }}
          disabled={!ready}
          aria-disabled={!ready}
          onClick={submit}
        >
          신호 더하기
        </button>
      </div>

      {/* defined signals list */}
      <div className="eg-card">
        <span className="eg-section-label">정해둔 신호</span>
        {blocklist.length === 0 ? (
          <p className="eg-sub" style={{ marginTop: 8, lineHeight: 1.6 }}>
            아직 정해둔 신호가 없어요. 위에서 멀리 둘 신호를 하나씩 더해 보세요.
          </p>
        ) : (
          <div className="shield-groups">
            {visibleGroups.map((g) => (
              <div className="shield-group" key={g.id}>
                <span className="shield-group-name">{g.name}</span>
                <ul className="shield-entry-list">
                  {g.entries.map((e) => (
                    <li className="shield-entry-row" key={e.id}>
                      <span className="shield-kind-tag">{KIND_LABEL[e.kind]}</span>
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
        <p className="eg-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
          이 신호는 실드가 준비되면 그대로 옮겨와 쓸 거예요.
        </p>
      </div>

      {/* 3) 잠깐 멈춤 — the prominent recovery action */}
      <div className="eg-section-label" style={{ marginTop: 4 }}>잠깐 멈춤</div>
      <div className="eg-card">
        <p className="shield-state-desc" style={{ marginTop: 0 }}>
          차단이 아직 없어도, 충동을 흘려보내는 잠깐 멈춤은 지금도 쓸 수 있어요.
        </p>
        <button
          type="button"
          className="eg-cta"
          style={{ marginTop: 12 }}
          onClick={() => onNavigate('urge')}
        >
          못 참을 것 같아요 · 잠깐 멈춤
        </button>
        <button
          type="button"
          className="eg-secbtn"
          style={{ marginTop: 9 }}
          onClick={() => onNavigate('checkin')}
        >
          오늘 기록으로 남기기
        </button>
      </div>

      {/* 4) 앞으로 연결될 보호 방식 — roadmap INFO (no controls) */}
      <div className="eg-section-label" style={{ marginTop: 4 }}>앞으로 연결될 보호 방식</div>
      <div className="eg-card">
        <p className="eg-sub" style={{ marginTop: 0, lineHeight: 1.6 }}>
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
      </div>

      {/* 5) 고급 보호 — genuinely not built yet; each honestly 준비 중, never faked */}
      <div className="eg-section-label" style={{ marginTop: 4 }}>고급 보호</div>
      <div className="eg-card">
        <p className="shield-state-desc" style={{ marginTop: 0 }}>
          {NO_BLOCK_YET} 이 기기 전체나 다른 앱을 막지는 않아요.
        </p>
        <ul className="shield-advanced-list" role="list">
          {ADVANCED.map((a) => (
            <li className="shield-advanced-item" key={a}>
              <span className="shield-advanced-name">{a}</span>
              <StateChip status="soon" />
            </li>
          ))}
        </ul>
        <p className="eg-sub" style={{ marginTop: 10, lineHeight: 1.6 }}>
          SNS 이미지를 흐리게 가리는 방법은 아직 연구 단계예요. 잘 되는 척하지 않고, 확실해질 때
          추가할게요.
        </p>
      </div>

      <p className="eg-sub" style={{ lineHeight: 1.6 }}>
        실드는 기기 안에서만 동작하도록 설계해요. 무엇을 봤는지 서버로 보내지 않아요.
      </p>

      <button type="button" className="eg-secbtn" onClick={() => onNavigate('home')}>
        홈으로 돌아가기
      </button>
    </div>
  );
}
