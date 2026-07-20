import { drawWalkingLegs } from './drawWalkingLegs';
import { drawHoodedMarksman, drawRottenPrisoner, drawSummonedPrisoner } from './drawPrisonEnemies';
import { drawMireShaman, drawSwampSlime, drawSwampTotem } from './drawLowlandEnemies';
import { drawBlindMiner, drawCartGuardian, drawDemolisher } from './drawMineEnemies';
import { drawFlyingGear, drawTowerSniper, drawWatchSoldier } from './drawClockEnemies';
import { drawCryptSeal, drawFallenPhantom, drawNecromancer } from './drawCryptEnemies';
import { drawBridgeKnight, drawGargoyleBomber } from './drawBridgeEnemies';
import { drawRoyalGuard, drawRoyalSorcerer } from './drawCastleEnemies';

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
type Pose = { variant: EarlyEnemyVariant; time: number; vx: number; vy: number; attack: number; attackProgress: number; hurt: number; blocked: number; stunned: number; defeated: boolean };
const rect = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const humanoid = (c: CanvasRenderingContext2D, p: Pose, body: string, skin: string, eye: string) => {
  const movement = Math.min(1, Math.max(0, (Math.abs(p.vx) - 8) / 70));
  drawWalkingLegs(c, { phase: p.time * (4.2 + movement * 5.8), moving: movement > .04 && p.stunned <= 0 && !p.defeated, movement, legColor: body, bootColor: '#090b0e', hipY: 4, spacing: 4, legWidth: 4, legLength: 10, bootWidth: 6, bootHeight: 5 });
  rect(c, p.hurt > 0 ? '#fff7ed' : body, -8, -7, 16, 13); rect(c, skin, -6, -14, 12, 8); rect(c, skin, 8, -5, 4, 11); rect(c, eye, 2, -11, 3, 2);
};
export const drawEarlyEnemy = (c: CanvasRenderingContext2D, p: Pose) => {
  const v = p.variant;
  if (v === 'marshSlime') { drawSwampSlime(c, p); return; }
  if (v === 'swampTotem') { drawSwampTotem(c, p); return; }
  if (v === 'minecartDefender') { drawCartGuardian(c, p); return; }
  if (v === 'rottenPrisoner') { drawRottenPrisoner(c, p); return; }
  if (v === 'cappedArcher') { drawHoodedMarksman(c, p); return; }
  if (v === 'bogShaman') { drawMireShaman(c, p); return; }
  if (v === 'blindMiner') { drawBlindMiner(c, p); return; }
  if (v === 'dynamiteTosser') { drawDemolisher(c, p); return; }
  if (v === 'clockworkSoldier') { drawWatchSoldier(c, p); return; }
  if (v === 'gearFlyer') { drawFlyingGear(c, p); return; }
  if (v === 'towerSniper') { drawTowerSniper(c, p); return; }
  if (v === 'wraith') { drawFallenPhantom(c, p); return; }
  if (v === 'necromancer') { drawNecromancer(c, p); return; }
  if (v === 'cryptTotem') { drawCryptSeal(c, p); return; }
  if (v === 'bridgeKnight') { drawBridgeKnight(c, p); return; }
  if (v === 'gargoyleBomber') { drawGargoyleBomber(c, p); return; }
  if (v === 'royalGuard') { drawRoyalGuard(c, p); return; }
  if (v === 'royalSorcerer') { drawRoyalSorcerer(c, p); return; }
  if (v === 'summonedPrisoner') { drawSummonedPrisoner(c, p); return; }
  humanoid(c, p, '#70472e', '#8a6044', '#ff9b2f'); rect(c, '#4c3021', -9, -8, 18, 3); rect(c, '#a5221f', 9, -3, 5, 12); rect(c, '#d43a2e', 14, -3, 3, 12); rect(c, '#ff9d2e', 11, -6, 2, 3); rect(c, '#ffd45a', 14, -8, 2, 2);
};
