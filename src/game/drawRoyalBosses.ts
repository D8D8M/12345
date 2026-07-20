type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const ease = (v: number) => v * v * (3 - 2 * v);

export const drawCryptGuardianBoss = (c: CanvasRenderingContext2D, _time: number, progress: number) => {
  const swing = progress < .68 ? ease(progress / .68) : 1 - ease((progress - .68) / .32), angle = -.9 + swing * 1.5;
  // Royal mantle behind an oversized articulated skeleton.
  shape(c, '#25172f', [[-21, -25], [-30, 31], [-8, 22], [0, 35], [17, 24], [24, -24]]); line(c, '#4d365b', 2, [[-18, -20], [-22, 24], [-8, 19]]);
  c.strokeStyle = '#d8cfb4'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -29); c.lineTo(0, 18); c.moveTo(-17, -19); c.lineTo(17, -19); c.moveTo(-16, -18); c.lineTo(-24, 5); c.moveTo(16, -18); c.lineTo(23, 5); c.moveTo(-6, 16); c.lineTo(-13, 34); c.moveTo(6, 16); c.lineTo(14, 34); c.stroke();
  for (let y = -19; y < 12; y += 7) { c.strokeStyle = '#eee8d4'; c.lineWidth = 3; c.beginPath(); c.arc(0, y, 13 - (y + 19) * .15, .15, Math.PI - .15); c.stroke(); }
  c.fillStyle = '#d9d0b8'; c.beginPath(); c.arc(0, -38, 13, 0, Math.PI * 2); c.fill(); shape(c, '#1b1420', [[-8, -42], [-3, -45], [-1, -38], [-7, -37]]); shape(c, '#1b1420', [[8, -42], [3, -45], [1, -38], [7, -37]]);
  shape(c, '#c79a2d', [[-13, -48], [-10, -57], [-4, -51], [0, -61], [5, -51], [11, -57], [13, -47]]);
  c.save(); c.shadowColor = '#72fff2'; c.shadowBlur = 12; c.fillStyle = '#7dfff4'; c.beginPath(); c.arc(-5, -41, 2, 0, Math.PI * 2); c.arc(5, -41, 2, 0, Math.PI * 2); c.fill(); c.restore();
  c.save(); c.rotate(angle); line(c, '#6d4b2b', 7, [[16, -9], [28, -6]]); line(c, '#ccd4db', 9, [[27, -6], [91, -6]]); shape(c, '#eef2f5', [[89, -14], [108, -6], [89, 2]]); c.restore();
  if (progress > .18 && progress < .84) { const alpha = Math.sin((progress - .18) / .66 * Math.PI); c.save(); c.globalAlpha = alpha * .34; c.strokeStyle = '#b9fff8'; c.shadowColor = '#68fff0'; c.shadowBlur = 15; c.lineWidth = 15; c.beginPath(); c.arc(5, -7, 92, -1.2, .95); c.stroke(); c.globalAlpha = alpha * .8; c.lineWidth = 3; c.strokeStyle = '#edfffd'; c.stroke(); c.restore(); }
};

export const drawBridgeColossusBoss = (c: CanvasRenderingContext2D, time: number, progress: number, moving: boolean) => {
  const motion = moving ? 1 : .35, attack = Math.sin(progress * Math.PI); c.save(); c.translate(attack * 9, 0);
  // Draw tail-to-head so each detailed segment overlaps naturally.
  for (let i = 8; i >= 0; i--) { const age = time * 3.2 - i * .48, x = -48 + i * 12, y = Math.sin(age) * (5 + motion * 4) + i * .7; const radius = 8 + i * .7;
    c.save(); c.translate(x, y); c.rotate(Math.cos(age) * .28 * motion); shape(c, i & 1 ? '#4e565d' : '#606970', [[-radius, 0], [-radius * .55, -radius], [radius * .5, -radius * .8], [radius, 0], [radius * .5, radius * .8], [-radius * .6, radius]]); line(c, '#929ba0', 1.5, [[-radius * .45, -radius * .55], [radius * .42, -radius * .45]]); c.restore();
    if (i < 8) { c.save(); c.shadowColor = '#4ce8dc'; c.shadowBlur = 8; c.fillStyle = '#55dfd5'; c.beginPath(); c.arc(x + 7, y, 2.5, 0, Math.PI * 2); c.fill(); c.restore(); }
  }
  c.translate(60, Math.sin(time * 3.2 - 4.3) * 7); shape(c, '#343c43', [[-15, -14], [1, -22], [19, -12], [24, 4], [11, 17], [-10, 14], [-20, 2]]); shape(c, '#6d767c', [[-10, -11], [2, -18], [15, -9], [17, 3], [8, 11], [-8, 9]]); shape(c, '#1b2227', [[12, -5], [28, 1], [13, 7]]); c.save(); c.shadowColor = '#5df8e8'; c.shadowBlur = 11; c.fillStyle = '#72fff0'; c.beginPath(); c.arc(8, -7, 3, 0, Math.PI * 2); c.fill(); c.restore(); c.restore();
};

export const drawRightHandBoss = (c: CanvasRenderingContext2D, time: number, progress: number, moving: boolean) => {
  const strike = progress < .55 ? ease(progress / .55) : 1 - ease((progress - .55) / .45), step = moving ? Math.sin(time * 7) * 3 : 0, cape = Math.sin(time * 4.5) * 4;
  shape(c, '#6f101d', [[-15, -27], [-28 - cape, 35], [-9, 28], [1, 40], [13, 22], [14, -24]]); shape(c, '#c82331', [[-12, -23], [-19 - cape, 28], [-7, 22], [2, 33], [7, -19]]);
  line(c, '#080a0d', 11, [[-6, 16], [-8 + step, 34]]); line(c, '#080a0d', 11, [[7, 16], [10 - step, 34]]); shape(c, '#07090c', [[-17, -18], [-10, -33], [10, -33], [18, -17], [14, 19], [-13, 19]]); shape(c, '#171a1f', [[-13, -15], [-7, -28], [9, -28], [13, -14], [10, 14], [-10, 14]]);
  // Gold shoulder blades make the silhouette unmistakable.
  shape(c, '#d4a632', [[-13, -25], [-31, -39], [-24, -19], [-14, -12]]); shape(c, '#f0c34b', [[13, -25], [31, -39], [24, -19], [14, -12]]); line(c, '#fff2a6', 2, [[16, -25], [28, -36]]);
  shape(c, '#07090c', [[-11, -31], [-6, -41], [7, -41], [12, -31], [8, -23], [-8, -24]]); c.save(); c.shadowColor = '#ff2038'; c.shadowBlur = 13; line(c, '#ff3549', 3, [[-6, -34], [7, -34]]); c.restore();
  c.save(); c.translate(8 + strike * 15, -3); c.rotate(-.16 + strike * .35); line(c, '#6b492b', 8, [[0, 0], [18, 0]]); line(c, '#2a2528', 14, [[16, 0], [79, 0]]); shape(c, '#4a3135', [[73, -12], [96, 0], [73, 12]]);
  for (let i = 0; i < 9; i++) { const wave = Math.sin(time * 11 + i) * (3 + i * .25), x = 22 + i * 7; c.save(); c.globalAlpha = .28 + i * .055; c.shadowColor = '#e51e2f'; c.shadowBlur = 10; shape(c, i & 1 ? '#8d101f' : '#24060b', [[x, -7], [x + 5, -14 - wave], [x + 9, -5], [x + 6, 5], [x, 7]]); c.restore(); }
  line(c, '#ef3348', 2, [[23, -5], [78, -4]]); c.restore();
};
