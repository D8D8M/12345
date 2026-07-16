export type PlatformBox = { x: number; y: number; w: number; h: number };

export const PLATFORM_WALL_PADDING = 80;
export const PLATFORM_HEADROOM = 120;
// These values only prevent ledges from visually/collision-wise merging. They
// must stay below the spacing used by the room stair templates; larger values
// remove intermediate steps and leave the remaining platforms unreachable.
export const PLATFORM_HORIZONTAL_GAP = 40;
export const PLATFORM_VERTICAL_GAP = 48;
export const PLATFORM_MAX_RELOCATION = 140;

const SAME_HEIGHT_TOLERANCE = 64;

const overlaps = (a: PlatformBox, b: PlatformBox) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const isVerticalWall = (block: PlatformBox) => block.h > block.w;

const horizontalGap = (a: PlatformBox, b: PlatformBox) =>
  a.x + a.w <= b.x ? b.x - (a.x + a.w) : b.x + b.w <= a.x ? a.x - (b.x + b.w) : -1;

const verticalGap = (a: PlatformBox, b: PlatformBox) =>
  a.y + a.h <= b.y ? b.y - (a.y + a.h) : b.y + b.h <= a.y ? a.y - (b.y + b.h) : -1;

const isSeparatedFromPlatforms = (candidate: PlatformBox, placedPlatforms: PlatformBox[]) =>
  placedPlatforms.every((placed) => {
    const xGap = horizontalGap(candidate, placed);
    if (Math.abs(candidate.y - placed.y) <= SAME_HEIGHT_TOLERANCE && xGap < PLATFORM_HORIZONTAL_GAP) return false;

    const horizontallyOverlapping = xGap < 0;
    return !horizontallyOverlapping || verticalGap(candidate, placed) >= PLATFORM_VERTICAL_GAP;
  });

export const isPlatformPlacementSafe = (
  platform: PlatformBox,
  solids: PlatformBox[],
  worldWidth: number,
) => {
  if (platform.x < 0 || platform.x + platform.w > worldWidth || solids.some((solid) => overlaps(platform, solid))) return false;

  const headroom = { x: platform.x, y: platform.y - PLATFORM_HEADROOM, w: platform.w, h: PLATFORM_HEADROOM };
  if (solids.some((solid) => overlaps(headroom, solid))) return false;

  const paddedJumpZone = {
    x: platform.x - PLATFORM_WALL_PADDING,
    y: platform.y - PLATFORM_HEADROOM,
    w: platform.w + PLATFORM_WALL_PADDING * 2,
    h: platform.h + PLATFORM_HEADROOM,
  };
  return !solids.some((solid) => isVerticalWall(solid) && overlaps(paddedJumpZone, solid));
};

export const placePlatformsSafely = <T extends PlatformBox>(
  candidates: T[],
  solids: PlatformBox[],
  worldWidth: number,
) => {
  const placedPlatforms: T[] = [];
  const searchOffsets = [0];
  for (let distance = 16; distance < PLATFORM_MAX_RELOCATION; distance += 16) searchOffsets.push(distance, -distance);
  searchOffsets.push(PLATFORM_MAX_RELOCATION, -PLATFORM_MAX_RELOCATION);

  for (const candidate of candidates) {
    for (const offsetX of searchOffsets) {
      const placed = { ...candidate, x: candidate.x + offsetX };
      if (isPlatformPlacementSafe(placed, solids, worldWidth) && isSeparatedFromPlatforms(placed, placedPlatforms)) {
        placedPlatforms.push(placed);
        break;
      }
    }
  }
  return placedPlatforms;
};
