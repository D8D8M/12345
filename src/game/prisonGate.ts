export type GateFragment = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  spin: number;
  life: number;
  maxLife: number;
};

type GateBox = { x: number; y: number; w: number; h: number };

export const createGateFragments = (gate: GateBox, direction: number): GateFragment[] => {
  const fragments: GateFragment[] = [];
  const barCount = Math.max(3, Math.floor((gate.w - 8) / 10));

  for (let bar = 0; bar < barCount; bar += 1) {
    for (let section = 0; section < 3; section += 1) {
      const maxLife = .75 + Math.random() * .55;
      fragments.push({
        x: gate.x + 7 + bar * 10,
        y: gate.y + 5 + section * (gate.h - 10) / 3,
        vx: direction * (130 + Math.random() * 190) + (Math.random() - .5) * 90,
        vy: -180 - Math.random() * 260 + section * 45,
        w: 4,
        h: Math.max(9, (gate.h - 16) / 3),
        angle: (Math.random() - .5) * .35,
        spin: (Math.random() - .5) * 13,
        life: maxLife,
        maxLife,
      });
    }
  }
  return fragments;
};

export const updateGateFragments = (fragments: GateFragment[], dt: number) => {
  for (const fragment of fragments) {
    fragment.life -= dt;
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.vy += 850 * dt;
    fragment.angle += fragment.spin * dt;
    fragment.vx *= Math.max(0, 1 - dt * 1.4);
  }
  for (let i = fragments.length - 1; i >= 0; i -= 1) {
    if (fragments[i].life <= 0) fragments.splice(i, 1);
  }
};

export const drawGateFragments = (ctx: CanvasRenderingContext2D, fragments: GateFragment[]) => {
  for (const fragment of fragments) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fragment.life * 4) * Math.min(1, fragment.life / (fragment.maxLife * .25));
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.angle);
    ctx.fillStyle = '#35484a';
    ctx.fillRect(-fragment.w / 2, -fragment.h / 2, fragment.w, fragment.h);
    ctx.fillStyle = '#78908a';
    ctx.fillRect(-fragment.w / 2, -fragment.h / 2, 1, fragment.h);
    ctx.restore();
  }
};
