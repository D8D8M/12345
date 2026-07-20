type PrisonPose = { time: number; vx: number; attack: number; attackProgress: number; hurt: number; stunned: number; defeated: boolean };
type Point = readonly [number, number];

const shape = (c: CanvasRenderingContext2D, color: string, points: Point[]) => {
  c.fillStyle = color; c.beginPath(); c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.closePath(); c.fill();
};
const pixel = (c: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
};
const stroke = (c: CanvasRenderingContext2D, color: string, width: number, points: Point[]) => {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]); c.stroke();
};
const limb = (c: CanvasRenderingContext2D, color: string, x: number, y: number, length: number, angle: number, width: number) => {
  c.save(); c.translate(x, y); c.rotate(angle); stroke(c, '#11151a', width + 2, [[0, 0], [0, length]]); stroke(c, color, width, [[0, 0], [0, length]]); c.restore();
  return [x - Math.sin(angle) * length, y + Math.cos(angle) * length] as Point;
};
const leg = (c: CanvasRenderingContext2D, color: string, hipX: number, hipY: number, phase: number, moving: number, back = false) => {
  // The foot travels forward while lifted, then stays low during the support half-cycle.
  const stride = Math.sin(phase) * 5 * moving;
  const lift = Math.max(0, -Math.cos(phase)) * 3.2 * moving;
  const foot = [hipX + stride, hipY + 13 - lift] as Point;
  const knee = [(hipX + foot[0]) * .5 + (back ? -1 : 1) * (1.8 + lift * .35), hipY + 6] as Point;
  stroke(c, '#101419', 6, [[hipX, hipY], knee, foot]);
  stroke(c, color, 3.8, [[hipX, hipY], knee, foot]);
  c.fillStyle = '#090d10'; c.beginPath(); c.roundRect(foot[0] - 2, foot[1] - 1, 8, 3, 1); c.fill();
};
const ease = (v: number) => v * v * (3 - 2 * v);
const attackPose = (p: PrisonPose) => {
  if (p.attack <= 0) return 0;
  return p.attackProgress < .58 ? ease(p.attackProgress / .58) : 1 - ease((p.attackProgress - .58) / .42);
};

const drawRune = (c: CanvasRenderingContext2D, t: number, active: number) => {
  c.save(); c.globalAlpha = .16 + active * .75; c.translate(0, 16); c.scale(1, .28); c.rotate(t * .9);
  c.strokeStyle = '#d45cff'; c.shadowColor = '#bd35ff'; c.shadowBlur = 12; c.lineWidth = 1.2;
  c.beginPath(); c.arc(0, 0, 16 + Math.sin(t * 8), 0, Math.PI * 2); c.stroke();
  shape(c, '#edb4ff', [[0, -11], [3, -3], [11, 0], [3, 3], [0, 11], [-3, 3], [-11, 0], [-3, -3]]);
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); c.restore();
};

const drawPrisoner = (c: CanvasRenderingContext2D, p: PrisonPose, summoned: boolean) => {
  const speed = Math.min(1, Math.max(0, (Math.abs(p.vx) - 12) / 70));
  const phase = p.time * (3.8 + speed * 4.2);
  const bob = Math.abs(Math.sin(phase)) * speed * .65, breathe = Math.sin(p.time * 3.4);
  const flesh = p.hurt > 0 ? '#fff4df' : summoned ? '#8560a4' : '#7f906c';
  const fleshLight = summoned ? '#ae7bc9' : '#a4b486', cloth = summoned ? '#38204b' : '#394539';
  const strike = attackPose(p); c.save(); c.translate(strike * 5, 1 - bob); c.rotate(strike * .08);
  // Back leg first: thigh, knee, shin and foot each move independently.
  leg(c, '#28312c', 3, 3, phase + Math.PI, speed, true);
  leg(c, cloth, -3, 3, phase, speed);
  // Curved, narrow torso replaces the old box and keeps the hunched silhouette.
  shape(c, '#151b19', [[-8, -7], [-5, -12], [4, -11], [8, -5], [6, 5], [-5, 5], [-9, 0]]);
  shape(c, cloth, [[-6, -8], [-3, -11], [3, -10], [6, -4], [4, 3], [-4, 3], [-7, -1]]);
  shape(c, summoned ? '#65417c' : '#586653', [[-5, -8], [-2, -10], [1, -9], [-2, 2], [-5, 2]]);
  pixel(c, summoned ? '#be67e7' : '#75836d', -5, -2, 9, 1);
  // Skull-like head, jaw and neck are separate shapes.
  shape(c, '#171b19', [[-6, -14], [-3, -18], [4, -17], [7, -13], [4, -8], [-4, -9], [-7, -11]]);
  shape(c, flesh, [[-4, -15], [-1, -17], [4, -16], [5, -12], [2, -9], [-4, -10]]);
  shape(c, fleshLight, [[-3, -15], [0, -16], [-1, -10], [-4, -11]]); pixel(c, '#252a24', 1, -10, 4, 2);
  c.save(); c.shadowColor = summoned ? '#db73ff' : '#6dff4f'; c.shadowBlur = 8;
  pixel(c, summoned ? '#efadff' : '#7dff5c', 1, -14, 3, 2); c.globalAlpha = .32; pixel(c, summoned ? '#d35cff' : '#6dff4f', 4, -14, 7 + Math.abs(breathe) * 3, 1); c.restore();
  // Two-bone arms, animated elbows, shaking hands, cuffs and broken chains.
  const elbowA = limb(c, flesh, -5, -7, 7, .55 - strike * 1.35, 3.2);
  const handA = limb(c, fleshLight, elbowA[0], elbowA[1], 7, -.65 + strike * .75, 2.8);
  const elbowB = limb(c, flesh, 5, -6, 7, -.65 - strike * .55, 3.2);
  const handB = limb(c, fleshLight, elbowB[0], elbowB[1], 7, .5 + strike * .35, 2.8);
  [handA, handB].forEach(([x, y], i) => {
    c.fillStyle = '#969b94'; c.beginPath(); c.roundRect(x - 2.5, y - 1.5, 5, 3, 1); c.fill();
    stroke(c, '#5c625e', 1, [[x, y + 1], [x + (i ? 3 : -3), y + 5], [x + (i ? 1 : -1), y + 8]]);
  });
  c.restore();
};

