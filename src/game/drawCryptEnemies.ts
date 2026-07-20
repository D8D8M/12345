type Pose = { time: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, width = 2, height = width) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), width, height); };
const ease = (v: number) => v * v * (3 - 2 * v);

export const drawFallenPhantom = (c: CanvasRenderingContext2D, p: Pose) => {
  const float = Math.sin(p.time * 3) * 2, wave = Math.sin(p.time * 6) * 2; c.save(); c.translate(0, float); c.globalAlpha = p.hurt > 0 ? .85 : .58; c.shadowColor = '#5da9ff'; c.shadowBlur = 13;
  shape(c, '#315a82', [[-8, -12], [-3, -18], [4, -17], [8, -10], [7, 3], [11 + wave, 14], [3, 10], [-1, 17], [-6 - wave, 11], [-9, 1]]);
  shape(c, '#70869a', [[-9, -8], [-5, -13], [-1, -10], [-4, 4], [-9, 2]]); shape(c, '#526979', [[4, -11], [9, -7], [8, 3], [3, 1]]);
  line(c, '#9cb0bd', 1, [[-7, -7], [-3, -4], [-6, 0]]); line(c, '#243e58', 1, [[6, -7], [3, -3], [7, 1]]);
  shape(c, '#142438', [[-5, -14], [-2, -19], [4, -18], [6, -13], [3, -9], [-4, -10]]); dot(c, '#8ed0ff', 1, -15, 3, 2);
  for (let i = 0; i < 3; i++) { const age = (p.time * .9 + i * .31) % 1; c.globalAlpha = (1 - age) * .55; shape(c, '#74b9ff', [[-6 + i * 6, 8 + age * 8], [-3 + i * 6, 11 + age * 9], [-7 + i * 6, 14 + age * 11]]); } c.restore();
};

export const drawNecromancer = (c: CanvasRenderingContext2D, p: Pose) => {
  const cast = p.attack <= 0 ? 0 : p.attackProgress < .68 ? ease(p.attackProgress / .68) : 1 - ease((p.attackProgress - .68) / .32);
  shape(c, '#07080d', [[-8, 15], [-7, -10], [-3, -18], [4, -18], [8, -9], [9, 15], [3, 11], [0, 16], [-4, 11]]); shape(c, p.hurt > 0 ? '#fff2f8' : '#171321', [[-6, 12], [-5, -9], [-1, -16], [4, -15], [6, -7], [6, 12]]);
  line(c, '#8f4cc2', 1.5, [[-6, 10], [-5, -8], [-1, -15]]); shape(c, '#050609', [[-7, -12], [-3, -20], [4, -19], [8, -12], [4, -7], [-5, -8]]); dot(c, '#ad65df', 1, -15, 2);
  const handY = 1 - cast * 14; line(c, '#2c2136', 4, [[-5, -7], [-12 - cast * 3, handY]]); line(c, '#2c2136', 4, [[5, -7], [11 + cast * 3, handY]]); dot(c, '#93768f', -14 - cast * 3, handY - 2, 4); dot(c, '#93768f', 10 + cast * 3, handY - 2, 4);
  line(c, '#5a3d28', 3, [[11, 15], [12 + cast * 3, -18]]); shape(c, '#a7a0a2', [[9 + cast * 3, -21], [12 + cast * 3, -25], [16 + cast * 3, -21], [15 + cast * 3, -16], [10 + cast * 3, -16]]);
  c.save(); c.globalAlpha = .4 + cast * .6; c.shadowColor = '#b34cff'; c.shadowBlur = 10 + cast * 15; for (let i = 0; i < 5; i++) { const a = p.time * 5 + i * 1.26; dot(c, '#c46bff', 12 + cast * 3 + Math.cos(a) * (5 + cast * 5), -20 + Math.sin(a) * (5 + cast * 5), 2); } c.restore();
};

export const drawCryptSeal = (c: CanvasRenderingContext2D, p: Pose) => {
  const hover = Math.sin(p.time * 2.4) * 2, glow = .45 + (Math.sin(p.time * 4) + 1) * .27; c.save(); c.translate(0, hover); c.rotate(Math.sin(p.time * 1.4) * .08);
  shape(c, '#20242d', [[0, -18], [10, -7], [8, 12], [0, 18], [-8, 12], [-10, -7]]); shape(c, '#555d68', [[0, -15], [7, -5], [5, 10], [0, 14], [-5, 9], [-7, -5]]);
  c.save(); c.globalAlpha = glow; c.shadowColor = '#ffd35c'; c.shadowBlur = 12; line(c, '#f2bd45', 2, [[0, -10], [4, -4], [0, 1], [-4, -4], [0, -10]]); line(c, '#ffe59a', 1, [[0, 2], [0, 10], [-3, 7], [3, 7], [0, 10]]); dot(c, '#fff1a8', -1, -2, 2); c.restore(); c.restore();
};
