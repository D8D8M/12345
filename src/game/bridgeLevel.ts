export type BridgeBox = { x: number; y: number; w: number; h: number };

export const BRIDGE_WORLD = { width: 5000, height: 1000 } as const;

export type BridgePlatform = BridgeBox & { kind: 'stone' | 'suspension' | 'rubble' };

export type BridgeLevel = {
  terrain: BridgeBox[];
  platforms: BridgePlatform[];
  abyssSpikes: BridgeBox[];
};

export const createBridgeLevel = (): BridgeLevel => {
  // Massive piers are the only solid ground. Nothing joins them below the screen.
  const terrain: BridgeBox[] = [
    // 4B opens with a full-width boss arena; the broken route starts after it.
    { x: 0, y: 610, w: 1000, h: 390 },
    { x: 1290, y: 585, w: 310, h: 415 },
    { x: 1940, y: 675, w: 225, h: 325 },
    { x: 2510, y: 600, w: 330, h: 400 },
    { x: 3210, y: 660, w: 230, h: 340 },
    { x: 3760, y: 570, w: 300, h: 430 },
    { x: 4370, y: 610, w: 630, h: 390 },
  ];

  const platforms: BridgePlatform[] = [
    { x: 1015, y: 525, w: 205, h: 22, kind: 'rubble' },
    { x: 1645, y: 535, w: 235, h: 18, kind: 'suspension' },
    { x: 2205, y: 575, w: 245, h: 22, kind: 'rubble' },
    { x: 2890, y: 535, w: 260, h: 18, kind: 'suspension' },
    { x: 3490, y: 510, w: 210, h: 22, kind: 'rubble' },
    { x: 4110, y: 545, w: 205, h: 18, kind: 'suspension' },
    // High hanging fragments create an optional aerial line through the ruins.
    { x: 565, y: 400, w: 115, h: 16, kind: 'rubble' },
    { x: 1110, y: 365, w: 125, h: 16, kind: 'stone' },
    { x: 1745, y: 390, w: 120, h: 16, kind: 'rubble' },
    { x: 2300, y: 420, w: 125, h: 16, kind: 'stone' },
    { x: 3000, y: 365, w: 120, h: 16, kind: 'rubble' },
    { x: 3575, y: 350, w: 115, h: 16, kind: 'stone' },
    { x: 4180, y: 395, w: 125, h: 16, kind: 'rubble' },
  ];

  return {
    terrain,
    platforms,
    abyssSpikes: [{ x: 0, y: 965, w: BRIDGE_WORLD.width, h: 35 }],
  };
};
