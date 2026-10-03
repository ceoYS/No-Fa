import { useEffect, useState } from 'react';
import {
  getShouts,
  postShout,
  getInspiration,
  getProfile,
  isSocialConfigured,
} from '../lib/socialClient.js';
import { moderateText, rateLimitPost } from '../lib/moderation.js';
import { SHOUT_MAX_LEN } from '../constants/social.js';

/*
 * CommunityHub — the 커뮤니티 destination (founder §6), hosting three tabs over the ONE social model:
 *   리그  — the weekly league (practice league today; real network league 준비 중)
 *   광장  — a short "확성기" shout stream (short text, anonymous, no DMs/links/images)
 *   영감  — opt-in Future-Diary public cards (the user's own local copies)
 *
 * It lives inside the 내 방 (PetRewardScreen) internal router, so no App.jsx change is needed. Every
 * network surface is honest: with no backend configured (SOCIAL_BACKEND_DECISION_REQUIRED), the
 * stream/feed/leaderboard are EMPTY with a "not connected yet" state — no fabricated users, posts,
 * rankings, or shares. Home is not overloaded; this is reached from the kitten hub.
 */

const TABS = [
  { id: 'league', label: '리그' },
  { id: 'plaza', label: '광장' },
  { id: 'inspiration', label: '영감' },
];

export default function CommunityHub({ league, share, onBack, onOpenLeague, initialTab = 'league' }) {
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : 'league');
  return (
    <div className="v2-screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">함께 걷는 사람들</p>
          <h1 className="screen-title">커뮤니티</h1>
          <button type="button" className="eg-room-back" onClick={onBack}>← 내 고양이</button>
        </div>
      </header>

      <div className="shop-tabs" role="tablist" aria-label="커뮤니티 탭">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="shop-tab"
            data-selected={tab === t.id}
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'league' ? <LeagueTab league={league} onOpenLeague={onOpenLeague} /> : null}
      {tab === 'plaza' ? <ShoutPlaza /> : null}
      {tab === 'inspiration' ? <InspirationFeed share={share} /> : null}
    </div>
  );
}

// 리그 — compact summary of the deterministic PRACTICE league, honest that a real network league is
// not connected yet. The full weekly-league detail stays its own view (onLadder → league ladder).
function LeagueTab({ league, onOpenLeague }) {
  const tierName = league?.tier?.name ?? '불씨';
  const myRank = league?.myRank ?? 1;
  const toPromote = league?.toPromote ?? 0;
  const promoteRank = league?.promoteRank ?? 5;
  return (
    <>
      <section className="card">
        <div className="card-row">
          <span className="card-label">이번 주 {tierName} 리그</span>
          <span className="pill pill-ember" style={{ fontSize: 'var(--fs-small)' }}>연습 리그</span>
        </div>
        <p className="hairline-note">지금 내 순위는 {myRank}위예요.</p>
        <p className="hairline-note">
          {toPromote > 0 ? `승급권(${promoteRank}위)까지 ${toPromote} 남았어요.` : '승급권 안에 있어요.'}
        </p>
        <p className="hairline-note text-quiet">
          지금 주변 순위는 예시로 채운 연습 리그예요. 실제 참가자와 겨루는 네트워크 리그는 아직 연결되지 않았어요.
        </p>
        {onOpenLeague ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={onOpenLeague} style={{ marginTop: 'var(--sp-2)' }}>
            주간 리그 자세히 보기
          </button>
        ) : null}
      </section>
      <section className="card">
        <span className="card-label">실제 네트워크 리그</span>
        <p className="hairline-note text-quiet">
          {isSocialConfigured()
            ? '네트워크 리그를 불러오는 중이에요.'
            : '실제 사람들과 겨루는 네트워크 리그는 아직 연결되지 않았어요. 연결되면 여기에 실제 순위가 표시돼요.'}
        </p>
      </section>
    </>
  );
}

