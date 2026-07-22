export type FinalBox = { x: number; y: number; w: number; h: number };

export type CastleMirror = FinalBox & { pairId: number; facing: -1 | 1; phase: number };
export type CrossbowStatue = FinalBox & { facing: -1 | 1; cooldown: number; hp: number; maxHp: number; hurt: number; dead: boolean };
export type ThroneColumn = FinalBox;

type PalaceRoom = { id: number; col: number; row: number; x: number; y: number };

export const createCastleMirrors = (rooms: PalaceRoom[], roomW: number, roomH: number): CastleMirror[] => {
  if (!rooms.length) return [];
  const maxCol = Math.max(...rooms.map((room) => room.col));
  const maxRow = Math.max(...rooms.map((room) => room.row));
  const corners = [
    rooms.find((room) => room.col === 0 && room.row === maxRow),
    rooms.find((room) => room.col === maxCol && room.row === 0),
    rooms.find((room) => room.col === maxCol && room.row === maxRow),
    rooms.find((room) => room.col === 0 && room.row === 0),
  ].filter((room): room is PalaceRoom => Boolean(room));
  return corners.map((room, index) => ({
    x: room.x + (index % 2 ? roomW - 112 : 68), y: room.y + roomH - 164,
    w: 44, h: 118, pairId: Math.floor(index / 2), facing: index % 2 ? -1 : 1,
    phase: index * Math.PI / 2,
  }));
};

export const createCrossbowStatues = (rooms: PalaceRoom[], roomW: number, roomH: number): CrossbowStatue[] => rooms
  .filter((room) => (room.id + room.row) % 3 === 1)
  .map((room, index) => ({
    x: room.x + (index % 2 ? roomW - 82 : 26), y: room.y + roomH * .43,
    w: 56, h: 44, facing: index % 2 ? -1 : 1, cooldown: index % 2,
    hp: 90, maxHp: 90, hurt: 0, dead: false,
  }));

export const createThroneColumns = (ceilingY: number, floorY: number): ThroneColumn[] => [190, 390, 660, 860].map((x) => ({
  x, y: ceilingY, w: 62, h: floorY - ceilingY,
}));

export const drawCastleMirror = (ctx: CanvasRenderingContext2D, mirror: CastleMirror, time: number, nearby: boolean) => {
  const glow = .55 + Math.sin(time * 3 + mirror.phase) * .18;
  ctx.save();
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 18 + glow * 12;
  ctx.fillStyle = '#5b3a25'; ctx.fillRect(mirror.x - 8, mirror.y - 8, mirror.w + 16, mirror.h + 16);
  const glass = ctx.createLinearGradient(mirror.x, mirror.y, mirror.x + mirror.w, mirror.y + mirror.h);
  glass.addColorStop(0, '#c4b5fd'); glass.addColorStop(.45, '#312e81'); glass.addColorStop(1, '#67e8f9');
  ctx.fillStyle = glass; ctx.fillRect(mirror.x, mirror.y, mirror.w, mirror.h);
  ctx.strokeStyle = '#f5d77a'; ctx.lineWidth = 4; ctx.strokeRect(mirror.x - 5, mirror.y - 5, mirror.w + 10, mirror.h + 10);
  ctx.globalAlpha = .3 + glow * .25; ctx.fillStyle = '#fff'; ctx.fillRect(mirror.x + 8, mirror.y + 8, 5, mirror.h - 22);
  ctx.restore();
  if (nearby) { ctx.fillStyle = 'rgba(5,3,12,.9)'; ctx.fillRect(mirror.x - 28, mirror.y - 30, 102, 20); ctx.fillStyle = '#ddd6fe'; ctx.font = 'bold 10px monospace'; ctx.fillText('E · ЗЕРКАЛО', mirror.x - 17, mirror.y - 16); }
};

