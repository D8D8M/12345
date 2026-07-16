export type StageFourBossVariant = 'cryptWarden' | 'bridgeColossus';

export function drawStageFourBoss(ctx: CanvasRenderingContext2D, variant: StageFourBossVariant, attacking: boolean, time: number, moving: boolean) {
  ctx.save();
  if (variant === 'cryptWarden') {
    ctx.fillStyle = '#17131f'; ctx.strokeStyle = '#554866'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-28, 28); ctx.lineTo(-34, -5); ctx.lineTo(-23, -34); ctx.lineTo(0, -48); ctx.lineTo(25, -34); ctx.lineTo(34, -5); ctx.lineTo(28, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2d2637'; ctx.fillRect(-31, -17, 62, 22); ctx.fillRect(-25, 8, 50, 27);
    ctx.strokeStyle = '#0b0810'; ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(-5, 2); ctx.lineTo(-14, 25); ctx.moveTo(19, -12); ctx.lineTo(6, 7); ctx.lineTo(17, 29); ctx.stroke();
    ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 15; ctx.fillStyle = '#d8b4fe'; ctx.fillRect(-14, -25, 9, 6); ctx.fillRect(6, -25, 9, 6); ctx.shadowBlur = 0;
    ctx.save(); ctx.rotate(attacking ? -.55 : -.18); ctx.fillStyle = '#403849'; ctx.fillRect(24, -8, 75, 7); ctx.beginPath(); ctx.moveTo(88, -12); ctx.quadraticCurveTo(122, -42, 125, -3); ctx.quadraticCurveTo(105, -17, 88, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  } else {
    ctx.fillStyle = '#5b6066'; ctx.strokeStyle = '#252a30'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-22, -24); ctx.lineTo(-64, -45); ctx.lineTo(-48, -4); ctx.lineTo(-70, 18); ctx.lineTo(-27, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -24); ctx.lineTo(64, -45); ctx.lineTo(48, -4); ctx.lineTo(70, 18); ctx.lineTo(27, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#686d72'; ctx.beginPath(); ctx.moveTo(-26, -31); ctx.lineTo(-14, -48); ctx.lineTo(-5, -35); ctx.lineTo(8, -35); ctx.lineTo(17, -49); ctx.lineTo(28, -28); ctx.lineTo(24, 29); ctx.lineTo(-24, 29); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f87171'; ctx.fillRect(-13, -23, 8, 5); ctx.fillRect(6, -23, 8, 5);
    const stride = moving ? Math.sin(time * 13) * 10 : 0;
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 4; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 23, 7); ctx.lineTo(side * 35 + stride * side, 24); ctx.lineTo(side * 28 - stride * side * .5, 39); ctx.lineTo(side * 39 + stride * side, 52); ctx.stroke(); }
  }
  ctx.restore();
}
