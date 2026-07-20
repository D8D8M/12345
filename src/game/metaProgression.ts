export type LegacyUnlockId = 'vitality' | 'arsenal' | 'relicLore' | 'fortune';
export type LegacyProgress = { embers: number; unlocks: LegacyUnlockId[] };

export const LEGACY_UNLOCKS = [
  { id: 'vitality', icon: '🩸', name: 'Крепкая кровь', description: '+1 маска в начале каждого нового забега.', cost: 8 },
  { id: 'arsenal', icon: '⚔️', name: 'Арсенал изгнанника', description: 'Стартовое оружие получает II уровень.', cost: 12 },
  { id: 'relicLore', icon: '🔮', name: 'Память реликвий', description: 'Новый забег начинается со случайной реликвией.', cost: 16 },
  { id: 'fortune', icon: '💎', name: 'Осколочная удача', description: 'Новый забег начинается с 20 осколками.', cost: 10 },
] as const;

export const emptyLegacyProgress = (): LegacyProgress => ({ embers: 0, unlocks: [] });
export const legacyReward = (kills: number, bosses: number, victory = false) => Math.max(1, Math.floor(kills / 12) + bosses * 2 + (victory ? 8 : 0));
