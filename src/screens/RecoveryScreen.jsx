import { useState } from 'react';
import { resolveRoomSceneAsset } from '../constants/petAssets.js';

const RECOVERY_SCENE_SRC = resolveRoomSceneAsset();

/*
 * Reflection diary (PRD §0.6.6) — repurposed from the old recovery screen.
 * Same form, two weights:
 *   - relapse (scope='relapse'): the timer was already reset (§0.6.3); reflection
 *     is *required* before moving on.
 *   - rule slip (scope='slip'): the timer is untouched; reflection is light and
 *     optional.
 * Three prompts, low friction: 왜 그랬을까요? → 무엇이 계기였어요? (trigger tags +
 * free text) → 다음엔 어떻게 해볼까요? Writing the last one earns 다음 행동 작성 완료.
 * Non-judgemental framing; no 실패/위반 wording (§0.5.8.1).
 */
export default function RecoveryScreen({
  onNavigate,
  rules = [],
  categories = [],
  reflectionCtx = null,
  onCompleteReflection,
}) {
  const scope = reflectionCtx?.scope ?? 'slip';
  const isRelapse = scope === 'relapse';
  const ruleId = reflectionCtx?.ruleId ?? null;
  const targetRule = rules.find((r) => r.id === ruleId) ?? null;

  const [why, setWhy] = useState('');
  const [triggers, setTriggers] = useState([]);
  const [nextAction, setNextAction] = useState('');

  const toggleTrigger = (tag) =>
    setTriggers((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]));

  const canFinish = !isRelapse || why.trim().length > 0;

  const finish = () => {
    if (!canFinish) return;
    if (onCompleteReflection) onCompleteReflection({ why, triggers, nextAction });
    else onNavigate('reward');
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">
            {isRelapse ? '다시 시작했어요' : '가볍게 돌아봐요'}
          </p>
          <h1 className="screen-title">
            {isRelapse ? '무너졌어도 끝난 건 아니에요' : '오늘을 한 번 복기해요'}
          </h1>
        </div>
        <span className="pill pill-moss">복기</span>
      </header>

      {RECOVERY_SCENE_SRC ? (
        <figure className="recovery-scene-card">
          <img
            className="recovery-scene-img"
            src={RECOVERY_SCENE_SRC}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <figcaption>{isRelapse ? '오늘을 한 번 복기해요' : '가볍게 돌아봐요'}</figcaption>
        </figure>
      ) : (
        <section className="card recovery-scene-card recovery-scene-card--text">
          <span className="card-label">가볍게 돌아봐요</span>
          <p className="hairline-note">오늘을 한 번 복기해요.</p>
        </section>
      )}

      <p className="screen-subtitle">
        {isRelapse
          ? '기록은 우리가 걸어온 노력의 나이테예요. 무엇이 계기였는지 한 번만 돌아보면 다음이 쉬워져요.'
          : '못 지킨 날도 기록이에요. 짧게 돌아보면 다음이 한결 가벼워져요. 길게 쓰지 않아도 돼요.'}
      </p>

      {targetRule ? (
        <section className="card">
          <span className="card-label">복기할 규율</span>
          <p className="discipline-summary">“{targetRule.label}”</p>
        </section>
      ) : null}

      <section className="card">
        <span className="card-label">왜 그랬을까요?</span>
        <textarea
          className="sheet-input reflect-input"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="떠오르는 대로 한두 줄이면 충분해요."
          maxLength={200}
          rows={2}
        />
      </section>

      <section className="card">
        <span className="card-label">무엇이 계기였어요?</span>
        <div className="sheet-chip-grid">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-selected={triggers.includes(c)}
              onClick={() => toggleTrigger(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="hairline-note">해당하는 계기를 골라요. 여러 개 골라도 돼요.</p>
      </section>

      <section className="card">
        <span className="card-label">다음엔 어떻게 해볼까요?</span>
        <textarea
          className="sheet-input reflect-input"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="예: 밤 11시에 멈춤 알림 켜기"
          maxLength={200}
          rows={2}
        />
        <p className="hairline-note">적어두면 “다음 행동 작성 완료”가 기록돼요. 선택이에요.</p>
      </section>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!canFinish}
        style={canFinish ? undefined : { opacity: 0.45, pointerEvents: 'none' }}
        onClick={finish}
      >
        {isRelapse ? '복기 마치고 다시 이어가기' : '복기 마치기'}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={() => onNavigate('home')}
      >
        {isRelapse ? '조금 이따 할게요' : '나중에 할게요'}
      </button>
    </div>
  );
}
