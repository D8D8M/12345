export type WeaponKind = 'sword' | 'bow' | 'shield' | 'grenade' | 'freeze' | 'trap';

export type WeaponFx = 'slash' | 'arrow' | 'guard' | 'explosion' | 'freeze' | 'trap';
export type HoldPose = 'blade-ready' | 'bow-ready' | 'shield-guard' | 'throwable' | 'frost-orb' | 'trap-kit';

export type AttackStep = {
  windup: number;
  active: number;
  recovery: number;
  damageMultiplier: number;
  knockback: number;
  animationIndex: number;
  animationTrigger: string;
  hitboxScale: number;
  fx: WeaponFx;
  criticalMultiplier?: number;
  freezeSeconds?: number;
};

export type WeaponCombatConfig = {
  kind: WeaponKind;
  holdPose: HoldPose;
  comboResetWindow: number;
  attacks: readonly AttackStep[];
};

export const combatStep = (windup: number, active: number, recovery: number, damageMultiplier: number, knockback: number,
  animationIndex: number, animationTrigger: string, hitboxScale: number, fx: WeaponFx): AttackStep =>
  ({ windup, active, recovery, damageMultiplier, knockback, animationIndex, animationTrigger, hitboxScale, fx });

export const WEAPON_COMBAT_CONFIGS: Record<WeaponKind, WeaponCombatConfig> = {
  sword: {
    kind: 'sword', holdPose: 'blade-ready', comboResetWindow: .52,
    attacks: [
      combatStep(.08, .09, .16, 1, 250, 0, 'SwordAttack1', 1, 'slash'),
      combatStep(.07, .1, .17, 1.15, 310, 1, 'SwordAttack2', 1.08, 'slash'),
      combatStep(.13, .13, .27, 1.65, 520, 2, 'SwordFinisher', 1.28, 'slash'),
    ],
  },
  bow: { kind: 'bow', holdPose: 'bow-ready', comboResetWindow: .7, attacks: [combatStep(.18, .05, .32, 1, 120, 0, 'BowShot', 1, 'arrow')] },
  shield: { kind: 'shield', holdPose: 'shield-guard', comboResetWindow: .3, attacks: [combatStep(.04, .2, .12, .5, 420, 0, 'ShieldGuard', 1.1, 'guard')] },
  grenade: { kind: 'grenade', holdPose: 'throwable', comboResetWindow: 1, attacks: [combatStep(.16, .05, .28, 1, 620, 0, 'GrenadeThrow', 1, 'explosion')] },
  freeze: { kind: 'freeze', holdPose: 'frost-orb', comboResetWindow: 1, attacks: [combatStep(.2, .05, .3, .8, 180, 0, 'FreezeThrow', 1.35, 'freeze')] },
  trap: { kind: 'trap', holdPose: 'trap-kit', comboResetWindow: 1, attacks: [combatStep(.12, .08, .2, 1, 160, 0, 'TrapPlace', 1, 'trap')] },
};

export const attackDuration = (attack: AttackStep) => attack.windup + attack.active + attack.recovery;

export function comboStep(kind: WeaponKind, index: number): AttackStep {
  const attacks = WEAPON_COMBAT_CONFIGS[kind].attacks;
  return attacks[index % attacks.length];
}
