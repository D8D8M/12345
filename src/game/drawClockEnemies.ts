type Pose = { time: number; vx: number; attack: number; attackProgress: number; hurt: number };
type Point = readonly [number, number];
const shape = (c: CanvasRenderingContext2D, color: string, p: Point[]) => { c.fillStyle = color; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.closePath(); c.fill(); };
const line = (c: CanvasRenderingContext2D, color: string, width: number, p: Point[]) => { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(...p[0]); p.slice(1).forEach((v) => c.lineTo(...v)); c.stroke(); };
const dot = (c: CanvasRenderingContext2D, color: string, x: number, y: number, width = 2, height = width) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), width, height); };
const ease = (v: number) => v * v * (3 - 2 * v);
const strike = (p: Pose) => p.attack <= 0 ? 0 : p.attackProgress < .55 ? ease(p.attackProgress / .55) : 1 - ease((p.attackProgress - .55) / .45);

export const drawWatchSoldier = (c: CanvasRenderingContext2D, p: Pose) => {
  const moving = Math.min(1, Math.abs(p.vx) / 150), phase = p.time * (4.2 + moving * 6), hit = strike(p);
  drawWalkingLegs(c, { phase, moving: moving > .04, movement: moving, legColor: '#b98a31', bootColor: '#2b2418', hipY: 4, spacing: 4, legWidth: 4, legLength: 12, bootWidth: 7, bootHeight: 4, strideScale: .9 });
  shape(c, '#3d301d', [[-9, -8], [-5, -13], [5, -13], [9, -7], [8, 5], [-8, 5]]); shape(c, p.hurt > 0 ? '#fff2c8' : '#b18332', [[-7, -7], [-3, -11], [5, -10], [7, -5], [6, 3], [-6, 3]]);
  shape(c, '#d0a548', [[-6, -11], [-4, -17], [4, -17], [7, -11]]); dot(c, '#13191c', -3, -14, 8, 4); c.save(); c.shadowColor = '#72e4ff'; c.shadowBlur = 8; dot(c, '#8ff0ff', 2, -13, 2); c.restore();
  line(c, '#6d5124', 3, [[6, -5], [11 + hit * 7, -1]]); line(c, '#d8dde0', 3, [[10 + hit * 7, -1], [38 + hit * 10, -1]]);
  c.save(); c.shadowColor = '#fff5bd'; c.shadowBlur = 7; line(c, '#ffffff', 1, [[18 + hit * 7, -2], [36 + hit * 10, -2]]); c.restore(); shape(c, '#e7ecee', [[38 + hit * 10, -5], [46 + hit * 10, -1], [38 + hit * 10, 3]]);
  if (moving > .15 || hit > .1) for (let i = 0; i < 4; i++) { const age = (p.time * 5 + i * .23) % 1; c.save(); c.globalAlpha = 1 - age; c.shadowColor = '#ffb52e'; c.shadowBlur = 5; dot(c, i & 1 ? '#fff09a' : '#ff8a22', (i & 1 ? -5 : 5) - age * 8, 6 + age * 8 - i, 1 + (i & 1)); c.restore(); }
};

export const drawFlyingGear = (c: CanvasRenderingContext2D, p: Pose) => {
  const speed = 5 + Math.min(8, Math.hypot(p.vx, 0) * .035), rotation = p.time * speed;
  c.save(); c.globalAlpha = .1 + Math.min(.28, Math.abs(p.vx) / 600); c.strokeStyle = '#a6dcff'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 15, 0, Math.PI * 2); c.stroke(); c.globalAlpha *= .6; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 19, 0, Math.PI * 2); c.stroke(); c.restore();
  c.save(); c.rotate(rotation); for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); shape(c, i & 1 ? '#8d9ba4' : '#c2d0d6', [[-3, -5], [1, -21], [5, -6], [3, -2], [-3, -2]]); line(c, '#f2fbff', 1, [[1, -19], [4, -7]]); } c.restore();
  c.fillStyle = '#343d43'; c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.fill(); for (let i = 0; i < 8; i++) { c.save(); c.rotate(i * Math.PI / 4); dot(c, '#788791', -2, -13, 4, 5); c.restore(); }
  c.save(); c.shadowColor = '#9a5cff'; c.shadowBlur = 13; c.fillStyle = '#7b34c7'; c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.fill(); dot(c, '#ead8ff', -1, -2, 2); c.restore();
};

export const drawTowerSniper = (c: CanvasRenderingContext2D, p: Pose) => {
  const charge = p.attack > 0 ? ease(Math.min(1, p.attackProgress / .78)) : 0, recoil = p.attack > 0 && p.attackProgress > .78 ? Math.sin((p.attackProgress - .78) / .22 * Math.PI) : 0;
  c.save(); c.translate(-recoil * 4, 0); shape(c, '#111724', [[-7, 14], [-8, -7], [-4, -16], [4, -16], [8, -7], [6, 14]]); shape(c, p.hurt > 0 ? '#f6f2df' : '#26334c', [[-5, 11], [-6, -6], [-2, -13], [4, -12], [6, -5], [4, 11]]);
  shape(c, '#0a0d14', [[-7, -10], [-3, -18], [4, -17], [8, -11], [4, -7], [-5, -7]]); c.save(); c.shadowColor = '#ff6b28'; c.shadowBlur = 5 + charge * 8; dot(c, '#ff9b35', 2, -13, 2); c.restore();
  line(c, '#19212b', 5, [[1, -5], [12, 0]]); line(c, '#3f4d57', 4, [[9, 0], [47, 0]]); dot(c, '#71808a', 15, -4, 12, 4); dot(c, '#182028', 19, -7, 5, 3);
  c.save(); c.shadowColor = charge > .7 ? '#ffd83d' : '#ff7028'; c.shadowBlur = 3 + charge * 17; line(c, charge > .7 ? '#fff06a' : '#d45528', 2 + charge * 2, [[35, 0], [49, 0]]); c.restore(); c.restore();
};
import { drawWalkingLegs } from './drawWalkingLegs';
