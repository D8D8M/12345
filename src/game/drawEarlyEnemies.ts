import { drawWalkingLegs } from './drawWalkingLegs';

export type EarlyEnemyVariant = 'rottenPrisoner' | 'summonedPrisoner' | 'cappedArcher' | 'marshSlime' | 'swampTotem' | 'bogShaman' | 'blindMiner' | 'dynamiteTosser' | 'minecartDefender' | 'clockworkSoldier' | 'gearFlyer' | 'towerSniper' | 'wraith' | 'necromancer' | 'cryptTotem' | 'bridgeKnight' | 'gargoyleBomber' | 'royalGuard' | 'royalSorcerer';
export const earlyEnemySpriteSizes: Record<EarlyEnemyVariant, { w: number; h: number }> = {
  rottenPrisoner: { w: 24, h: 32 }, cappedArcher: { w: 24, h: 32 }, marshSlime: { w: 16, h: 16 }, swampTotem: { w: 16, h: 32 },
  bogShaman: { w: 24, h: 32 }, blindMiner: { w: 24, h: 32 }, dynamiteTosser: { w: 24, h: 32 }, minecartDefender: { w: 28, h: 20 },
  clockworkSoldier: { w: 24, h: 32 }, gearFlyer: { w: 16, h: 16 }, towerSniper: { w: 24, h: 32 }, wraith: { w: 24, h: 32 },
  necromancer: { w: 24, h: 32 }, cryptTotem: { w: 16, h: 32 }, bridgeKnight: { w: 24, h: 32 }, gargoyleBomber: { w: 28, h: 28 },
  royalGuard: { w: 24, h: 32 }, royalSorcerer: { w: 24, h: 32 }, summonedPrisoner: { w: 24, h: 32 },
};
export const earlyEnemySizes: Record<EarlyEnemyVariant, { w: number; h: number }> = {
  rottenPrisoner: { w: 40, h: 52 }, cappedArcher: { w: 40, h: 52 }, marshSlime: { w: 26, h: 26 }, swampTotem: { w: 26, h: 52 },
  bogShaman: { w: 40, h: 52 }, blindMiner: { w: 40, h: 52 }, dynamiteTosser: { w: 40, h: 52 }, minecartDefender: { w: 46, h: 34 },
  clockworkSoldier: { w: 40, h: 52 }, gearFlyer: { w: 26, h: 26 }, towerSniper: { w: 40, h: 52 }, wraith: { w: 40, h: 52 },
  necromancer: { w: 40, h: 52 }, cryptTotem: { w: 26, h: 52 }, bridgeKnight: { w: 40, h: 52 }, gargoyleBomber: { w: 46, h: 46 },
  royalGuard: { w: 40, h: 52 }, royalSorcerer: { w: 40, h: 52 }, summonedPrisoner: { w: 40, h: 52 },
};
export const isEarlyEnemyVariant = (variant: string): variant is EarlyEnemyVariant => variant in earlyEnemySizes;
type Pose = { variant: EarlyEnemyVariant; time: number; vx: number; vy: number; attack: number; hurt: number; blocked: number; stunned: number; defeated: boolean };
const rect = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const humanoid = (c: CanvasRenderingContext2D, p: Pose, body: string, skin: string, eye: string) => {
  drawWalkingLegs(c, { phase: p.time * Math.min(18, 5 + Math.abs(p.vx) * .065), moving: Math.abs(p.vx) > 12 && p.stunned <= 0 && !p.defeated, legColor: body, bootColor: '#090b0e', hipY: 4, spacing: 4, legWidth: 4, legLength: 10, bootWidth: 6, bootHeight: 5 });
  rect(c, p.hurt > 0 ? '#fff7ed' : body, -8, -7, 16, 13); rect(c, skin, -6, -14, 12, 8); rect(c, skin, 8, -5, 4, 11); rect(c, eye, 2, -11, 3, 2);
};
export const drawEarlyEnemy = (c: CanvasRenderingContext2D, p: Pose) => {
  const v = p.variant, t = p.time;
  if (v === 'marshSlime') { const s = Math.abs(p.vy) > 20 ? .78 : 1 + Math.sin(t * 8) * .08; c.save(); c.scale(1 / s, s); c.globalAlpha = .72; rect(c, '#58b957', -8, -8, 16, 16); rect(c, '#8ee77d', -5, -10, 10, 4); c.globalAlpha = 1; rect(c, '#1f7a3c', -3, -3, 6, 6); rect(c, '#b7ff9b', -1, -2, 2, 2); c.restore(); return; }
  if (v === 'swampTotem') { const pulse = .45 + (Math.sin(t * 5) + 1) * .25; rect(c, '#2a1a12', -8, -16, 16, 32); rect(c, '#4b2f1d', -6, -14, 12, 28); c.save(); c.globalAlpha = pulse; c.shadowColor = '#76ff4f'; c.shadowBlur = 8; rect(c, '#65e342', -4, -10, 8, 2); rect(c, '#65e342', -1, -7, 2, 14); rect(c, '#9cff68', -4, 7, 8, 2); c.restore(); return; }
  if (v === 'minecartDefender') {
    rect(c, '#111820', -14, 4, 6, 6); rect(c, '#111820', 8, 4, 6, 6);
    rect(c, '#4b5563', -14, -7, 28, 13); rect(c, '#788391', -12, -9, 24, 4);
    rect(c, '#252c34', -8, -13, 16, 8); rect(c, '#ff8a24', -5, -10, 10, 2);
    rect(c, '#aab2bd', -11, -4, 3, 7); rect(c, '#aab2bd', 8, -4, 3, 7);
    // The shield is deliberately asymmetric: canvas mirroring now makes the
    // defender's facing direction readable and matches the guarded hit side.
    c.save();
    if (p.blocked > 0) { c.shadowColor = '#fff3a3'; c.shadowBlur = 9; }
    rect(c, p.blocked > 0 ? '#fff3a3' : '#cbd5e1', 11, -16, 7, 23);
    rect(c, '#64748b', 13, -13, 7, 17); rect(c, '#f59e0b', 15, -9, 3, 9);
    c.restore();
    rect(c, '#94a3b8', 18, -3, 11, 3);
    return;
  }
  if (v === 'rottenPrisoner') { humanoid(c, p, '#66735f', '#77846c', '#f12f38'); rect(c, '#303a32', -9, -7, 4, 15); rect(c, '#303a32', 5, -7, 4, 11); rect(c, '#1d2822', -9, 5, 5, 4); rect(c, '#6e3b25', 9, 0, 8, 3); rect(c, '#9b5a32', 15, -2, 9, 6); rect(c, '#4a2b20', 21, -3, 3, 8); return; }
  if (v === 'cappedArcher') { humanoid(c, p, '#711f38', '#9a5362', '#ff253f'); rect(c, '#57142b', -7, -17, 14, 4); rect(c, '#711f38', -9, -14, 18, 3); c.strokeStyle = '#784421'; c.lineWidth = 2; c.beginPath(); c.arc(14, 0, 8, -1.35, 1.35); c.stroke(); c.strokeStyle = '#e7d7bd'; c.lineWidth = 1; c.beginPath(); c.moveTo(16, -8); c.lineTo(11, 0); c.lineTo(16, 8); c.stroke(); return; }
  if (v === 'bogShaman') { c.save(); c.translate(0, Math.sin(t * 3) * 2); humanoid(c, p, '#30363b', '#465158', '#36f1df'); rect(c, '#20262b', -9, -16, 18, 4); rect(c, '#573b24', 10, -5, 3, 22); c.shadowColor = '#42ffe8'; c.shadowBlur = 10; rect(c, '#7cfff0', 7, -11, 9, 9); c.restore(); return; }
  if (v === 'blindMiner') { humanoid(c, p, '#24272b', '#363b3f', '#1a1b1c'); rect(c, '#17191c', -6, -12, 12, 3); rect(c, '#4b4432', -8, -16, 16, 4); c.shadowColor = '#ffd84a'; c.shadowBlur = 9; rect(c, '#ffe35b', -2, -17, 5, 4); c.shadowBlur = 0; const jab = p.attack > 0 ? 5 : 0; rect(c, '#6e492a', 8 + jab, -1, 20, 3); rect(c, '#a8b0b8', 25 + jab, -7, 3, 14); rect(c, '#a8b0b8', 20 + jab, -7, 8, 3); return; }
  if (v === 'clockworkSoldier') { humanoid(c, p, '#a97724', '#c3953d', '#71ddff'); rect(c, '#d0a443', -8, -8, 16, 3); rect(c, '#63461d', -10, -2, 3, 10); rect(c, '#72502a', 8, -1, 28, 3); rect(c, '#d6d9d8', 33, -4, 10, 9); rect(c, '#efffff', 39, -2, 6, 5); c.strokeStyle = '#d8ad45'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -3); c.lineTo(-15, -7); c.moveTo(-8, -3); c.lineTo(-15, 1); c.stroke(); return; }
  if (v === 'gearFlyer') { c.save(); c.rotate(t * 4); rect(c, '#56616e', -8, -8, 16, 16); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); rect(c, '#94a3b8', -2, -12, 4, 5); } c.restore(); c.shadowColor = '#b45cff'; c.shadowBlur = 9; rect(c, '#a855f7', -3, -3, 6, 6); rect(c, '#e9d5ff', -1, -1, 2, 2); c.shadowBlur = 0; return; }
  if (v === 'towerSniper') { humanoid(c, p, '#273979', '#40549a', '#76ff62'); rect(c, '#182653', -8, -15, 16, 4); rect(c, '#18312a', 1, -12, 5, 4); rect(c, '#18212c', 8, -3, 34, 4); rect(c, '#64748b', 38, -4, 9, 6); rect(c, '#65e85c', 19, -7, 7, 4); return; }
  if (v === 'wraith') { c.save(); c.globalAlpha = .62; const wave = Math.sin(t * 6) * 2; rect(c, '#7651a8', -8, -13, 16, 17); rect(c, '#5c3c8d', -10, -8, 20, 8); rect(c, '#69469b', -7 + wave, 3, 6, 7); rect(c, '#503177', 1 - wave, 3, 6, 9); c.shadowColor = '#c084fc'; c.shadowBlur = 12; rect(c, '#d8b4fe', -5, -8, 3, 3); rect(c, '#d8b4fe', 3, -8, 3, 3); c.restore(); return; }
  if (v === 'necromancer') { humanoid(c, p, '#111318', '#22252b', '#66f06f'); rect(c, '#080a0d', -9, -16, 18, 12); rect(c, '#6b7280', -8, -16, 3, 5); rect(c, '#6b7280', 5, -16, 3, 5); rect(c, '#164b29', 8, -5, 12, 13); rect(c, '#42d96b', 10, -3, 8, 2); rect(c, '#42d96b', 13, 1, 2, 6); return; }
  if (v === 'cryptTotem') { rect(c, '#555963', -8, -16, 16, 32); rect(c, '#757b85', -6, -14, 12, 28); c.strokeStyle = '#292d34'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, -8); c.lineTo(0, -4); c.lineTo(-3, 2); c.moveTo(5, 5); c.lineTo(1, 9); c.lineTo(4, 14); c.stroke(); c.shadowColor = '#b45cff'; c.shadowBlur = 10; rect(c, '#a855f7', -4, -7, 8, 5); rect(c, '#eadcff', -1, -6, 2, 3); c.shadowBlur = 0; return; }
  if (v === 'bridgeKnight') { humanoid(c, p, '#9ca3af', '#cbd5e1', '#ffffff'); rect(c, '#e5e7eb', -8, -16, 16, 5); rect(c, '#ffffff', -5, -11, 10, 2); rect(c, '#2563a8', -2, -21, 4, 6); rect(c, '#3b82c4', 1, -20, 5, 3); rect(c, '#58412c', 8, -1, 7, 3); rect(c, '#dce3e8', 14, -3, 26, 5); rect(c, '#f8fafc', 36, -5, 8, 9); return; }
  if (v === 'gargoyleBomber') { const flap = Math.sin(t * 12) * 5; rect(c, '#62666d', -10, -10, 20, 20); c.fillStyle = '#777c84'; c.beginPath(); c.moveTo(-8, -6); c.lineTo(-22, -14 - flap); c.lineTo(-16, 5); c.fill(); c.beginPath(); c.moveTo(8, -6); c.lineTo(22, -14 - flap); c.lineTo(16, 5); c.fill(); rect(c, '#ef3038', -6, -5, 3, 3); rect(c, '#ef3038', 3, -5, 3, 3); rect(c, '#111318', 8, 2, 11, 11); rect(c, '#6b4a26', 12, -1, 3, 4); return; }
  if (v === 'royalGuard') { humanoid(c, p, '#d5a928', '#f0c94d', '#4db8ff'); rect(c, '#2253a2', -8, -7, 16, 4); rect(c, '#f2cf55', -8, -16, 16, 5); rect(c, '#55bfff', -5, -11, 10, 2); rect(c, '#6e4824', 8, -2, 34, 3); c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(39, -8); c.lineTo(50, -2); c.lineTo(39, 4); c.fill(); rect(c, '#d6a72c', 35, -7, 3, 13); return; }
  if (v === 'royalSorcerer') { humanoid(c, p, '#142552', '#213a75', '#79baff'); rect(c, '#0b1737', -9, -16, 18, 6); rect(c, '#d6ad37', -7, -20, 14, 5); rect(c, '#f2cf55', -7, -23, 3, 5); rect(c, '#f2cf55', -1, -25, 3, 7); rect(c, '#f2cf55', 5, -23, 3, 5); rect(c, '#67512d', 10, -5, 3, 23); c.shadowColor = '#60a5fa'; c.shadowBlur = 10; rect(c, '#6fb7ff', 7, -13, 9, 9); rect(c, '#93c5fd', -10, -3, 3, 3); rect(c, '#60a5fa', 4, 4, 3, 3); c.shadowBlur = 0; return; }
  if (v === 'summonedPrisoner') { c.save(); c.globalAlpha = .58; humanoid(c, p, '#35b8b4', '#52d8d2', '#ffffff'); rect(c, '#176f70', -9, -7, 4, 15); rect(c, '#176f70', 5, -7, 4, 11); c.shadowColor = '#baffff'; c.shadowBlur = 9; rect(c, '#d8ffff', -12, 1, 5, 5); rect(c, '#d8ffff', 9, 1, 5, 5); rect(c, '#8ffff4', -9, 2, 18, 2); c.restore(); return; }
  humanoid(c, p, '#70472e', '#8a6044', '#ff9b2f'); rect(c, '#4c3021', -9, -8, 18, 3); rect(c, '#a5221f', 9, -3, 5, 12); rect(c, '#d43a2e', 14, -3, 3, 12); rect(c, '#ff9d2e', 11, -6, 2, 3); rect(c, '#ffd45a', 14, -8, 2, 2);
};
