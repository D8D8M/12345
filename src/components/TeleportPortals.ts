export type TeleportPortal = {
  id: number;
  x: number;
  y: number;
  active: boolean;
  label: string;
};

type PortalRoom = {
  id: number;
  x: number;
  y: number;
};

type PortalPlatform = {
  x: number;
  y: number;
  w: number;
};

export const createTeleportPortals = (
  rooms: PortalRoom[],
  platforms: PortalPlatform[],
  startRoomId: number,
  exitRoomId: number | undefined,
  roomDistance: number[],
  roomWidth: number,
  roomHeight: number,
): TeleportPortal[] => {
  if (rooms.length < 2 || exitRoomId === undefined) return [];
  const maximumDistance = Math.max(...roomDistance.filter(Number.isFinite));
  const middleRoom = rooms
    .filter((room) => room.id !== startRoomId && room.id !== exitRoomId)
    .sort((a, b) => Math.abs(roomDistance[a.id] - maximumDistance / 2) - Math.abs(roomDistance[b.id] - maximumDistance / 2))[0];
  const selections = [
    { roomId: startRoomId, label: 'НАЧАЛО' },
    ...(middleRoom ? [{ roomId: middleRoom.id, label: 'СЕРЕДИНА' }] : []),
    { roomId: exitRoomId, label: 'ВЫХОД' },
  ].filter((selection, index, all) => all.findIndex((candidate) => candidate.roomId === selection.roomId) === index);

  return selections.map(({ roomId, label }, index) => {
    const room = rooms[roomId];
    const roomPlatforms = platforms
      .filter((platform) => platform.x >= room.x && platform.x + platform.w <= room.x + roomWidth && platform.y > room.y && platform.y <= room.y + roomHeight)
      .sort((a, b) => b.y - a.y);
    const platform = roomPlatforms[0];
    const preferredX = roomId === startRoomId ? room.x + 145 : room.x + roomWidth / 2;
    return {
      id: index,
      x: platform ? Math.max(platform.x + 35, Math.min(platform.x + platform.w - 35, preferredX)) : preferredX,
      y: platform ? platform.y : room.y + roomHeight - 42,
      active: false,
      label,
    };
  });
};

export const drawTeleportPortal = (
  ctx: CanvasRenderingContext2D,
  portal: TeleportPortal,
  time: number,
  nearby: boolean,
  activeCount: number,
) => {
  const pulse = 1 + Math.sin(time * 4 + portal.id) * .08;
  ctx.save();
  ctx.translate(portal.x, portal.y);
  ctx.shadowColor = portal.active ? '#22d3ee' : '#64748b';
  ctx.shadowBlur = portal.active ? 22 : 7;
  ctx.strokeStyle = portal.active ? '#67e8f9' : '#475569';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, -35, 21 * pulse, 35 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = portal.active ? .38 : .12;
  ctx.fillStyle = portal.active ? '#0891b2' : '#334155';
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-31, -5, 62, 8);
  ctx.fillStyle = portal.active ? '#a5f3fc' : '#64748b';
  ctx.fillRect(-24, -7, 48, 3);
  ctx.shadowBlur = 0;
  if (nearby) {
    const prompt = portal.active && activeCount > 1 ? 'E · ТЕЛЕПОРТ' : portal.active ? 'НУЖЕН ЕЩЁ ПОРТАЛ' : 'АКТИВАЦИЯ...';
    ctx.fillStyle = 'rgba(3,7,12,.92)';
    ctx.fillRect(-66, -92, 132, 20);
    ctx.fillStyle = portal.active ? '#a5f3fc' : '#94a3b8';
    ctx.font = 'bold 9px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, 0, -79);
    ctx.textAlign = 'start';
  }
  ctx.restore();
};
