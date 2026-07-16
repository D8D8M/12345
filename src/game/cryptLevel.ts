export type CryptBox = { x: number; y: number; w: number; h: number };

export type CryptSecret = {
  wall: CryptBox;
  reward: CryptBox & { kind: 'goldChest' | 'shardCache' };
  broken: boolean;
};

export type CryptColumn = CryptBox & { depth: number };
export type CrumblingSlab = CryptBox & { state: 'stable' | 'cracking' | 'fallen'; timer: number };
export type GhostPlatform = CryptBox & { phase: number; ghost: true };

export const CRYPT_WORLD = { width: 3500, height: 3000 } as const;

export const createCryptLevel = () => {
  const boundary: CryptBox[] = [
    { x: 0, y: 0, w: CRYPT_WORLD.width, h: 44 },
    { x: 0, y: 0, w: 44, h: CRYPT_WORLD.height },
    { x: CRYPT_WORLD.width - 44, y: 0, w: 44, h: CRYPT_WORLD.height },
    { x: 0, y: CRYPT_WORLD.height - 70, w: CRYPT_WORLD.width, h: 70 },
  ];
  const terraces: CryptBox[] = [
    { x: 44, y: 565, w: 920, h: 42 }, { x: 1190, y: 735, w: 770, h: 42 },
    { x: 2240, y: 905, w: 1216, h: 42 }, { x: 1510, y: 1270, w: 1040, h: 42 },
    { x: 44, y: 1470, w: 1110, h: 42 }, { x: 530, y: 1890, w: 1220, h: 42 },
    { x: 2070, y: 2075, w: 1386, h: 42 }, { x: 1180, y: 2440, w: 1040, h: 42 },
    { x: 44, y: 2725, w: 890, h: 42 }, { x: 2580, y: 2745, w: 876, h: 42 },
  ];
  const platforms: CryptBox[] = [
    { x: 1035, y: 470, w: 170, h: 16 }, { x: 1995, y: 650, w: 180, h: 16 },
    { x: 2700, y: 1160, w: 170, h: 16 }, { x: 2260, y: 1390, w: 160, h: 16 },
    { x: 1190, y: 1585, w: 180, h: 16 }, { x: 260, y: 1745, w: 170, h: 16 },
    { x: 1790, y: 1810, w: 165, h: 16 }, { x: 2900, y: 2260, w: 180, h: 16 },
    { x: 2300, y: 2410, w: 165, h: 16 }, { x: 970, y: 2590, w: 170, h: 16 },
  ];
  const crumblingSlabs: CrumblingSlab[] = [
    { x: 690, y: 565, w: 145, h: 42, state: 'stable', timer: 0 },
    { x: 1535, y: 735, w: 145, h: 42, state: 'stable', timer: 0 },
    { x: 2780, y: 905, w: 150, h: 42, state: 'stable', timer: 0 },
    { x: 720, y: 1470, w: 150, h: 42, state: 'stable', timer: 0 },
    { x: 2420, y: 2075, w: 155, h: 42, state: 'stable', timer: 0 },
  ];
  const ghostPlatforms: GhostPlatform[] = [
    { x: 970, y: 930, w: 165, h: 16, phase: 0, ghost: true },
    { x: 1260, y: 1110, w: 165, h: 16, phase: 1.5, ghost: true },
    { x: 1820, y: 1640, w: 175, h: 16, phase: 0, ghost: true },
    { x: 1950, y: 2250, w: 175, h: 16, phase: 1.5, ghost: true },
  ];
  const solidTerraces = terraces.flatMap((terrace) => {
    const cuts = crumblingSlabs.filter((slab) => slab.y === terrace.y && slab.x >= terrace.x && slab.x + slab.w <= terrace.x + terrace.w).sort((a, b) => a.x - b.x);
    if (!cuts.length) return [terrace];
    const pieces: CryptBox[] = []; let cursor = terrace.x;
    for (const cut of cuts) { if (cut.x > cursor) pieces.push({ x: cursor, y: terrace.y, w: cut.x - cursor, h: terrace.h }); cursor = cut.x + cut.w; }
    if (cursor < terrace.x + terrace.w) pieces.push({ x: cursor, y: terrace.y, w: terrace.x + terrace.w - cursor, h: terrace.h });
    return pieces;
  });
  const secrets: CryptSecret[] = [
    { wall: { x: 220, y: 1308, w: 48, h: 162 }, reward: { x: 125, y: 1418, w: 44, h: 44, kind: 'goldChest' }, broken: false },
    { wall: { x: 3280, y: 1913, w: 48, h: 162 }, reward: { x: 3360, y: 2023, w: 44, h: 44, kind: 'shardCache' }, broken: false },
    { wall: { x: 220, y: 2563, w: 48, h: 162 }, reward: { x: 125, y: 2673, w: 44, h: 44, kind: 'goldChest' }, broken: false },
  ];
  const columns: CryptColumn[] = [
    { x: 260, y: 120, w: 72, h: 445, depth: .7 }, { x: 720, y: 75, w: 86, h: 490, depth: 1 },
    { x: 1420, y: 180, w: 78, h: 555, depth: .65 }, { x: 1840, y: 95, w: 92, h: 640, depth: 1 },
    { x: 2460, y: 210, w: 76, h: 695, depth: .7 }, { x: 3140, y: 90, w: 94, h: 815, depth: 1 },
    { x: 330, y: 1510, w: 86, h: 380, depth: .8 }, { x: 1540, y: 1312, w: 88, h: 578, depth: 1 },
    { x: 2410, y: 1312, w: 82, h: 763, depth: .7 }, { x: 3150, y: 2117, w: 88, h: 628, depth: 1 },
  ];
  return { boundary, terraces: solidTerraces, platforms, crumblingSlabs, ghostPlatforms, secrets, columns };
};
