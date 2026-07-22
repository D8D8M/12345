type ThroneRoomBounds = { left: number; top: number; floor: number; width: number };

const drawWindow = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hue: 'red' | 'violet') => {
  const glass = ctx.createLinearGradient(x, y, x, y + h);
  glass.addColorStop(0, hue === 'red' ? '#40152c' : '#251947');
  glass.addColorStop(.5, hue === 'red' ? '#9d2945' : '#573278');
  glass.addColorStop(1, '#151326');
  ctx.fillStyle = glass;
  ctx.beginPath(); ctx.moveTo(x, y + 42); ctx.quadraticCurveTo(x + w / 2, y - 28, x + w, y + 42); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#0b0b13'; ctx.lineWidth = 9; ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 8); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * .43); ctx.lineTo(x + w, y + h * .43); ctx.moveTo(x + 12, y + 50); ctx.lineTo(x + w - 12, y + h); ctx.moveTo(x + w - 12, y + 50); ctx.lineTo(x + 12, y + h); ctx.stroke();
};

const drawBanner = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = '#d3a940'; ctx.fillRect(x - 9, y - 9, 80, 9);
  ctx.fillStyle = '#75152d'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 62, y); ctx.lineTo(x + 56, y + 156); ctx.lineTo(x + 42, y + 137); ctx.lineTo(x + 27, y + 169); ctx.lineTo(x + 13, y + 132); ctx.lineTo(x + 4, y + 149); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e2b84e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f7dc79'; ctx.font = 'bold 28px serif'; ctx.textAlign = 'center'; ctx.fillText('♛', x + 31, y + 70); ctx.textAlign = 'start';
};

const drawBlueTorch = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, phase: number) => {
  const pulse = 1 + Math.sin(time * 9 + phase) * .14;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 74 * pulse); glow.addColorStop(0, 'rgba(147,197,253,.32)'); glow.addColorStop(1, 'rgba(79,70,229,0)');
  ctx.fillStyle = glow; ctx.fillRect(x - 80, y - 80, 160, 160);
  ctx.fillStyle = '#44382e'; ctx.fillRect(x - 4, y + 10, 8, 28);
  ctx.fillStyle = '#6366f1'; ctx.beginPath(); ctx.ellipse(x, y, 8 * pulse, 18 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dbeafe'; ctx.beginPath(); ctx.ellipse(x, y + 5, 3, 8, 0, 0, Math.PI * 2); ctx.fill();
};

