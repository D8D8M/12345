import type { MinesLevel } from './minesLevel';

export const drawMines = (ctx: CanvasRenderingContext2D, level: MinesLevel) => {
  // Irregular silhouettes hide the rectangular collision shell and close the cave visually.
  ctx.fillStyle = '#17120f';
  for (let x = 0; x < 4000; x += 46) {
    const ridge = 18 + (x * 17 % 31);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 46, 0); ctx.lineTo(x + 46, 42 + ridge); ctx.lineTo(x + 25, 30 + ridge * .45); ctx.lineTo(x, 50 + ridge); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, 2500); ctx.lineTo(x + 46, 2500); ctx.lineTo(x + 46, 2458 - ridge); ctx.lineTo(x + 20, 2471 - ridge * .5); ctx.lineTo(x, 2450 - ridge); ctx.closePath(); ctx.fill();
  }
  for (const ore of level.ores) {
    ctx.shadowColor = ore.color; ctx.shadowBlur = 14; ctx.fillStyle = ore.color;
    ctx.beginPath(); ctx.moveTo(ore.x, ore.y); ctx.lineTo(ore.x + ore.size, ore.y - 5); ctx.lineTo(ore.x + ore.size * 1.7, ore.y + 3); ctx.lineTo(ore.x + 4, ore.y + ore.size); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const support of level.supports) {
    ctx.fillStyle = '#2a160d'; ctx.fillRect(support.x - 7, support.y, support.w + 14, 13); ctx.fillRect(support.x, support.y, support.w, support.h);
    ctx.fillStyle = '#704326'; ctx.fillRect(support.x + 4, support.y + 3, 5, support.h - 6);
    ctx.fillStyle = '#17100c'; for (let y = support.y + 40; y < support.y + support.h; y += 78) ctx.fillRect(support.x, y, support.w, 4);
  }
  for (const rail of level.rails) {
    ctx.strokeStyle = '#111317'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rail.x, rail.y); ctx.lineTo(rail.x + rail.w, rail.y); ctx.moveTo(rail.x, rail.y + 13); ctx.lineTo(rail.x + rail.w, rail.y + 13); ctx.stroke();
    ctx.fillStyle = '#4b3526'; for (let x = rail.x; x < rail.x + rail.w; x += 34) ctx.fillRect(x, rail.y - 5, 8, 24);
  }
  for (const shaft of level.shafts) {
    if (shaft.kind === 'ladder') {
      ctx.strokeStyle = '#624124'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(shaft.x - 18, shaft.y); ctx.lineTo(shaft.x - 18, shaft.y + shaft.length); ctx.moveTo(shaft.x + 18, shaft.y); ctx.lineTo(shaft.x + 18, shaft.y + shaft.length); ctx.stroke();
      ctx.fillStyle = '#805332'; for (let y = shaft.y; y < shaft.y + shaft.length; y += 24) ctx.fillRect(shaft.x - 20, y, 40, 5);
    } else {
      ctx.strokeStyle = '#59616a'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = shaft.y; y < shaft.y + shaft.length; y += 12) { ctx.ellipse(shaft.x, y, 5, 8, 0, 0, Math.PI * 2); } ctx.stroke();
    }
  }
  for (const obstacle of level.obstacles) {
    if (obstacle.kind === 'cart') {
      ctx.fillStyle = '#25282b'; ctx.fillRect(obstacle.x, obstacle.y + 18, obstacle.w, obstacle.h - 34); ctx.fillStyle = '#555b60'; ctx.fillRect(obstacle.x + 7, obstacle.y + 25, obstacle.w - 14, 8);
      ctx.fillStyle = '#0b0c0e'; ctx.beginPath(); ctx.arc(obstacle.x + 22, obstacle.y + obstacle.h - 8, 13, 0, Math.PI * 2); ctx.arc(obstacle.x + obstacle.w - 22, obstacle.y + obstacle.h - 8, 13, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#54301b'; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h / 2); ctx.rotate((i - 2) * .28); ctx.fillRect(-obstacle.w / 2, -7, obstacle.w, 14); ctx.restore(); }
    }
  }
};
