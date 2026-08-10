import { useState } from 'react';

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
 * FutureDiaryScreen — a future-visualization journal, separate from 오늘 기록.
 * Entries are handed to App's dedicated futureDiaryEntries slice and never enter
 * todayRecord/checkinLedger. The writing prompts describe a desired future as a
 * concrete scene rather than asking for today's events or retrospective feelings.
 */
export default function FutureDiaryScreen({ futureDiaryEntries = [], onSaveFutureDiary }) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [writing, setWriting] = useState(() => futureDiaryEntries.length === 0);
  const canSave = Object.values(draft).some((value) => value.trim().length > 0);

  const updateDraft = (id, value) => {
    setDraft((prev) => ({ ...prev, [id]: value.slice(0, MAX_LENGTH) }));
  };

  const save = () => {
    if (!canSave) return;
    onSaveFutureDiary?.(draft);
    setDraft(EMPTY_DRAFT);
    setWriting(false);
  };

  return (
    <div className="screen future-diary-screen">
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
        </div>
      ) : (
        <div className="future-diary-entries">
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
            </article>
          ))}

          <button type="button" className="btn btn-primary btn-block" onClick={() => setWriting(true)}>
            미래 장면 더 쓰기
          </button>
          <p className="hairline-note text-quiet future-diary-local-note">
            이 미래일기는 일반 기록과 분리되어 이 기기에만 저장돼요.
          </p>
        </div>
      )}
    </div>
  );
}
