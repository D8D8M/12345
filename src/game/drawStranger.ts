export type StrangerPose = 'idle' | 'dash' | 'parry' | 'daggers';

export function drawStranger(
  ctx: CanvasRenderingContext2D,
  time: number,
  pose: StrangerPose = 'idle',
  alpha = 1,
) {
  const sway = Math.sin(time * 2.1) * 2;
  const crouch = pose === 'dash' ? 7 : 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(0, crouch);
  ctx.shadowColor = pose === 'parry' ? '#c4b5fd' : 'rgba(109,40,217,.8)';
  ctx.shadowBlur = pose === 'idle' ? 13 : 24;

  ctx.fillStyle = '#020308';
  ctx.beginPath();
  ctx.moveTo(-23, 27);
  ctx.quadraticCurveTo(-19 + sway, -13, -11, -31);
  ctx.lineTo(11, -31);
  ctx.quadraticCurveTo(19 + sway, -10, 25, 27);
  ctx.lineTo(10, 19);
  ctx.lineTo(0, 29);
  ctx.lineTo(-10, 19);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#090a10';
  ctx.beginPath();
  ctx.arc(0, -31, 18, Math.PI, 0);
  ctx.lineTo(15, -19);
  ctx.lineTo(-15, -19);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#141622';
  ctx.beginPath();
  ctx.ellipse(0, -29, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#030409';
  ctx.beginPath();
  ctx.moveTo(-19, -31);
  ctx.quadraticCurveTo(0, -55, 19, -31);
  ctx.lineTo(12, -19);
  ctx.quadraticCurveTo(0, -27, -12, -19);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#a78bfa';
  ctx.shadowColor = '#8b5cf6';
  ctx.shadowBlur = 9;
  ctx.fillRect(-6, -31, 3, 2);
  ctx.fillRect(3, -31, 3, 2);
  ctx.shadowBlur = 0;

  if (pose === 'parry') {
    ctx.strokeStyle = '#ddd6fe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, 31, -.9, 1.15);
    ctx.stroke();
  } else {
    const bladeY = pose === 'daggers' ? -15 : 0;
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(pose === 'dash' ? 50 : 35, bladeY);
    ctx.stroke();
    ctx.fillStyle = '#c4b5fd';
    ctx.fillRect(8, -9, 8, 4);
  }
  ctx.restore();
}

export function drawShadowBlade(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = '#8b5cf6';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#c4b5fd';
  ctx.beginPath();
  ctx.moveTo(-30, -3);
  ctx.lineTo(28, 0);
  ctx.lineTo(-30, 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#312e81';
  ctx.fillRect(-39, -5, 10, 10);
  ctx.restore();
}
