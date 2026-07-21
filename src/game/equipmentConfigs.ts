export type EquipmentId = 'old_bow' | 'hunter_bow' | 'precision_bow' | 'old_shield' | 'tower_shield'
  | 'fragmentation_bomb' | 'ice_bomb' | 'heavy_bomb' | 'toothed_trap' | 'frost_orb';

type BowConfig = { kind: 'bow'; charge: number; recovery: number; shots: number; spread: number; projectileSpeed: number; damageMultiplier: number };
type ShieldConfig = { kind: 'shield'; perfectBlockWindow: number; movementDamping: number; parryGain: number };
type BombConfig = { kind: 'grenade' | 'freeze'; windup: number; projectileSpeed: number; blastRadius: number; damageMultiplier: number; freezeSeconds?: number };
type TrapConfig = { kind: 'trap'; windup: number; lifetime: number; width: number; damageMultiplier: number };
export type EquipmentConfig = BowConfig | ShieldConfig | BombConfig | TrapConfig;

export const EQUIPMENT_CONFIGS: Record<EquipmentId, EquipmentConfig> = {
  old_bow: { kind: 'bow', charge: .18, recovery: .32, shots: 1, spread: 0, projectileSpeed: 720, damageMultiplier: 1 },
  hunter_bow: { kind: 'bow', charge: .12, recovery: .24, shots: 3, spread: .1, projectileSpeed: 760, damageMultiplier: .72 },
  precision_bow: { kind: 'bow', charge: .38, recovery: .2, shots: 1, spread: 0, projectileSpeed: 980, damageMultiplier: 1.75 },
  old_shield: { kind: 'shield', perfectBlockWindow: .2, movementDamping: 8, parryGain: 34 },
  tower_shield: { kind: 'shield', perfectBlockWindow: .3, movementDamping: 13, parryGain: 45 },
  fragmentation_bomb: { kind: 'grenade', windup: .16, projectileSpeed: 600, blastRadius: 150, damageMultiplier: 1 },
  ice_bomb: { kind: 'freeze', windup: .2, projectileSpeed: 570, blastRadius: 135, damageMultiplier: .8, freezeSeconds: 1.35 },
  heavy_bomb: { kind: 'grenade', windup: .28, projectileSpeed: 480, blastRadius: 205, damageMultiplier: 1.55 },
  toothed_trap: { kind: 'trap', windup: .12, lifetime: 9, width: 58, damageMultiplier: 1.25 },
  frost_orb: { kind: 'freeze', windup: .1, projectileSpeed: 690, blastRadius: 170, damageMultiplier: 1.05, freezeSeconds: 2.2 },
};

const IDS_BY_NAME: Record<string, EquipmentId> = {
  'Старый лук': 'old_bow', 'Охотничий лук': 'hunter_bow', 'Точный лук': 'precision_bow',
  'Старый щит': 'old_shield', 'Башенный щит': 'tower_shield',
  'Осколочная бомба': 'fragmentation_bomb', 'Ледяная бомба': 'ice_bomb', 'Тяжёлая бомба': 'heavy_bomb',
  'Зубастый капкан': 'toothed_trap', 'Морозная сфера': 'frost_orb',
};

export const equipmentIdForName = (name: string): EquipmentId | undefined => IDS_BY_NAME[name];
export const equipmentConfig = (id: EquipmentId | undefined, kind: string): EquipmentConfig => {
  const fallback: EquipmentId = kind === 'bow' ? 'old_bow' : kind === 'shield' ? 'old_shield' : kind === 'trap' ? 'toothed_trap' : kind === 'freeze' ? 'ice_bomb' : 'fragmentation_bomb';
  return EQUIPMENT_CONFIGS[id ?? fallback];
};
