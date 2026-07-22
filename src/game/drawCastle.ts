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

const traceArch = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const curveY = y + h * .42;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, curveY);
  ctx.arc(x + w / 2, curveY, w / 2, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
};

export const drawCastleBackdrop = (ctx: CanvasRenderingContext2D, level: CastleLevel, time: number) => {
  for (const wall of level.walls) {
    ctx.fillStyle = '#4b382d';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = 'rgba(27,19,25,.48)';
    for (let y = wall.y; y < wall.y + wall.h; y += 52) {
      const row = Math.floor((y - wall.y) / 52);
      for (let x = wall.x - (row % 2) * 65; x < wall.x + wall.w; x += 130) {
        ctx.fillRect(x, y + 45, 122, 7);
        ctx.fillRect(x + 122, y, 8, 52);
      }
    }
    ctx.strokeStyle = 'rgba(214,173,75,.22)';
    ctx.lineWidth = 3;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }
  for (const arch of level.arches) {
    traceArch(ctx, arch.x, arch.y, arch.w, arch.h);
    const night = ctx.createLinearGradient(0, arch.y, 0, arch.y + arch.h);
    night.addColorStop(0, '#090d20'); night.addColorStop(1, '#171a36');
    ctx.fillStyle = night; ctx.fill();
    ctx.save(); traceArch(ctx, arch.x, arch.y, arch.w, arch.h); ctx.clip();
    for (let star = 0; star < 38; star++) {
      const x = arch.x + 16 + ((star * 97 + arch.x * .13) % (arch.w - 32));
      const y = arch.y + 16 + ((star * 53 + arch.y * .17) % (arch.h - 32));
      const radius = .8 + (star % 4) * .38;
      ctx.globalAlpha = .42 + Math.sin(time * (1.2 + star % 3 * .25) + star) * .25;
      ctx.fillStyle = star % 6 === 0 ? '#ffe7a0' : '#dbeafe';
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    traceArch(ctx, arch.x, arch.y, arch.w, arch.h);
    ctx.strokeStyle = '#8f6829'; ctx.lineWidth = 14; ctx.stroke();
    traceArch(ctx, arch.x, arch.y, arch.w, arch.h);
    ctx.strokeStyle = '#f0ca68'; ctx.lineWidth = 4; ctx.stroke();
  }
  for (const banner of level.banners) {
    ctx.save(); ctx.translate(banner.x, banner.y); ctx.scale(banner.scale, banner.scale);
    const color = banner.color === 'red' ? '#801f32' : '#173f7a';
    ctx.fillStyle = '#d6ad4b'; ctx.fillRect(-7, -8, 82, 7);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(68, 0);
    ctx.lineTo(68, 116); ctx.lineTo(34, 94); ctx.lineTo(0, 116); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e4bd55'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f3d77d'; ctx.font = 'bold 28px serif'; ctx.textAlign = 'center';
    ctx.fillText(banner.crest === 'crown' ? '♛' : '♜', 34, 58); ctx.restore();
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
