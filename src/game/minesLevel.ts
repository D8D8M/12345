export type MineBox = { x: number; y: number; w: number; h: number };
export type MineRoom = MineBox & { id: number; col: number; row: number; connections: Set<number> };
export type MineObstacle = MineBox & { kind: 'barricade' | 'cart' };
export type MineShaft = { x: number; y: number; length: number; kind: 'chain' | 'ladder' };
export type MineRail = { x: number; y: number; w: number };
export type MineOre = { x: number; y: number; color: string; size: number };

export const MINES_WORLD = { width: 4000, height: 2500 } as const;

export type MinesLevel = {
  platforms: MineBox[];
  obstacles: MineObstacle[];
  shafts: MineShaft[];
  rails: MineRail[];
  ores: MineOre[];
  supports: MineBox[];
};

const oreColors = ['#38bdf8', '#a78bfa', '#34d399', '#f59e0b', '#fb7185'];

/** Deterministic mine dressing: the room maze decides connectivity, this builds traversable tunnels. */
export const createMinesLevel = (rooms: MineRoom[], columns: number): MinesLevel => {
  const platforms: MineBox[] = [], obstacles: MineObstacle[] = [], shafts: MineShaft[] = [];
  const rails: MineRail[] = [], ores: MineOre[] = [], supports: MineBox[] = [];
  for (const room of rooms) {
    const floorY = room.y + room.h - 42;
    const upperY = room.y + 245;
    const centerX = room.x + room.w / 2;
    // A continuous upper bypass makes every ground-level blockage fair.
    platforms.push({ x: room.x + 62, y: upperY, w: 270, h: 18 }, { x: room.x + 390, y: upperY, w: 348, h: 18 });
    platforms.push({ x: room.x + 145, y: floorY - 112, w: 120, h: 16 }, { x: room.x + 535, y: floorY - 112, w: 120, h: 16 });
    if (room.id % 2 === 0) rails.push({ x: room.x + 45, y: floorY - 7, w: room.w - 90 });
    const hasVerticalPassage = room.connections.has(room.id - columns) || room.connections.has(room.id + columns);
    if (room.id % 3 === 1 && room.col > 0 && room.col < columns - 1 && !hasVerticalPassage) {
      // Vertical exits use the middle of a room. The old x + 344 placement
      // put a solid cart directly inside that shaft and could make the route
      // impossible. Keep dressing out of shaft rooms and off the centre line.
      const obstacleX = room.id % 2 ? room.x + 525 : room.x + 170;
      obstacles.push({ x: obstacleX, y: floorY - 94, w: 104, h: 94, kind: room.id % 2 ? 'cart' : 'barricade' });
    }
    for (let x = room.x + 110; x < room.x + room.w - 70; x += 205) {
      supports.push({ x, y: room.y + 52, w: 22, h: room.h - 94 });
    }
    for (let index = 0; index < 4; index++) {
      const seed = room.id * 37 + index * 71;
      ores.push({ x: room.x + 70 + seed % (room.w - 140), y: room.y + 70 + seed * 13 % (room.h - 180), color: oreColors[(room.id + index) % oreColors.length], size: 5 + seed % 7 });
    }
    if (room.connections.has(room.id + columns)) {
      shafts.push({ x: centerX, y: room.y + room.h - 300, length: 530, kind: room.id % 2 ? 'ladder' : 'chain' });
      // Alternating narrow landings keep the shaft usable without breaking its vertical silhouette.
      for (let step = 0; step < 5; step++) platforms.push({ x: centerX + (step % 2 ? 26 : -112), y: room.y + room.h - 82 + step * 125, w: 86, h: 14 });
    }
  }
  return { platforms, obstacles, shafts, rails, ores, supports };
};
