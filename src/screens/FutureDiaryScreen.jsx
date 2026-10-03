import { useState } from 'react';
import { useFutureDiaryShare } from '../hooks/useFutureDiaryShare.js';
import { useImageUsage } from '../hooks/useImageUsage.js';
import { generate as generateFutureImage } from '../lib/futureImageProvider.js';

const MAX_LENGTH = 500;

const PROMPTS = [
  {
    id: 'futureSelf',
    label: '되고 싶은 미래의 나',
    guide: '어떤 사람으로 살아가고 있는지, 원하는 습관과 태도를 구체적으로 적어보세요.',
    placeholder: '나는 내가 원하는 선택을 자연스럽게 이어가는 사람이다. 매일 아침에는…',
  },
  {
    id: 'idealDay',
    label: '미래의 어느 하루',
    guide: '그날의 아침부터 밤까지 어디서, 누구와, 무엇을 하는지 장면처럼 그려보세요.',
    placeholder: '아침에 눈을 뜬 곳은… 함께하는 사람은… 오늘 가장 기대되는 일은…',
  },
  {
    id: 'feelingsEnvironment',
    label: '감정 · 관계 · 환경',
    guide: '그 삶에서 느끼는 감정, 곁의 관계, 머무는 공간을 가능한 한 선명하게 적어보세요.',
    placeholder: '나는 하루 동안…을 느낀다. 내 곁에는… 내가 머무는 공간은…',
  },
];

const EMPTY_DRAFT = Object.freeze({ futureSelf: '', idealDay: '', feelingsEnvironment: '' });

function formatSavedAt(ms) {
  if (!Number.isFinite(ms)) return '저장한 미래';
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(ms);
}

/*
 * FutureDiaryScreen — a future-visualization journal, separate from 오늘 기록. Entries are handed to
 * App's dedicated futureDiaryEntries slice and never enter todayRecord/checkinLedger.
 *
 * P2 — opt-in anonymous sharing. The private entry stays PRIVATE BY DEFAULT: nothing is shared unless
 * the user explicitly chooses 익명으로 영감에 공유. Sharing builds a SEPARATE public copy (scrubbed by
 * whitelist — only the three prose fields; no counter name, streak, id, or timestamp) via
 * useFutureDiaryShare, which the user previews and can edit before it is created. The private record
 * is never touched, and deleting a public copy never deletes the private one. With no social backend
 * yet, the public copy stays a LOCAL draft (nothing leaves the device) — stated honestly.
 *
 * P3 — a "미래의 한 장면 보기" image seam sits in the share preview. No image provider is configured,
 * so it shows an honest not-connected message (never a fabricated image) and a REAL usage meter that
 * caps generation. It still never routes into 오늘 기록 and claims no reward.
 */
