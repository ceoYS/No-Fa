/*
 * Reward economy (PRD §0.6.9) — earned in-app resource only.
 *
 * The resource (잔불 조각) is earned ONLY by doing the core abstinence work and is
 * spent on cosmetic room/pet items (roomItems.js). Hard rules for this layer:
 *   - no real-money payment, no gacha / loot box / random reward, no pay-to-win,
 *   - no streak-recovery tickets, no probability rewards.
 * The reward never substitutes for abstinence — it only marks the effort
 * (see REWARD_DISCLAIMER, surfaced on the reward screen).
 */

export const RESOURCE = {
  id: 'ember_shard',
  name: '잔불 조각',
  unit: '조각',
};

// Fixed grants for completing a core action. Small and deterministic — never
// random. Earned through: timer milestone (below), daily check-in, crisis held
// (위기였지만 버텼어요), relapse/slip reflection, discipline check.
export const EARN = {
  checkin: 3, // 오늘의 체크인 완료 (체크인은 규율 점검을 포함 → discipline check)
  disciplineHeld: 2, // 체크인에서 '위기였지만 버텼어요'로 표시한 규율 1개당
  crisisHeld: 4, // 잠깐 멈춤 끝까지 버팀 (crisis resisted)
  relapseReflection: 2, // 다시 시작 후 복기 완료
  slipReflection: 2, // 못 지킨 규율 복기 완료
};

// Milestone rewards — become *claimable* (받기) once the abstinence streak
// reaches `day`. Each is granted at most once (tracked by claimedRewardIds).
// One milestone grants a snack so "받기" demonstrably fills the inventory.
export const MILESTONES = [
  { id: 'ms_d1', day: 1, kind: 'shards', amount: 3, label: '절제 1일' },
  { id: 'ms_d3', day: 3, kind: 'snack', amount: 1, label: '절제 3일' },
  { id: 'ms_d7', day: 7, kind: 'shards', amount: 8, label: '절제 7일' },
  { id: 'ms_d14', day: 14, kind: 'shards', amount: 12, label: '절제 14일' },
  { id: 'ms_d30', day: 30, kind: 'shards', amount: 20, label: '절제 30일' },
];

export const MILESTONE_BY_ID = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));

// Milestones the user has reached but not yet claimed.
export function earnableMilestones(streakDays = 0, claimedIds = []) {
  return MILESTONES.filter((m) => streakDays >= m.day && !claimedIds.includes(m.id));
}

// Single source of claim eligibility (§0.6.9). A reward unlocks ONLY through real
// abstinence progress — the streak must have reached the milestone day — and each
// reward is claimable at most once. Opening the room or re-pressing 받기 grants
// nothing: this is the guard the screen *and* the App action both consult, so the
// snack/shard balance can never move for an ineligible or already-claimed reward.
export function isMilestoneClaimable(milestone, streakDays = 0, claimedIds = []) {
  if (!milestone) return false;
  return streakDays >= milestone.day && !claimedIds.includes(milestone.id);
}

// The next locked milestone (reached none of it yet) — used to show an honest
// "아직 열리지 않은" row instead of hiding future rewards entirely.
export function nextLockedMilestone(streakDays = 0) {
  return MILESTONES.find((m) => streakDays < m.day) ?? null;
}

export function milestoneReward(kind, amount) {
  return kind === 'snack' ? `간식 ${amount}개` : `${RESOURCE.name} ${amount}${RESOURCE.unit}`;
}

// Seeded balance so the prototype can demonstrate spending immediately.
export const SEED_SHARDS = 28;

export const REWARD_DISCLAIMER =
  '이 보상은 절제를 대신하지 않아요. 오늘의 노력을 기억하게 해주는 작은 표시예요.';
