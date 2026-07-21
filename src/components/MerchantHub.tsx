import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { drawPlayerCape, drawPlayerKnight } from '../game/drawPlayerKnight';
import { drawPlayerSword } from '../game/drawCombatAnimations';
import { drawLocationBackdrop, type ParallaxLocation } from '../game/drawParallaxBackground';

type StationId = 'forge' | 'alchemist' | 'weapons' | 'evolution';

type Props = {
  origin: 'prison' | 'swamps' | 'mines' | 'clock' | 'crypt' | 'bridge' | 'castle';
  shards: number;
  interactKey: string;
  forge: ReactNode;
  alchemist: ReactNode;
  weapons: ReactNode;
  evolution: ReactNode;
  onLeave: () => void;
};

function HubBackdrop({ location }: { location: Props['origin'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const draw = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
      const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.scale(ratio, ratio);
      const w = innerWidth, h = innerHeight;
      drawLocationBackdrop(ctx, location as ParallaxLocation, w, h);
    };
    draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw);
  }, [location]);
  return <canvas ref={ref} className="hub-rendered-backdrop"/>;
}

function HubKnight({ moving, rolling, attacking, facing }: { moving: boolean; rolling: boolean; attacking: boolean; facing: -1 | 1 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = (now: number) => {
      const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(52, 58); ctx.scale(1.25 * facing, 1.25);
      const pose = { time: now / 1000, speed: moving ? 155 : 0, grounded: true, rolling, damaged: false };
      drawPlayerCape(ctx, pose);
      ctx.strokeStyle = '#242630'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      const step = moving ? Math.sin(now / 85) * 5 : 0;
      ctx.beginPath(); ctx.moveTo(-4, 11); ctx.lineTo(-7 + step, 27); ctx.moveTo(5, 11); ctx.lineTo(8 - step, 27); ctx.stroke();
      drawPlayerKnight(ctx, pose); if (attacking) drawPlayerSword(ctx, .18, .32, 0); ctx.restore(); frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
  }, [attacking, facing, moving, rolling]);
  return <canvas ref={canvasRef} width={104} height={108} aria-label="Рыцарь"/>;
}

const STATIONS: Array<{ id: StationId | 'exit'; x: number; name: string; role: string; icon: string }> = [
  { id: 'forge', x: 15, name: 'Хранитель кузни', role: 'Постоянные улучшения', icon: '♜' },
  { id: 'alchemist', x: 36, name: 'Странствующий алхимик', role: 'Раздаёт реликвии', icon: '⚗' },
  { id: 'weapons', x: 59, name: 'Оружейник', role: 'Продажа оружия', icon: '⚔' },
  { id: 'evolution', x: 79, name: 'Верстак эволюции', role: 'Рунный станок', icon: '⌘' },
  { id: 'exit', x: 94, name: 'Врата', role: 'Следующая локация', icon: '➜' },
];

function MerchantPerson({ kind, facing }: { kind: 'forge' | 'alchemist' | 'weapons'; facing: -1 | 1 }) {
  return <span className="hub-person-facing" style={{ transform: `scaleX(${facing})` }}><span className={`hub-person hub-person-${kind}`} aria-hidden="true"><i className="hub-person-shadow"/><i className="hub-person-leg hub-person-leg-left"/><i className="hub-person-leg hub-person-leg-right"/><i className="hub-person-body"/><i className="hub-person-arm hub-person-arm-left"/><i className="hub-person-arm hub-person-arm-right"/><i className="hub-person-head"/><i className="hub-person-hair"/><i className="hub-person-face"/><i className="hub-person-item"/></span></span>;
}