export default function FutureDiaryScreen({
  futureDiaryEntries = [],
  onSaveFutureDiary,
  onNavigate,
}) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [writing, setWriting] = useState(() => futureDiaryEntries.length === 0);
  const [justSaved, setJustSaved] = useState(false);
  const canSave = Object.values(draft).some((value) => value.trim().length > 0);

  // P2 share state. shareFor = the entry being shared (private, read-only source); shareDraft = the
  // editable public copy the user trims before publishing. shareResult = the honest outcome line.
  const shareHook = useFutureDiaryShare();
  const [shareFor, setShareFor] = useState(null);
  const [shareDraft, setShareDraft] = useState(EMPTY_DRAFT);
  const [shareResult, setShareResult] = useState('');

  // P3 image state (in the share preview).
  const imageUsage = useImageUsage();
  const [imgState, setImgState] = useState('idle'); // 'idle' | 'generating' | 'not_configured' | 'blocked' | 'failed'
  const [imgMsg, setImgMsg] = useState('');

  const updateDraft = (id, value) => {
    setDraft((prev) => ({ ...prev, [id]: value.slice(0, MAX_LENGTH) }));
  };

  const save = () => {
    if (!canSave) return;
    onSaveFutureDiary?.(draft);
    setDraft(EMPTY_DRAFT);
    setJustSaved(true);
    setWriting(false);
  };

  const startWriting = () => {
    setJustSaved(false);
    setWriting(true);
  };

  // Open the share preview for an entry (opt-in only). Seeds the editable copy from the entry's prose.
  const openShare = (entry) => {
    if (!entry) return;
    setShareFor(entry);
    setShareDraft({
      futureSelf: entry.futureSelf ?? '',
      idealDay: entry.idealDay ?? '',
      feelingsEnvironment: entry.feelingsEnvironment ?? '',
    });
    setShareResult('');
    setImgState('idle');
    setImgMsg('');
    setJustSaved(false);
  };

  const cancelShare = () => {
    setShareFor(null);
    setShareResult('');
  };

  const updateShareDraft = (id, value) => {
    setShareDraft((prev) => ({ ...prev, [id]: value.slice(0, MAX_LENGTH) }));
  };

  const confirmShare = async () => {
    const { backend } = await shareHook.shareEntry(shareFor, shareDraft);
    // Honest outcome: with no backend the copy stays a local draft. Never claim it was published.
    if (backend && backend.ok) {
      setShareResult('익명 공개본을 영감에 올렸어요.');
    } else {
      setShareResult(
        '익명 공개본이 이 기기에 저장됐어요. 커뮤니티(영감)가 아직 연결되지 않아 지금은 올라가지 않아요. 연결되면 이 공개본만 올라가요. 내 미래일기 원본은 그대로예요.',
      );
    }
  };

  // P3 — "미래의 한 장면 보기". Enforce the REAL usage cap BEFORE calling the provider, so a paid API
  // can never be hit beyond the free trial. No provider is configured, so this shows an honest
  // not-connected state and never a fabricated image; a not-configured attempt does not spend a trial.
  const generateImage = async () => {
    if (!imageUsage.canGenerate(false)) {
      setImgState('blocked');
      setImgMsg('무료 미래 이미지 체험을 모두 사용했어요.');
      return;
    }
    setImgState('generating');
    setImgMsg('');
    const diaryText = [shareDraft.futureSelf, shareDraft.idealDay, shareDraft.feelingsEnvironment]
      .filter(Boolean)
      .join('\n');
    const res = await generateFutureImage({ diaryText });
    if (res.state === 'ready' && res.imageUrl) {
      imageUsage.recordGeneration(false); // spend a trial only on a REAL image
      setImgState('ready');
    } else if (res.state === 'not_configured') {
      setImgState('not_configured');
      setImgMsg('미래 이미지 생성은 아직 연결되지 않았어요.');
    } else {
      setImgState('failed');
      setImgMsg('지금은 미래 이미지를 만들 수 없어요.');
    }
  };

  const shareCanSave = Object.values(shareDraft).some((v) => v.trim().length > 0);

  return (
    <div className="v2-screen eg-form future-diary-screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">미래에 도착한 것처럼 써봐요</p>
          <h1 className="screen-title">미래일기</h1>
        </div>
        <span className="pill pill-ember">나의 비전</span>
      </header>

      <section className="future-diary-intro" aria-labelledby="future-diary-intro-title">
        <span className="future-diary-eyebrow">상상할수록 선명해지는 삶</span>
        <h2 id="future-diary-intro-title">원하는 미래의 나를 한 장면씩 그려요</h2>
        <p>
          이미 그 삶을 살고 있는 나를 떠올려 보세요. 모습, 하루, 관계, 감정, 습관, 환경을 구체적으로
          적을수록 내가 향하고 싶은 방향이 또렷해져요.
        </p>
      </section>

      {writing ? (
        <div className="future-diary-form">
          {PROMPTS.map((prompt) => (
            <section className="card future-diary-prompt" key={prompt.id}>
              <div className="card-row">
                <label className="card-label" htmlFor={`future-${prompt.id}`}>{prompt.label}</label>
                <span className="future-diary-count">{draft[prompt.id].length}/{MAX_LENGTH}</span>
              </div>
              <p className="hairline-note">{prompt.guide}</p>
              <textarea
                id={`future-${prompt.id}`}
                className="sheet-input future-diary-input"
                value={draft[prompt.id]}
                onChange={(event) => updateDraft(prompt.id, event.target.value)}
                placeholder={prompt.placeholder}
                maxLength={MAX_LENGTH}
                rows={4}
              />
            </section>
          ))}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={!canSave}
            onClick={save}
          >
            미래의 나로 저장하기
          </button>
          <p className="hairline-note text-quiet future-diary-local-note">
            미래일기는 일반 기록과 섞이지 않고 이 기기에만 따로 저장돼요.
          </p>
          <p className="hairline-note text-quiet future-diary-local-note">
            공유는 저장한 뒤에, 내가 직접 고를 때만 익명 공개본으로 따로 만들어져요.
          </p>
        </div>
      ) : shareFor ? (
        /* P2 — opt-in share preview/editor. This is a SEPARATE public copy: only the three prose
           fields, editable before publishing. It never carries a counter name, streak, id, or
           timestamp (scrubbed by whitelist in useFutureDiaryShare). */
        <div className="future-diary-share">
          <section className="card">
            <div className="card-row">
              <span className="card-label">익명으로 영감에 공유</span>
              <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>공개본 미리보기</span>
            </div>
            <p className="hairline-note">
              올리기 전에 공개본을 다듬을 수 있어요. 이름·기간·날짜 같은 개인 정보는 담기지 않아요.
            </p>
            {PROMPTS.map((prompt) => (
              <div className="future-diary-prompt" key={prompt.id} style={{ marginTop: 'var(--sp-3)' }}>
                <div className="card-row">
                  <label className="card-label" htmlFor={`share-${prompt.id}`}>{prompt.label}</label>
                  <span className="future-diary-count">{shareDraft[prompt.id].length}/{MAX_LENGTH}</span>
                </div>
                <textarea
                  id={`share-${prompt.id}`}
                  className="sheet-input future-diary-input"
                  value={shareDraft[prompt.id]}
                  onChange={(event) => updateShareDraft(prompt.id, event.target.value)}
                  placeholder="공개할 내용만 남겨요"
                  maxLength={MAX_LENGTH}
                  rows={3}
                />
              </div>
            ))}
          </section>

          {/* P3 — 미래의 한 장면 보기. Honest not-connected state + a real usage meter that caps it. */}
          <section className="card">
            <div className="card-row">
              <span className="card-label">미래의 한 장면 보기</span>
              <span className="pill" style={{ fontSize: 'var(--fs-micro)' }}>
                무료 체험 {imageUsage.remaining(false)}/{imageUsage.freeLimit}회
              </span>
            </div>
            <p className="hairline-note text-quiet">내 미래일기로 한 장면을 그려, 공개본에 함께 담을 수 있어요.</p>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={generateImage}
              disabled={imgState === 'generating'}
            >
              {imgState === 'generating' ? '그리는 중이에요…' : '미래의 한 장면 보기'}
            </button>
            {imgState === 'not_configured' ? (
              <p className="hairline-note text-quiet" aria-live="polite">미래 이미지 생성은 아직 연결되지 않았어요.</p>
            ) : imgMsg ? (
              <p className="hairline-note text-quiet" aria-live="polite">{imgMsg}</p>
            ) : null}
          </section>

          {shareResult ? (
            <section className="card future-diary-entry">
              <p className="hairline-note" aria-live="polite">{shareResult}</p>
              <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
                <button type="button" className="btn btn-primary btn-block" onClick={() => onNavigate?.('reward')}>
                  내 방 커뮤니티에서 보기
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={cancelShare}>
                  닫기
                </button>
              </div>
            </section>
          ) : (
            <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={!shareCanSave}
                onClick={confirmShare}
              >
                익명 공개본 만들기
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={cancelShare}>
                취소하고 나만 보기
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="future-diary-entries">
          {justSaved ? (
            <section className="card future-diary-entry">
              <div className="card-row">
                <span className="card-label">미래 장면을 저장했어요</span>
                <span className="pill pill-moss" style={{ fontSize: 'var(--fs-small)' }}>완료</span>
              </div>
              <p className="hairline-note">
                아래에 그대로 남아 있어요. 나만 볼 수도, 익명으로 영감에 나눌 수도 있어요.
              </p>
              <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => setJustSaved(false)}
                >
                  나만 보기
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => openShare(futureDiaryEntries[0])}
                  disabled={!futureDiaryEntries[0]}
                >
                  익명으로 영감에 공유
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => onNavigate?.('reward')}
                >
                  내 방에서 보기
                </button>
                <button type="button" className="btn btn-ghost btn-block" onClick={startWriting}>
                  미래 장면 더 쓰기
                </button>
              </div>
            </section>
          ) : null}

          <div className="card-row future-diary-saved-heading">
            <div>
              <span className="card-label">내가 그린 미래</span>
              <p className="hairline-note">오늘의 회고가 아닌, 내가 향하고 싶은 삶의 장면이에요.</p>
            </div>
            <span className="pill pill-moss">{futureDiaryEntries.length}편</span>
          </div>

          {futureDiaryEntries.map((entry) => (
            <article className="card future-diary-entry" key={entry.id}>
              <time
                className="future-diary-date"
                dateTime={Number.isFinite(entry.createdAt) ? new Date(entry.createdAt).toISOString() : undefined}
              >
                {formatSavedAt(entry.createdAt)}
              </time>
              {PROMPTS.map((prompt) => entry[prompt.id] ? (
                <div className="future-diary-entry-block" key={prompt.id}>
                  <h3>{prompt.label}</h3>
                  <p>{entry[prompt.id]}</p>
                </div>
              ) : null)}
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => openShare(entry)}
                style={{ marginTop: 'var(--sp-2)' }}
              >
                {shareHook.isShared(entry.id) ? '공개본 다시 만들기' : '익명으로 영감에 공유'}
              </button>
            </article>
          ))}

          {justSaved ? null : (
            <button type="button" className="btn btn-primary btn-block" onClick={startWriting}>
              미래 장면 더 쓰기
            </button>
          )}
          <p className="hairline-note text-quiet future-diary-local-note">
            이 미래일기는 일반 기록과 분리되어 이 기기에만 저장돼요. 공유는 내가 고른 장면만 익명 공개본으로 따로 만들어져요.
          </p>
        </div>
      )}
    </div>
  );
}
