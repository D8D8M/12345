export type UniqueBossVariant = 'swampGiant' | 'stoneGolem' | 'cryptWarden' | 'bridgeColossus' | 'rightHand';

export const uniqueBossSpriteSizes: Record<UniqueBossVariant, { w: number; h: number }> = {
  swampGiant: { w: 56, h: 64 }, stoneGolem: { w: 64, h: 52 }, cryptWarden: { w: 40, h: 56 }, bridgeColossus: { w: 64, h: 64 }, rightHand: { w: 44, h: 60 },
};

export const uniqueBossSizes: Record<UniqueBossVariant, { w: number; h: number }> = {
  swampGiant: { w: 100, h: 128 }, stoneGolem: { w: 112, h: 116 }, cryptWarden: { w: 88, h: 124 }, bridgeColossus: { w: 120, h: 132 }, rightHand: { w: 92, h: 124 },
};

export const drawUniqueBoss = (c: CanvasRenderingContext2D, variant: UniqueBossVariant, time: number, attackProgress: number, moving: boolean) => {
  if (variant === 'swampGiant') return drawSwampGiantBoss(c, time, attackProgress, moving);
  if (variant === 'stoneGolem') return drawStoneGolemBoss(c, time, attackProgress, moving);
  if (variant === 'cryptWarden') return drawCryptGuardianBoss(c, time, attackProgress);
  if (variant === 'bridgeColossus') return drawBridgeColossusBoss(c, time, attackProgress, moving);
  drawRightHandBoss(c, time, attackProgress, moving);
};
import { drawStoneGolemBoss, drawSwampGiantBoss } from './drawPrimalBosses';
import { drawBridgeColossusBoss, drawCryptGuardianBoss, drawRightHandBoss } from './drawRoyalBosses';
