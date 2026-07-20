type Pose = { time: number; vx: number; vy: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, width = 2, height = width) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), width, height); };
const ease = (v: number) => v * v * (3 - 2 * v);
const attackPose = (p: Pose) => p.attack <= 0 ? 0 : p.attackProgress < .62 ? ease(p.attackProgress / .62) : 1 - ease((p.attackProgress - .62) / .38);

export const drawBridgeKnight = (c: CanvasRenderingContext2D, p: Pose) => {
  const moving = Math.min(1, Math.abs(p.vx) / 45), phase = p.time * (3.8 + moving * 4.7), hit = attackPose(p), wind = Math.sin(p.time * 3.4) * 2 + moving * 2;
  // Wind-driven cape behind the armor, split into independently moving tails.
  shape(c, '#241b39', [[-7, -13], [-12, -7], [-18 - wind, 4], [-12 - wind, 2], [-17 - wind * .6, 13], [-8, 8], [-4, -4]]); shape(c, '#52396d', [[-8, -10], [-12, -5], [-14 - wind, 8], [-9, 5], [-6, -3]]);
  drawWalkingLegs(c, { phase, moving: moving > .04, movement: moving, legColor: '#88929a', bootColor: '#262a31', hipY: 4, spacing: 5, legWidth: 6, legLength: 13, bootWidth: 9, bootHeight: 5, strideScale: .95 });
  shape(c, '#272c32', [[-12, -9], [-7, -17], [7, -17], [12, -9], [11, 6], [-11, 6]]); shape(c, p.hurt > 0 ? '#fff8e6' : '#919ba2', [[-9, -8], [-5, -14], [6, -14], [9, -7], [8, 3], [-8, 3]]);
  shape(c, '#cbd2d6', [[-8, -15], [-5, -22], [5, -22], [9, -15], [5, -10], [-6, -11]]); dot(c, '#11151a', -4, -18, 10, 4); dot(c, '#ecf6ff', 2, -17, 2);
  shape(c, '#59636a', [[-12, -11], [-8, -16], [-4, -12], [-7, -6]]); shape(c, '#7f8990', [[8, -16], [13, -11], [8, -6], [4, -12]]);
  line(c, '#5e4328', 5, [[5, -7], [12 + hit * 7, -2]]); line(c, '#b8c1c7', 5, [[11 + hit * 7, -2], [45 + hit * 11, -2]]); c.save(); c.shadowColor = '#f7fbff'; c.shadowBlur = 6; line(c, '#ffffff', 1.5, [[18 + hit * 8, -4], [43 + hit * 11, -4]]); c.restore(); shape(c, '#dce3e6', [[45 + hit * 11, -7], [54 + hit * 11, -2], [45 + hit * 11, 3]]);
  if (moving > .2) for (let i = 0; i < 3; i++) dot(c, '#8d969a', -10 + i * 9 - Math.sin(phase) * 3, 18 + (i & 1), 2);
};

export const drawGargoyleBomber = (c: CanvasRenderingContext2D, p: Pose) => {
  const dive = Math.min(1, Math.max(Math.abs(p.vy) / 260, p.attack > 0 ? attackPose(p) : 0)), flap = Math.sin(p.time * 11) * (1 - dive) * 6;
  c.save(); c.translate(0, Math.sin(p.time * 4) * (1 - dive));
  // Wide wings fold close to the body as vertical speed or attack commitment rises.
  shape(c, '#3d4248', [[-7, -7], [-22 + dive * 12, -15 + flap + dive * 11], [-17 + dive * 9, 5], [-8, 2]]); shape(c, '#687078', [[-8, -5], [-19 + dive * 10, -12 + flap + dive * 9], [-15 + dive * 8, 1]]);
  shape(c, '#3d4248', [[7, -7], [22 - dive * 12, -15 - flap + dive * 11], [17 - dive * 9, 5], [8, 2]]); shape(c, '#687078', [[8, -5], [19 - dive * 10, -12 - flap + dive * 9], [15 - dive * 8, 1]]);
  shape(c, p.hurt > 0 ? '#f3f4f4' : '#555b61', [[-9, -8], [-4, -14], [5, -13], [10, -7], [8, 8], [-7, 9], [-10, 2]]); line(c, '#2d3237', 1, [[-5, -10], [-1, -5], [-4, 1], [1, 7]]); line(c, '#80878d', 1, [[5, -10], [2, -4], [6, 2]]);
  shape(c, '#31363b', [[-7, -11], [-3, -17], [5, -16], [8, -10], [4, -6], [-5, -7]]); dot(c, '#ff3e3e', 1, -13, 3, 2);
  line(c, '#454b4f', 4, [[5, 4], [11, 9]]); c.save(); c.translate(13, 11); c.rotate(p.time * 2); dot(c, '#17191c', -5, -5, 10, 10); dot(c, '#31363b', -3, -3, 6, 6); c.restore();
  c.save(); c.shadowColor = '#ffb338'; c.shadowBlur = 9; const spark = Math.sin(p.time * 25) * 2; dot(c, '#ffe57a', 12 + spark, 3, 2); dot(c, '#ff6a28', 15 - spark, 5, 2); c.restore(); c.restore();
};
import { drawWalkingLegs } from './drawWalkingLegs';