export function MerchantHub({ origin, shards, interactKey, forge, alchemist, weapons, evolution, onLeave }: Props) {
  const [playerX, setPlayerX] = useState(7);
  const [openStation, setOpenStation] = useState<StationId | null>(null);
  const [playerY, setPlayerY] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const verticalSpeed = useRef(0);
  const rollingRef = useRef(false);
  const attackingRef = useRef(false);
  const playerYRef = useRef(0);
  const openStationRef = useRef<StationId | null>(null);
  const held = useRef(new Set<string>());
  const nearest = useMemo(() => STATIONS.reduce((best, station) =>
    Math.abs(station.x - playerX) < Math.abs(best.x - playerX) ? station : best), [playerX]);
  const canInteract = Math.abs(nearest.x - playerX) < 5.5;
  const nearestRef = useRef(nearest);
  const canInteractRef = useRef(canInteract);
  nearestRef.current = nearest; canInteractRef.current = canInteract;

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      if (!openStationRef.current) {
        const direction = (held.current.has('KeyD') || held.current.has('ArrowRight') ? 1 : 0)
          - (held.current.has('KeyA') || held.current.has('ArrowLeft') ? 1 : 0);
        if (direction) { setFacing(direction as -1 | 1); setPlayerX((x) => Math.max(3, Math.min(97, x + direction * (rollingRef.current ? 43 : 25) * dt))); }
        verticalSpeed.current += 150 * dt;
        setPlayerY((y) => { const next = y + verticalSpeed.current * dt; if (next >= 0) { verticalSpeed.current = 0; playerYRef.current = 0; return 0; } playerYRef.current = next; return next; });
      }
      frame = requestAnimationFrame(tick);
    };
    const down = (event: KeyboardEvent) => {
      held.current.add(event.code);
      if (!openStationRef.current && (event.code === 'Space' || event.code === 'KeyW') && playerYRef.current === 0) { verticalSpeed.current = -68; event.preventDefault(); }
      if (!openStationRef.current && (event.code === 'ShiftLeft' || event.code === 'KeyC') && !rollingRef.current) { rollingRef.current = true; setRolling(true); window.setTimeout(() => { rollingRef.current = false; setRolling(false); }, 420); }
      if (!openStationRef.current && event.code === 'KeyJ' && !attackingRef.current) { attackingRef.current = true; setAttacking(true); window.setTimeout(() => { attackingRef.current = false; setAttacking(false); }, 320); }
      if (event.code === 'Escape' && openStationRef.current) { event.preventDefault(); setOpenStation(null); return; }
      if (event.code !== interactKey || event.repeat || openStationRef.current || !canInteractRef.current) return;
      event.preventDefault();
      if (nearestRef.current.id === 'exit') onLeave(); else setOpenStation(nearestRef.current.id);
    };
    const up = (event: KeyboardEvent) => held.current.delete(event.code);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [interactKey, onLeave]);

  useEffect(() => { openStationRef.current = openStation; }, [openStation]);

  const panels = { forge, alchemist, weapons, evolution };
  const move = (direction: -1 | 1) => setPlayerX((x) => Math.max(3, Math.min(97, x + direction * 4)));
  const interact = () => {
    if (!canInteract) return;
    if (nearest.id === 'exit') onLeave(); else setOpenStation(nearest.id);
  };

  const moving = held.current.has('KeyA') || held.current.has('KeyD') || held.current.has('ArrowLeft') || held.current.has('ArrowRight');
  return <div className={`merchant-hub merchant-hub-${origin} merchant-hub-exact fixed inset-0 z-40 overflow-hidden bg-[#070b0d] text-slate-100`}>
    <HubBackdrop location={origin}/>
    <div className="merchant-hub-sky"/><div className="merchant-hub-stonework"/><div className="merchant-hub-arches"/>
    <div className="hub-upper-walkway"/><div className="hub-back-door hub-back-door-one"/><div className="hub-back-door hub-back-door-two"/><div className="hub-back-door hub-back-door-three"/><div className="hub-wood-beam hub-wood-beam-left"/><div className="hub-wood-beam hub-wood-beam-right"/>
    <div className="hub-biome-decor hub-biome-decor-one"/><div className="hub-biome-decor hub-biome-decor-two"/><div className="hub-biome-decor hub-biome-decor-three"/>
    {[9, 29, 51, 72, 90].map((x, index) => <div key={x} className="hub-torch" style={{ left: `${x}%`, animationDelay: `${index * -.17}s` }}><i/><b/></div>)}
    <header className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 md:p-7">
      <div><p className="text-[9px] font-black uppercase tracking-[.4em] text-teal-300">Между локациями</p><h2 className="mt-1 text-xl font-black uppercase md:text-3xl">Убежище торговцев</h2></div>
      <p className="border border-amber-300/25 bg-black/40 px-4 py-2 text-xs">Осколки <b className="text-amber-200">{shards} ◆</b></p>
    </header>
    <div className="hub-clean-wall"/><div className="merchant-hub-floor absolute inset-x-0 bottom-0"/>
    {STATIONS.map((station) => <div key={station.id} className={`hub-station hub-${station.id}`} style={{ left: `${station.x}%` }}>
      {station.id === 'forge' || station.id === 'alchemist' || station.id === 'weapons' ? <MerchantPerson kind={station.id} facing={playerX < station.x ? -1 : 1}/>
        : station.id === 'evolution' ? <span className="hub-evolution-machine"><i/><b>⌘</b><em/></span>
        : <span className="hub-exit-gate"><i/><b>●</b></span>}
      <span className="hub-world-label"><b>{station.name}</b><small>{station.role}</small></span>
    </div>)}
    <div className="hub-player" style={{ left: `${playerX}%`, transform: `translate(-50%, ${playerY}px) scale(${rolling ? .82 : 1})` }}><HubKnight moving={moving} rolling={rolling} attacking={attacking} facing={facing}/></div>
    {canInteract && !openStation && <button onClick={interact} className="hub-prompt" style={{ left: `${nearest.x}%` }}><kbd>{interactKey.replace('Key', '')}</kbd> {nearest.id === 'exit' ? 'отправиться дальше' : `говорить · ${nearest.name}`}</button>}
    <div className="hub-mobile-controls"><button onPointerDown={() => move(-1)}>◀</button><button onClick={interact}>E</button><button onPointerDown={() => move(1)}>▶</button></div>
    <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[.2em] text-slate-500">A / D — идти · подойдите ближе · {interactKey.replace('Key', '')} — взаимодействовать</p>
    {openStation && <div className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"><section className="hub-dialog w-full max-w-5xl border border-white/15 bg-[#0b1114]/95 p-5 shadow-2xl md:p-7"><div className="mb-5 flex items-start justify-between"><div><small className="text-[9px] font-black uppercase tracking-[.3em] text-teal-300">{STATIONS.find((item) => item.id === openStation)?.role}</small><h3 className="mt-1 text-2xl font-black uppercase">{STATIONS.find((item) => item.id === openStation)?.name}</h3></div><button onClick={() => setOpenStation(null)} className="border border-white/15 px-3 py-2 text-xs text-slate-400">ESC · закрыть</button></div>{panels[openStation]}</section></div>}
  </div>;
}
