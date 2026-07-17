type EnemyWeapon = 'melee' | 'shield' | 'crossbow' | 'bomb' | 'magic' | 'none';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => value * value * (3 - 2 * value);

export const drawPlayerSword = (
  ctx: CanvasRenderingContext2D,
  remaining: number,
  duration: number,
  direction: number,
  bladeColor = '#cbd5e1',
) => {
  if (remaining <= 0) return;
  const progress = clamp01(1 - remaining / Math.max(.01, duration));
  if (direction !== 0) {
    const thrust = progress < .28
      ? -ease(progress / .28) * 10
      : progress < .68
        ? -10 + ease((progress - .28) / .4) * 42
        : 32 - ease((progress - .68) / .32) * 24;
    ctx.save();
    ctx.translate(0, direction < 0 ? -12 - thrust : 12 + thrust);
    ctx.rotate(direction < 0 ? -Math.PI / 2 : Math.PI / 2);
    ctx.strokeStyle = '#6f5428'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = bladeColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(49, 0); ctx.stroke();
    ctx.strokeStyle = '#fffbea'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(13, -1); ctx.lineTo(47, -1); ctx.stroke();
    ctx.restore();
    if (progress > .28 && progress < .78) {
      ctx.globalAlpha = Math.sin((progress - .28) / .5 * Math.PI) * .45;
      ctx.strokeStyle = bladeColor; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-10, direction < 0 ? -35 : 35); ctx.lineTo(10, direction < 0 ? -76 : 76); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    return;
  }
  const swing = ease(clamp01(progress / .72));
  const angle = -1.65 + swing * 2.75;
  ctx.save();
  ctx.translate(10, 0);
  ctx.rotate(angle);
  ctx.strokeStyle = '#6f5428'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(17, 0); ctx.stroke();
  ctx.strokeStyle = bladeColor; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(54, 0); ctx.stroke();
  ctx.strokeStyle = '#fffbea'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(19, -1); ctx.lineTo(52, -1); ctx.stroke();
  ctx.restore();
  if (progress > .22 && progress < .82) {
    const glow = Math.sin((progress - .22) / .6 * Math.PI);
    ctx.save(); ctx.globalAlpha = glow * .16; ctx.strokeStyle = '#94a3b8'; ctx.lineCap = 'round';
    ctx.shadowColor = '#e2e8f0'; ctx.shadowBlur = 4; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(7, 0, 49, -1.4, 1.2); ctx.stroke();
    ctx.globalAlpha = glow * .4; ctx.strokeStyle = '#cbd5e1'; ctx.shadowBlur = 2; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(7, 0, 49, -1.4, 1.2); ctx.stroke();
    ctx.globalAlpha = glow * .9; ctx.strokeStyle = '#ffffff'; ctx.shadowBlur = 0; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(7, 0, 49, -1.4, 1.2); ctx.stroke(); ctx.restore();
  }
};

export const drawPlayerBow = (ctx: CanvasRenderingContext2D, remaining: number, duration: number) => {
  if (remaining <= 0) return;
  const progress = clamp01(1 - remaining / Math.max(.01, duration));
  const draw = progress < .58 ? ease(progress / .58) : Math.max(0, 1 - (progress - .58) / .18);
  ctx.save(); ctx.translate(13, -3);
  ctx.strokeStyle = '#d8a75d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, -24); ctx.quadraticCurveTo(30, 0, 10, 24); ctx.stroke();
  ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(10, -24); ctx.lineTo(10 - draw * 18, 0); ctx.lineTo(10, 24); ctx.stroke();
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(7 - draw * 18, -1, 35 + draw * 18, 3);
  ctx.beginPath(); ctx.moveTo(43, 0); ctx.lineTo(36, -4); ctx.lineTo(36, 4); ctx.fill();
  ctx.restore();
};

export const enemyWeaponFor = (kind: string): EnemyWeapon => {
  if (kind === 'crossbow') return 'crossbow';
  if (kind === 'bomber') return 'bomb';
  if (kind === 'mage' || kind === 'totem') return 'magic';
  if (kind === 'shield') return 'shield';
  if (kind === 'zombie' || kind === 'boss' || kind === 'rightHand') return 'melee';
  return 'none';
};

