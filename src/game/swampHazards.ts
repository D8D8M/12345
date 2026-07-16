import type { SwampBox, SwampPlatform } from './swampLevel';

export type SinkingPlatform = {
  collider: SwampBox;
  visual: SwampPlatform;
  baseY: number;
  baseHeight: number;
  stoodFor: number;
  sink: number;
};

export type GasBubble = SwampBox & {
  baseY: number;
  phase: number;
  state: 'waiting' | 'rising' | 'burst';
  timer: number;
};

export const createSinkingPlatforms = (
  platforms: SwampPlatform[],
  terrain: SwampBox[],
  oneWays: SwampBox[],
): SinkingPlatform[] => platforms.filter(({ sinkable }) => sinkable).flatMap((visual) => {
  const pool = visual.kind === 'hummock' ? terrain : oneWays;
  const collider = pool.find((box) => box.x === visual.x && box.y === visual.y && box.w === visual.w);
  return collider ? [{ collider, visual, baseY: visual.y, baseHeight: collider.h, stoodFor: 0, sink: 0 }] : [];
});

export const updateSinkingPlatform = (platform: SinkingPlatform, standing: boolean, dt: number) => {
  platform.stoodFor = standing ? platform.stoodFor + dt : Math.max(0, platform.stoodFor - dt * 1.7);
  const target = platform.stoodFor > 1.5 ? 190 : 0;
  platform.sink += (target - platform.sink) * Math.min(1, dt * (target ? 1.2 : 1.8));
  platform.visual.y = platform.baseY + platform.sink;
  platform.collider.y = platform.baseY + platform.sink;
  if (platform.visual.kind === 'hummock') platform.collider.h = Math.max(12, platform.baseHeight - platform.sink);
};

export const createGasBubbles = (worldWidth: number, poisonY: number): GasBubble[] =>
  Array.from({ length: 14 }, (_, index) => ({
    x: 330 + index * ((worldWidth - 660) / 13), y: poisonY + 22, w: 30, h: 30,
    baseY: poisonY + 22, phase: index * .73, state: 'waiting', timer: .8 + (index % 5) * .65,
  }));

export const updateGasBubble = (bubble: GasBubble, dt: number) => {
  bubble.timer -= dt;
  if (bubble.state === 'waiting' && bubble.timer <= 0) { bubble.state = 'rising'; bubble.timer = 2.2; }
  else if (bubble.state === 'rising') {
    bubble.y -= 48 * dt;
    if (bubble.timer <= 0) { bubble.state = 'burst'; bubble.timer = .3; bubble.w = 78; bubble.h = 78; bubble.x -= 24; bubble.y -= 24; }
  } else if (bubble.state === 'burst' && bubble.timer <= 0) {
    bubble.x += 24; bubble.w = 30; bubble.h = 30; bubble.y = bubble.baseY;
    bubble.state = 'waiting'; bubble.timer = 2.4 + Math.random() * 3.4;
  }
};
