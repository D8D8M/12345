// Six enormous halls (3 x 2), each several times the area of a normal room.
export const CASTLE_WORLD = { width: 5400, height: 2800 } as const;

export type CastleRoom = { id: number; col: number; row: number; x: number; y: number; connections: Set<number> };
export type CastleTorch = { x: number; y: number; phase: number };
export type CastleBanner = { x: number; y: number; color: 'red' | 'blue'; crest: 'crown' | 'lion'; scale: number };
export type CastleArch = { x: number; y: number; w: number; h: number };
export type CastleCarpet = { x: number; y: number; w: number; h: number };
export type CastleStaircase = { x: number; y: number; h: number };
export type CastleWall = { x: number; y: number; w: number; h: number };

export type CastleLevel = {
  torches: CastleTorch[];
  banners: CastleBanner[];
  arches: CastleArch[];
  carpets: CastleCarpet[];
  staircases: CastleStaircase[];
  walls: CastleWall[];
};

/** Decorative layout derived from the room grid, with mirrored left/right details. */
export const createCastleLevel = (rooms: CastleRoom[], roomW: number, roomH: number, columns: number): CastleLevel => {
  const torches: CastleTorch[] = [];
  const banners: CastleBanner[] = [];
  const arches: CastleArch[] = [];
  const carpets: CastleCarpet[] = [];
  const staircases: CastleStaircase[] = [];
  const walls: CastleWall[] = [];

  for (const room of rooms) {
    walls.push({ x: room.x + 42, y: room.y + 42, w: roomW - 84, h: roomH - 84 });
    const floor = room.y + roomH - 42;
    carpets.push({ x: room.x + 76, y: floor - 12, w: roomW - 152, h: 12 });
    arches.push({ x: room.x + roomW / 2 - 210, y: room.y + 110, w: 420, h: Math.min(520, roomH * .48) });
    for (const side of [-1, 1]) {
      torches.push({ x: room.x + roomW / 2 + side * 520, y: room.y + 310, phase: room.id * 1.7 + side });
      banners.push({
        x: room.x + roomW / 2 + side * 360 - 34,
        y: room.y + 140,
        color: (room.col + room.row) % 2 ? 'red' : 'blue',
        crest: side < 0 ? 'crown' : 'lion',
        scale: 1,
      });
    }
    const bannerPositions = [.06, .16, .26, .36, .64, .74, .84, .94];
    for (const [row, height] of [.43, .66].entries()) {
      for (const [index, position] of bannerPositions.entries()) banners.push({
        x: room.x + roomW * position - 21,
        y: room.y + roomH * height,
        color: (room.id + index + row) % 2 ? 'red' : 'blue',
        crest: (index + row) % 2 ? 'lion' : 'crown',
        scale: .62,
      });
    }
    if (room.connections.has(room.id - columns)) staircases.push({ x: room.x + roomW / 2, y: room.y + 48, h: roomH - 96 });
  }
  return { torches, banners, arches, carpets, staircases, walls };
};