export const drawThroneRoom = (ctx: CanvasRenderingContext2D, room: ThroneRoomBounds, throneX: number, time: number) => {
  const { left, top, floor, width } = room, height = floor - top;
  const wall = ctx.createLinearGradient(0, top, 0, floor); wall.addColorStop(0, '#090711'); wall.addColorStop(.58, '#18131f'); wall.addColorStop(1, '#25232b');
  // Extend the masonry behind every collision wall so camera movement can
  // never expose an empty strip outside the decorated hall.
  ctx.fillStyle = wall; ctx.fillRect(left - 180, top - 180, width + 360, height + 360);
  ctx.fillStyle = '#33251e';
  for (let y = top - 160; y < floor + 160; y += 52) for (let x = left - 180; x < left + width + 180; x += 126) {
    const offset = Math.floor((y - top) / 52) % 2 ? 61 : 0;
    ctx.fillRect(x + offset, y, 116, 44);
  }
  ctx.fillStyle = 'rgba(8,6,13,.5)'; ctx.fillRect(left, top, width, height);
  ctx.strokeStyle = 'rgba(91,83,96,.18)'; ctx.lineWidth = 2;
  for (let y = top + 28; y < floor; y += 44) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + width, y); ctx.stroke(); }

  const gold = ctx.createLinearGradient(left, 0, left + width, 0);
  gold.addColorStop(0, '#76511b'); gold.addColorStop(.25, '#e6bd52'); gold.addColorStop(.5, '#8f6422'); gold.addColorStop(.75, '#f2d16d'); gold.addColorStop(1, '#694516');
  ctx.fillStyle = gold; ctx.fillRect(left, top + 12, width, 14); ctx.fillRect(left, floor - 50, width, 12);
  ctx.fillRect(left + 22, top + 26, 9, height - 76); ctx.fillRect(left + width - 31, top + 26, 9, height - 76);
  for (let x = left + 70; x < left + width - 70; x += 190) {
    ctx.strokeStyle = 'rgba(231,190,82,.32)'; ctx.lineWidth = 3; ctx.strokeRect(x, top + 42, 142, height - 116);
    ctx.fillStyle = '#d1a33d'; ctx.beginPath(); ctx.arc(x + 71, top + 57, 5, 0, Math.PI * 2); ctx.fill();
  }

  const windowY = top + 46, windowW = 235, windowH = 300;
  drawWindow(ctx, left + 340, windowY, windowW, windowH, 'violet');
  drawWindow(ctx, left + 720, windowY - 16, windowW + 30, windowH + 28, 'red');
  drawWindow(ctx, throneX - 82, windowY - 10, windowW + 52, windowH + 38, 'violet');

  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [x, color] of [[left + 450, 'rgba(108,63,160,.15)'], [left + 845, 'rgba(164,40,69,.17)'], [throneX + 55, 'rgba(114,56,147,.18)']] as const) {
    const ray = ctx.createLinearGradient(x, windowY + windowH, x - 170, floor); ray.addColorStop(0, color); ray.addColorStop(1, 'rgba(80,35,100,0)');
    ctx.fillStyle = ray; ctx.beginPath(); ctx.moveTo(x - 70, windowY + windowH - 25); ctx.lineTo(x + 70, windowY + windowH - 25); ctx.lineTo(x + 260, floor); ctx.lineTo(x - 290, floor); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  for (const x of [left + 115, left + 620, left + 1090, left + width - 150]) {
    ctx.fillStyle = '#211b1b'; ctx.fillRect(x, top + 18, 66, height - 18); ctx.fillStyle = gold; ctx.fillRect(x - 13, top + 12, 92, 20); ctx.fillRect(x - 18, floor - 28, 102, 28);
    ctx.strokeStyle = '#d0a844'; ctx.lineWidth = 4; ctx.strokeRect(x + 7, top + 42, 52, height - 80);
  }
  for (const x of [left + 205, left + 645, left + 1080, left + 1325, left + width - 265]) drawBanner(ctx, x, top + 72 + (x % 3) * 5);
  drawBlueTorch(ctx, left + 148, top + 300, time, 0); drawBlueTorch(ctx, left + 653, top + 330, time, 1.7); drawBlueTorch(ctx, left + width - 117, top + 300, time, 3.2);

  ctx.fillStyle = '#17171d'; ctx.fillRect(left, floor - 36, width, 36);
  ctx.strokeStyle = '#46414b'; ctx.lineWidth = 3; for (let x = left + 80; x < left + width; x += 155) { ctx.beginPath(); ctx.moveTo(x, floor); ctx.lineTo(x + 48, floor - 36); ctx.lineTo(x + 102, floor - 10); ctx.stroke(); }
  const carpetLeft = left + 86, carpetRight = throneX + 125;
  ctx.fillStyle = '#571124'; ctx.beginPath(); ctx.moveTo(carpetLeft, floor); ctx.lineTo(carpetLeft + 26, floor - 23); ctx.lineTo(carpetRight - 18, floor - 23); ctx.lineTo(carpetRight, floor); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#98652f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(carpetLeft + 10, floor - 2); ctx.lineTo(carpetLeft + 32, floor - 20); ctx.moveTo(carpetRight - 9, floor - 2); ctx.lineTo(carpetRight - 24, floor - 20); ctx.stroke();

  ctx.fillStyle = '#121015'; ctx.fillRect(left + 8, floor - 158, 70, 158); ctx.strokeStyle = '#5b4633'; ctx.lineWidth = 6; ctx.strokeRect(left + 14, floor - 151, 58, 151);
  ctx.fillStyle = '#3a2418'; for (let x = left + 20; x < left + 70; x += 13) ctx.fillRect(x, floor - 146, 8, 142);
  ctx.fillStyle = '#77717a'; ctx.fillRect(left + 15, floor - 112, 56, 9); ctx.fillRect(left + 40, floor - 150, 8, 150);
};

export const drawStoneThrone = (ctx: CanvasRenderingContext2D, throne: { x: number; y: number; w: number; h: number }) => {
  const { x, y, w, h } = throne;
  ctx.fillStyle = '#5f431b'; ctx.fillRect(x - 58, y + h - 20, w + 116, 20); ctx.fillStyle = '#b88a32'; ctx.fillRect(x - 37, y + h - 39, w + 74, 19);
  const stone = ctx.createLinearGradient(x, y, x + w, y + h); stone.addColorStop(0, '#55515a'); stone.addColorStop(.48, '#25242b'); stone.addColorStop(1, '#15151a');
  ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(x - 17, y + h); ctx.lineTo(x - 17, y - 5); ctx.lineTo(x + 4, y - 36); ctx.lineTo(x + w / 2, y - 73); ctx.lineTo(x + w - 4, y - 36); ctx.lineTo(x + w + 17, y - 5); ctx.lineTo(x + w + 17, y + h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e5bd55'; ctx.lineWidth = 7; ctx.stroke();
  ctx.strokeStyle = '#fff0a3'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#39101d'; ctx.fillRect(x + 18, y + 23, w - 36, h - 43); ctx.fillStyle = '#6d2737'; ctx.fillRect(x + 24, y + 29, w - 48, 7);
  ctx.fillStyle = '#8f7138'; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 51); ctx.lineTo(x + w / 2 - 27, y - 27); ctx.lineTo(x + w / 2 - 19, y - 6); ctx.lineTo(x + w / 2, y - 18); ctx.lineTo(x + w / 2 + 19, y - 6); ctx.lineTo(x + w / 2 + 27, y - 27); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2cf65'; for (const finialX of [x - 17, x + w + 17]) { ctx.beginPath(); ctx.arc(finialX, y - 5, 8, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#111116'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 7, y + 44); ctx.lineTo(x + 13, y + 28); ctx.lineTo(x + 5, y + 12); ctx.moveTo(x + w + 8, y + 53); ctx.lineTo(x + w - 12, y + 36); ctx.lineTo(x + w - 3, y + 18); ctx.stroke();
};
