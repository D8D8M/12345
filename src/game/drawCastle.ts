import type { CastleLevel } from './castleLevel';

const drawFlame = (ctx: CanvasRenderingContext2D, x: number, y: number, phase: number, time: number) => {
  const pulse = 1 + Math.sin(time * 11 + phase) * .12;
  const glow = ctx.createRadialGradient(x, y, 3, x, y, 72 * pulse);
  glow.addColorStop(0, 'rgba(255,192,73,.42)'); glow.addColorStop(1, 'rgba(255,126,24,0)');
  ctx.fillStyle = glow; ctx.fillRect(x - 80, y - 80, 160, 160);
  ctx.fillStyle = '#5b351f'; ctx.fillRect(x - 4, y + 10, 8, 24);
  ctx.fillStyle = '#ff8a22'; ctx.beginPath(); ctx.ellipse(x, y, 9 * pulse, 18 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff0a3'; ctx.beginPath(); ctx.ellipse(x, y + 5, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
};

export const drawCastleBackdrop = (ctx: CanvasRenderingContext2D, level: CastleLevel, time: number) => {
  for (const arch of level.arches) {
    ctx.fillStyle = '#15182a'; ctx.fillRect(arch.x, arch.y + arch.h * .42, arch.w, arch.h * .58);
    ctx.beginPath(); ctx.arc(arch.x + arch.w / 2, arch.y + arch.h * .42, arch.w / 2, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#b88a36'; ctx.lineWidth = 9; ctx.stroke();
    ctx.strokeStyle = '#f0ca68'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const banner of level.banners) {
    const color = banner.color === 'red' ? '#801f32' : '#173f7a';
    ctx.fillStyle = '#d6ad4b'; ctx.fillRect(banner.x - 7, banner.y - 8, 82, 7);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(banner.x, banner.y); ctx.lineTo(banner.x + 68, banner.y);
    ctx.lineTo(banner.x + 68, banner.y + 116); ctx.lineTo(banner.x + 34, banner.y + 94); ctx.lineTo(banner.x, banner.y + 116); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e4bd55'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f3d77d'; ctx.font = 'bold 28px serif'; ctx.textAlign = 'center';
    ctx.fillText(banner.crest === 'crown' ? '♛' : '♜', banner.x + 34, banner.y + 58);
  }
  for (const carpet of level.carpets) {
    ctx.fillStyle = '#551226'; ctx.fillRect(carpet.x, carpet.y, carpet.w, carpet.h);
    ctx.fillStyle = '#b12a42'; ctx.fillRect(carpet.x, carpet.y, carpet.w, 5);
    ctx.fillStyle = '#d4aa45'; ctx.fillRect(carpet.x, carpet.y, 7, carpet.h); ctx.fillRect(carpet.x + carpet.w - 7, carpet.y, 7, carpet.h);
  }
  for (const stairs of level.staircases) {
    ctx.fillStyle = '#39271e'; ctx.fillRect(stairs.x - 6, stairs.y, 12, stairs.h);
    ctx.strokeStyle = '#d8ad48'; ctx.lineWidth = 5; ctx.beginPath();
    ctx.moveTo(stairs.x - 54, stairs.y + stairs.h);
    ctx.bezierCurveTo(stairs.x + 85, stairs.y + stairs.h * .78, stairs.x - 85, stairs.y + stairs.h * .36, stairs.x + 54, stairs.y);
    ctx.stroke();
    ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  for (const torch of level.torches) drawFlame(ctx, torch.x, torch.y, torch.phase, time);
};
