type Pose = { time: number; vx: number; vy: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, size = 2) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), size, size); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const ease = (v: number) => v * v * (3 - 2 * v);
const castPose = (p: Pose) => p.attack <= 0 ? 0 : p.attackProgress < .65 ? ease(p.attackProgress / .65) : 1 - ease((p.attackProgress - .65) / .35);

export const drawSwampSlime = (c: CanvasRenderingContext2D, p: Pose) => {
  const airborne = Math.min(1, Math.abs(p.vy) / 190), falling = p.vy > 35;
  const sx = falling ? 1 - airborne * .28 : 1 + airborne * .2, sy = falling ? 1 + airborne * .45 : 1 - airborne * .18;
  c.save(); c.scale(sx, sy); c.translate(0, 8 / sy - 8);
  c.globalAlpha = .88; c.shadowColor = '#7dff56'; c.shadowBlur = 7;
  c.fillStyle = p.hurt > 0 ? '#efffdc' : '#4eaa47'; c.beginPath(); c.moveTo(-10, 7); c.bezierCurveTo(-11, 0, -7, -8, -1, -9); c.bezierCurveTo(6, -10, 11, -3, 10, 7); c.closePath(); c.fill();
  shape(c, '#77d967', [[-8, 3], [-6, -4], [-1, -7], [-2, 4]]); shape(c, '#317a39', [[2, -7], [7, -3], [8, 5], [3, 3]]);
  for (let i = 0; i < 4; i++) { const x = Math.sin(p.time * (2.4 + i * .3) + i * 2) * 6; const y = 4 - ((p.time * (5 + i) + i * 3) % 10); dot(c, i % 2 ? '#b5ff8e' : '#296b35', x, y, i % 2 + 1); }
  dot(c, '#153f2b', -4, -3, 3); dot(c, '#d4ff9c', -3, -3, 1); c.restore();
  if (falling) for (let i = 0; i < 6; i++) { const spread = (i - 2.5) * (2 + airborne); dot(c, i % 2 ? '#82e66d' : '#4cac49', spread, 8 - Math.abs(i - 2.5) * 2 - airborne * 4, i % 3 + 1); }
};

export const drawSwampTotem = (c: CanvasRenderingContext2D, p: Pose) => {
  const rage = castPose(p), pulse = .5 + Math.sin(p.time * 9) * .25; c.save(); c.scale(1 + rage * .08, 1 - rage * .05);
  shape(c, '#26170f', [[-9, 15], [-10, -12], [-5, -16], [5, -15], [10, -10], [8, 15]]);
  shape(c, '#56351f', [[-7, 13], [-8, -10], [-3, -14], [5, -12], [7, 12]]);
  line(c, '#7a5130', 1, [[-5, -9], [-2, -5], [-5, 1], [-3, 11]]); line(c, '#1b100c', 1, [[5, -9], [2, -2], [5, 5], [3, 12]]);
  shape(c, '#17100d', [[-6, -7], [-2, -10], [0, -6], [3, -10], [7, -6], [5, -2], [-5, -2]]);
  c.save(); c.shadowColor = '#ff253f'; c.shadowBlur = 5 + rage * 14; dot(c, rage ? '#ff314b' : '#80202b', -4, -7, 3); dot(c, rage ? '#ff314b' : '#80202b', 2, -7, 3); c.restore();
  shape(c, '#100b09', [[-5, 2], [5, 2], [3, 8], [-3, 8]]); dot(c, '#8ddf50', -2, 4, 4);
  for (let i = 0; i < 5; i++) { const age = (p.time * .75 + i * .2) % 1; c.save(); c.globalAlpha = (1 - age) * .55; c.fillStyle = i % 2 ? '#739d46' : '#3e693d'; c.beginPath(); c.arc(4 + age * 19, 5 - age * 12 + Math.sin(age * 12 + i) * 3, 2 + age * 3, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.save(); c.globalAlpha = pulse; c.shadowColor = '#9bff65'; c.shadowBlur = 8; dot(c, '#a9ff73', -2, 4, 4); c.restore(); c.restore();
};

export const drawMireShaman = (c: CanvasRenderingContext2D, p: Pose) => {
  const moving = Math.min(1, Math.abs(p.vx) / 80), cast = castPose(p), sway = Math.sin(p.time * 5) * moving;
  c.save(); c.translate(-cast * 2, cast * 2); c.rotate(-cast * .08);
  shape(c, '#17241d', [[-5, -9], [5, -9], [8 + sway, 14], [2, 11], [-2, 15], [-7 - sway, 12]]);
  for (let i = -5; i <= 5; i += 2) line(c, i % 3 ? '#45663c' : '#617c43', 1.5, [[i, -7], [i + sway * (i / 5), 13 + (i % 4)]]);
  shape(c, '#253529', [[-7, -9], [-4, -16], [2, -18], [7, -11], [4, -7], [-5, -7]]); shape(c, '#090e0c', [[-4, -13], [3, -15], [5, -11], [-3, -10]]);
  const staffX = 9 + sway + cast * 8, staffTop = -16 - cast * 4;
  line(c, '#76502d', 3, [[9, 15], [staffX, staffTop]]); line(c, '#a17b46', 1, [[9, 14], [staffX + 1, staffTop + 1]]);
  c.save(); c.shadowColor = '#45ff76'; c.shadowBlur = 14 + cast * 12; shape(c, '#5dff82', [[staffX, staffTop - 4], [staffX + 4, staffTop], [staffX + 1, staffTop + 4], [staffX - 3, staffTop]]); dot(c, '#d2ffd8', staffX, staffTop - 2, 2); c.restore();
  if (moving > .1 || cast > .1) for (let i = 0; i < 4; i++) { const age = (p.time * 1.8 + i * .24) % 1; c.save(); c.globalAlpha = 1 - age; c.shadowColor = '#52ff76'; c.shadowBlur = 6; dot(c, '#63ff82', staffX - age * (cast ? 22 : 15), staffTop + age * 13 + Math.sin(i + p.time * 5) * 2, 2); c.restore(); } c.restore();
};