export const drawCrossbowStatue = (ctx: CanvasRenderingContext2D, statue: CrossbowStatue) => {
  const centerX = statue.x + statue.w / 2, centerY = statue.y + statue.h / 2;
  ctx.save();
  if (statue.dead) {
    ctx.globalAlpha = .75;
    ctx.fillStyle = '#24232a'; ctx.fillRect(statue.x - 3, statue.y + statue.h - 10, statue.w + 6, 16);
    ctx.fillStyle = '#625b61'; ctx.fillRect(statue.x + 5, statue.y + statue.h - 17, 13, 8); ctx.fillRect(statue.x + 29, statue.y + statue.h - 14, 18, 6);
    ctx.strokeStyle = '#887b68'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(statue.x + 12, statue.y + statue.h - 12); ctx.lineTo(statue.x + 47, statue.y + statue.h - 3); ctx.stroke();
    ctx.restore(); return;
  }
  if (statue.hurt > 0) { ctx.shadowColor = '#fff7ed'; ctx.shadowBlur = 14; }
  // A broad bolted plate and triangular braces make this read as architecture,
  // not as an invulnerable humanoid enemy.
  ctx.fillStyle = '#292832'; ctx.fillRect(statue.x - 4, statue.y - 6, statue.w + 8, statue.h + 12);
  ctx.strokeStyle = '#756f78'; ctx.lineWidth = 3; ctx.strokeRect(statue.x - 4, statue.y - 6, statue.w + 8, statue.h + 12);
  ctx.fillStyle = '#a59ca5';
  for (const [x, y] of [[statue.x + 4, statue.y + 2], [statue.x + statue.w - 8, statue.y + 2], [statue.x + 4, statue.y + statue.h - 6], [statue.x + statue.w - 8, statue.y + statue.h - 6]]) ctx.fillRect(x, y, 4, 4);
  ctx.strokeStyle = '#665f69'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX - statue.facing * 18, statue.y + statue.h + 12); ctx.moveTo(centerX, centerY); ctx.lineTo(centerX - statue.facing * 18, statue.y - 12); ctx.stroke();
  ctx.translate(centerX, centerY); ctx.scale(statue.facing, 1);
  ctx.fillStyle = '#4b2d20'; ctx.fillRect(-15, -4, 59, 8); ctx.fillStyle = '#b7a27d'; ctx.fillRect(8, -2, 42, 4);
  ctx.strokeStyle = '#d6c5a6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, -18); ctx.lineTo(44, 0); ctx.lineTo(18, 18); ctx.stroke();
  ctx.strokeStyle = '#887b68'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, -18); ctx.lineTo(18, 18); ctx.stroke();
  ctx.fillStyle = '#18171d'; ctx.fillRect(-9, 4, 12, 10); ctx.restore();
  const healthWidth = statue.w + 8;
  ctx.fillStyle = 'rgba(10,8,12,.9)'; ctx.fillRect(statue.x - 4, statue.y - 17, healthWidth, 6);
  ctx.fillStyle = statue.hurt > 0 ? '#fff7ed' : '#ef4444'; ctx.fillRect(statue.x - 4, statue.y - 17, healthWidth * Math.max(0, statue.hp / statue.maxHp), 6);
};

export const drawThroneColumn = (ctx: CanvasRenderingContext2D, column: ThroneColumn) => {
  ctx.save();
  ctx.globalAlpha = .58;
  const marble = ctx.createLinearGradient(column.x, 0, column.x + column.w, 0);
  marble.addColorStop(0, '#78716c'); marble.addColorStop(.3, '#e7e5e4'); marble.addColorStop(.7, '#cbd5e1'); marble.addColorStop(1, '#716b75');
  ctx.fillStyle = marble; ctx.fillRect(column.x, column.y, column.w, column.h);
  ctx.fillStyle = '#e7e5e4'; ctx.fillRect(column.x - 13, column.y, column.w + 26, 18); ctx.fillRect(column.x - 18, column.y + column.h - 24, column.w + 36, 24);
  ctx.strokeStyle = 'rgba(71,85,105,.45)'; ctx.beginPath(); ctx.moveTo(column.x + 19, column.y + 45); ctx.lineTo(column.x + 35, column.y + 120); ctx.lineTo(column.x + 23, column.y + 215); ctx.stroke();
  ctx.restore();
};

export const drawFinalStoneWall = (ctx: CanvasRenderingContext2D, wall: FinalBox) => {
  ctx.save();
  const stone = ctx.createLinearGradient(wall.x, 0, wall.x + wall.w, 0);
  stone.addColorStop(0, '#17191d'); stone.addColorStop(.22, '#4b4b4d');
  stone.addColorStop(.7, '#292a2d'); stone.addColorStop(1, '#0d0f12');
  ctx.fillStyle = stone; ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.strokeStyle = '#08090b'; ctx.lineWidth = 4; ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

  const courseH = 46;
  ctx.lineWidth = 3;
  for (let row = 0, y = wall.y; y < wall.y + wall.h; row++, y += courseH) {
    ctx.strokeStyle = row % 3 === 0 ? '#77716b' : '#555250';
    ctx.beginPath(); ctx.moveTo(wall.x + 3, y); ctx.lineTo(wall.x + wall.w - 3, y); ctx.stroke();
    const offset = row % 2 ? wall.w * .32 : wall.w * .68;
    ctx.beginPath(); ctx.moveTo(wall.x + offset, y); ctx.lineTo(wall.x + offset, Math.min(y + courseH, wall.y + wall.h)); ctx.stroke();
  }

  ctx.restore();
};
