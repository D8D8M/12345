export const CASTLE_WORLD = { width: 4000, height: 3000 } as const;

export type CastleRoom = { id: number; col: number; row: number; x: number; y: number; connections: Set<number> };
export type CastleTorch = { x: number; y: number; phase: number };
export type CastleBanner = { x: number; y: number; color: 'red' | 'blue'; crest: 'crown' | 'lion' };
export type CastleArch = { x: number; y: number; w: number; h: number };
export type CastleCarpet = { x: number; y: number; w: number; h: number };
export type CastleStaircase = { x: number; y: number; h: number };

export type CastleLevel = {
  torches: CastleTorch[];
  banners: CastleBanner[];
  arches: CastleArch[];
  carpets: CastleCarpet[];
  staircases: CastleStaircase[];
};

/** Decorative layout derived from the room grid, with mirrored left/right details. */
export const createCastleLevel = (rooms: CastleRoom[], roomW: number, roomH: number): CastleLevel => {
  const torches: CastleTorch[] = [];
  const banners: CastleBanner[] = [];
  const arches: CastleArch[] = [];
  const carpets: CastleCarpet[] = [];
  const staircases: CastleStaircase[] = [];

  for (const room of rooms) {
    const floor = room.y + roomH - 42;
    carpets.push({ x: room.x + 76, y: floor - 12, w: roomW - 152, h: 12 });
    arches.push({ x: room.x + roomW / 2 - 118, y: room.y + 92, w: 236, h: 225 });
    for (const side of [-1, 1]) {
      torches.push({ x: room.x + roomW / 2 + side * 245, y: room.y + 235, phase: room.id * 1.7 + side });
      banners.push({
        x: room.x + roomW / 2 + side * 155 - 34,
        y: room.y + 104,
        color: (room.col + room.row) % 2 ? 'red' : 'blue',
        crest: side < 0 ? 'crown' : 'lion',
      });
    }
    if (room.connections.has(room.id - 5)) staircases.push({ x: room.x + roomW / 2, y: room.y + 48, h: roomH - 96 });
  }
  return { torches, banners, arches, carpets, staircases };
};
