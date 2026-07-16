type KnightPose = {
  time: number;
  speed: number;
  grounded: boolean;
  rolling: boolean;
  damaged: boolean;
};

export const drawPlayerCape = (
  ctx: CanvasRenderingContext2D,
  { time, speed, grounded, rolling, damaged }: KnightPose,
) => {
  const run = Math.min(1, speed / 230);
  const lift = grounded ? run : Math.min(1, Math.abs(speed) / 180 + .3);
  const flutter = Math.sin(time * (8 + run * 8));
  const tailX = -13 - lift * 17;
  const tailY = 19 - lift * 13;

  ctx.save();
  ctx.fillStyle = damaged ? '#f8fafc' : rolling ? '#34313d' : '#17131e';
  ctx.strokeStyle = damaged ? '#ffffff' : '#30283b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -14);
  ctx.bezierCurveTo(-15, -9, tailX - 4, -2 - flutter * lift * 2, tailX, tailY);
  ctx.bezierCurveTo(tailX + 6, tailY - 3 + flutter * 2, -14, 22, -7, 15);
  ctx.bezierCurveTo(-3, 7, -4, -4, -8, -14);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = damaged ? '#e2e8f0' : 'rgba(105,86,124,.48)';
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.bezierCurveTo(-16, 1, tailX + 3, 8 + flutter * lift, tailX + 3, tailY - 2);
  ctx.stroke();
  ctx.restore();
};

export const drawPlayerKnight = (
  ctx: CanvasRenderingContext2D,
  { time, speed, grounded, rolling, damaged }: KnightPose,
) => {
  const run = grounded ? Math.min(1, speed / 230) : 0;
  const armSwing = Math.sin(time * (8 + run * 7)) * run * 2;
  const steel = damaged ? '#ffffff' : rolling ? '#646672' : '#4a4d58';
  const darkSteel = damaged ? '#e5e7eb' : '#252832';

  // Dark tunic and layered breastplate.
  ctx.fillStyle = damaged ? '#f8fafc' : '#211e29';
  ctx.beginPath(); ctx.roundRect(-13, -10, 26, 25, 5); ctx.fill();
  ctx.fillStyle = steel;
  ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(3, -13); ctx.lineTo(12, -7); ctx.lineTo(8, 10); ctx.lineTo(1, 14); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darkSteel; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, 1); ctx.lineTo(1, 5); ctx.lineTo(9, 0); ctx.moveTo(-5, 7); ctx.lineTo(1, 11); ctx.lineTo(7, 7); ctx.stroke();

  // Pauldrons, bracers and belt move subtly with the run cycle.
  ctx.fillStyle = darkSteel;
  ctx.beginPath(); ctx.arc(-9, -7, 4, Math.PI * .7, Math.PI * 1.75); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -6, 7, Math.PI * 1.15, Math.PI * 2.3); ctx.fill();
  ctx.save(); ctx.translate(-9, armSwing * .55); ctx.rotate(-.08); ctx.fillRect(-2, -1, 5, 15); ctx.restore();
  ctx.save(); ctx.translate(14, -armSwing); ctx.rotate(.18); ctx.fillRect(-3, -2, 6, 17); ctx.restore();
  ctx.fillStyle = damaged ? '#fef3c7' : '#8b6a31'; ctx.fillRect(-12, 8, 24, 4);
  ctx.fillStyle = damaged ? '#fff' : '#c69a43'; ctx.fillRect(-2, 8, 4, 5);

  // Hood and helmet are deliberately drawn in right-facing profile. The
  // player transform mirrors this entire silhouette when facing left.
  ctx.fillStyle = damaged ? '#f3f4f6' : '#121019';
  ctx.beginPath(); ctx.moveTo(-11, -18); ctx.quadraticCurveTo(-3, -35, 9, -24); ctx.lineTo(13, -14); ctx.lineTo(5, -10); ctx.lineTo(-10, -11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = steel;
  ctx.beginPath(); ctx.moveTo(-7, -25); ctx.quadraticCurveTo(1, -32, 9, -25); ctx.lineTo(10, -22); ctx.lineTo(15, -18); ctx.lineTo(9, -13); ctx.lineTo(-5, -14); ctx.lineTo(-9, -19); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = damaged ? '#fff' : '#777b88'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#08090d';
  ctx.beginPath(); ctx.moveTo(0, -23); ctx.lineTo(11, -21); ctx.lineTo(14, -18); ctx.lineTo(1, -18); ctx.closePath(); ctx.fill();
  ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 9;
  ctx.fillStyle = damaged ? '#fff' : '#ff394d';
  ctx.beginPath(); ctx.ellipse(7, -20, 2.4, 1.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = darkSteel;
  ctx.beginPath(); ctx.moveTo(2, -16); ctx.lineTo(10, -16); ctx.lineTo(13, -14); ctx.lineTo(1, -14); ctx.closePath(); ctx.fill();
};

export const drawPlayerLungePose = (ctx: CanvasRenderingContext2D, time: number, damaged = false) => {
  ctx.save();
  ctx.translate(3, 7);
  ctx.rotate(.16);
  drawPlayerCape(ctx, { time, speed: 440, grounded: true, rolling: true, damaged });

  // Compact crouched dash: both legs stay under and behind the torso. This
  // reads as a powerful forward step without turning into a split pose.
  ctx.strokeStyle = damaged ? '#f8fafc' : '#34343f';
  ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(5, 8); ctx.lineTo(11, 15); ctx.lineTo(8, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3, 9); ctx.lineTo(-7, 17); ctx.lineTo(-16, 20); ctx.stroke();
  ctx.strokeStyle = damaged ? '#fff' : '#15151b'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(7, 22); ctx.lineTo(14, 22); ctx.moveTo(-16, 20); ctx.lineTo(-22, 20); ctx.stroke();

  ctx.save(); ctx.translate(4, -4); ctx.rotate(-.16);
  drawPlayerKnight(ctx, { time, speed: 440, grounded: true, rolling: true, damaged });
  ctx.restore();
  ctx.restore();
};
