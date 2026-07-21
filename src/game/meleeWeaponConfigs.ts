import { combatStep, type WeaponCombatConfig } from './weaponCombatConfig';

export type MeleeWeaponId = 'rusty_sword' | 'steel_blade' | 'ice_sword' | 'heavy_axe' | 'fast_daggers' | 'forgotten_king_blade' | 'merchant_blade';

const melee = (comboResetWindow: number, attacks: WeaponCombatConfig['attacks']): WeaponCombatConfig =>
  ({ kind: 'sword', holdPose: 'blade-ready', comboResetWindow, attacks });

export const MELEE_WEAPON_CONFIGS: Record<MeleeWeaponId, WeaponCombatConfig> = {
  rusty_sword: melee(.52, [
    combatStep(.08, .09, .16, 1, 250, 0, 'RustySword1', 1, 'slash'),
    combatStep(.07, .1, .17, 1.15, 310, 1, 'RustySword2', 1.08, 'slash'),
    combatStep(.13, .13, .27, 1.65, 520, 2, 'RustySwordFinisher', 1.28, 'slash'),
  ]),
  steel_blade: melee(.4, [
    combatStep(.055, .075, .11, .9, 220, 0, 'SteelBlade1', .95, 'slash'),
    combatStep(.05, .08, .12, 1, 260, 1, 'SteelBlade2', 1, 'slash'),
    combatStep(.08, .1, .17, 1.4, 410, 2, 'SteelBladeFinisher', 1.16, 'slash'),
  ]),
  ice_sword: melee(.62, [
    { ...combatStep(.11, .11, .2, 1.1, 260, 0, 'IceSword1', 1.06, 'freeze'), freezeSeconds: .18 },
    { ...combatStep(.16, .14, .3, 1.75, 430, 1, 'IceSwordFinisher', 1.3, 'freeze'), freezeSeconds: .35 },
  ]),
  heavy_axe: melee(.78, [
    combatStep(.22, .15, .34, 1.45, 480, 0, 'HeavyAxe1', 1.3, 'slash'),
    combatStep(.31, .2, .48, 2.4, 760, 1, 'HeavyAxeFinisher', 1.65, 'slash'),
  ]),
  fast_daggers: melee(.34, [
    combatStep(.035, .055, .075, .65, 120, 0, 'Daggers1', .76, 'slash'),
    combatStep(.03, .055, .08, .7, 140, 1, 'Daggers2', .8, 'slash'),
    combatStep(.035, .06, .085, .8, 170, 2, 'Daggers3', .86, 'slash'),
    { ...combatStep(.06, .08, .14, 1.05, 290, 3, 'DaggersCriticalFinisher', 1, 'slash'), criticalMultiplier: 2.25 },
  ]),
  forgotten_king_blade: melee(.58, [
    combatStep(.1, .12, .2, 1.15, 310, 0, 'KingBlade1', 1.38, 'slash'),
    combatStep(.11, .13, .22, 1.3, 370, 1, 'KingBlade2', 1.52, 'slash'),
    combatStep(.18, .17, .34, 2, 620, 2, 'KingBladeFinisher', 1.9, 'slash'),
  ]),
  merchant_blade: melee(.48, [
    combatStep(.07, .085, .14, .95, 230, 0, 'MerchantBlade1', .96, 'slash'),
    combatStep(.065, .09, .15, 1.1, 280, 1, 'MerchantBlade2', 1.04, 'slash'),
    combatStep(.11, .12, .23, 1.55, 470, 2, 'MerchantBladeFinisher', 1.22, 'slash'),
  ]),
};

export const meleeConfig = (weaponId?: MeleeWeaponId) => MELEE_WEAPON_CONFIGS[weaponId ?? 'rusty_sword'];

const IDS_BY_NAME: Record<string, MeleeWeaponId> = {
  'Ржавый меч': 'rusty_sword', 'Стальной клинок': 'steel_blade', 'Ледяной меч': 'ice_sword',
  'Тяжёлый топор': 'heavy_axe', 'Быстрые кинжалы': 'fast_daggers',
  'Клинок забытого короля': 'forgotten_king_blade', 'Клинок торговца': 'merchant_blade',
};

export const meleeWeaponIdForName = (name: string): MeleeWeaponId => IDS_BY_NAME[name] ?? 'rusty_sword';