export const drawRottenPrisoner = (c: CanvasRenderingContext2D, p: PrisonPose) => drawPrisoner(c, p, false);
export const drawSummonedPrisoner = (c: CanvasRenderingContext2D, p: PrisonPose) => {
  const pulse = .5 + Math.sin(p.time * 6) * .18, active = attackPose(p); drawRune(c, p.time, active);
  c.save(); c.shadowColor = '#ba38ff'; c.shadowBlur = 11 + pulse * 9; drawPrisoner(c, p, true); c.restore();
  c.save(); c.globalAlpha = pulse; c.strokeStyle = '#c85cff'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, 12 + pulse * 2, 19, 0, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 3; i++) pixel(c, '#e9adff', Math.sin(p.time * 3 + i * 2) * 12, 11 - ((p.time * 13 + i * 7) % 25), 1, 2); c.restore();
};

export const drawHoodedMarksman = (c: CanvasRenderingContext2D, p: PrisonPose) => {
  const progress = p.attackProgress, aim = p.attack <= 0 ? 0 : progress < .72 ? ease(progress / .72) : Math.max(0, 1 - (progress - .72) / .12);
  const recoil = p.attack > 0 && progress > .72 ? Math.sin(Math.min(1, (progress - .72) / .28) * Math.PI) : 0;
  const moving = Math.min(1, Math.max(0, (Math.abs(p.vx) - 12) / 70));
  const phase = p.time * (3.8 + moving * 4.2);
  const bob = Math.abs(Math.sin(phase)) * moving * .65;
  c.save(); c.translate(-recoil * 2, -bob); c.rotate(-recoil * .08);
  // Articulated legs visible below the cloak.
  leg(c, '#171923', 3, 5, phase + Math.PI, moving, true);
  leg(c, '#292b3e', -3, 5, phase, moving);
  // Asymmetric cloak with animated tails and cel-shaded folds.
  const wind = Math.sin(p.time * 4.5) * 1.5 + moving * 2;
  shape(c, '#0b0d16', [[-8, -8], [5, -10], [10, -3], [13 + wind, 12], [6 + wind, 9], [3, 15], [-2, 10], [-9 - wind, 14], [-8, 3]]);
  shape(c, p.hurt > 0 ? '#fff4df' : '#1d1e2d', [[-6, -8], [4, -9], [8, -3], [9 + wind, 9], [3, 7], [0, 12], [-5, 7], [-7, 1]]);
  shape(c, '#343247', [[-5, -7], [-1, -9], [1, 8], [-3, 10], [-5, 3]]); stroke(c, '#555168', 1, [[-4, -4], [4 + wind, 8]]);
  // Hood has a curved silhouette and recessed face.
  c.fillStyle = '#292a3d'; c.beginPath(); c.moveTo(-8, -9); c.quadraticCurveTo(-7, -18, 1, -19); c.quadraticCurveTo(8, -17, 9, -10); c.lineTo(5, -5); c.lineTo(-6, -6); c.closePath(); c.fill();
  shape(c, '#10111a', [[-4, -14], [1, -16], [6, -12], [4, -8], [-3, -9]]); pixel(c, '#ec3150', 2, -12, 2, 1);
  // Drawing arm and bow react to the attack state instead of remaining static.
  const shoulder = [4, -6] as Point, bowX = 17 + aim * 3;
  const elbow = limb(c, '#3a394d', shoulder[0], shoulder[1], 7, -1.05 + aim * .2, 3.5); limb(c, '#a37a68', elbow[0], elbow[1], 6, -.15 - aim * .45, 2.5);
  stroke(c, '#11131b', 4, [[-1, -6], [6 - aim * 4, -1]]); stroke(c, '#aa796a', 2.4, [[-1, -6], [6 - aim * 4, -1]]);
  c.strokeStyle = '#c08a43'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(bowX, -11); c.quadraticCurveTo(bowX + 9, 0, bowX, 11); c.stroke();
  stroke(c, '#eadcc8', 1, [[bowX, -11], [bowX - 4 - aim * 3, 0], [bowX, 11]]);
  stroke(c, '#d7dce2', 1, [[5 - aim * 3, 0], [bowX + 14, 0]]); shape(c, '#d7dce2', [[bowX + 14, 0], [bowX + 9, -2], [bowX + 9, 2]]);
  c.restore();
};
