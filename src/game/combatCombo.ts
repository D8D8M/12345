export type CombatRank = '—' | 'C' | 'B' | 'A' | 'S';

export type CombatCombo = {
  hits: number;
  rank: CombatRank;
  multiplier: number;
  expiresAt: number;
};

export const EMPTY_COMBO: CombatCombo = { hits: 0, rank: '—', multiplier: 1, expiresAt: 0 };

export function comboForHits(hits: number, now: number): CombatCombo {
  const rank: CombatRank = hits >= 12 ? 'S' : hits >= 8 ? 'A' : hits >= 4 ? 'B' : 'C';
  const multiplier = rank === 'S' ? 2 : rank === 'A' ? 1.6 : rank === 'B' ? 1.3 : 1.1;
  return { hits, rank, multiplier, expiresAt: now + 4000 };
}

