import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { drawPlayerCape, drawPlayerKnight } from '../game/drawPlayerKnight';
import { drawPlayerSword } from '../game/drawCombatAnimations';
import { drawParallaxBackground, type ParallaxLocation } from '../game/drawParallaxBackground';

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
  const images: Partial<Record<Props['origin'], string>> = {
    prison: '/hub-backgrounds/location-1.png',
    swamps: '/hub-backgrounds/location-2.png',
    mines: '/hub-backgrounds/location-3.png',
    clock: '/hub-backgrounds/location-4.png',
    crypt: '/hub-backgrounds/location-5.png',
    bridge: '/hub-backgrounds/location-6.png',
  };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const draw = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
      const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.scale(ratio, ratio);
      const w = innerWidth, h = innerHeight; drawParallaxBackground(ctx, location as ParallaxLocation, w, h);
      if (location === 'prison') for (const x of [90, w * .37, w * .68, w - 190]) { ctx.fillStyle = '#071116'; ctx.fillRect(x, 55, 145, 175); ctx.strokeStyle = '#52666a'; ctx.lineWidth = 8; ctx.strokeRect(x, 55, 145, 175); for (let bar = 1; bar < 5; bar++) { ctx.fillStyle = '#43565a'; ctx.fillRect(x + bar * 28, 60, 7, 165); } }
      if (location === 'swamps') for (let x = -40; x < w + 100; x += 145) { ctx.fillStyle = '#0b2118'; ctx.fillRect(x + 54, h * .28, 25, h); ctx.beginPath(); ctx.ellipse(x + 65, h * .23, 105, 58, 0, 0, Math.PI * 2); ctx.fill(); }
      if (location === 'mines') for (let x = 90; x < w; x += 330) { ctx.fillStyle = '#5a321d'; ctx.fillRect(x, 0, 19, h); ctx.fillStyle = '#1d120d'; for (let y = 70; y < h; y += 150) ctx.fillRect(x - 7, y, 33, 7); }
      if (location === 'clock') { ctx.fillStyle = '#3b2119'; for (let y = 0; y < h; y += 34) for (let x = -(y % 68); x < w; x += 92) ctx.fillRect(x, y, 86, 28); for (const [x,y,r] of [[w*.2,h*.25,58],[w*.63,h*.16,78],[w*.52,h*.62,50],[w*.82,h*.72,70]] as const) { ctx.strokeStyle='#111317aa'; ctx.lineWidth=14; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); } }
      if (location === 'crypt') { ctx.fillStyle = '#20154a77'; for (let x = 80; x < w; x += 290) ctx.fillRect(x, 0, 72, h); ctx.fillStyle='#050714aa'; for (let x=240;x<w;x+=430) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+70,150); ctx.lineTo(x+130,0); ctx.fill(); } }
      if (location === 'bridge') { const sky=ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#96919d'); sky.addColorStop(.48,'#d59270'); sky.addColorStop(1,'#d9a669'); ctx.fillStyle=sky; ctx.fillRect(0,0,w,h); ctx.fillStyle='#252936'; for(let x=-100;x<w;x+=190){ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x+100,h*.48);ctx.lineTo(x+230,h);ctx.fill();} }
      if (location === 'castle') { ctx.fillStyle='#4b382d'; for(let y=0;y<h;y+=52) for(let x=-(y%104);x<w;x+=130) ctx.fillRect(x,y,122,45); for(const x of [w*.16,w*.48,w*.8]) { ctx.fillStyle='#781f2b'; ctx.fillRect(x-38,65,76,190); ctx.fillStyle='#d4af55'; ctx.fillRect(x-42,65,84,8); ctx.beginPath(); ctx.arc(x,145,22,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#4b1019'; ctx.font='bold 28px serif'; ctx.textAlign='center'; ctx.fillText('♛',x,155); } for(const x of [w*.08,w*.32,w*.64,w*.92]) { const y=h*.43; ctx.fillStyle='#661925'; ctx.fillRect(x-25,y,50,112); ctx.fillStyle='#d4af55'; ctx.fillRect(x-29,y,58,6); ctx.beginPath(); ctx.arc(x,y+48,15,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#4b1019'; ctx.font='bold 19px serif'; ctx.textAlign='center'; ctx.fillText('♛',x,y+55); } }
      ctx.fillStyle = location === 'bridge' ? '#30343d' : location === 'swamps' ? '#17261a' : location === 'castle' ? '#332820' : '#10191d'; ctx.fillRect(0, h * .73, w, h * .27); ctx.fillStyle = location === 'castle' ? '#d4af55' : '#48635a'; ctx.fillRect(0, h * .73, w, 6);
    };
    draw(); window.addEventListener('resize', draw); return () => window.removeEventListener('resize', draw);
  }, [location]);
  const image = images[location];
  return image ? <img src={image} className="hub-rendered-backdrop" alt=""/> : <canvas ref={ref} className="hub-rendered-backdrop"/>;
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
