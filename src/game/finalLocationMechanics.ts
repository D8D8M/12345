export type FinalBox = { x: number; y: number; w: number; h: number };

export type CastleMirror = FinalBox & { pairId: number; facing: -1 | 1; phase: number };
export type CrossbowStatue = FinalBox & { facing: -1 | 1; cooldown: number };
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
    x: room.x + (index % 2 ? roomW - 76 : 40), y: room.y + roomH - 178,
    w: 36, h: 72, facing: index % 2 ? -1 : 1, cooldown: index % 2,
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
  ctx.save(); ctx.translate(statue.x + statue.w / 2, statue.y); ctx.scale(statue.facing, 1);
  ctx.fillStyle = '#77707d'; ctx.fillRect(-18, 25, 36, 47); ctx.fillStyle = '#a69eaa'; ctx.fillRect(-14, 5, 28, 25);
  ctx.fillStyle = '#292532'; ctx.fillRect(3, 12, 6, 4); ctx.strokeStyle = '#4b2d20'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(8, 31); ctx.lineTo(42, 31); ctx.stroke();
  ctx.strokeStyle = '#d6c5a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(25, 18); ctx.lineTo(42, 31); ctx.lineTo(25, 44); ctx.stroke(); ctx.restore();
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
