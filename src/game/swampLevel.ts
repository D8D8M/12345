export type SwampBox = { x: number; y: number; w: number; h: number };
export type SwampPlatform = SwampBox & {
  kind: 'hummock' | 'bridge' | 'branch' | 'swing';
  route: 'main' | 'deadEnd';
  branchId?: number;
  rewardNode?: boolean;
  sinkable?: boolean;
};

export const SWAMP_WORLD = { width: 7000, height: 4000, poisonY: 3840 } as const;

// Edge-to-edge jump limits. Normal transfers require a run-up; rising
// transfers are the only exception and trade horizontal distance for height.
export const STAGE_TWO_JUMP = {
  minHorizontalGap: 180,
  maxHorizontalGap: 220,
  minRisingGap: 120,
  maxRisingGap: 150,
  maxRise: 120,
  farHorizontalGap: 220,
  minFarDrop: 30,
  maxFarDrop: 50,
  wallClearance: 64,
} as const;

const routeEnd = SWAMP_WORLD.width - 1100;

const horizontalEdgeGap = (from: SwampBox, to: SwampBox) => to.x >= from.x
  ? to.x - (from.x + from.w)
  : from.x - (to.x + to.w);

const PLATFORM_CLEARANCE = 56;

const isClearOfOtherPlatforms = (candidate: SwampBox, connected: SwampBox, platforms: SwampBox[]) =>
  platforms.every((platform) => {
    if (platform === connected) return true;
    const horizontalGap = Math.max(0, platform.x - (candidate.x + candidate.w), candidate.x - (platform.x + platform.w));
    const verticalGap = Math.max(0, platform.y - (candidate.y + candidate.h), candidate.y - (platform.y + platform.h));
    return horizontalGap >= PLATFORM_CLEARANCE || verticalGap >= PLATFORM_CLEARANCE;
  });

/** Every generated graph edge passes through this check before placement. */
export const isValidStageTwoPlatformStep = (from: SwampBox, to: SwampBox) => {
  const horizontalGap = horizontalEdgeGap(from, to);
  const verticalChange = to.y - from.y;
  const rises = verticalChange < 0;

  if (rises) {
    return -verticalChange <= STAGE_TWO_JUMP.maxRise
      && horizontalGap >= STAGE_TWO_JUMP.minRisingGap
      && horizontalGap <= STAGE_TWO_JUMP.maxRisingGap;
  }
  if (horizontalGap < STAGE_TWO_JUMP.minHorizontalGap || horizontalGap > STAGE_TWO_JUMP.maxHorizontalGap) return false;
  if (horizontalGap >= STAGE_TWO_JUMP.farHorizontalGap) {
    return verticalChange === 0
      || (verticalChange >= STAGE_TWO_JUMP.minFarDrop && verticalChange <= STAGE_TWO_JUMP.maxFarDrop);
  }
  return true;
};

const appendChecked = (platforms: SwampPlatform[], candidate: SwampPlatform) => {
  const previous = platforms[platforms.length - 1];
  if (!previous || isValidStageTwoPlatformStep(previous, candidate)) {
    platforms.push(candidate);
    return true;
  }
  return false;
};

/**
 * Builds one ordered route instead of maintaining two overlapping hand-made
 * platform lists. Every candidate is validated against the previous ledge.
 */
const createSwampRoute = (): SwampPlatform[] => {
  const platforms: SwampPlatform[] = [];
  // Varied, moderately wide ledges remain comfortable for landing without
  // reducing the required air gap between neighbouring platforms.
  // The first tier is just above the poison and the repeating staircase then
  // climbs into the regular play area one reachable step at a time.
  const widths = [120, 132, 124, 140];
  const gaps = [130, 190, 220, 140, 200, 220];
  const heightChanges = [-90, 50, 0, -64, 90, 0];
  let x = 92, y = 3690;

  for (let index = 0; ; index += 1) {
    const w = widths[index % widths.length];
    if (x + w > routeEnd - 480) break;
    // Sparse solid hummocks grow out of the poison. Their horizontal footprint
    // is identical to a normal ledge, so the 84px air gaps on both sides stay
    // open and no two columns can merge into an impassable wall.
    const growsFromSwamp = index % 7 === 2;
    const candidate: SwampPlatform = {
      x,
      y,
      w,
      h: growsFromSwamp ? SWAMP_WORLD.poisonY - y : 18,
      kind: growsFromSwamp ? 'hummock' : index % 9 === 4 ? 'bridge' : index % 11 === 7 ? 'swing' : 'branch',
      route: 'main',
      sinkable: growsFromSwamp || index % 9 === 4,
    };
    if (!appendChecked(platforms, candidate)) break;
    const gap = gaps[index % gaps.length];
    x += w + gap;
    y += heightChanges[index % heightChanges.length];
  }

  return platforms;
};

/** Bridges the large height difference between the last route ledge and the
 * open side of the boss chamber. The final ledge overlaps the arena floor, so
 * the player can walk inside instead of attempting one impossible jump. */
