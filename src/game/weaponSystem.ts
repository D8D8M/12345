export type WeaponAnimationState = 'idle' | 'windup' | 'active' | 'recovery';
export type WeaponCategory = 'melee' | 'ranged' | 'shield' | 'bomb' | 'magic' | 'trap';

export interface WeaponHitbox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface ComboStep {
  windup: number;
  active: number;
  recovery: number;
  damageMultiplier: number;
  knockback: number;
  animationIndex: number;
  animationKey: string;
  hitbox: WeaponHitbox;
  fxKey: string;
  criticalMultiplier?: number;
  freezeSeconds?: number;
}

export interface WeaponConfig {
  id: string;
  displayName: string;
  category: WeaponCategory;
  holdAnimationKey: string;
  comboResetWindow: number;
  combo: readonly ComboStep[];
  evolutionOf?: string;
  effectKey?: string;
}

export interface WeaponAnimationSnapshot {
  state: WeaponAnimationState;
  stepIndex: number;
  animationKey: string;
  normalizedTime: number;
}

export type CombatEvent =
  | { type: 'attack-started'; stepIndex: number; step: ComboStep }
  | { type: 'active-started'; stepIndex: number; step: ComboStep }
  | { type: 'returned-idle' };

export class WeaponManager {
  private state: WeaponAnimationState = 'idle';
  private held = false;
  private buffered = false;
  private stepIndex = 0;
  private stateTime = 0;
  private resetTime = 0;

  setAttackHeld(held: boolean) {
    if (held && !this.held) this.buffered = true;
    this.held = held;
  }

  queueAttack() { this.buffered = true; }

  reset() {
    this.state = 'idle'; this.held = false; this.buffered = false;
    this.stepIndex = 0; this.stateTime = 0; this.resetTime = 0;
  }

  update(dt: number, config: WeaponConfig): CombatEvent[] {
    const events: CombatEvent[] = [];
    this.resetTime = Math.max(0, this.resetTime - dt);
    if (this.state === 'idle') {
      if (this.resetTime <= 0) this.stepIndex = 0;
      if (this.held || this.buffered) this.startStep(config, events);
      return events;
    }

    this.stateTime += dt;
    const step = config.combo[this.stepIndex];
    if (this.state === 'windup' && this.stateTime >= step.windup) {
      this.state = 'active'; this.stateTime -= step.windup;
      events.push({ type: 'active-started', stepIndex: this.stepIndex, step });
    }
    if (this.state === 'active' && this.stateTime >= step.active) {
      this.state = 'recovery'; this.stateTime -= step.active;
    }
    if (this.state === 'recovery' && this.stateTime >= step.recovery) {
      this.state = 'idle'; this.stateTime = 0;
      this.stepIndex = (this.stepIndex + 1) % config.combo.length;
      this.resetTime = config.comboResetWindow;
      events.push({ type: 'returned-idle' });
      if (this.held || this.buffered) this.startStep(config, events);
    }
    return events;
  }

  snapshot(config: WeaponConfig): WeaponAnimationSnapshot {
    const step = config.combo[this.stepIndex];
    const duration = this.state === 'windup' ? step.windup : this.state === 'active' ? step.active : this.state === 'recovery' ? step.recovery : 1;
    return { state: this.state, stepIndex: this.stepIndex, animationKey: this.state === 'idle' ? config.holdAnimationKey : step.animationKey, normalizedTime: Math.min(1, this.stateTime / Math.max(.001, duration)) };
  }

  private startStep(config: WeaponConfig, events: CombatEvent[]) {
    this.buffered = false; this.state = 'windup'; this.stateTime = 0;
    const step = config.combo[this.stepIndex];
    events.push({ type: 'attack-started', stepIndex: this.stepIndex, step });
  }
}

export class CombatController extends WeaponManager {}
