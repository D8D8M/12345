type Pose = { time: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, width = 2, height = width) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), width, height); };
const ease = (v: number) => v * v * (3 - 2 * v);

export const drawRoyalGuard = (c: CanvasRenderingContext2D, p: Pose) => {
  const progress = p.attackProgress, thrust = p.attack <= 0 ? 0 : progress < .35 ? -ease(progress / .35) * 4 : progress < .68 ? -4 + ease((progress - .35) / .33) * 19 : 15 - ease((progress - .68) / .32) * 15;
  if (thrust > 4) { c.save(); c.globalAlpha = .12; c.translate(-thrust * .75, 0); shape(c, '#f7e7a5', [[-8, -15], [6, -15], [9, 6], [-7, 7]]); c.restore(); }
  c.save(); c.translate(thrust * .18, 0); shape(c, '#4d381c', [[-8, 15], [-7, -9], [-4, -17], [5, -17], [9, -8], [8, 15]]); shape(c, p.hurt > 0 ? '#fff8df' : '#f1eee1', [[-6, 12], [-5, -8], [-2, -14], [5, -13], [7, -6], [6, 12]]);
  shape(c, '#e4b943', [[-7, -9], [-3, -15], [6, -12], [8, -7], [4, -4], [-5, -5]]); shape(c, '#fbfaf0', [[-6, -13], [-3, -20], [5, -20], [8, -13], [4, -9], [-5, -10]]); dot(c, '#192130', -3, -16, 9, 3); c.save(); c.shadowColor = '#ffffff'; c.shadowBlur = 7; line(c, '#ffffff', 1, [[-3, -19], [4, -18]]); c.restore();
  line(c, '#e5b844', 2, [[-5, -4], [5, 7]]); line(c, '#f3ead7', 4, [[4, -6], [11 + thrust, -1]]); line(c, '#c6cbd0', 4, [[9 + thrust, -1], [42 + thrust, -1]]); line(c, '#ffffff', 1, [[15 + thrust, -3], [41 + thrust, -3]]); shape(c, '#f5f6f7', [[42 + thrust, -5], [51 + thrust, -1], [42 + thrust, 3]]); c.restore();
};

export const drawRoyalSorcerer = (c: CanvasRenderingContext2D, p: Pose) => {
  const cast = p.attack <= 0 ? 0 : p.attackProgress < .68 ? ease(p.attackProgress / .68) : 1 - ease((p.attackProgress - .68) / .32), pulse = .5 + Math.sin(p.time * 7) * .2;
  shape(c, '#25103c', [[-8, 15], [-7, -10], [-3, -18], [4, -18], [8, -9], [9, 15], [3, 11], [-1, 16], [-5, 11]]); shape(c, p.hurt > 0 ? '#fff0ff' : '#5b267c', [[-6, 12], [-5, -8], [-1, -15], [4, -14], [6, -6], [6, 12]]); line(c, '#b665df', 1.5, [[-5, 10], [-4, -8], [0, -14]]);
  shape(c, '#170821', [[-7, -12], [-3, -21], [4, -20], [8, -12], [4, -7], [-5, -8]]); dot(c, '#efb7ff', 1, -16, 2);
  line(c, '#5d3f28', 3, [[10, 15], [11 + cast * 4, -18]]); c.save(); c.shadowColor = '#c35cff'; c.shadowBlur = 12 + cast * 18; c.fillStyle = '#b84be8'; c.beginPath(); c.arc(11 + cast * 4, -20, 4 + cast * 2, 0, Math.PI * 2); c.fill(); dot(c, '#f1c4ff', 10 + cast * 4, -22, 2); c.restore();
  if (p.attack > 0) { c.save(); c.translate(0, -4); c.globalAlpha = .25 + cast * .65; c.strokeStyle = '#dc76ff'; c.shadowColor = '#c44cff'; c.shadowBlur = 12; c.lineWidth = 1;
    for (let ring = 0; ring < 2; ring++) { c.save(); c.rotate((ring ? -1 : 1) * p.time * (2 + ring)); c.beginPath(); c.arc(0, 0, 11 + ring * 6 + cast * 7, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; dot(c, ring ? '#f0b3ff' : '#bd5bff', Math.cos(a) * (11 + ring * 6 + cast * 7), Math.sin(a) * (11 + ring * 6 + cast * 7), 2); } c.restore(); } c.restore(); }
  c.save(); c.globalAlpha = pulse * cast; c.fillStyle = '#d76cff'; c.beginPath(); c.arc(0, -4, 23 + cast * 8, 0, Math.PI * 2); c.fill(); c.restore();
};
