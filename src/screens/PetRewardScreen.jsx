import { useEffect, useRef, useState } from 'react';
import PetRoomEditor from '../components/PetRoomEditor.jsx';
import PetRoomDecorator from '../components/PetRoomDecorator.jsx';
import PetSceneViewer from '../components/PetSceneViewer.jsx';
import usePetSound from '../hooks/usePetSound.js';
import useDismissOnEscape from '../hooks/useDismissOnEscape.js';
import {
  isItemSpriteReady,
  resolveItemAsset,
  petStageArtReady,
  shouldUsePetSceneMode,
} from '../constants/petAssets.js';
import {
  RESOURCE,
  EARN,
  REWARD_DISCLAIMER,
  MILESTONES,
  milestoneReward,
  isMilestoneClaimable,
  nextLockedMilestone,
} from '../constants/rewards.js';
import {
  DECOR_ITEMS,
  ITEM_BY_ID,
  ROOM_THEMES,
  SHOP_CATEGORIES,
  catalogForCategory,
} from '../constants/roomItems.js';

/*
 * 고양이 방 — the cosmetic reward loop as a visual room editor (PRD §0.6.9).
 *
 * Asset-first: the room, cat and decor are approved art (or clean neutral pending
 * slots until art lands) — no emoji furniture, no SVG cat, no blob tokens. Owned
 * decor lives in the 보관함 sheet and is dragged onto the room; placements are
 * coordinates in App state. Unlocking happens in a separate 상점 sheet, grouped by
 * category. The single currency is the earned 잔불 조각 — nothing here is bought
 * with money, rolled at random, or recovers a streak (see the disclaimer).
 *
 * Scene mode keeps feedback honest: until transparent sprites are approved, the
 * room stays one finished image and interactions use text plus a subtle scene
 * glow instead of claiming visible cat/item motion.
 */
// R-8: room-state speech only while the scene is a static composite — no gaze,
// mood-reading, or approach lines that set up a motion/reaction expectation.
const TAP_MESSAGES = [
  '고양이 곁 잔불이 은은하게 빛나고 있어요.',
  '방이 당신의 하루를 조용히 담아두고 있어요.',
  '방이 조금 더 따뜻해졌어요.',
  '오늘의 절제를 조용히 기억했어요.',
];

// Honest hand-off copy (Goal E) — a calm delivery line, no feeding/sound claim.
const SCENE_FEED_MESSAGE = '간식을 고양이 곁에 놓아두었어요.';
const SCENE_REWARD_MESSAGE = '오늘의 절제를 조용히 기억했어요.';
const NO_SNACK_MESSAGE = '보유한 간식이 없어요. 오늘의 보상으로 다시 받을 수 있어요.';
// 쓰다듬기 (놀아주기) affection cue copy (RC-1). R-8-safe: a calm "spent a warm moment"
// line — never a gaze / motion / purr / approach claim (the cat stays a static composite).
const PET_MESSAGE = '고양이 곁에서 잠깐 따뜻한 시간을 보냈어요.';

// Character growth v1 — DERIVED warmth labels read from LOCAL records (today's
// check-in + the abstinence streak). This is a calm summary, NOT a pet evolution
// level and NOT a live reaction: the cat stays a static composite and nothing here
// animates or grows by itself. The card's disclosure line states this plainly.
const ROOM_WARMTH = {
  base: { label: '기본', tone: 'pill', note: '아직 오늘 기록 전이에요. 오늘 기록을 남기면 방이 조금 더 따뜻해져요.' },
  warmer: { label: '조금 따뜻해짐', tone: 'pill-ember', note: '오늘 기록을 남겨서 방이 조금 더 따뜻해졌어요.' },
  sustained: { label: '온기 유지 중', tone: 'pill-moss', note: '절제를 이어가고 오늘 기록도 남겨서 온기가 유지되고 있어요.' },
};

