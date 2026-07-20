import { useEffect, useRef } from 'react';
import type { BestiaryEntry } from '../game/bestiary';
import { drawEarlyEnemy, earlyEnemySpriteSizes, isEarlyEnemyVariant } from '../game/drawEarlyEnemies';
import { drawUniqueBoss, uniqueBossSpriteSizes, type UniqueBossVariant } from '../game/drawUniqueBoss';

const BOSSES = new Set<UniqueBossVariant>(['swampGiant', 'stoneGolem', 'cryptWarden', 'bridgeColossus', 'rightHand']);

export function BestiaryGameModel({ entry }: { entry: BestiaryEntry }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const time = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createRadialGradient(180, 120, 20, 180, 120, 180);
      gradient.addColorStop(0, `${entry.color}44`); gradient.addColorStop(1, '#030609');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#090d12'; ctx.fillRect(0, 215, canvas.width, 45);
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, 214, canvas.width, 2);
      ctx.save(); ctx.translate(180, 207);
      if (isEarlyEnemyVariant(entry.id)) {
        const size = earlyEnemySpriteSizes[entry.id];
        const scale = Math.min(5.2, 135 / size.h); ctx.scale(scale, scale); ctx.translate(0, -size.h / 2);
        drawEarlyEnemy(ctx, { variant: entry.id, time, vx: 0, vy: 0, attack: 0, attackProgress: 0, hurt: 0, blocked: 0, stunned: 0, defeated: false });
      } else if (BOSSES.has(entry.id as UniqueBossVariant)) {
        const variant = entry.id as UniqueBossVariant, size = uniqueBossSpriteSizes[variant];
        const scale = Math.min(3.1, 160 / size.h); ctx.scale(scale, scale); ctx.translate(0, -size.h / 2);
        drawUniqueBoss(ctx, variant, time, 0, false);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '10px ui-sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ИГРОВАЯ МОДЕЛЬ', 180, 246);
    };
    draw();
  }, [entry]);
  return <canvas ref={canvasRef} width={360} height={260} className="h-full w-full object-contain [image-rendering:pixelated]" aria-label={`Игровая модель: ${entry.name}`}/>;
}
