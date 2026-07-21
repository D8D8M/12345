export type WeaponBranchId = 'swift' | 'brutal' | 'sniper' | 'frost' | 'bastion' | 'reprisal' | 'cluster' | 'alchemist';

export type UpgradeableGear = {
  kind: string;
  name: string;
  tier: number;
  damage: number;
  cooldown: number;
  branch?: WeaponBranchId;
};

type WeaponUpgrade = {
  id: WeaponBranchId;
  name: string;
  description: string;
  damageMultiplier: number;
  cooldownMultiplier: number;
};

const BRANCHES: Record<string, readonly WeaponUpgrade[]> = {
  sword: [
    { id: 'swift', name: 'Клинок бури', description: 'Каждый удар комбо вызывает цепную молнию.', damageMultiplier: .9, cooldownMultiplier: .65 },
    { id: 'brutal', name: 'Клинок палача', description: 'Широкий финишер вызывает кровотечение и казнит ослабленных врагов.', damageMultiplier: 1.65, cooldownMultiplier: 1.3 },
  ],
  bow: [
    { id: 'sniper', name: 'Дальний приговор', description: 'Пробивает цель, а урон растёт с расстоянием.', damageMultiplier: 1.7, cooldownMultiplier: 1.35 },
    { id: 'frost', name: 'Лук зимы', description: 'Каждая стрела замораживает поражённую цель.', damageMultiplier: 1.15, cooldownMultiplier: .78 },
  ],
  shield: [
    { id: 'bastion', name: 'Живая крепость', description: 'Полностью удерживает фронтальный удар и накапливает парирование.', damageMultiplier: 1.2, cooldownMultiplier: .6 },
    { id: 'reprisal', name: 'Щит возмездия', description: 'Идеальный блок наносит ответный урон атакующему.', damageMultiplier: 2, cooldownMultiplier: 1.05 },
  ],
  grenade: [
    { id: 'cluster', name: 'Кассетная бомба', description: 'Увеличенный взрыв выпускает четыре вторичных заряда.', damageMultiplier: 1.6, cooldownMultiplier: 1.2 },
    { id: 'alchemist', name: 'Алхимический заряд', description: 'Отравляет врагов и оставляет ядовитое облако.', damageMultiplier: 1.1, cooldownMultiplier: .65 },
  ],
  freeze: [
    { id: 'cluster', name: 'Ледяной раскол', description: 'Расширенный взрыв раскалывает уже замороженных врагов.', damageMultiplier: 1.5, cooldownMultiplier: 1.1 },
    { id: 'alchemist', name: 'Сфера вечной мерзлоты', description: 'Замораживает поражённые цели на 4,5 секунды.', damageMultiplier: 1.05, cooldownMultiplier: .62 },
  ],
};

export const weaponBranches = (kind: string): readonly WeaponUpgrade[] => BRANCHES[kind] ?? [];

export function evolveWeapon<T extends UpgradeableGear>(gear: T, branch: WeaponUpgrade): T {
  return {
    ...gear,
    name: branch.name,
    tier: gear.tier + 1,
    damage: Math.round(gear.damage * branch.damageMultiplier),
    cooldown: Number((gear.cooldown * branch.cooldownMultiplier).toFixed(2)),
    branch: branch.id,
  };
}
