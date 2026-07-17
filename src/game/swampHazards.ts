import type { SwampBox, SwampPlatform } from './swampLevel';

export type SinkingPlatform = {
  collider: SwampBox;
  visual: SwampPlatform;
  baseY: number;
  baseHeight: number;
  stoodFor: number;
  sink: number;
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
