export type RoomEventKind = 'fountain' | 'cursedChest' | 'merchant' | 'parkour' | 'leverPuzzle';
export type LeverDirection = 'left' | 'up' | 'right';

export type RoomEvent = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: RoomEventKind;
  resolved: boolean;
  phase: number;
  active?: boolean;
  timer?: number;
  targetX?: number;
  targetY?: number;
  sequence?: LeverDirection[];
  sequenceProgress?: number;
};

type Platform = { x: number; y: number; w: number; h: number };

export function createRoomEvents(platforms: Platform[], sector: number): RoomEvent[] {
  const count = Math.min(platforms.length, sector >= 4 ? 2 : 1);
  const kinds: RoomEventKind[] = ['fountain', 'cursedChest', 'merchant', 'parkour', 'leverPuzzle'];
  return platforms.slice(0, count).map((platform, index) => ({
    x: platform.x + platform.w / 2 - 24,
    y: platform.y - 54,
    w: 48,
    h: 54,
    kind: kinds[(index + Math.floor(Math.random() * kinds.length)) % kinds.length],
    resolved: false,
    phase: Math.random() * Math.PI * 2,
    targetX: platforms[(index + 1) % platforms.length]?.x + platforms[(index + 1) % platforms.length]?.w / 2 - 18,
    targetY: platforms[(index + 1) % platforms.length]?.y - 48,
    sequence: Array.from({ length: 3 }, () => (['left', 'up', 'right'] as LeverDirection[])[Math.floor(Math.random() * 3)]),
    sequenceProgress: 0,
  }));
}