const createBossApproach = (mainRoute: SwampPlatform[]): SwampPlatform[] => {
  const last = mainRoute[mainRoute.length - 1];
  if (!last) return [];
  const approach: SwampPlatform[] = [];
  const rise = last.y - 3235;
  const stepCount = Math.max(1, Math.ceil(rise / STAGE_TWO_JUMP.maxRise));
  let previous = last;
  for (let step = 1; step <= stepCount; step += 1) {
    const width = step === stepCount ? 180 : 132;
    const candidate: SwampPlatform = {
      x: previous.x + previous.w + STAGE_TWO_JUMP.minRisingGap,
      y: step === stepCount ? 3235 : Math.round(last.y - rise * (step / stepCount)),
      w: width, h: 16, kind: 'branch', route: 'main',
    };
    if (!isValidStageTwoPlatformStep(previous, candidate)) break;
    approach.push(candidate);
    previous = candidate;
  }
  return approach;
};

/**
 * Adds optional climbs to the main route. Each chain has exactly one link to
 * the route graph, so its last platform is a real dead end and cannot be part
 * of the path to the boss-room exit.
 */
const createDeadEndBranches = (mainRoute: SwampPlatform[]): SwampPlatform[] => {
  const branches: SwampPlatform[] = [];
  const anchorIndexes = [3, 10, 14];
  // The path first leaves the main route, travels sideways, briefly dips and
  // only then climbs to its endpoint. This makes exploration less predictable
  // than three identical vertical staircases.
  const gaps = [130, 220, 190, 220, 140];
  const heightChanges = [-90, 0, 50, 0, -90];

  anchorIndexes.forEach((anchorIndex, branchId) => {
    const anchor = mainRoute[anchorIndex];
    if (!anchor) return;
    const branchStart = branches.length;
    let direction = branchId % 2 === 0 ? 1 : -1;
    let previous = anchor;

    for (let step = 0; step < heightChanges.length; step += 1) {
      const width = step === heightChanges.length - 1 ? 150 : 126;
      const gap = gaps[step];
      const makeCandidate = (candidateDirection: number): SwampPlatform => ({
        x: candidateDirection > 0 ? previous.x + previous.w + gap : previous.x - gap - width,
        y: previous.y + heightChanges[step], w: width, h: 16, kind: 'branch', route: 'deadEnd', branchId,
        rewardNode: step === heightChanges.length - 1,
      });
      let candidate = makeCandidate(direction);
      const occupiedPlatforms = [...mainRoute, ...branches];
      if (!isClearOfOtherPlatforms(candidate, previous, occupiedPlatforms)) {
        const opposite = makeCandidate(-direction);
        if (isClearOfOtherPlatforms(opposite, previous, occupiedPlatforms)) {
          candidate = opposite;
          direction *= -1;
        }
      }
      if (candidate.x < 44 || candidate.x + candidate.w > routeEnd
        || !isValidStageTwoPlatformStep(previous, candidate)
        || !isClearOfOtherPlatforms(candidate, previous, occupiedPlatforms)) break;
      branches.push(candidate);
      previous = candidate;
    }
    // A clearance conflict may shorten a branch; its actual last safe ledge
    // remains the exploration reward instead of silently removing that reward.
    if (branches.length > branchStart) branches[branches.length - 1].rewardNode = true;
  });

  return branches;
};

const generatedRoute = createSwampRoute();
const mainRoute = [...generatedRoute, ...createBossApproach(generatedRoute)];
const platforms = [...mainRoute, ...createDeadEndBranches(mainRoute)];

export const createSwampLevel = () => ({
  terrain: [
    ...platforms.filter(({ kind }) => kind === 'hummock').map(({ kind: _kind, route: _route, branchId: _branchId, rewardNode: _rewardNode, sinkable: _sinkable, ...box }) => box),
    // Physical boss room: ceiling, upper entrance wall and a continuous floor.
    { x: routeEnd, y: 2585, w: 1100, h: 42 },
    { x: routeEnd, y: 2585, w: 42, h: 350 },
    { x: routeEnd, y: 3235, w: 1100, h: SWAMP_WORLD.poisonY - 3235 },
  ],
  oneWays: platforms.filter(({ kind }) => kind !== 'hummock').map(({ kind: _kind, route: _route, branchId: _branchId, rewardNode: _rewardNode, sinkable: _sinkable, ...box }) => box),
  platforms: platforms.map((platform) => ({ ...platform })),
  rewardNodes: platforms.filter(({ rewardNode }) => rewardNode).map((platform) => ({ ...platform })),
  boundaries: [
    { x: 0, y: 0, w: 28, h: SWAMP_WORLD.height },
    { x: SWAMP_WORLD.width - 28, y: 0, w: 28, h: SWAMP_WORLD.height },
  ],
  poison: { x: 0, y: SWAMP_WORLD.poisonY, w: SWAMP_WORLD.width, h: SWAMP_WORLD.height - SWAMP_WORLD.poisonY },
});
