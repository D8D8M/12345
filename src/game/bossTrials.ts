export type BossTrialModifier = 'empowered' | 'timed' | 'noHealing';

export type BossTrial = {
  id: string;
  boss: string;
  location: 'swamps' | 'mines' | 'crypt' | 'bridge' | 'throne';
  modifier: BossTrialModifier;
  description: string;
  timeLimit?: number;
};

export type BossTrialRecord = { clears: number; bestTime?: number };
export type BossTrialProgress = { seals: number; records: Record<string, BossTrialRecord> };

const STORAGE_KEY = 'ashfall-boss-trial-progress';

export const emptyBossTrialProgress = (): BossTrialProgress => ({ seals: 0, records: {} });

export function loadBossTrialProgress(): BossTrialProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '') as BossTrialProgress;
    return { seals: Math.max(0, saved.seals || 0), records: saved.records || {} };
  } catch { return emptyBossTrialProgress(); }
}

export function recordBossTrialClear(trial: BossTrial, elapsed: number): { progress: BossTrialProgress; earned: number } {
  const progress = loadBossTrialProgress();
  const previous = progress.records[trial.id] || { clears: 0 };
  const quickClear = trial.timeLimit !== undefined && elapsed <= trial.timeLimit * .7;
  const earned = (previous.clears === 0 ? 3 : 1) + (quickClear ? 1 : 0);
  progress.seals += earned;
  progress.records[trial.id] = {
    clears: previous.clears + 1,
    bestTime: Math.min(previous.bestTime ?? Number.POSITIVE_INFINITY, Math.round(elapsed * 10) / 10),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return { progress, earned };
}

export const trialRewardTier = (seals: number) => seals >= 30 ? 3 : seals >= 15 ? 2 : seals >= 5 ? 1 : 0;

export const BOSS_TRIALS: BossTrial[] = [
  { id: 'giant-empowered', boss: 'Болотный гигант', location: 'swamps', modifier: 'empowered', description: 'Вдвое больше здоровья и более тяжёлые удары.' },
  { id: 'golem-timed', boss: 'Каменный голем', location: 'mines', modifier: 'timed', description: 'Разбей голема до обвала шахты.', timeLimit: 75 },
  { id: 'warden-no-heal', boss: 'Страж склепа', location: 'crypt', modifier: 'noHealing', description: 'Сила Души не может восстанавливать маски.' },
  { id: 'colossus-empowered', boss: 'Мостовой колосс', location: 'bridge', modifier: 'empowered', description: 'Усиленный колосс на краю бездны.' },
  { id: 'right-hand-timed', boss: 'Правая Рука Короля', location: 'throne', modifier: 'timed', description: 'Последняя дуэль. На победу — 90 секунд.', timeLimit: 90 },
];

export const trialModifierName = (modifier: BossTrialModifier) => modifier === 'empowered'
  ? 'Усиленный босс'
  : modifier === 'timed' ? 'На время' : 'Без лечения';