export default function PetRewardScreen({
  onNavigate,
  emberShards = 0,
  inventory = {},
  ownedItems = [],
  placements = [],
  activeRoomTheme = 'empty',
  petCareState = {},
  petFedToday = false,
  petPettedToday = false,
  streakDays = 0,
  todayRecord = null,
  claimedRewardIds = [],
  lastEarn = null,
  onClaimReward,
  onBuyItem,
  onPlaceItemAt,
  onMoveItem,
  onRemovePlacement,
  onChooseRoomTheme,
  onFeedSnack,
  onPetPet,
}) {
  const motionTimer = useRef(null);
  const sceneReactionTimer = useRef(null);
  const snackTossTimer = useRef(null);
  const affectionTossTimer = useRef(null);
  const tapCount = useRef(0);
  const [selectedId, setSelectedId] = useState(null);
  const [sheet, setSheet] = useState(null); // 'inventory' | 'shop' | null
  // 방 꾸미기 — explicit opt-in editing mode (RC-2B). Owned items are tapped or
  // dragged from a tray onto the room as honest framed cards; coordinates persist.
  const [placementMode, setPlacementMode] = useState(false);
  const [catMotion, setCatMotion] = useState('idle');
  const [tapMsg, setTapMsg] = useState(null);
  const [sceneReacting, setSceneReacting] = useState(false);
  // A small snack token that rises from the feed button toward the scene on a
  // successful feed. Purely a hand-off cue — never a consume or motion claim.
  const [snackToss, setSnackToss] = useState(false);
  // A warm affection cue that rises from the 쓰다듬기 button on a successful pet. Purely a
  // visible UI response to the user's action — never a claim the static cat moved/reacted.
  const [affectionToss, setAffectionToss] = useState(false);
  // Gesture-gated cat audio; silent fallback while the .mp3 files are pending.
  // hasSound stays false until a real file is probed present, so the 소리/무음
  // toggle is hidden rather than shown as a dead switch over silent audio.
  const { play: playSound, muted, toggleMuted, hasSound } = usePetSound();
  // Esc closes whichever sheet (보관함 / 상점) is open — keyboard dismiss parity.
  useDismissOnEscape(sheet !== null, () => setSheet(null));

  useEffect(() => () => {
    clearTimeout(motionTimer.current);
    clearTimeout(sceneReactionTimer.current);
    clearTimeout(snackTossTimer.current);
    clearTimeout(affectionTossTimer.current);
  }, []);

  // Fire the snack hand-off token, then clear it so it can replay on the next feed.
  const triggerSnackToss = (ms = 900) => {
    setSnackToss(true);
    clearTimeout(snackTossTimer.current);
    snackTossTimer.current = setTimeout(() => setSnackToss(false), ms);
  };

  // Fire the affection cue, then clear it so it can replay on the next 쓰다듬기.
  const triggerAffectionToss = (ms = 900) => {
    setAffectionToss(true);
    clearTimeout(affectionTossTimer.current);
    affectionTossTimer.current = setTimeout(() => setAffectionToss(false), ms);
  };

  // Briefly play a motion state, then settle back to idle. Fixed, never random.
  const triggerMotion = (state, ms = 1400) => {
    setCatMotion(state);
    clearTimeout(motionTimer.current);
    motionTimer.current = setTimeout(() => setCatMotion('idle'), ms);
  };

  const snackCount = inventory.snack ?? 0;
  // Cumulative (not day-scoped) hand-offs, read straight from persisted petCareState.
  const fedCount = petCareState.fedCount ?? 0;
  // Cumulative 쓰다듬기 count, read straight from persisted petCareState (RC-1).
  const pettedCount = petCareState.pettedCount ?? 0;
  const reachedMilestones = MILESTONES.filter((m) => streakDays >= m.day);
  const lockedNext = nextLockedMilestone(streakDays);

  // Character growth v1 — derive the room's warmth from LOCAL records only: today's
  // saved check-in (todayRecord.checkin) and the abstinence streak. Summary label
  // only; no live reaction, no auto-grow (see ROOM_WARMTH + the card disclosure).
  const checkinDoneToday = todayRecord?.checkin != null;
  const warmthLevel = !checkinDoneToday ? 'base' : streakDays > 0 ? 'sustained' : 'warmer';
  const warmth = ROOM_WARMTH[warmthLevel];
  // Next room state the user can honestly reach: the cheapest unowned theme, priced
  // in the same earned 잔불 조각 (no new currency, no random unlock).
  const nextRoom = ROOM_THEMES.filter((t) => t.cost > 0 && !ownedItems.includes(t.id)).sort(
    (a, b) => a.cost - b.cost,
  )[0];
  const nextRoomNote = !nextRoom
    ? '방 테마를 모두 열었어요.'
    : emberShards >= nextRoom.cost
      ? `다음 방 ‘${nextRoom.name}’으로 바꿀 수 있어요. 상점에서 데려와요.`
      : `다음 방 ‘${nextRoom.name}’까지 ${nextRoom.cost - emberShards}${RESOURCE.unit} 남았어요.`;
  const placedIds = new Set(placements.map((p) => p.itemId));
  const ownedDecor = DECOR_ITEMS.filter((it) => ownedItems.includes(it.id));
  const selectedItem = selectedId ? ITEM_BY_ID[selectedId] : null;
  const sceneMode = shouldUsePetSceneMode({ catState: catMotion });
  // While the room/cat art is pending the stage is a calm panel, not an editor.
  const stageReady = petStageArtReady({ theme: activeRoomTheme, catState: catMotion, sceneMode });
  // The selected-item bar only makes sense for an item that's actually visible.
  const canControlSelected = selectedItem && !sceneMode && isItemSpriteReady(selectedItem.assetId);
  const feedCardMessage =
    tapMsg === NO_SNACK_MESSAGE
      ? NO_SNACK_MESSAGE
      : petCareState.reaction ?? '간식을 주면 고양이 곁에 살며시 놓아둘 수 있어요.';

  const triggerSceneReaction = (ms = 1000) => {
    setSceneReacting(true);
    clearTimeout(sceneReactionTimer.current);
    sceneReactionTimer.current = setTimeout(() => setSceneReacting(false), ms);
  };

  const handleFeed = () => {
    if (snackCount <= 0) {
      setTapMsg(NO_SNACK_MESSAGE);
      return;
    }
    onFeedSnack?.();
    // Soft purr on a successful feed (gesture-triggered, silent if asset absent).
    playSound('purr');
    // Visual hand-off cue — a snack token rises toward the scene (a delivery, not
    // a feeding motion).
    triggerSnackToss();
    if (sceneMode) {
      setTapMsg(SCENE_FEED_MESSAGE);
      triggerSceneReaction();
      return;
    }
    triggerMotion('happy', 1600);
  };

  // 쓰다듬기 (놀아주기): record the affection (App stamps a day-scoped count) and answer
  // with a VISIBLE cue — the affection token rises + the scene warms — plus a calm,
  // R-8-safe line. No motion / purr / food claim; the static cat never reacts on its own.
  const handlePet = () => {
    onPetPet?.();
    playSound('purr'); // gesture-triggered, silent until a real audio file is wired
    triggerAffectionToss();
    setTapMsg(PET_MESSAGE);
    if (sceneMode) {
      triggerSceneReaction();
      return;
    }
    triggerMotion('happy', 1200);
  };

  const handleCatTap = () => {
    setTapMsg(TAP_MESSAGES[tapCount.current % TAP_MESSAGES.length]);
    tapCount.current += 1;
    // Soft meow on tap (gesture-triggered, silent if asset absent).
    playSound('meow');
    if (sceneMode) {
      triggerSceneReaction();
      return;
    }
    triggerMotion('tap', 700);
  };

  const handleClaim = (id) => {
    const milestone = MILESTONES.find((m) => m.id === id);
    // Only react when the claim is actually eligible — re-pressing an already
    // claimed or not-yet-reached reward must give no warm feedback and no grant.
    if (!isMilestoneClaimable(milestone, streakDays, claimedRewardIds)) return;
    onClaimReward?.(id);
    if (sceneMode) {
      setTapMsg(SCENE_REWARD_MESSAGE);
      triggerSceneReaction();
      return;
    }
    triggerMotion('happy', 1600);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <p className="screen-greeting">오늘의 절제가 만든 방</p>
          <h1 className="screen-title">고양이 방</h1>
        </div>
        <div className="room-header-side">
          {/* Only render the 소리/무음 toggle once real audio is confirmed present.
              While the .mp3s are uncommitted every play() is a silent no-op, so an
              operable sound switch would imply audio that does not exist — the same
              dead-switch the Shield screen deliberately removed. */}
          {hasSound ? (
            <button
              type="button"
              className="sound-toggle"
              onClick={toggleMuted}
              aria-pressed={muted}
              aria-label={muted ? '고양이 소리 켜기' : '고양이 소리 끄기'}
              title={muted ? '소리 꺼짐' : '소리 켜짐'}
            >
              {muted ? '무음' : '소리'}
            </button>
          ) : null}
          <span className="pill pill-ember">{RESOURCE.name} {emberShards}{RESOURCE.unit}</span>
        </div>
      </header>

      {/* C31 — reward landing save confirmation. Shown ONLY when today's check-in is
          actually saved (checkinDoneToday, derived from the persisted todayRecord.checkin),
          so it can never appear before a real save. It gives a short save acknowledgement
          and the two next-action routes (최근 기록 / 홈) — no growth / unlock / shop / cloud
          claim, and it does not change the room's cosmetic semantics. */}
      {checkinDoneToday ? (
        <section className="card reward-checkin-confirm">
          <div className="card-row">
            <span className="card-label">오늘 기록이 저장됐어요</span>
            <span className="pill pill-moss" style={{ fontSize: 'var(--fs-small)' }}>완료</span>
          </div>
          <p className="hairline-note">최근 기록에서 다시 볼 수 있어요.</p>
          <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onNavigate('calendar')}
            >
              최근 기록 보기
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => onNavigate('home')}
            >
              홈으로 가기
            </button>
          </div>
        </section>
      ) : null}

      {placementMode ? (
        <PetRoomDecorator
          editable
          theme={activeRoomTheme}
          placements={placements}
          ownedDecor={ownedDecor}
          reacting={sceneReacting}
          onPlace={onPlaceItemAt}
          onMove={onMoveItem}
          onRemove={onRemovePlacement}
          onDone={() => setPlacementMode(false)}
          label="고양이 방 꾸미기"
        />
      ) : (
        <>
          <PetRoomEditor
            theme={activeRoomTheme}
            placements={placements}
            tone="bright"
            catMotion={catMotion}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={onMoveItem}
            onPlaceAt={onPlaceItemAt}
            onCatTap={handleCatTap}
            sceneMode={sceneMode}
            reacting={sceneReacting}
            label="지금 꾸미는 고양이 방"
          />

          {canControlSelected ? (
            <div className="room-select-bar">
              <span className="room-select-name">{selectedItem.name} 선택됨</span>
              <div className="room-select-actions">
                <button
                  type="button"
                  className="room-select-btn"
                  onClick={() => {
                    onRemovePlacement?.(selectedItem.id);
                    setSelectedId(null);
                  }}
                >
                  보관함으로 치우기
                </button>
                <button type="button" className="room-select-btn room-select-btn--ghost" onClick={() => setSelectedId(null)}>
                  선택 해제
                </button>
              </div>
            </div>
          ) : (
            <p className="room-instruction" aria-live="polite">
              {/* Scene mode's persistent "완성된 방 이미지" caption lives in the stage's
                  room-scene-note; this region only surfaces dynamic tap/feed/reward
                  feedback so the same sentence never stacks twice. Kept mounted (empty
                  when idle) so it stays a stable live region and reserves its space. */}
              {stageReady
                ? tapMsg ?? '아이템 배치하기로 방을 꾸미고, 간식을 놓아줄 수 있어요.'
                : '승인된 고양이와 방 이미지를 연결하면 꾸미기를 시작할 수 있어요.'}
            </p>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-block placement-enter-btn"
            onClick={() => setPlacementMode(true)}
          >
            아이템 배치하기
          </button>
        </>
      )}

      <p className="hairline-note" aria-live="polite">
        {lastEarn
          ? lastEarn.kind === 'snack'
            ? `방금 ${lastEarn.reason} · 간식 ${lastEarn.amount}개를 받았어요.`
            : `방금 ${lastEarn.reason} · ${RESOURCE.name} ${lastEarn.amount}${RESOURCE.unit}을 모았어요.`
          : '오늘의 절제로 방이 조금 더 따뜻해졌어요.'}
      </p>

      <section className="card">
        <div className="card-row">
          <span className="card-label">고양이 방 온기</span>
          <span className={`pill ${warmth.tone}`} style={{ fontSize: 'var(--fs-small)' }}>
            {warmth.label}
          </span>
        </div>
        <p className="discipline-summary">{warmth.note}</p>
        <div className="stack" style={{ '--gap': 'var(--sp-2)' }}>
          <p className="hairline-note">
            ·{' '}
            {checkinDoneToday
              ? `오늘 기록을 남겨서 ${RESOURCE.name} ${EARN.checkin}${RESOURCE.unit}을 모았어요.`
              : `오늘 기록을 남기면 ${RESOURCE.name} ${EARN.checkin}${RESOURCE.unit}을 모을 수 있어요.`}
          </p>
          <p className="hairline-note">
            · 지금까지 모은 {RESOURCE.name} {emberShards}{RESOURCE.unit}
          </p>
          <p className="hairline-note">
            ·{' '}
            {petFedToday
              ? '오늘 간식 놓아주기 완료 · 오늘의 방 온기에 반영돼요.'
              : '오늘 간식을 놓아주면 오늘의 방 온기에 반영돼요.'}
          </p>
          <p className="hairline-note">· {nextRoomNote}</p>
        </div>
        <p className="hairline-note text-quiet">
          이 온기는 기기에 저장된 오늘의 기록으로 표시해요. 고양이가 실시간으로 반응하거나 저절로 자라는 건
          아니에요.
        </p>
      </section>

      <div className="room-action-row">
        <button type="button" className="btn btn-primary" onClick={() => setSheet('inventory')}>
          아이템 보관함
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setSheet('shop')}>
          상점
        </button>
      </div>

      <section className="card">
        <div className="card-row">
          <span className="card-label">고양이에게 간식 놓아주기</span>
          <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>간식 {snackCount}개</span>
        </div>
        <p className="hairline-note" aria-live="polite">
          {feedCardMessage}
        </p>
        {petFedToday ? (
          <p className="hairline-note">오늘 간식 놓아주기 완료 · 오늘의 방 온기에 반영돼요.</p>
        ) : null}
        {fedCount > 0 ? (
          <p className="hairline-note text-quiet">지금까지 놓아준 간식 {fedCount}번</p>
        ) : null}
        <div className="feed-btn-wrap">
          <span className="snack-toss-token" data-active={snackToss} aria-hidden="true">
            <span className="snack-toss-ember" />
          </span>
          <button
            type="button"
            className="btn btn-primary btn-block feed-btn"
            onClick={handleFeed}
            data-empty={snackCount <= 0}
            data-reacting={sceneReacting && tapMsg === SCENE_FEED_MESSAGE}
            aria-disabled={snackCount <= 0}
          >
            간식 놓아주기
          </button>
        </div>
      </section>

      {/* 고양이와 놀아주기 (RC-1 feedback #3) — a real, visible affection interaction. Pressing
          쓰다듬기 records an honest day-scoped count in App and rises a warm affection cue while
          the scene warms. The cat art is a static composite, so the copy never claims it moved,
          purred, or reacted on its own (R-8 / guard #6). */}
      <section className="card">
        <div className="card-row">
          <span className="card-label">고양이와 놀아주기</span>
          <span className="pill" style={{ fontSize: 'var(--fs-small)' }}>쓰다듬기 {pettedCount}번</span>
        </div>
        <p className="hairline-note" aria-live="polite">
          {tapMsg === PET_MESSAGE ? PET_MESSAGE : '쓰다듬기를 누르면 고양이 곁에서 잠깐 함께할 수 있어요.'}
        </p>
        {petPettedToday ? (
          <p className="hairline-note">오늘도 고양이와 함께한 시간을 남겼어요.</p>
        ) : null}
        {pettedCount > 0 ? (
          <p className="hairline-note text-quiet">지금까지 쓰다듬기 {pettedCount}번</p>
        ) : null}
        <div className="feed-btn-wrap">
          <span className="pet-affection-token" data-active={affectionToss} aria-hidden="true">
            <span className="pet-affection-ember" />
          </span>
          <button
            type="button"
            className="btn btn-primary btn-block feed-btn"
            onClick={handlePet}
            data-reacting={sceneReacting && tapMsg === PET_MESSAGE}
          >
            쓰다듬기
          </button>
        </div>
      </section>

      <section className="card">
        <span className="card-label">오늘의 보상 받기</span>
        <p className="hairline-note">오늘의 절제를 채우면 받을 수 있어요.</p>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' }}>
          {reachedMilestones.map((m) => {
            const claimed = claimedRewardIds.includes(m.id);
            return (
              <div className="row-between reward-row" data-claimed={claimed} key={m.id}>
                <div>
                  <div style={{ color: 'var(--text-primary)' }}>{m.label} 달성</div>
                  <div className="hairline-note">
                    {claimed ? '이미 받은 보상이에요.' : milestoneReward(m.kind, m.amount)}
                  </div>
                </div>
                <button
                  type="button"
                  className={`pill ${claimed ? 'pill-claimed' : 'pill-moss'} reward-claim-btn`}
                  onClick={() => handleClaim(m.id)}
                  disabled={claimed}
                  aria-pressed={claimed}
                >
                  {claimed ? '받음' : '받기'}
                </button>
              </div>
            );
          })}

          {lockedNext ? (
            <div className="row-between reward-row" data-locked="true" key={lockedNext.id}>
              <div>
                <div style={{ color: 'var(--text-secondary)' }}>{lockedNext.label} 달성</div>
                <div className="hairline-note">
                  아직 받을 수 없어요. 오늘을 채우면 열려요.
                </div>
              </div>
              <span className="pill reward-claim-btn" aria-disabled="true" style={{ opacity: 0.55 }}>
                {lockedNext.day}일째
              </span>
            </div>
          ) : null}

          {reachedMilestones.length === 0 && !lockedNext ? (
            <p className="hairline-note">절제를 이어가면 새 보상이 도착해요.</p>
          ) : null}
        </div>
      </section>

      <p className="reward-disclaimer">{REWARD_DISCLAIMER}</p>

      {/* Scene Mode v1 — static preset gallery over the approved finished art.
          Sits after the daily loop (간식 → 보상 → disclaimer) so browsing art never
          pushes the primary actions down; the live stage above stays the room's
          anchor and is never replaced by this viewer. */}
      <PetSceneViewer ownedItems={ownedItems} />

      <button type="button" className="btn btn-ghost btn-block" onClick={() => onNavigate('home')}>
        홈으로 돌아가기
      </button>

      {sheet === 'inventory' ? (
        <InventorySheet
          ownedDecor={ownedDecor}
          placedIds={placedIds}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === 'shop' ? (
        <ShopSheet
          emberShards={emberShards}
          ownedItems={ownedItems}
          placedIds={placedIds}
          snackCount={snackCount}
          activeRoomTheme={activeRoomTheme}
          sceneMode={sceneMode}
          onBuyItem={onBuyItem}
          onChooseRoomTheme={onChooseRoomTheme}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </div>
  );
}

// Neutral decor thumb — real art when present, clean pending slot otherwise.
function DecorThumb({ assetId, className = 'inv-thumb-img', pendingClass = 'inv-thumb-pending' }) {
  const src = resolveItemAsset(assetId);
  return src ? <img className={className} src={src} alt="" /> : <span className={pendingClass} aria-hidden="true" />;
}

function InventorySheet({ ownedDecor, placedIds, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="아이템 보관함"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div>
          <h2 className="sheet-title">아이템 보관함</h2>
          <p className="sheet-help">
            가진 아이템을 모아 봐요. ‘아이템 배치하기’에서 끌어다 방에 놓을 수 있어요.
          </p>
          <p className="sheet-help">간식은 보관함에 두지 않고 ‘간식 놓아주기’ 버튼으로 사용해요.</p>
        </div>
        {ownedDecor.length === 0 ? (
          <p className="hairline-note">아직 가진 아이템이 없어요. 상점에서 데려와 보세요.</p>
        ) : (
          <div className="inv-grid">
            {ownedDecor.map((it) => (
              <div key={it.id} className="inv-thumb" data-locked="false">
                <DecorThumb assetId={it.assetId} />
                <span className="inv-thumb-name">{it.name}</span>
                {placedIds.has(it.id) ? <span className="inv-thumb-badge">방에 있음</span> : null}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function ShopSheet({
  emberShards,
  ownedItems,
  placedIds,
  snackCount,
  activeRoomTheme,
  sceneMode,
  onBuyItem,
  onChooseRoomTheme,
  onClose,
}) {
  const [cat, setCat] = useState('snack');
  const visibleCategories = sceneMode ? SHOP_CATEGORIES.filter((c) => c.id !== 'theme') : SHOP_CATEGORIES;
  const currentCat = sceneMode && cat === 'theme' ? 'snack' : cat;
  const entries = catalogForCategory(currentCat);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="상점"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="row-between">
          <h2 className="sheet-title">상점</h2>
          <span className="pill pill-ember">{RESOURCE.name} {emberShards}{RESOURCE.unit}</span>
        </div>
        <p className="sheet-help">잔불 조각으로 새 아이템을 데려와요. 무작위 보상 없이, 오늘의 노력으로만 열려요.</p>
        {sceneMode ? (
          <p className="sheet-help">테마 변경은 테마별 완성 이미지가 연결된 뒤 사용할 수 있어요.</p>
        ) : null}

        <div className="shop-tabs">
          {visibleCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="shop-tab"
              data-selected={currentCat === c.id}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="catalog-list">
          {entries.map((entry) => (
            <CatalogCard
              key={entry.id}
              cat={currentCat}
              entry={entry}
              emberShards={emberShards}
              owned={ownedItems.includes(entry.id) || entry.cost === 0}
              placed={placedIds.has(entry.id)}
              snackCount={snackCount}
              activeRoomTheme={activeRoomTheme}
              sceneMode={sceneMode}
              onBuyItem={onBuyItem}
              onChooseRoomTheme={onChooseRoomTheme}
            />
          ))}
        </div>

        <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function CatalogCard({
  cat,
  entry,
  emberShards,
  owned,
  placed,
  snackCount,
  activeRoomTheme,
  sceneMode,
  onBuyItem,
  onChooseRoomTheme,
}) {
  const canAfford = emberShards >= entry.cost;
  const active = cat === 'theme' && activeRoomTheme === entry.id;

  let pill;
  let action = null;
  if (cat === 'snack') {
    pill = { label: `보유 ${snackCount}개`, tone: 'pill' };
    action = { label: `간식 늘리기 · ${entry.cost}${RESOURCE.unit}`, onClick: () => onBuyItem?.(entry.id), disabled: !canAfford };
  } else if (cat === 'theme') {
    if (active) {
      pill = { label: '사용 중', tone: 'pill-moss' };
    } else if (owned) {
      pill = { label: '보유 중', tone: 'pill' };
      action = { label: '사용하기', onClick: () => onChooseRoomTheme?.(entry.id) };
    } else {
      pill = { label: `${entry.cost}${RESOURCE.unit}`, tone: 'pill-ember' };
      action = { label: '데려오기', onClick: () => onBuyItem?.(entry.id), disabled: !canAfford };
    }
  } else {
    // decor (조명 / 방석·러그 / 가구)
    if (placed && !sceneMode) {
      pill = { label: '방에 있음', tone: 'pill-moss' };
    } else if (owned) {
      pill = { label: '보관함에 있음', tone: 'pill' };
    } else {
      pill = { label: `${entry.cost}${RESOURCE.unit}`, tone: 'pill-ember' };
      action = { label: '데려오기', onClick: () => onBuyItem?.(entry.id), disabled: !canAfford };
    }
  }

  return (
    <div className="catalog-row" data-active={active}>
      <span className="catalog-thumb">
        {cat === 'theme' ? (
          <span className="catalog-swatch" style={{ background: entry.swatch }} />
        ) : (
          <DecorThumb assetId={entry.assetId} className="catalog-thumb-img" pendingClass="catalog-thumb-pending" />
        )}
      </span>
      <div className="catalog-main">
        <span className="catalog-name">{entry.name}</span>
        {entry.blurb ? <span className="catalog-blurb">{entry.blurb}</span> : null}
      </div>
      <div className="catalog-side">
        <span className={`pill ${pill.tone}`} style={{ fontSize: 'var(--fs-micro)' }}>{pill.label}</span>
        {action ? (
          <button
            type="button"
            className="catalog-action"
            onClick={action.onClick}
            disabled={action.disabled}
            style={action.disabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
            title={action.disabled ? '잔불 조각이 조금 더 필요해요' : undefined}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
