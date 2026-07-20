type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const rock = (c: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, light: string) => { c.fillStyle = color; c.beginPath(); c.moveTo(x - radius, y); c.lineTo(x - radius * .55, y - radius * .8); c.lineTo(x + radius * .25, y - radius); c.lineTo(x + radius, y - radius * .25); c.lineTo(x + radius * .7, y + radius * .7); c.lineTo(x - radius * .3, y + radius); c.closePath(); c.fill(); line(c, light, Math.max(1, radius * .11), [[x - radius * .55, y - radius * .45], [x + radius * .2, y - radius * .7]]); };
const ease = (v: number) => v * v * (3 - 2 * v);
const strike = (progress: number) => progress < .55 ? ease(progress / .55) : 1 - ease((progress - .55) / .45);

export const drawSwampGiantBoss = (c: CanvasRenderingContext2D, time: number, progress: number, moving: boolean) => {
  const hit = strike(progress), stride = moving ? Math.sin(time * 5) * 4 : 0, breathe = Math.sin(time * 2.2) * 2;
  c.save(); c.translate(hit * 3, hit * 7); c.scale(1 + hit * .07, 1 - hit * .08);
  // Rooted legs and log-like arms build a broad, irregular silhouette.
  shape(c, '#142719', [[-23, 18], [-17, 4], [-7, 5], [-8 + stride, 33], [-27 + stride, 35]]); shape(c, '#203a24', [[22, 18], [15, 4], [6, 5], [8 - stride, 33], [28 - stride, 35]]);
  shape(c, '#1b321f', [[-25, 9], [-28, -22], [-18, -39], [8, -43 - breathe], [25, -26], [27, 8], [15, 24], [-15, 24]]);
  shape(c, '#35543a', [[-20, 5], [-21, -20], [-12, -34], [0, -37], [-5, 17], [-16, 19]]); shape(c, '#273f2b', [[2, -39], [16, -31], [21, -11], [15, 17], [6, 18]]);
  // Bark plates, moss and embedded logs.
  line(c, '#6a4b2d', 8, [[-14, -28], [-5, -5], [-10, 16]]); line(c, '#8a6234', 2, [[-15, -29], [-7, -5], [-11, 14]]); line(c, '#68492c', 7, [[8, -35], [13, -13], [10, 15]]);
  for (let i = 0; i < 9; i++) { const x = -20 + (i * 17) % 39, y = -29 + (i * 13) % 43; c.fillStyle = i & 1 ? '#628a43' : '#426b37'; c.beginPath(); c.arc(x, y, 3 + (i % 3), 0, Math.PI * 2); c.fill(); }
  // Head recessed between shoulders.
  shape(c, '#111d15', [[-11, -37], [-4, -50], [8, -48], [15, -36], [8, -26], [-7, -27]]); c.save(); c.shadowColor = '#8aff57'; c.shadowBlur = 11; c.fillStyle = '#7aff4e'; c.beginPath(); c.arc(5, -39, 3, 0, Math.PI * 2); c.fill(); c.restore();
  // Both massive fists rise, then slam down with dirt chunks around impact.
  const fistY = 5 - hit * 11; line(c, '#4b3724', 13, [[-18, -20], [-31, -7], [-35, fistY]]); line(c, '#705035', 5, [[-19, -21], [-31, -7], [-35, fistY]]); rock(c, -36, fistY + 3, 10, '#3c5236', '#79936a');
  line(c, '#4b3724', 13, [[18, -20], [31, -7], [35, fistY]]); line(c, '#705035', 5, [[19, -21], [31, -7], [35, fistY]]); rock(c, 36, fistY + 3, 10, '#3c5236', '#79936a');
  if (progress > .45 && progress < .78) for (let i = 0; i < 12; i++) { const power = Math.sin((progress - .45) / .33 * Math.PI); const side = i & 1 ? 1 : -1; rock(c, side * (30 + i * 3) * power, 31 - (i % 4) * 7 * power, 1 + i % 3, '#6a4a2f', '#9a7950'); }
  c.restore();
};

export const drawStoneGolemBoss = (c: CanvasRenderingContext2D, time: number, progress: number, moving: boolean) => {
  const compression = progress < .5 ? ease(progress * 2) : 1 - ease((progress - .5) * 2), stride = moving ? Math.sin(time * 6) * 3 : 0;
  c.save(); c.translate(0, compression * 8); c.scale(1 + compression * .13, 1 - compression * .18);
  c.save(); c.shadowColor = '#39f2e2'; c.shadowBlur = 18; line(c, '#34d9cf', 5, [[-17, 15], [-8, -10], [0, -28], [10, -8], [19, 15]]); line(c, '#9afff5', 2, [[-17, 15], [-8, -10], [0, -28], [10, -8], [19, 15]]); c.restore();
  rock(c, -15 + stride, 26, 14, '#39434a', '#74818a'); rock(c, 15 - stride, 26, 14, '#465159', '#89959c');
  rock(c, -16, 4, 18, '#4e5960', '#89949a'); rock(c, 15, 3, 19, '#59646a', '#939da2'); rock(c, 0, -22, 22, '#4a555c', '#8b979e');
  rock(c, -30 + compression * 9, -7 + compression * 7, 13, '#566168', '#96a0a5'); rock(c, 31 - compression * 9, -6 + compression * 7, 14, '#606b71', '#a2acb0');
  rock(c, -40 + compression * 14, 9 + compression * 8, 11, '#424c53', '#7d8990'); rock(c, 41 - compression * 14, 10 + compression * 8, 11, '#4b565d', '#8b969c');
  c.save(); c.shadowColor = '#4affea'; c.shadowBlur = 12; c.fillStyle = '#73fff0'; c.beginPath(); c.arc(-7, -25, 3, 0, Math.PI * 2); c.arc(7, -25, 3, 0, Math.PI * 2); c.fill(); c.restore(); c.restore();
};