// 광장 — short shout stream. Compose is ≤100 chars, no links/DMs/images. Without a backend, posting
// honestly cannot happen and the stream is empty — never a fabricated live post.
function ShoutPlaza() {
  const [profile] = useState(() => getProfile());
  const [messages, setMessages] = useState(null); // null = loading
  const [configured, setConfigured] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [lastPostAt, setLastPostAt] = useState(NaN);

  useEffect(() => {
    let alive = true;
    getShouts().then((res) => {
      if (!alive) return;
      setConfigured(!!res.configured);
      setMessages(Array.isArray(res.messages) ? res.messages : []);
    });
    return () => {
      alive = false;
    };
  }, []);

  const send = async () => {
    const rl = rateLimitPost(lastPostAt);
    if (!rl.ok) {
      setMsg('조금 뒤에 다시 올려요. 잠깐 사이를 두는 게 좋아요.');
      return;
    }
    const mod = moderateText(text);
    if (!mod.allowed) {
      setMsg(
        mod.reasons.includes('link_not_allowed') || mod.reasons.includes('contact_info')
          ? '링크나 연락처는 올릴 수 없어요. 짧은 응원 한마디만 남겨요.'
          : mod.reasons.includes('too_long')
            ? `${SHOUT_MAX_LEN}자까지 쓸 수 있어요.`
            : '한마디를 적어요.',
      );
      return;
    }
    const res = await postShout(profile, text);
    if (res && res.ok) {
      setText('');
      setMsg('');
      setLastPostAt(Date.now());
    } else {
      setLastPostAt(Date.now());
      setMsg('광장은 아직 연결되지 않았어요. 실제 커뮤니티가 연결되면 이 한마디가 올라가요.');
    }
  };

  return (
    <>
      <section className="card">
        <div className="card-row">
          <span className="card-label">한마디 남기기</span>
          <span className="future-diary-count">{text.length}/{SHOUT_MAX_LEN}</span>
        </div>
        <p className="hairline-note text-quiet">짧은 응원만요. 링크·연락처·사진은 올릴 수 없어요.</p>
        <input
          type="text"
          className="sheet-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, SHOUT_MAX_LEN))}
          placeholder="오늘 하루, 짧은 응원 한마디"
          maxLength={SHOUT_MAX_LEN}
        />
        <button type="button" className="btn btn-primary btn-block" onClick={send} style={{ marginTop: 'var(--sp-2)' }}>
          한마디 올리기
        </button>
        {msg ? <p className="hairline-note text-quiet" aria-live="polite">{msg}</p> : null}
        <p className="hairline-note text-quiet">익명으로 남겨져요 · 개인 메시지(DM)는 없어요.</p>
      </section>

      <section className="card">
        <span className="card-label">지금 광장</span>
        {messages === null ? (
          <p className="hairline-note text-quiet">불러오는 중이에요…</p>
        ) : messages.length === 0 ? (
          <p className="hairline-note text-quiet">
            {configured
              ? '아직 올라온 한마디가 없어요. 첫 한마디를 남겨 보세요.'
              : '아직 실제 커뮤니티가 연결되지 않았어요. 연결되면 다른 사람들의 한마디가 여기에 흘러가요.'}
          </p>
        ) : (
          <ul className="shield-entry-list">
            {messages.map((m) => (
              <li className="shield-entry-row" key={m.id}>
                <span className="shield-entry-label">
                  <strong style={{ color: 'var(--eg-text-2)' }}>{m.displayAlias}</strong> · {m.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// 영감 — the user's OWN opt-in public diary copies (local, real), plus the honest state of the
// network inspiration feed (not connected yet). Deleting a public copy here never touches the
// private diary (separate store).
function InspirationFeed({ share }) {
  const shares = share?.shares ?? [];
  const [netConfigured, setNetConfigured] = useState(false);

  useEffect(() => {
    let alive = true;
    getInspiration().then((res) => {
      if (alive) setNetConfigured(!!res.configured);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <section className="card">
        <span className="card-label">내가 공유한 미래 장면</span>
        {shares.length === 0 ? (
          <p className="hairline-note text-quiet">
            아직 공유한 미래 장면이 없어요. 미래일기에서 ‘익명으로 영감에 공유’를 고르면 여기에 공개본이 생겨요.
          </p>
        ) : (
          <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
            {shares.map((s) => (
              <article className="card future-diary-entry" key={s.id}>
                <div className="card-row">
                  <span className="card-label">{s.displayAlias}</span>
                  <span className="pill" style={{ fontSize: 'var(--fs-micro)' }}>
                    {s.published ? '공개됨' : '공개 대기'}
                  </span>
                </div>
                {[['되고 싶은 미래의 나', s.futureSelf], ['미래의 어느 하루', s.idealDay], ['감정 · 관계 · 환경', s.feelingsEnvironment]].map(
                  ([label, val]) => (val ? (
                    <div className="future-diary-entry-block" key={label}>
                      <h3>{label}</h3>
                      <p>{val}</p>
                    </div>
                  ) : null),
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => share?.removeShare(s.id)}
                  style={{ marginTop: 'var(--sp-2)' }}
                >
                  공개본 지우기
                </button>
              </article>
            ))}
            <p className="hairline-note text-quiet">
              공개본을 지워도 내 미래일기 원본은 그대로 있어요. 둘은 따로 저장돼요.
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <span className="card-label">영감 피드</span>
        <p className="hairline-note text-quiet">
          {netConfigured
            ? '영감 피드를 불러오는 중이에요.'
            : '다른 사람들의 익명 미래 장면을 보는 영감 피드는 아직 연결되지 않았어요. 연결되면 여기에 흘러가요.'}
        </p>
      </section>
    </>
  );
}
