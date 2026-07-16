import type { MineCart } from './minesLevel';
import type { CrumblingSlab, GhostPlatform } from './cryptLevel';

export const ghostPlatformVisible = (platform: { phase?: number }, time: number) =>
  (time + (platform.phase ?? 0)) % 3 < 1.8;

export const drawMineMechanics = (ctx: CanvasRenderingContext2D, carts: MineCart[]) => {
  for (const cart of carts) {
    ctx.fillStyle = '#20252a'; ctx.fillRect(cart.x, cart.y + 8, cart.w, cart.h - 18);
    ctx.fillStyle = cart.moving ? '#f59e0b' : '#66717b'; ctx.fillRect(cart.x + 7, cart.y + 14, cart.w - 14, 7);
    ctx.fillStyle = '#080a0c';
    for (const x of [cart.x + 19, cart.x + cart.w - 19]) { ctx.beginPath(); ctx.arc(x, cart.y + cart.h - 3, 12, 0, Math.PI * 2); ctx.fill(); }
  }
};

export const drawCryptMechanics = (ctx: CanvasRenderingContext2D, slabs: CrumblingSlab[], ghosts: GhostPlatform[], time: number) => {
  for (const slab of slabs) if (slab.state !== 'fallen') {
    ctx.fillStyle = slab.state === 'cracking' ? '#51475e' : '#393342'; ctx.fillRect(slab.x, slab.y, slab.w, slab.h);
    if (slab.state === 'cracking') { ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(slab.x + 20, slab.y); ctx.lineTo(slab.x + 55, slab.y + slab.h); ctx.lineTo(slab.x + 92, slab.y + 8); ctx.lineTo(slab.x + 125, slab.y + slab.h); ctx.stroke(); }
  }
  for (const platform of ghosts) {
    const visible = ghostPlatformVisible(platform, time);
    ctx.save(); ctx.globalAlpha = visible ? .78 : .1; ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = visible ? 18 : 4;
    ctx.fillStyle = '#9b87d8'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h); ctx.restore();
  }
};
