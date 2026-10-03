/*
 * GrowthRoadmap — EG-06 성장 로드맵. The five growth forms as a vertical timeline, each
 * marked 완료 / 현재 / (next) N XP 남음 / 잠김 from the real Personal XP. Future forms show a
 * white silhouette WITH the name revealed (design rule: silhouette + name, never a "?").
 * Bottom rail: 다음 성장까지 N XP + today's record state. Ported from the frozen design.
 */
import { catSprite } from '../constants/companionAssets.js';
import { EVOLUTION_STAGES } from '../constants/progression.js';

export default function GrowthRoadmap({
  xp = 0,
  form,
  progress = { total: 0, target: 1, remaining: 0, maxed: false },
  recordedToday = false,
  onBack,
  onRecord,
}) {
  const curMin = form?.minXp ?? 0;
  return (
    <div className="v2-screen eg-roadmap">
      <div className="eg-topbar">
        <button type="button" className="eg-back" onClick={() => onBack?.()} aria-label="뒤로">←</button>
        <b style={{ fontSize: 17 }}>성장 로드맵</b>
      </div>

      <div className="eg-timeline">
        {EVOLUTION_STAGES.map((s) => {
          const done = s.minXp < curMin;
          const current = s.minXp === curMin;
          const isNext = !current && s.minXp > curMin && s.minXp === progress.target && !progress.maxed;
          const future = !done && !current; // next + locked both render as silhouette
          let state;
          if (current) state = progress.maxed ? '현재 · 최고 단계' : `현재 · ${progress.total}/${progress.target}`;
          else if (done) state = '완료';
          else if (isNext) state = `${progress.remaining} XP 남음`;
          else state = '잠김';
          return (
            <div className="eg-tl-row" data-state={current ? 'current' : done ? 'done' : 'future'} key={s.id}>
              <div className="eg-tl-thumb">
                <img
                  className={future ? 'eg-tl-img eg-tl-img--future' : 'eg-tl-img'}
                  src={catSprite(s.asset) ?? catSprite('idle')}
                  alt={s.name}
                />
              </div>
              <div className="eg-tl-main">
                <div className="eg-tl-head">
                  <span className="eg-tl-lv">Lv.{s.level}</span>
                  <b className="eg-tl-name">{s.name}</b>
                  <span className="eg-tl-state">{state}</span>
                </div>
                <div className="eg-tl-note">해금: {s.unlock}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="eg-roadmap-rail">
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 12.5, color: 'var(--eg-ember-light)' }}>
            {progress.maxed ? '최고 성장 단계에 도달했어요' : `다음 성장까지 ${progress.remaining} XP`}
          </b>
          <div className="eg-sub" style={{ marginTop: 2 }}>
            {recordedToday ? '오늘 몫은 이미 채웠어요' : '오늘 기록을 남기면 한 뼘 더 자라요'}
          </div>
        </div>
        {recordedToday ? (
          <span className="eg-roadmap-done">오늘 기록 완료 ✓</span>
        ) : (
          <button type="button" className="eg-roadmap-cta" onClick={() => onRecord?.()}>오늘 기록</button>
        )}
      </div>
    </div>
  );
}
