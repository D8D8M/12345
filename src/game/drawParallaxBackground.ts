export type ParallaxLocation = 'prison' | 'swamps' | 'mines' | 'clock' | 'crypt' | 'bridge' | 'castle' | 'throne';

type Palette = { sky: string; glow: string; far: string; middle: string; near: string };

const PALETTES: Record<ParallaxLocation, Palette> = {
  prison: { sky: '#071018', glow: '#263b43', far: '#14252d', middle: '#102027', near: '#09151b' },
  swamps: { sky: '#142239', glow: '#788064', far: '#25372e', middle: '#172b25', near: '#0b1c18' },
  mines: { sky: '#080706', glow: '#4d3522', far: '#30241c', middle: '#211813', near: '#100c09' },
  clock: { sky: '#100807', glow: '#6c371e', far: '#402318', middle: '#29150f', near: '#130907' },
  crypt: { sky: '#03020a', glow: '#251449', far: '#17102c', middle: '#0e0a20', near: '#070512' },
  bridge: { sky: '#586f91', glow: '#e59a72', far: '#5d5063', middle: '#403947', near: '#24232d' },
  castle: { sky: '#090817', glow: '#4b2940', far: '#2b2139', middle: '#1c192c', near: '#100f20' },
  throne: { sky: '#07121b', glow: '#24506a', far: '#173244', middle: '#102837', near: '#091922' },
};

const wrap = (value: number, size: number) => ((value % size) + size) % size;

const drawLayer = (ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number, cameraY: number, speed: number, color: string, layer: number, location: ParallaxLocation) => {
  const spacing = 155 + layer * 58;
  const offsetX = wrap(cameraX * speed, spacing);
  const offsetY = cameraY * speed * .16;
  ctx.fillStyle = color;

  for (let i = -2; i < Math.ceil(width / spacing) + 3; i += 1) {
    const x = i * spacing - offsetX;
    const variation = (i * 47 + layer * 31) % 85;
    if (location === 'swamps') {
      const trunkH = 175 + variation + layer * 34;
      ctx.fillRect(x + 42, height - trunkH - offsetY, 18 + layer * 5, trunkH + 30);
      ctx.beginPath(); ctx.ellipse(x + 48, height - trunkH - offsetY, 70 + layer * 15, 38 + layer * 8, 0, 0, Math.PI * 2); ctx.fill();
    } else if (location === 'clock') {
      const y = 115 + wrap(i * 127 - cameraY * speed, Math.max(180, height - 160));
      const radius = 30 + layer * 15 + Math.abs(variation) * .12;
      ctx.strokeStyle = color; ctx.lineWidth = 9 + layer * 3; ctx.beginPath(); ctx.arc(x + 60, y, radius, 0, Math.PI * 2); ctx.stroke();
      for (let tooth = 0; tooth < 8; tooth += 1) { const angle = tooth * Math.PI / 4; ctx.save(); ctx.translate(x + 60 + Math.cos(angle) * radius, y + Math.sin(angle) * radius); ctx.rotate(angle); ctx.fillRect(-7, -7, 19, 14); ctx.restore(); }
    } else if (location === 'bridge') {
      ctx.beginPath(); ctx.moveTo(x - 35, height); ctx.lineTo(x + spacing * .48, height - 105 - variation - layer * 34 - offsetY); ctx.lineTo(x + spacing + 35, height); ctx.fill();
    } else if (location === 'mines' || location === 'crypt') {
      ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 45, 75 + variation + layer * 24 + offsetY); ctx.lineTo(x + 92, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 55, height); ctx.lineTo(x + 120, height - 80 - variation - layer * 19 - offsetY); ctx.lineTo(x + spacing + 20, height); ctx.fill();
    } else {
      const towerH = 170 + variation + layer * 45;
      ctx.fillRect(x + 18, height - towerH - offsetY, spacing - 38, towerH + 20);
      if (location === 'castle' || location === 'throne') {
        ctx.beginPath(); ctx.moveTo(x + 12, height - towerH - offsetY); ctx.lineTo(x + spacing / 2, height - towerH - 75 - layer * 18 - offsetY); ctx.lineTo(x + spacing - 12, height - towerH - offsetY); ctx.fill();
      } else {
        for (let bar = 0; bar < 4; bar += 1) ctx.fillRect(x + 30 + bar * 25, height - towerH + 18 - offsetY, 7, towerH - 30);
      }
    }
  }
};

export const drawParallaxBackground = (ctx: CanvasRenderingContext2D, location: ParallaxLocation, width: number, height: number) => {
  const palette = PALETTES[location];
  const sky = ctx.createRadialGradient(width * .55, height * .34, 20, width * .5, height * .45, width * .8);
  sky.addColorStop(0, palette.glow); sky.addColorStop(.58, palette.sky); sky.addColorStop(1, '#020407');
  ctx.fillStyle = sky; ctx.fillRect(-20, -20, width + 40, height + 40);
};

export const drawParallaxLayers = (ctx: CanvasRenderingContext2D, location: ParallaxLocation, width: number, height: number, cameraX: number, cameraY: number) => {
  const palette = PALETTES[location];
  drawLayer(ctx, width, height, cameraX, cameraY, .06, palette.far, 0, location);
  drawLayer(ctx, width, height, cameraX, cameraY, .14, palette.middle, 1, location);
  drawLayer(ctx, width, height, cameraX, cameraY, .28, palette.near, 2, location);
};