export const enemyAttackDuration = (kind: string, variant: string) => {
  if (kind === 'crossbow') return variant === 'cappedArcher' ? .8 : .35;
  if (kind === 'bomber') return .35;
  if (kind === 'mage') return .45;
  if (kind === 'shield') return .36;
  if (kind === 'rightHand' || kind === 'boss') return .42;
  if (kind === 'zombie') return variant === 'rottenPrisoner' ? .6 : variant === 'blindMiner' ? .16 : variant === 'clockworkSoldier' || variant === 'royalGuard' ? .18 : .3;
  return Math.max(.35, 1);
};

export const drawEnemyAttack = (ctx: CanvasRenderingContext2D, weapon: EnemyWeapon, variant: string, remaining: number, duration: number, time: number) => {
  if (remaining <= 0 || weapon === 'none') return;
  const progress = clamp01(1 - remaining / Math.max(.01, duration));
  const windup = ease(clamp01(progress / .7));
  const strike = progress < .7 ? windup : 1 - ease((progress - .7) / .3);
  if (weapon === 'crossbow') {
    ctx.save(); ctx.translate(13, 0); ctx.rotate((1 - windup) * .18);
    ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(14, 0, 13, -1.35, 1.35); ctx.stroke();
    ctx.strokeStyle = '#f5f3ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(17, -13); ctx.lineTo(17 - windup * 13, 0); ctx.lineTo(17, 13); ctx.stroke();
    ctx.fillStyle = '#e9d5ff'; ctx.fillRect(0, -2, 38, 4); ctx.restore(); return;
  }
  if (weapon === 'magic') {
    const radius = 5 + windup * 9 + Math.sin(time * 18) * 2;
    ctx.save(); ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 18; ctx.fillStyle = '#e9d5ff';
    ctx.beginPath(); ctx.arc(24, -8 - windup * 8, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); return;
  }
  if (weapon === 'bomb') {
    ctx.save(); ctx.translate(16 - windup * 14, -4 - windup * 25); ctx.rotate(progress * 2);
    ctx.fillStyle = '#fb923c'; ctx.fillRect(-7, -7, 14, 14); ctx.fillStyle = '#fde68a'; ctx.fillRect(-1, -12, 3, 6); ctx.restore(); return;
  }
  // Melee attacks move from the shoulder toward the target.  Keeping the
  // weapon almost horizontal makes the motion read as a punch/thrust instead
  // of the old universal circular swing.
  const punch = variant === 'rottenPrisoner';
  const shovel = variant === 'blindMiner';
  const heavy = variant === 'bridgeColossus' || variant === 'cryptWarden';
  const extension = strike * (heavy ? 25 : punch ? 24 : 31);
  const recoil = Math.sin(progress * Math.PI) * (heavy ? 3 : 1.5);

  ctx.save();
  ctx.translate(7 + extension, -3 + recoil);
  ctx.rotate((1 - strike) * (shovel ? -.28 : punch ? -.18 : -.12));

  // Back arm/hand: it now visibly carries the striking object.
  ctx.strokeStyle = punch ? '#8f7868' : '#6b4f36';
  ctx.lineWidth = punch ? 7 : 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12 - extension * .45, 4); ctx.lineTo(5, 0); ctx.stroke();

  if (punch) {
    ctx.fillStyle = '#9b8270';
    ctx.beginPath(); ctx.arc(10, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (weapon === 'shield') {
    ctx.fillStyle = '#a16207'; ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(3, -17); ctx.lineTo(22, -12); ctx.lineTo(24, 12); ctx.lineTo(3, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (shovel) {
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(48, 0); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(46, -9); ctx.lineTo(64, -6); ctx.lineTo(64, 6); ctx.lineTo(46, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else {
    ctx.strokeStyle = heavy ? '#64748b' : '#d1d5db'; ctx.lineWidth = heavy ? 8 : 5;
    ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(heavy ? 55 : 49, 0); ctx.stroke();
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(heavy ? 53 : 47, -1); ctx.stroke();
  }
  ctx.restore();
};
