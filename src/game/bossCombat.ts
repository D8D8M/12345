export const BOSS_HIT_INVULNERABILITY = 0.08;
export const BOSS_KNOCKBACK_MULTIPLIER = 0.12;
export const BOSS_FREEZE_MULTIPLIER = 0.35;

export const scaledFreezeDuration = (duration: number, isBoss: boolean) =>
  duration * (isBoss ? BOSS_FREEZE_MULTIPLIER : 1);
