export type EliteModifier = 'armored' | 'vampire' | 'explosive' | 'teleporter';

export const ELITE_CHANCE = 0.14;

export const ELITE_INFO: Record<EliteModifier, { label: string; color: string; symbol: string }> = {
  armored: { label: 'Бронированный', color: '#94a3b8', symbol: '◆' },
  vampire: { label: 'Вампир', color: '#fb7185', symbol: '♥' },
  explosive: { label: 'Взрывной', color: '#fb923c', symbol: '✦' },
  teleporter: { label: 'Телепортер', color: '#c084fc', symbol: '◇' },
};

const MODIFIERS: EliteModifier[] = ['armored', 'vampire', 'explosive', 'teleporter'];

export function rollEliteModifier(): EliteModifier | undefined {
  if (Math.random() >= ELITE_CHANCE) return undefined;
  return MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
}

export function eliteDamageMultiplier(modifier?: EliteModifier): number {
  return modifier === 'armored' ? 0.7 : 1;
}
