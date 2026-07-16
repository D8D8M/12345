type Tile = { x: number; y: number; w: number; h: number };

export type EnvironmentTileStyle = {
  material: 'stone' | 'wood';
  base: string;
  dark: string;
  edge: string;
  moss: string;
  wet: boolean;
};

const noise = (value: number) => {
  const wave = Math.sin(value * 12.9898) * 43758.5453;
  return wave - Math.floor(wave);
};

const traceSilhouette = (ctx: CanvasRenderingContext2D, tile: Tile, roughness: number) => {
  const step = Math.max(10, Math.min(22, tile.w / 5));
  ctx.beginPath();
  ctx.moveTo(tile.x, tile.y + roughness * .6);
  for (let x = tile.x; x < tile.x + tile.w; x += step) {
    const px = Math.min(tile.x + tile.w, x + (noise(x + tile.y) - .5) * 5);
    ctx.lineTo(px, tile.y + roughness * (.25 + noise(x * .17 + tile.y) * .75));
  }
  ctx.lineTo(tile.x + tile.w, tile.y + roughness * .55);
  ctx.lineTo(tile.x + tile.w - roughness * .35, tile.y + tile.h);
  ctx.lineTo(tile.x + roughness * .45, tile.y + tile.h);
  ctx.closePath();
};

const drawCrack = (ctx: CanvasRenderingContext2D, x: number, y: number, length: number, seed: number) => {
  ctx.beginPath(); ctx.moveTo(x, y);
  let px = x;
  for (let i = 1; i <= 4; i += 1) {
    px += (noise(seed + i) - .5) * 12;
    ctx.lineTo(px, y + length * i / 4);
  }
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, y + length * .72); ctx.lineTo(px + (noise(seed + 8) - .5) * 15, y + length * .88); ctx.stroke();
};

const drawMoss = (ctx: CanvasRenderingContext2D, tile: Tile, color: string) => {
  ctx.fillStyle = color;
  for (let x = tile.x + 5; x < tile.x + tile.w - 4; x += 17) {
    if (noise(x * .7 + tile.y) < .5) continue;
    const width = 8 + noise(x + 2) * 11, length = 4 + noise(x) * 15;
    ctx.fillRect(x, tile.y + 2, width, 3);
    ctx.beginPath(); ctx.moveTo(x + 2, tile.y + 4); ctx.lineTo(x + 5, tile.y + length); ctx.lineTo(x + 8, tile.y + 4); ctx.fill();
  }
};

const drawStone = (ctx: CanvasRenderingContext2D, tile: Tile, style: EnvironmentTileStyle) => {
  const roughness = Math.min(9, Math.max(3, tile.h * .22));
  traceSilhouette(ctx, tile, roughness); ctx.fillStyle = style.base; ctx.fill();
  ctx.save(); traceSilhouette(ctx, tile, roughness); ctx.clip();
  const shade = ctx.createLinearGradient(0, tile.y, 0, tile.y + tile.h);
  shade.addColorStop(0, 'rgba(255,255,255,.16)'); shade.addColorStop(.24, 'rgba(255,255,255,.02)'); shade.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = shade; ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
  const rowHeight = Math.max(16, Math.min(25, tile.h * .42));
  ctx.strokeStyle = style.dark; ctx.lineWidth = 2.5;
  for (let row = 0, y = tile.y + rowHeight; y < tile.y + tile.h; row += 1, y += rowHeight) {
    ctx.beginPath(); ctx.moveTo(tile.x, y); ctx.lineTo(tile.x + tile.w, y + (noise(y) - .5) * 3); ctx.stroke();
    for (let x = tile.x + (row % 2 ? 18 : 43); x < tile.x + tile.w; x += 58) {
      ctx.beginPath(); ctx.moveTo(x, y - rowHeight); ctx.lineTo(x + (noise(x) - .5) * 4, y); ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(5,7,9,.72)'; ctx.lineWidth = 1.8;
  for (let x = tile.x + 25; x < tile.x + tile.w - 10; x += 67) if (noise(x + tile.y) > .42) drawCrack(ctx, x, tile.y + roughness, Math.min(tile.h - roughness, 20 + noise(x) * 30), x);
  ctx.restore();
  ctx.strokeStyle = style.edge; ctx.globalAlpha = .8; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(tile.x, tile.y + roughness * .6);
  for (let x = tile.x + 8; x <= tile.x + tile.w; x += 16) ctx.lineTo(Math.min(x, tile.x + tile.w), tile.y + roughness * (.2 + noise(x * .17 + tile.y) * .7));
  ctx.stroke(); ctx.globalAlpha = 1;
  drawMoss(ctx, tile, style.moss);
  if (style.wet) {
    ctx.fillStyle = 'rgba(126,220,226,.46)';
    for (let x = tile.x + 18; x < tile.x + tile.w; x += 59) if (noise(x + tile.y) > .48) {
      const length = 7 + noise(x) * 18; ctx.fillRect(x, tile.y + tile.h - 1, 2, length);
      ctx.beginPath(); ctx.arc(x + 1, tile.y + tile.h + length + 2, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
};

const drawRivet = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = '#111419'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#879099'; ctx.beginPath(); ctx.arc(x - 1, y - 1, 1.5, 0, Math.PI * 2); ctx.fill();
};

const drawWood = (ctx: CanvasRenderingContext2D, tile: Tile, style: EnvironmentTileStyle) => {
  const roughness = Math.min(7, Math.max(3, tile.h * .24));
  traceSilhouette(ctx, tile, roughness); ctx.fillStyle = style.dark; ctx.fill();
  ctx.save(); traceSilhouette(ctx, tile, roughness); ctx.clip();
  const plankHeight = Math.max(9, Math.min(17, tile.h / 2));
  for (let row = 0, y = tile.y; y < tile.y + tile.h; row += 1, y += plankHeight) {
    ctx.fillStyle = row % 2 ? style.base : style.edge; ctx.fillRect(tile.x, y, tile.w, plankHeight - 2);
    ctx.fillStyle = 'rgba(255,220,155,.13)'; ctx.fillRect(tile.x + 5, y + 3, Math.max(0, tile.w - 10), 2);
    ctx.strokeStyle = 'rgba(34,18,11,.64)'; ctx.lineWidth = 1.2;
    for (let x = tile.x + 12; x < tile.x + tile.w; x += 43) {
      ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.bezierCurveTo(x + 8, y + 1, x + 20, y + 10, x + 31, y + 5); ctx.stroke();
    }
  }
  ctx.restore();
  ctx.fillStyle = '#27272a'; ctx.fillRect(tile.x + 3, tile.y + 3, 7, Math.max(4, tile.h - 6)); ctx.fillRect(tile.x + tile.w - 10, tile.y + 3, 7, Math.max(4, tile.h - 6));
  for (const x of [tile.x + 6.5, tile.x + tile.w - 6.5]) for (let y = tile.y + 8; y < tile.y + tile.h; y += 18) drawRivet(ctx, x, y);
  drawMoss(ctx, { ...tile, y: tile.y + tile.h - 4 }, style.moss);
};

export const drawEnvironmentTile = (ctx: CanvasRenderingContext2D, tile: Tile, style: EnvironmentTileStyle) => {
  if (tile.w <= 0 || tile.h <= 0) return;
  ctx.save();
  if (style.material === 'wood') drawWood(ctx, tile, style); else drawStone(ctx, tile, style);
  ctx.restore();
};
