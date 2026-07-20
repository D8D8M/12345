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
    { id: 'swift', name: 'Клинок бури', description: 'Атакует на 35% быстрее.', damageMultiplier: .9, cooldownMultiplier: .65 },
    { id: 'brutal', name: 'Клинок палача', description: 'Тяжёлые удары наносят на 65% больше урона.', damageMultiplier: 1.65, cooldownMultiplier: 1.3 },
  ],
  bow: [
    { id: 'sniper', name: 'Дальний приговор', description: 'Мощные дальние выстрелы.', damageMultiplier: 1.7, cooldownMultiplier: 1.35 },
    { id: 'frost', name: 'Лук зимы', description: 'Быстрые стрелы с ледяной закалкой.', damageMultiplier: 1.15, cooldownMultiplier: .78 },
  ],
  shield: [
    { id: 'bastion', name: 'Живая крепость', description: 'Ускоряет восстановление защиты.', damageMultiplier: 1.2, cooldownMultiplier: .6 },
    { id: 'reprisal', name: 'Щит возмездия', description: 'Усиливает контратаки.', damageMultiplier: 2, cooldownMultiplier: 1.05 },
  ],
  grenade: [
    { id: 'cluster', name: 'Кассетная бомба', description: 'Большой взрыв и высокий урон.', damageMultiplier: 1.6, cooldownMultiplier: 1.2 },
    { id: 'alchemist', name: 'Алхимический заряд', description: 'Быстрая перезарядка.', damageMultiplier: 1.1, cooldownMultiplier: .65 },
  ],
  freeze: [
    { id: 'cluster', name: 'Ледяной раскол', description: 'Усиленный урон по площади.', damageMultiplier: 1.5, cooldownMultiplier: 1.1 },
    { id: 'alchemist', name: 'Сфера вечной мерзлоты', description: 'Быстрая перезарядка.', damageMultiplier: 1.05, cooldownMultiplier: .62 },
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
