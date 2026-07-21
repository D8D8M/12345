import { EQUIPMENT_CONFIGS, type EquipmentId } from './equipmentConfigs';
import { MELEE_WEAPON_CONFIGS, type MeleeWeaponId } from './meleeWeaponConfigs';
import type { AttackStep } from './weaponCombatConfig';
import type { ComboStep, WeaponCategory, WeaponConfig } from './weaponSystem';

const meleeNames: Record<MeleeWeaponId, string> = {
  rusty_sword: 'Ржавый меч', steel_blade: 'Стальной клинок', ice_sword: 'Ледяной меч',
  heavy_axe: 'Тяжёлый топор', fast_daggers: 'Быстрые кинжалы',
  forgotten_king_blade: 'Клинок забытого короля', merchant_blade: 'Клинок торговца',
};
const equipmentNames: Record<EquipmentId, string> = {
  old_bow: 'Старый лук', hunter_bow: 'Охотничий лук', precision_bow: 'Точный лук',
  old_shield: 'Старый щит', tower_shield: 'Башенный щит', fragmentation_bomb: 'Осколочная бомба',
  ice_bomb: 'Ледяная бомба', heavy_bomb: 'Тяжёлая бомба', toothed_trap: 'Зубастый капкан', frost_orb: 'Морозная сфера',
};

const meleeStep = (step: AttackStep): ComboStep => ({
  ...step, animationKey: step.animationTrigger, fxKey: step.fx,
  hitbox: { offsetX: 30, offsetY: 4, width: 62 * step.hitboxScale, height: 48 },
});

const meleeEntries = Object.entries(MELEE_WEAPON_CONFIGS).map(([id, config]) => [id, {
  id, displayName: meleeNames[id as MeleeWeaponId], category: 'melee' as const,
  holdAnimationKey: config.holdPose, comboResetWindow: config.comboResetWindow, combo: config.attacks.map(meleeStep),
} satisfies WeaponConfig]);

const equipmentEntry = (id: EquipmentId): WeaponConfig => {
  const config = EQUIPMENT_CONFIGS[id];
  const category: WeaponCategory = config.kind === 'bow' ? 'ranged' : config.kind === 'shield' ? 'shield' : config.kind === 'trap' ? 'trap' : config.kind === 'freeze' ? 'magic' : 'bomb';
  const holdAnimationKey = config.kind === 'bow' ? 'bow-ready' : config.kind === 'shield' ? 'shield-guard' : config.kind === 'trap' ? 'trap-kit' : config.kind === 'freeze' ? 'frost-orb' : 'throwable';
  const step: ComboStep = config.kind === 'bow'
    ? { windup: config.charge, active: .05, recovery: config.recovery, damageMultiplier: config.damageMultiplier, knockback: 120, animationIndex: 0, animationKey: `${id}.shoot`, hitbox: { offsetX: 30, offsetY: 20, width: config.projectileSpeed * 1.5, height: 8 }, fxKey: 'arrow' }
    : config.kind === 'shield'
      ? { windup: .04, active: config.perfectBlockWindow, recovery: .12, damageMultiplier: 0, knockback: 0, animationIndex: 0, animationKey: `${id}.guard`, hitbox: { offsetX: 15, offsetY: -18, width: id === 'tower_shield' ? 16 : 12, height: 36 }, fxKey: 'guard' }
      : config.kind === 'trap'
        ? { windup: config.windup, active: .08, recovery: .2, damageMultiplier: config.damageMultiplier, knockback: 160, animationIndex: 0, animationKey: `${id}.place`, hitbox: { offsetX: -12, offsetY: 46, width: config.width, height: 12 }, fxKey: 'trap' }
        : { windup: config.windup, active: .05, recovery: .28, damageMultiplier: config.damageMultiplier, knockback: 620, animationIndex: 0, animationKey: `${id}.throw`, hitbox: { offsetX: 12, offsetY: 12, width: config.blastRadius * 2, height: config.blastRadius * 2 }, fxKey: config.kind === 'freeze' ? 'freeze' : 'explosion', freezeSeconds: config.freezeSeconds };
  return { id, displayName: equipmentNames[id], category, holdAnimationKey, comboResetWindow: 1, combo: [step] };
};

const equipmentEntries = (Object.keys(EQUIPMENT_CONFIGS) as EquipmentId[]).map((id) => [id, equipmentEntry(id)]);
const baseRegistry = Object.fromEntries([...meleeEntries, ...equipmentEntries]) as Record<string, WeaponConfig>;

const evolve = (id: string, name: string, baseId: string, effectKey: string, scale = 1): WeaponConfig => {
  const base = baseRegistry[baseId];
  return { ...base, id, displayName: name, evolutionOf: baseId, effectKey, combo: base.combo.map((step, index) => ({ ...step, damageMultiplier: step.damageMultiplier * scale, animationKey: `${id}.${index + 1}`, fxKey: effectKey })) };
};

export const WEAPON_REGISTRY: Readonly<Record<string, WeaponConfig>> = {
  ...baseRegistry,
  storm_blade: evolve('storm_blade', 'Клинок бури', 'rusty_sword', 'chain-lightning', .9),
  executioner_blade: evolve('executioner_blade', 'Клинок палача', 'heavy_axe', 'bleed-execute', 1.65),
  distant_verdict: evolve('distant_verdict', 'Дальний приговор', 'precision_bow', 'distance-pierce', 1.7),
  winter_bow: evolve('winter_bow', 'Лук зимы', 'hunter_bow', 'frost-arrow', 1.15),
  living_fortress: evolve('living_fortress', 'Живая крепость', 'tower_shield', 'fortress-block', 1.2),
  reprisal_shield: evolve('reprisal_shield', 'Щит возмездия', 'old_shield', 'counter-strike', 2),
  cluster_bomb: evolve('cluster_bomb', 'Кассетная бомба', 'fragmentation_bomb', 'cluster-explosion', 1.6),
  alchemical_charge: evolve('alchemical_charge', 'Алхимический заряд', 'fragmentation_bomb', 'poison-cloud', 1.1),
  ice_rift: evolve('ice_rift', 'Ледяной раскол', 'ice_bomb', 'frozen-shatter', 1.5),
  permafrost_sphere: evolve('permafrost_sphere', 'Сфера вечной мерзлоты', 'frost_orb', 'permafrost', 1.05),
};

export const weaponConfig = (id: string) => WEAPON_REGISTRY[id];
