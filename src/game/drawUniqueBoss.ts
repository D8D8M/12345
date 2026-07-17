export type UniqueBossVariant = 'swampGiant' | 'stoneGolem' | 'cryptWarden' | 'bridgeColossus' | 'rightHand';

export const uniqueBossSpriteSizes: Record<UniqueBossVariant, { w: number; h: number }> = {
  swampGiant: { w: 56, h: 64 }, stoneGolem: { w: 64, h: 52 }, cryptWarden: { w: 40, h: 56 }, bridgeColossus: { w: 64, h: 64 }, rightHand: { w: 44, h: 60 },
};

export const uniqueBossSizes: Record<UniqueBossVariant, { w: number; h: number }> = {
  swampGiant: { w: 100, h: 128 }, stoneGolem: { w: 112, h: 116 }, cryptWarden: { w: 88, h: 124 }, bridgeColossus: { w: 120, h: 132 }, rightHand: { w: 92, h: 124 },
};

const rect = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export const drawUniqueBoss = (c: CanvasRenderingContext2D, variant: UniqueBossVariant, time: number, attacking: boolean, moving: boolean) => {
  const step = moving ? Math.sin(time * 9) * 3 : 0;
  if (variant === 'swampGiant') {
    rect(c, '#162f22', -20, -27, 40, 47); rect(c, '#294b30', -25, -20, 12, 36); rect(c, '#294b30', 13, -20, 12, 36);
    rect(c, '#0e2419', -20 - step, 18, 16, 14); rect(c, '#0e2419', 4 + step, 18, 16, 14); rect(c, '#355b37', -28, attacking ? -4 : 5, 15, 20); rect(c, '#355b37', 13, attacking ? -4 : 5, 15, 20);
    c.shadowColor = '#76ff4f'; c.shadowBlur = 15; rect(c, '#50e848', -7, -12, 14, 18); rect(c, '#b0ff7c', -3, -8, 6, 9); c.shadowBlur = 0;
    rect(c, '#42663c', -16, -32, 7, 10); rect(c, '#42663c', 9, -35, 7, 13); return;
  }
  if (variant === 'stoneGolem') {
    rect(c, '#4b5158', -25, -19, 50, 35); rect(c, '#666d75', -30, -13, 13, 28); rect(c, '#666d75', 17, -13, 13, 28); rect(c, '#343a40', -25 - step, 14, 20, 12); rect(c, '#343a40', 5 + step, 14, 20, 12);
    rect(c, '#777d84', -38, attacking ? -8 : 0, 17, 22); rect(c, '#777d84', 21, attacking ? -8 : 0, 17, 22);
    c.shadowColor = '#ff7a24'; c.shadowBlur = 10; c.strokeStyle = '#ff812e'; c.lineWidth = 3; c.beginPath(); c.moveTo(-16, -18); c.lineTo(-7, -7); c.lineTo(-13, 3); c.moveTo(16, -14); c.lineTo(6, -3); c.lineTo(13, 13); c.stroke(); rect(c, '#ffc04d', -3, -10, 6, 8); c.shadowBlur = 0; return;
  }
  if (variant === 'cryptWarden') {
    rect(c, '#d8cfb4', -13, -20, 26, 41); rect(c, '#eee6cf', -16, -15, 32, 5); rect(c, '#b9ad91', -15, -5, 30, 4); rect(c, '#eee6cf', -14, 7, 28, 5);
    c.shadowColor = '#45fff1'; c.shadowBlur = 12; rect(c, '#6ffff2', -8, -14, 5, 3); rect(c, '#6ffff2', 3, -14, 5, 3); c.shadowBlur = 0;
    rect(c, '#c99a2e', -13, -28, 26, 7); rect(c, '#edc44c', -12, -33, 5, 7); rect(c, '#edc44c', -2, -36, 5, 10); rect(c, '#edc44c', 8, -33, 5, 7);
    rect(c, '#6e4a25', 13, -2, 9, 4); rect(c, '#d7dde3', 20, -5, 37, 10); rect(c, '#f8fafc', 50, -8, 12, 16); return;
  }
  if (variant === 'bridgeColossus') {
    rect(c, '#1f2935', -26, -27, 52, 50); rect(c, '#344354', -31, -21, 12, 40); rect(c, '#344354', 19, -21, 12, 40); rect(c, '#111923', -24 - step, 20, 18, 12); rect(c, '#111923', 6 + step, 20, 18, 12);
    c.shadowColor = '#42bfff'; c.shadowBlur = 12; rect(c, '#55c7ff', -15, -17, 30, 5); rect(c, '#d8f3ff', -8, -16, 16, 2); c.shadowBlur = 0;
    rect(c, '#29394c', 14, -25, 28, 52); rect(c, '#718096', 17, -22, 22, 46); rect(c, '#1e4f85', 20, -15, 16, 29); rect(c, '#d5ad3c', 25, -10, 6, 20); rect(c, '#d5ad3c', 20, -3, 16, 6); return;
  }
  const capeWave = Math.sin(time * 7) * 3;
  c.fillStyle = '#8e1723'; c.beginPath(); c.moveTo(-16, -19); c.lineTo(-27 - capeWave, 23); c.lineTo(7, 20); c.lineTo(10, -16); c.fill();
  rect(c, '#111318', -15, -23, 30, 44); rect(c, '#c79b2d', -17, -16, 34, 5); rect(c, '#d9ad39', -11 - step, 18, 9, 12); rect(c, '#d9ad39', 3 + step, 18, 9, 12);
  rect(c, '#080a0d', -13, -29, 26, 10); c.shadowColor = '#ef233c'; c.shadowBlur = 12; rect(c, '#ff3048', -9, -25, 18, 3); c.shadowBlur = 0;
  c.save(); c.translate(attacking ? 12 : 0, -2); rect(c, '#6a3c22', 10, -2, 13, 6); c.shadowColor = '#ff3b20'; c.shadowBlur = 18; rect(c, '#e63820', 21, -7, 51, 13); rect(c, '#ffb02e', 26, -4, 42, 6); rect(c, '#fff1a3', 32, -2, 34, 2); c.restore();
};
