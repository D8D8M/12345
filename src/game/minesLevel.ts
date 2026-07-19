export type MineBox = { x: number; y: number; w: number; h: number };
export type MineRoom = MineBox & { id: number; col: number; row: number; connections: Set<number> };
export type MineObstacle = MineBox & { kind: 'barricade' | 'cart' };
export type MineShaft = { x: number; y: number; length: number; kind: 'chain' | 'ladder' };
export type MineRail = { x: number; y: number; w: number };
export type MineOre = { x: number; y: number; color: string; size: number };
export type MineCart = MineBox & { baseX: number; minX: number; maxX: number; vx: number; moving: boolean };

// Three very long, low tunnel rooms per row. Keep this distinct from every
// other biome: traversal is primarily horizontal, with only rare shafts.
export const MINES_WORLD = { width: 4800, height: 1800 } as const;

export type MinesLevel = {
  platforms: MineBox[];
  obstacles: MineObstacle[];
  shafts: MineShaft[];
  rails: MineRail[];
  ores: MineOre[];
  supports: MineBox[];
  carts: MineCart[];
};

const oreColors = ['#38bdf8', '#a78bfa', '#34d399', '#f59e0b', '#fb7185'];

/** Deterministic mine dressing: the room maze decides connectivity, this builds traversable tunnels. */
export const createMinesLevel = (rooms: MineRoom[], columns: number): MinesLevel => {
  const platforms: MineBox[] = [], obstacles: MineObstacle[] = [], shafts: MineShaft[] = [];
  const rails: MineRail[] = [], ores: MineOre[] = [], supports: MineBox[] = [];
  const carts: MineCart[] = [];
  for (const room of rooms) {
    const floorY = room.y + room.h - 42;
    const upperY = room.y + Math.round(room.h * .48);
    const centerX = room.x + room.w / 2;
    // A continuous upper bypass makes every ground-level blockage fair.
    const tunnelMargin = 70;
    const tunnelGap = 150;
    const tunnelWidth = (room.w - tunnelMargin * 2 - tunnelGap) / 2;
    platforms.push(
      { x: room.x + tunnelMargin, y: upperY, w: tunnelWidth, h: 18 },
      { x: room.x + tunnelMargin + tunnelWidth + tunnelGap, y: upperY, w: tunnelWidth, h: 18 },
    );
    // Long acceleration lanes with just a few raised parkour steps.
    platforms.push(
      { x: room.x + room.w * .18, y: floorY - 118, w: room.w * .2, h: 16 },
      { x: room.x + room.w * .62, y: floorY - 118, w: room.w * .2, h: 16 },
    );
    if (room.id % 2 === 0) {
      const rail = { x: room.x + 45, y: floorY - 7, w: room.w - 90 };
      rails.push(rail);
      if (room.id % 4 === 0) carts.push({ x: rail.x + 75, y: floorY - 62, w: 92, h: 55, baseX: rail.x + 75, minX: rail.x, maxX: rail.x + rail.w, vx: 0, moving: false });
    }
    const hasVerticalPassage = room.connections.has(room.id - columns) || room.connections.has(room.id + columns);
    if (room.id % 3 === 1 && room.col > 0 && room.col < columns - 1 && !hasVerticalPassage) {
      // Vertical exits use the middle of a room. The old x + 344 placement
      // put a solid cart directly inside that shaft and could make the route
      // impossible. Keep dressing out of shaft rooms and off the centre line.
      const obstacleX = room.id % 2 ? room.x + room.w * .72 : room.x + room.w * .22;
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
      shafts.push({ x: centerX, y: room.y + room.h - 300, length: room.h + 40, kind: room.id % 2 ? 'ladder' : 'chain' });
      // Alternating narrow landings keep the shaft usable without breaking its vertical silhouette.
      for (let step = 0; step < 5; step++) platforms.push({ x: centerX + (step % 2 ? 26 : -112), y: room.y + room.h - 82 + step * 125, w: 86, h: 14 });
    }
  }
  return { platforms, obstacles, shafts, rails, ores, supports, carts };
};
