export type ShadowDashGhost = {
  x: number;
  y: number;
  facing: number;
  life: number;
  maxLife: number;
};

export const drawShadowDashGhost = (
  ctx: CanvasRenderingContext2D,
  ghost: ShadowDashGhost,
  width: number,
  height: number,
  _time: number,
) => {
  const fade = Math.max(0, ghost.life / ghost.maxLife);
  ctx.save();
  ctx.globalAlpha = fade * .5;
  ctx.translate(ghost.x + width / 2, ghost.y + height);
  ctx.scale(1.22, .84);
  ctx.translate(0, -height / 2);
  if (ghost.facing < 0) ctx.scale(-1, 1);

  // A single flat path is deliberately used here: canvas filters and a full
  // redraw of the detailed knight for every afterimage caused frame spikes.
  ctx.fillStyle = '#5e626c';
  ctx.beginPath();
  ctx.moveTo(-31, -9);
  ctx.quadraticCurveTo(-18, -18, -8, -17);
  ctx.lineTo(-7, -25);
  ctx.quadraticCurveTo(2, -37, 12, -25);
  ctx.lineTo(18, -18);
  ctx.lineTo(13, -10);
  ctx.quadraticCurveTo(24, -5, 31, 10);
  ctx.quadraticCurveTo(7, 17, -28, 12);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha *= .7;
  ctx.fillStyle = '#eef0f4';
  ctx.beginPath();
  ctx.ellipse(8, -20, 3, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};
