type Pose = { time: number; vx: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w = 2, h = w) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const body = (c: CanvasRenderingContext2D, p: Pose, color: string) => { shape(c, '#11151a', [[-10, 5], [-9, -8], [-5, -13], [5, -13], [10, -7], [9, 6]]); shape(c, p.hurt > 0 ? '#fff4dc' : color, [[-8, 4], [-7, -7], [-3, -11], [5, -10], [8, -5], [7, 4]]); dot(c, '#11151a', -7, 5, 5, 11); dot(c, '#11151a', 3, 5, 5, 11); };
const ease = (v: number) => v * v * (3 - 2 * v);
const strikePose = (p: Pose, hit = .58) => p.attack <= 0 ? 0 : p.attackProgress < hit ? ease(p.attackProgress / hit) : 1 - ease((p.attackProgress - hit) / (1 - hit));

export const drawBlindMiner = (c: CanvasRenderingContext2D, p: Pose) => {
  const swing = strikePose(p, .48); c.save(); c.translate(swing * 3, swing * 2); c.rotate(swing * .06); body(c, p, '#45423d');
  shape(c, '#756758', [[-8, -11], [-5, -17], [5, -16], [8, -10]]); shape(c, '#a49279', [[-7, -15], [7, -14], [6, -10], [-7, -11]]);
  line(c, '#605746', 1, [[-5, -14], [-2, -11], [1, -14], [4, -11]]); dot(c, '#17181a', -4, -12, 9, 2);
  const angle = -1.05 + swing * 1.75; c.save(); c.rotate(angle); line(c, '#805a32', 3, [[0, 0], [0, -27]]);
  if (swing > .12) { c.save(); c.globalAlpha = swing * .22; for (let i = 1; i <= 3; i++) { c.rotate(-.1 * i); line(c, '#d5dde2', 3, [[-9, -27], [10, -27]]); } c.restore(); }
  line(c, '#b8c0c4', 4, [[-10, -27], [10, -27]]); shape(c, '#e1e6e8', [[-11, -29], [-5, -27], [-11, -24]]); c.restore(); c.restore();
};

export const drawDemolisher = (c: CanvasRenderingContext2D, p: Pose) => {
  const throwPose = strikePose(p, .42); c.save(); c.translate(-throwPose * 3, throwPose); c.rotate(-throwPose * .1); body(c, p, '#6a452c'); shape(c, '#39271e', [[-7, -10], [-5, -16], [5, -16], [8, -10]]);
  shape(c, '#b8872f', [[-8, -15], [-5, -19], [5, -19], [9, -15]]); dot(c, '#e0b64d', -9, -15, 18, 3);
  c.save(); c.globalAlpha = .13; shape(c, '#ffe58a', [[4, -16], [34, -25], [34, -6]]); c.restore();
  c.save(); c.shadowColor = '#ffd95c'; c.shadowBlur = 10; dot(c, '#ffe46b', 3, -18, 5, 3); c.restore();
  dot(c, '#b62229', -12, -8, 5, 14); dot(c, '#ed3940', -11, -7, 2, 10); dot(c, '#b62229', -16, -6, 5, 14); dot(c, '#ed3940', -15, -5, 2, 10);
  line(c, '#6a4b2a', 1, [[-13, -8], [-15, -13]]); const spark = Math.sin(p.time * 28) * 2;
  c.save(); c.shadowColor = '#ff9b32'; c.shadowBlur = 8; dot(c, '#fff08a', -16 + spark, -15, 2); dot(c, '#ff5b24', -13 - spark, -13, 2); c.restore();
  line(c, '#9b7358', 4, [[5, -6], [11 + throwPose * 8, -13 - throwPose * 10]]); if (p.attack > 0) { c.save(); c.translate(13 + throwPose * 13, -16 - throwPose * 12); c.rotate(p.attackProgress * 4); dot(c, '#d92730', -3, -5, 6, 10); c.restore(); } c.restore();
};

export const drawCartGuardian = (c: CanvasRenderingContext2D, p: Pose) => {
  const ram = strikePose(p, .62), spin = p.time * (8 + Math.abs(p.vx) * .08), pulse = .6 + Math.sin(p.time * 7) * .25; c.save(); c.translate(ram * 7, 0); c.scale(1 + ram * .08, 1 - ram * .06);
  for (const x of [-10, 10]) { c.save(); c.translate(x, 8); c.rotate(spin); c.fillStyle = '#11151a'; c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); dot(c, '#78838a', -1, -5, 2, 5); } c.restore(); }
  shape(c, '#343d43', [[-15, -7], [15, -7], [12, 7], [-12, 7]]); shape(c, '#66747b', [[-13, -5], [11, -5], [8, 1], [-11, 2]]); dot(c, '#20272b', -8, -14, 17, 9);
  dot(c, '#151b1e', 8, -18, 5, 13); dot(c, '#69747a', 9, -20, 4, 4);
  for (let i = 0; i < 4; i++) { const age = (p.time * .8 + i * .23) % 1; c.save(); c.globalAlpha = (1 - age) * .55; c.fillStyle = '#1a1c1d'; c.beginPath(); c.arc(11 - age * 7, -21 - age * 15, 2 + age * 4, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.save(); c.shadowColor = '#3cbcff'; c.shadowBlur = 8 + pulse * 8; c.fillStyle = '#188ad1'; c.beginPath(); c.arc(0, -9, 5 + pulse, 0, Math.PI * 2); c.fill(); dot(c, '#baf2ff', -1, -11, 2); c.restore();
  dot(c, '#b7c0c5', -13, -4, 3, 8); shape(c, p.attack > 0 ? '#e8f7ff' : '#b7c0c5', [[10, -5], [17 + ram * 8, -2], [17 + ram * 8, 3], [10, 5]]); c.restore();
};
