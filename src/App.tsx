import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { supabase } from './lib/supabase';

type Hud = { hp: number; maxHp: number; cells: number; kills: number; grenade: number; trap: number; message: string };
type Box = { x: number; y: number; w: number; h: number };
type GearKind = 'sword' | 'bow' | 'shield' | 'grenade' | 'freeze' | 'trap' | 'empty';
type Gear = { kind: GearKind; name: string; tier: number; damage: number; cooldown: number };
type RunProgress = { hp: number; maxHp: number; damage: number; cells: number; loadout: [Gear, Gear, Gear, Gear] };
type PermanentProgress = { maxHpBonus: number; damageBonus: number };
type LocationKind = 'prison' | 'sewers' | 'promenade';
type SectorTheme = { name: string; subtitle: string; center: string; middle: string; edge: string; stone: string; mortar: string; accent: string; accentGlow: string; flame: string; flameCore: string; mist: string };

const SECTOR_THEMES: SectorTheme[] = [
  { name: 'Гнилые болота', subtitle: 'ядовитая низина', center: '#203c38', middle: '#112522', edge: '#050d0c', stone: '#293633', mortar: '#121c1a', accent: '#66e38f', accentGlow: '#35d06f', flame: '#b7ef55', flameCore: '#efff9a', mist: 'rgba(91,180,116,.08)' },
  { name: 'Кристальная пещера', subtitle: 'синие разломы', center: '#262d5e', middle: '#141a3d', edge: '#060817', stone: '#303544', mortar: '#151925', accent: '#65b8ed', accentGlow: '#428ddf', flame: '#7ad7ff', flameCore: '#d4f5ff', mist: 'rgba(91,126,220,.09)' },
  { name: 'Древний склеп', subtitle: 'залы забытых', center: '#38264d', middle: '#20162e', edge: '#0a0610', stone: '#37313d', mortar: '#19141d', accent: '#b887db', accentGlow: '#8f55bf', flame: '#ff9d42', flameCore: '#ffe08a', mist: 'rgba(150,103,175,.08)' },
  { name: 'Затопленные руины', subtitle: 'безмолвные каналы', center: '#17384b', middle: '#102631', edge: '#040c12', stone: '#293940', mortar: '#111d22', accent: '#42d8d0', accentGlow: '#1fa8ad', flame: '#65e1ca', flameCore: '#c6fff5', mist: 'rgba(60,173,190,.09)' },
  { name: 'Пепельная кузня', subtitle: 'сердце механизма', center: '#4a2927', middle: '#271516', edge: '#0e0607', stone: '#3d3332', mortar: '#1d1515', accent: '#f07845', accentGlow: '#dc452c', flame: '#ff7b29', flameCore: '#ffe071', mist: 'rgba(210,83,48,.08)' },
];
const LOCATION_NAMES: Record<LocationKind, string> = { prison: "Prisoners' Quarters", sewers: 'Toxic Sewers', promenade: 'Promenade of the Condemned' };
const PROMENADE_THEME: SectorTheme = { name: 'Тропа обречённых', subtitle: 'багровый закат', center: '#61343f', middle: '#351b28', edge: '#10070d', stone: '#42353b', mortar: '#20151b', accent: '#e07878', accentGlow: '#b83f58', flame: '#ffad57', flameCore: '#ffe3a1', mist: 'rgba(190,72,91,.09)' };
const ENEMIES_PER_SECTOR = 28;
const STARTING_LOADOUT: [Gear, Gear, Gear, Gear] = [
  { kind: 'sword', name: 'Ржавый меч', tier: 1, damage: 18, cooldown: .38 },
  { kind: 'bow', name: 'Старый лук', tier: 1, damage: 13, cooldown: .65 },
  { kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 },
  { kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 },
];
const loadPermanentProgress = (): PermanentProgress => {
  try { return JSON.parse(localStorage.getItem('ashfall-permanent-progress') || '') as PermanentProgress; }
  catch { return { maxHpBonus: 0, damageBonus: 0 }; }
};
const freshRun = (permanent: PermanentProgress = { maxHpBonus: 0, damageBonus: 0 }): RunProgress => ({ hp: 100 + permanent.maxHpBonus, maxHp: 100 + permanent.maxHpBonus, damage: 1 + permanent.damageBonus, cells: 0, loadout: STARTING_LOADOUT.map((gear) => ({ ...gear })) as [Gear, Gear, Gear, Gear] });

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const permanentProgress = useRef<PermanentProgress>(loadPermanentProgress());
  const runProgress = useRef<RunProgress>(freshRun(permanentProgress.current));
  const selectedSlot = useRef(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [hud, setHud] = useState<Hud>({ hp: 100, maxHp: 100, cells: 0, kills: 0, grenade: 0, trap: 0, message: '' });
  const [started, setStarted] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [sector, setSector] = useState(1);
  const [location, setLocation] = useState<LocationKind>('prison');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<Exclude<LocationKind, 'prison'>>('sewers');
  const [, refreshShop] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      if (nextSession) setShowAuth(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const theme = location === 'sewers' ? SECTOR_THEMES[0] : location === 'promenade' ? PROMENADE_THEME : SECTOR_THEMES[1];
    const enemyHealthScale = 1 + (sector - 1) * .18;
    const enemyDamageScale = (1 + (sector - 1) * .12) * (location === 'sewers' ? 1.25 : 1);

    const W = 1280, H = 720, worldW = 12000, worldH = 2200, groundY = 620, lowerGroundY = 1420, deepGroundY = 2100;
    const layout = (sector - 1) % 3;
    const terrain: Box[] = [
      { x: 420, y: 540, w: 300, h: 80 }, { x: 1000, y: 500, w: 360, h: 120 }, { x: 1640, y: 550, w: 270, h: 70 },
      { x: 2250, y: 470, w: 410, h: 150 }, { x: 3020, y: 525, w: 310, h: 95 }, { x: 3700, y: 445, w: 430, h: 175 },
      { x: 4400, y: 520, w: 340, h: 100 }, { x: 4970, y: 455, w: 390, h: 165 }, { x: 5680, y: 535, w: 320, h: 85 },
      { x: 6270, y: 475, w: 430, h: 145 }, { x: 6940, y: 535, w: 330, h: 85 }, { x: 7480, y: 460, w: 420, h: 160 },
      { x: 8120, y: 520, w: 360, h: 100 },
      // Нижний ярус.
      { x: 300, y: 1280, w: 460, h: 140 }, { x: 980, y: 1330, w: 380, h: 90 }, { x: 1540, y: 1240, w: 440, h: 180 },
      { x: 2380, y: 1300, w: 520, h: 120 }, { x: 3180, y: 1220, w: 430, h: 200 }, { x: 3910, y: 1320, w: 480, h: 100 },
      { x: 4700, y: 1260, w: 390, h: 160 }, { x: 5380, y: 1325, w: 440, h: 95 }, { x: 6400, y: 1240, w: 480, h: 180 },
      { x: 7180, y: 1310, w: 420, h: 110 }, { x: 7900, y: 1250, w: 460, h: 170 },
      // Продолжение верхнего и среднего ярусов далеко вправо.
      { x: 8750, y: 510, w: 420, h: 110 }, { x: 9460, y: 450, w: 470, h: 170 }, { x: 10220, y: 530, w: 380, h: 90 },
      { x: 10850, y: 470, w: 460, h: 150 }, { x: 11520, y: 525, w: 360, h: 95 },
      { x: 8700, y: 1300, w: 440, h: 120 }, { x: 9440, y: 1230, w: 480, h: 190 }, { x: 10200, y: 1320, w: 420, h: 100 },
      { x: 10900, y: 1260, w: 450, h: 160 }, { x: 11550, y: 1310, w: 330, h: 110 },
      // Самый глубокий ярус.
      { x: 260, y: 1960, w: 470, h: 140 }, { x: 980, y: 2010, w: 420, h: 90 }, { x: 1660, y: 1920, w: 500, h: 180 },
      { x: 2500, y: 1990, w: 450, h: 110 }, { x: 3260, y: 1900, w: 520, h: 200 }, { x: 4080, y: 2010, w: 480, h: 90 },
      { x: 4900, y: 1940, w: 440, h: 160 }, { x: 5640, y: 2010, w: 500, h: 90 }, { x: 6460, y: 1920, w: 460, h: 180 },
      { x: 7240, y: 1980, w: 430, h: 120 }, { x: 8100, y: 1900, w: 500, h: 200 }, { x: 8940, y: 2010, w: 480, h: 90 },
      { x: 9740, y: 1930, w: 460, h: 170 }, { x: 10520, y: 2000, w: 500, h: 100 }, { x: 11320, y: 1910, w: 520, h: 190 },
    ];
    const ceilings: Box[] = [
      { x: 40, y: 0, w: 760, h: 155 }, { x: 940, y: 0, w: 690, h: 205 }, { x: 1780, y: 0, w: 720, h: 145 },
      { x: 2640, y: 0, w: 620, h: 190 }, { x: 3400, y: 0, w: 690, h: 135 }, { x: 4230, y: 0, w: 700, h: 200 },
      { x: 5070, y: 0, w: 650, h: 150 }, { x: 5860, y: 0, w: 900, h: 185 }, { x: 6960, y: 0, w: 620, h: 130 },
      { x: 7820, y: 0, w: 740, h: 175 },
    ];
    const dividers: Box[] = [
      { x: 800, y: 0, w: 48, h: 390 }, { x: 1630, y: 0, w: 48, h: 420 }, { x: 2500, y: 0, w: 48, h: 350 },
      { x: 3260, y: 0, w: 48, h: 405 }, { x: 4090, y: 0, w: 48, h: 340 }, { x: 4930, y: 0, w: 40, h: 350 },
      { x: 5720, y: 0, w: 48, h: 410 }, { x: 6760, y: 0, w: 48, h: 350 }, { x: 7580, y: 0, w: 48, h: 190 },
    ];
    const upperFloor: Box[] = [
      { x: 0, y: groundY, w: 2050, h: 100 }, { x: 2250, y: groundY, w: 3750, h: 100 }, { x: 6200, y: groundY, w: worldW - 6200, h: 100 },
    ];
    const solids: Box[] = [
      ...upperFloor,
      { x: 0, y: lowerGroundY, w: 4300, h: 100 }, { x: 4520, y: lowerGroundY, w: 3080, h: 100 }, { x: 7820, y: lowerGroundY, w: worldW - 7820, h: 100 },
      { x: 0, y: deepGroundY, w: worldW, h: 100 }, { x: 0, y: 0, w: 40, h: worldH }, { x: worldW - 40, y: 0, w: 40, h: worldH }, ...terrain, ...ceilings, ...dividers,
    ];
    const heightShift = layout === 1 ? 34 : layout === 2 ? -28 : 0;
    const oneWays: Box[] = [
      { x: 150, y: 455, w: 210, h: 18 }, { x: 520, y: 350 + heightShift, w: 260, h: 18 }, { x: 820, y: 425, w: 150, h: 18 },
      { x: 1080, y: 315 - heightShift, w: 240, h: 18 }, { x: 1400, y: 410, w: 200, h: 18 }, { x: 1690, y: 305 + heightShift, w: 260, h: 18 },
      { x: 1990, y: 535, w: 210, h: 18 }, { x: 2290, y: 280 - heightShift, w: 320, h: 18 }, { x: 2700, y: 390, w: 250, h: 18 },
      { x: 3070, y: 330 + heightShift, w: 230, h: 18 }, { x: 3380, y: 530, w: 260, h: 18 }, { x: 3740, y: 245 - heightShift, w: 340, h: 18 },
      { x: 4160, y: 365, w: 210, h: 18 }, { x: 4430, y: 300 + heightShift, w: 270, h: 18 }, { x: 4800, y: 405, w: 150, h: 18 },
      { x: 5020, y: 260 - heightShift, w: 290, h: 18 }, { x: 5410, y: 390, w: 220, h: 18 }, { x: 5710, y: 310 + heightShift, w: 260, h: 18 },
      { x: 6060, y: 525, w: 170, h: 18 }, { x: 6320, y: 275 - heightShift, w: 320, h: 18 },
      { x: 365, y: 485, w: 90, h: 18 }, { x: 795, y: 455, w: 90, h: 18 }, { x: 1540, y: 485, w: 90, h: 18 },
      { x: 2160, y: 410, w: 90, h: 18 }, { x: 2940, y: 465, w: 90, h: 18 }, { x: 3600, y: 385, w: 100, h: 18 },
      { x: 4870, y: 490, w: 100, h: 18 }, { x: 6000, y: 430, w: 100, h: 18 },
      // Развилка: лестница ведёт к верхней ветке, нижняя продолжается по земле.
      { x: 6740, y: 525, w: 170, h: 18 }, { x: 6980, y: 420, w: 190, h: 18 }, { x: 7240, y: 325, w: 210, h: 18 },
      { x: 7530, y: 235, w: 310, h: 18 }, { x: 7910, y: 315, w: 230, h: 18 }, { x: 8200, y: 405, w: 220, h: 18 },
      // Боковой карман нижнего маршрута образует отдельный тупик.
      { x: 7080, y: 560, w: 250, h: 18 }, { x: 7700, y: 550, w: 250, h: 18 }, { x: 8230, y: 500, w: 250, h: 18 },
      // Две шахты соединяют верхний мир с большим нижним этажом.
      { x: 2055, y: 760, w: 125, h: 18 }, { x: 2120, y: 885, w: 125, h: 18 }, { x: 2055, y: 1010, w: 125, h: 18 }, { x: 2120, y: 1135, w: 125, h: 18 },
      { x: 6010, y: 760, w: 125, h: 18 }, { x: 6075, y: 885, w: 125, h: 18 }, { x: 6010, y: 1010, w: 125, h: 18 }, { x: 6075, y: 1135, w: 125, h: 18 },
      // Развилки нижнего яруса.
      { x: 120, y: 1160, w: 260, h: 18 }, { x: 520, y: 1040, w: 300, h: 18 }, { x: 900, y: 1150, w: 250, h: 18 },
      { x: 1420, y: 1080, w: 300, h: 18 }, { x: 1840, y: 1190, w: 280, h: 18 }, { x: 2300, y: 1010, w: 340, h: 18 },
      { x: 2750, y: 1120, w: 260, h: 18 }, { x: 3060, y: 970, w: 330, h: 18 }, { x: 3500, y: 1090, w: 310, h: 18 },
      { x: 4050, y: 1040, w: 330, h: 18 }, { x: 4500, y: 1160, w: 280, h: 18 }, { x: 4930, y: 1010, w: 330, h: 18 },
      { x: 5460, y: 1110, w: 300, h: 18 }, { x: 6280, y: 1030, w: 340, h: 18 }, { x: 6700, y: 1150, w: 260, h: 18 },
      { x: 7120, y: 980, w: 330, h: 18 }, { x: 7580, y: 1110, w: 300, h: 18 }, { x: 8050, y: 1020, w: 350, h: 18 },
      { x: 8660, y: 1090, w: 320, h: 18 }, { x: 9100, y: 970, w: 300, h: 18 }, { x: 9540, y: 1100, w: 340, h: 18 },
      { x: 10040, y: 1010, w: 300, h: 18 }, { x: 10500, y: 1140, w: 320, h: 18 }, { x: 11000, y: 1020, w: 340, h: 18 }, { x: 11500, y: 1120, w: 300, h: 18 },
      // Шахты на третий ярус.
      { x: 4305, y: 1540, w: 130, h: 18 }, { x: 4385, y: 1660, w: 130, h: 18 }, { x: 4305, y: 1780, w: 130, h: 18 }, { x: 4385, y: 1900, w: 130, h: 18 },
      { x: 7605, y: 1540, w: 130, h: 18 }, { x: 7685, y: 1660, w: 130, h: 18 }, { x: 7605, y: 1780, w: 130, h: 18 }, { x: 7685, y: 1900, w: 130, h: 18 },
      // Длинные развилки глубинного этажа.
      { x: 100, y: 1810, w: 300, h: 18 }, { x: 560, y: 1700, w: 320, h: 18 }, { x: 1040, y: 1810, w: 280, h: 18 },
      { x: 1480, y: 1680, w: 340, h: 18 }, { x: 1980, y: 1790, w: 300, h: 18 }, { x: 2460, y: 1650, w: 350, h: 18 },
      { x: 3000, y: 1770, w: 320, h: 18 }, { x: 3500, y: 1640, w: 340, h: 18 }, { x: 4010, y: 1760, w: 300, h: 18 },
      { x: 4750, y: 1680, w: 340, h: 18 }, { x: 5280, y: 1800, w: 300, h: 18 }, { x: 5750, y: 1660, w: 350, h: 18 },
      { x: 6300, y: 1780, w: 320, h: 18 }, { x: 6850, y: 1650, w: 340, h: 18 }, { x: 7350, y: 1800, w: 300, h: 18 },
      { x: 8040, y: 1680, w: 350, h: 18 }, { x: 8580, y: 1800, w: 300, h: 18 }, { x: 9050, y: 1660, w: 340, h: 18 },
      { x: 9580, y: 1790, w: 320, h: 18 }, { x: 10080, y: 1650, w: 350, h: 18 }, { x: 10620, y: 1780, w: 310, h: 18 }, { x: 11200, y: 1660, w: 380, h: 18 },
    ];
    const projectileBlockers = [...solids, ...oneWays];
    type EnemyKind = 'zombie' | 'crossbow' | 'shield' | 'bomber' | 'mage' | 'totem';
    type Enemy = Box & { kind: EnemyKind; vx: number; patrolSpeed: number; hp: number; maxHp: number; left: number; right: number; homeY: number; facing: number; alert: number; turnDelay: number; hurt: number; attack: number; cooldown: number; blocked: number; dead: boolean };
    type Projectile = Box & { vx: number; vy: number; life: number; damage: number; kind: 'arrow' | 'grenade' | 'freeze' | 'enemyArrow' | 'enemyBomb' | 'magicOrb' };
    type Trap = Box & { life: number; damage: number; triggered: boolean };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
    type Explosion = { x: number; y: number; life: number; maxLife: number; radius: number };
    type Door = Box & { opening: number; destination: Exclude<LocationKind, 'prison'>; label: string };
    type PowerUp = Box & { kind: 'health'; collected: boolean; phase: number };
    type Loot = Box & { gear: Gear; collected: boolean; phase: number };
    const doors: Door[] = [
      // Каждая дверь завершает отдельную ветку — рядом с ней больше нет второй двери.
      { x: 7730, y: 163, w: 58, h: 72, opening: 0, destination: 'promenade', label: 'Верхняя галерея' },
      { x: 11720, y: 1238, w: 58, h: 72, opening: 0, destination: 'sewers', label: 'Дальний тоннель' },
      { x: 4450, y: 1938, w: 58, h: 72, opening: 0, destination: location === 'sewers' ? 'promenade' : 'sewers', label: 'Забытые глубины' },
    ];
    const spawnPlatforms = [...terrain, ...oneWays];
    const basicKinds: EnemyKind[] = ['zombie', 'crossbow', 'shield', 'zombie', 'bomber', 'shield', 'zombie', 'crossbow'];
    const advancedKinds: EnemyKind[] = ['zombie', 'mage', 'shield', 'crossbow', 'totem', 'bomber', 'zombie', 'mage', 'shield', 'crossbow', 'totem', 'bomber', 'zombie', 'mage'];
    const enemyPool = location === 'prison' ? basicKinds : advancedKinds;
    const kinds: EnemyKind[] = Array.from({ length: ENEMIES_PER_SECTOR }, (_, index) => enemyPool[index % enemyPool.length]);
    const shuffledPlatforms = [...spawnPlatforms].sort(() => Math.random() - .5).slice(0, kinds.length);
    const enemies: Enemy[] = kinds.map((kind, index) => {
      const platform = shuffledPlatforms[index];
      const w = kind === 'shield' ? 44 : kind === 'totem' ? 40 : 38, h = kind === 'shield' ? 48 : kind === 'totem' ? 60 : 42;
      const left = platform.x + 10, right = platform.x + platform.w - 10;
      let x = left;
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidateX = left + Math.random() * Math.max(1, right - left - w);
        const blocked = [...ceilings, ...dividers].some((wall) => candidateX < wall.x + wall.w && candidateX + w > wall.x && platform.y - h < wall.y + wall.h && platform.y > wall.y);
        if (!blocked) { x = candidateX; break; }
      }
      const hp = Math.round((kind === 'totem' ? 105 : kind === 'mage' ? 65 : 55) * enemyHealthScale);
      const speed = kind === 'zombie' ? 78 : kind === 'shield' ? 24 : kind === 'bomber' ? 26 : 0;
      return { kind, x, y: platform.y - h, w, h, vx: speed * (Math.random() < .5 ? -1 : 1), patrolSpeed: speed, hp, maxHp: hp, left, right, homeY: platform.y - h, facing: 1, alert: 0, turnDelay: 0, hurt: 0, attack: 0, cooldown: .5 + Math.random(), blocked: 0, dead: false };
    });
    const player = { x: 90, y: 560, w: 34, h: 56, vx: 0, vy: 0, facing: 1, grounded: false, jumps: 0, hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, roll: 0, rollCd: 0, attack: 0, bow: 0, guard: 0, hurt: 0, drop: 0, dead: false };
    const checkpoint = { x: player.x, y: player.y };
    const powerUpPlatforms = [...terrain, ...oneWays].sort(() => Math.random() - .5).slice(0, 1);
    const powerUps: PowerUp[] = powerUpPlatforms.map((platform) => ({ x: platform.x + 25 + Math.random() * Math.max(1, platform.w - 70), y: platform.y - 28, w: 24, h: 24, kind: 'health', collected: false, phase: Math.random() * Math.PI * 2 }));
    const lootTemplates: Gear[] = [
      { kind: 'sword', name: 'Стальной клинок', tier: sector + 1, damage: 25 + sector * 5, cooldown: .32 },
      { kind: 'bow', name: 'Охотничий лук', tier: sector + 1, damage: 19 + sector * 4, cooldown: .52 },
      { kind: 'shield', name: 'Башенный щит', tier: sector + 1, damage: 12 + sector * 3, cooldown: .7 },
      { kind: 'grenade', name: 'Осколочная бомба', tier: sector, damage: 45 + sector * 6, cooldown: 5 },
      { kind: 'freeze', name: 'Ледяная бомба', tier: sector, damage: 24 + sector * 4, cooldown: 6 },
      { kind: 'trap', name: 'Зубастый капкан', tier: sector, damage: 38 + sector * 5, cooldown: 8 },
    ];
    const sectorLoot = [...lootTemplates].sort(() => Math.random() - .5).slice(0, 2);
    const lootPlatforms = [...terrain, ...oneWays].sort(() => Math.random() - .5).slice(0, sectorLoot.length);
    const loot: Loot[] = sectorLoot.map((gear, index) => ({ x: lootPlatforms[index].x + lootPlatforms[index].w / 2 - 13, y: lootPlatforms[index].y - 30, w: 26, h: 26, gear, collected: false, phase: Math.random() * Math.PI * 2 }));
    const keys = new Set<string>(), pressed = new Set<string>();
    const projectiles: Projectile[] = [], traps: Trap[] = [], particles: Particle[] = [], explosions: Explosion[] = [];
    let grenadeCd = 0, trapCd = 0, kills = 0, cells = runProgress.current.cells, camera = 0, cameraY = 0, last = performance.now(), raf = 0, uiTimer = 0, shake = 0, flash = 0, activeDoor: Door | null = null;
    const torches = Array.from({ length: 42 }, (_, i) => ({ x: 110 + i * 247 + Math.random() * 90, y: 145 + Math.random() * (worldH - 260), phase: Math.random() * Math.PI * 2 }));
    const chains = [...terrain, ...oneWays].filter(() => Math.random() > .52).map((tile) => ({ x: tile.x + 22 + Math.random() * Math.max(10, tile.w - 44), y: tile.y + tile.h, length: 45 + Math.random() * 105 }));

    const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const resolveEnemyWalls = (enemy: Enemy) => {
      for (const wall of solids) if (overlap(enemy, wall)) {
        const enemyCenter = enemy.x + enemy.w / 2, wallCenter = wall.x + wall.w / 2;
        enemy.x = enemyCenter < wallCenter ? wall.x - enemy.w : wall.x + wall.w;
        enemy.vx = enemyCenter < wallCenter ? -Math.abs(enemy.patrolSpeed) : Math.abs(enemy.patrolSpeed);
      }
    };
    const clearShot = (x1: number, y: number, x2: number) => {
      const left = Math.min(x1, x2), right = Math.max(x1, x2);
      return !projectileBlockers.some((tile) => y > tile.y && y < tile.y + tile.h && tile.x < right && tile.x + tile.w > left);
    };
    const wallBetween = (x1: number, y1: number, x2: number, y2: number) => dividers.some((wall) => {
      for (let step = 1; step < 24; step++) {
        const t = step / 24, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        if (x > wall.x && x < wall.x + wall.w && y > wall.y && y < wall.y + wall.h) return true;
      }
      return false;
    });
    const gearSlot = (gear: Gear) => {
      if (gear.kind === 'bow') return 1;
      if (gear.kind === 'sword' || gear.kind === 'shield') return 0;
      const same = runProgress.current.loadout.findIndex((equipped, index) => index >= 2 && equipped.kind === gear.kind);
      const empty = runProgress.current.loadout.findIndex((equipped, index) => index >= 2 && equipped.kind === 'empty');
      return same >= 0 ? same : empty >= 0 ? empty : runProgress.current.loadout[2].tier <= runProgress.current.loadout[3].tier ? 2 : 3;
    };
    const tap = (...codes: string[]) => codes.some((code) => pressed.has(code));
    const burst = (x: number, y: number, color: string, count = 9) => {
      for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 260, vy: (Math.random() - .7) * 220, life: .25 + Math.random() * .35, color, size: 2 + Math.random() * 5 });
    };
    const protectedByTotem = (enemy: Enemy) => enemy.kind !== 'totem' && enemies.some((totem) => {
      if (totem.dead || totem.kind !== 'totem') return false;
      const dx = enemy.x + enemy.w / 2 - (totem.x + totem.w / 2), dy = enemy.y + enemy.h / 2 - (totem.y + totem.h / 2);
      return dx * dx + dy * dy <= 280 * 280;
    });
    const damageEnemy = (enemy: Enemy, damage: number, direction: number, sourceX: number) => {
      if (enemy.dead || enemy.hurt > 0) return;
      if (protectedByTotem(enemy)) { enemy.blocked = .22; shake = 2; burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#67e8f9', 7); return; }
      const sourceInFront = enemy.facing > 0 ? sourceX > enemy.x + enemy.w / 2 : sourceX < enemy.x + enemy.w / 2;
      if (enemy.kind === 'shield' && sourceInFront) { enemy.blocked = .22; shake = 2; burst(enemy.x + enemy.w / 2 + enemy.facing * 18, enemy.y + 22, '#fde68a', 5); return; }
      enemy.hp -= damage * runProgress.current.damage; enemy.hurt = .16; enemy.x += direction * 12; shake = 5; burst(enemy.x + enemy.w / 2, enemy.y + 18, '#ff5d67');
      if (enemy.hp <= 0) {
        enemy.dead = true; kills++; cells += 3; runProgress.current.cells = cells;
        for (let i = 0; i < 12; i++) particles.push({ x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2, vx: (Math.random() - .5) * 210, vy: -70 - Math.random() * 150, life: .7 + Math.random() * .45, color: i % 2 ? '#ef445d' : '#4ea8de', size: 3 + Math.random() * 4 });
      }
    };
    const attackSword = (gear: Gear) => {
      if (player.attack > 0 || player.dead) return;
      player.attack = gear.cooldown;
      const hit: Box = { x: player.facing > 0 ? player.x + player.w : player.x - 62, y: player.y + 4, w: 62, h: 48 };
      enemies.forEach((enemy) => { if (overlap(hit, enemy)) damageEnemy(enemy, gear.damage, player.facing, player.x + player.w / 2); });
    };
    const shoot = (gear: Gear) => {
      if (player.bow > 0 || player.dead) return;
      player.bow = gear.cooldown;
      projectiles.push({ x: player.x + (player.facing > 0 ? 32 : -12), y: player.y + 22, w: 18, h: 4, vx: player.facing * 720, vy: 0, life: 1.5, damage: gear.damage, kind: 'arrow' });
    };
    const grenade = (gear: Gear, slot: number) => {
      if ((slot === 2 ? grenadeCd : trapCd) > 0 || player.dead) return;
      if (slot === 2) grenadeCd = gear.cooldown; else trapCd = gear.cooldown;
      projectiles.push({ x: player.x + 12, y: player.y + 12, w: 14, h: 14, vx: player.facing * 320, vy: -450, life: .85, damage: gear.damage, kind: gear.kind === 'freeze' ? 'freeze' : 'grenade' });
    };
    const placeTrap = (gear: Gear, slot: number) => {
      if ((slot === 2 ? grenadeCd : trapCd) > 0 || player.dead) return;
      if (slot === 2) grenadeCd = gear.cooldown; else trapCd = gear.cooldown;
      traps.push({ x: player.x - 8, y: player.y + player.h - 10, w: 52, h: 12, life: 7, damage: gear.damage, triggered: false });
    };
    const useSelectedGear = () => {
      const slot = selectedSlot.current, gear = runProgress.current.loadout[slot];
      if (gear.kind === 'sword') attackSword(gear);
      else if (gear.kind === 'bow') shoot(gear);
      else if (gear.kind === 'shield') { player.guard = .55; attackSword(gear); }
      else if (gear.kind === 'trap') placeTrap(gear, slot);
      else if (gear.kind === 'grenade' || gear.kind === 'freeze') grenade(gear, slot);
    };
    const damagePlayer = (damage: number, sourceX: number) => {
      if (player.roll > 0 || player.hurt > 0 || player.dead) return;
      const attackInFront = player.facing > 0 ? sourceX > player.x : sourceX < player.x + player.w;
      if (player.guard > 0 && attackInFront) { shake = 3; burst(player.x + player.w / 2 + player.facing * 18, player.y + 24, '#fde68a', 7); return; }
      player.hp -= Math.round(damage * enemyDamageScale); runProgress.current.hp = Math.max(0, player.hp); player.hurt = .85; player.vy = -280; player.vx = (player.x < sourceX ? -1 : 1) * 330;
      shake = 10; flash = .12; burst(player.x + 17, player.y + 25, '#fb7185', 14);
      if (player.hp <= 0) { player.hp = 0; player.dead = true; player.vy = -380; }
    };
    const reset = () => {
      runProgress.current = freshRun(permanentProgress.current); selectedSlot.current = 0; setActiveSlot(0);
      setHud({ hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, cells: 0, kills: 0, grenade: 0, trap: 0, message: '' });
      setLocation('prison'); setSector(1); setRunKey((n) => n + 1);
    };

    const keyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        keys.clear(); pressed.clear();
        return;
      }
      if (pausedRef.current) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
      if (!keys.has(e.code)) pressed.add(e.code);
      keys.add(e.code);
      const slotCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4'];
      const slot = slotCodes.indexOf(e.code);
      if (slot >= 0) { selectedSlot.current = slot; setActiveSlot(slot); }
      if (e.code === 'KeyR' && player.dead) reset();
    };
    const keyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const mouseDown = (e: MouseEvent) => { if (!pausedRef.current && e.button === 0) { e.preventDefault(); useSelectedGear(); } };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    canvas.addEventListener('mousedown', mouseDown);

    const moveAndCollide = (dt: number) => {
      const oldY = player.y;
      player.x += player.vx * dt;
      for (const tile of solids) if (overlap(player, tile)) {
        if (player.vx > 0) player.x = tile.x - player.w; else if (player.vx < 0) player.x = tile.x + tile.w;
        player.vx = 0;
      }
      player.y += player.vy * dt; player.grounded = false;
      for (const tile of solids) if (overlap(player, tile)) {
        if (player.vy > 0) { player.y = tile.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0; }
        else if (player.vy < 0) { player.y = tile.y + tile.h; player.vy = 0; }
      }
      if (player.vy >= 0 && player.drop <= 0) for (const tile of oneWays) {
        const oldBottom = oldY + player.h, newBottom = player.y + player.h;
        if (player.x + player.w > tile.x && player.x < tile.x + tile.w && oldBottom <= tile.y + 3 && newBottom >= tile.y) {
          player.y = tile.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0;
        }
      }
    };

    const update = (dt: number) => {
      // Защита от проваливания за геометрию: без неё камера доходила до
      // нижнего левого ограничения и оставалась там без видимого игрока.
      const playerOutOfWorld = !Number.isFinite(player.x) || !Number.isFinite(player.y) || player.x < 40 || player.x + player.w > worldW - 40 || player.y > worldH + 80;
      if (playerOutOfWorld && !player.dead) {
        player.x = checkpoint.x; player.y = checkpoint.y; player.vx = 0; player.vy = 0; player.grounded = false;
        camera = Math.max(0, Math.min(player.x - W * .38, worldW - W));
        cameraY = Math.max(0, Math.min(player.y - H * .78, worldH - H));
        keys.clear(); pressed.clear();
      }
      if (player.dead) {
        player.vy += 1450 * dt; moveAndCollide(dt); shake *= .82; flash -= dt; uiTimer -= dt;
        if (uiTimer <= 0) { uiTimer = .08; setHud({ hp: 0, maxHp: player.maxHp, cells, kills, grenade: Math.max(0, grenadeCd), trap: Math.max(0, trapCd), message: 'ВЫ ПРОИГРАЛИ' }); }
        return;
      }
      player.roll -= dt; player.rollCd -= dt; player.attack -= dt; player.bow -= dt; player.guard -= dt; player.hurt -= dt; player.drop -= dt; grenadeCd -= dt; trapCd -= dt; flash -= dt;
      const left = keys.has('ArrowLeft') || keys.has('KeyA'), right = keys.has('ArrowRight') || keys.has('KeyD');
      if (player.roll <= 0) {
        const target = (Number(right) - Number(left)) * 260;
        player.vx += (target - player.vx) * Math.min(1, dt * (player.grounded ? 15 : 7));
        if (left) player.facing = -1; if (right) player.facing = 1;
      }
      if (tap('ShiftLeft', 'ShiftRight', 'KeyC') && player.rollCd <= 0) { player.roll = .3; player.rollCd = .65; player.vx = player.facing * 440; burst(player.x + 17, player.y + 45, '#66e4c2', 7); }
      if (tap('Space', 'KeyW', 'ArrowUp')) {
        if ((keys.has('ArrowDown') || keys.has('KeyS')) && player.grounded) { player.drop = .22; player.grounded = false; player.y += 5; }
        else if (player.grounded || player.jumps < 2) { player.vy = -560; player.jumps++; player.grounded = false; burst(player.x + 17, player.y + 55, '#a7b2b8', 6); }
      }
      player.vy = Math.min(player.vy + 1550 * dt, 850); moveAndCollide(dt);
      if (player.grounded && player.y >= 0 && player.y < worldH - player.h) {
        checkpoint.x = player.x; checkpoint.y = player.y;
      }

      for (const item of loot) if (!item.collected) {
        const nearLoot = Math.abs(player.x + player.w / 2 - (item.x + item.w / 2)) < 68 && Math.abs(player.y + player.h / 2 - (item.y + item.h / 2)) < 72;
        if (!nearLoot || !tap('KeyE')) continue;
        const gear = item.gear;
        const slot = gearSlot(gear);
        runProgress.current.loadout[slot] = { ...gear }; item.collected = true; pressed.delete('KeyE'); burst(item.x + 13, item.y + 13, '#f8fafc', 20);
      }
      for (const powerUp of powerUps) if (!powerUp.collected && overlap(player, powerUp)) {
        powerUp.collected = true;
        const previousMax = player.maxHp; player.maxHp = Math.round(player.maxHp * 1.1); player.hp = Math.min(player.maxHp, player.hp + player.maxHp - previousMax);
        runProgress.current.maxHp = player.maxHp; runProgress.current.hp = player.hp; burst(powerUp.x + 12, powerUp.y + 12, '#fb7185', 18);
      }

      for (const enemy of enemies) if (!enemy.dead) {
        enemy.hurt -= dt; enemy.cooldown -= dt; enemy.blocked -= dt;
        const enemyCenter = enemy.x + enemy.w / 2, playerCenter = player.x + player.w / 2;
        const playerCenterY = player.y + player.h / 2, enemyCenterY = enemy.y + enemy.h / 2;
        const dx = playerCenter - enemyCenter, dyToPlayer = playerCenterY - enemyCenterY, sameLevel = Math.abs(dyToPlayer) < 55;
        const sightRange = enemy.kind === 'mage' ? 13 * 40 : enemy.kind === 'crossbow' ? 8 * 40 : enemy.kind === 'zombie' ? 7 * 40 : enemy.kind === 'bomber' ? 6 * 40 : 5 * 40;
        const bomberSeesPlayer = enemy.kind === 'bomber' && Math.hypot(dx, dyToPlayer) <= 360 && !wallBetween(enemyCenter, enemyCenterY, playerCenter, playerCenterY);
        const seesPlayer = enemy.kind !== 'totem' && (bomberSeesPlayer || (sameLevel && Math.abs(dx) <= sightRange && (enemy.kind === 'mage' || clearShot(enemyCenter, enemyCenterY, playerCenter))));
        if (enemy.kind === 'shield') enemy.alert = seesPlayer ? Math.min(.65, enemy.alert + dt) : Math.max(0, enemy.alert - dt * 2);
        const detected = enemy.kind === 'shield' ? seesPlayer && enemy.alert >= .55 : seesPlayer;
        const wasAttacking = enemy.attack > 0; enemy.attack -= dt;

        if (enemy.kind === 'zombie' || enemy.kind === 'shield') {
          if (detected && enemy.attack <= 0) {
            const direction = Math.sign(dx) || enemy.facing;
            enemy.vx = direction * (enemy.kind === 'zombie' ? 155 : 38);
            if (enemy.kind === 'shield' && direction !== enemy.facing) { enemy.vx = 0; enemy.turnDelay += dt; if (enemy.turnDelay >= .55) { enemy.facing = direction; enemy.turnDelay = 0; } }
            else { enemy.facing = direction; enemy.turnDelay = 0; }
          } else if (!detected && enemy.attack <= 0) { enemy.vx = (Math.sign(enemy.vx) || enemy.facing) * enemy.patrolSpeed; enemy.turnDelay = 0; }
        }
        if (enemy.kind === 'zombie') {
          if (detected && Math.abs(dx) < 64 && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = .25; enemy.cooldown = .82; enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          if (wasAttacking && enemy.attack <= 0 && detected && Math.abs(dx) < 80) damagePlayer(18, enemyCenter);
        } else if (enemy.kind === 'shield') {
          if (detected && Math.abs(dx) < 64 && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = .36; enemy.cooldown = 1.15; enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          if (wasAttacking && enemy.attack <= 0 && detected && Math.abs(dx) < 78) damagePlayer(7, enemyCenter);
        } else if (enemy.kind === 'crossbow') {
          enemy.vx = 0; if (seesPlayer) enemy.facing = Math.sign(dx) || enemy.facing;
          if (seesPlayer && enemy.cooldown <= 0) {
            enemy.attack = .18; enemy.cooldown = 2.6;
            projectiles.push({ x: enemyCenter + enemy.facing * 18, y: enemy.y + 21, w: 22, h: 5, vx: enemy.facing * 430, vy: 0, life: 2.2, damage: 14, kind: 'enemyArrow' });
          }
        } else if (enemy.kind === 'bomber') {
          if (detected) { enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          else enemy.vx = (Math.sign(enemy.vx) || enemy.facing) * enemy.patrolSpeed;
          if (detected && enemy.cooldown <= 0) {
            enemy.attack = .35; enemy.cooldown = 3.2;
            const flightTime = Math.max(.75, Math.min(1.35, Math.abs(dx) / 300));
            const bombVx = dx / flightTime, bombVy = (dyToPlayer - .5 * 900 * flightTime * flightTime) / flightTime;
            projectiles.push({ x: enemyCenter + enemy.facing * 14, y: enemy.y + 5, w: 13, h: 13, vx: bombVx, vy: bombVy, life: 2.4, damage: 20, kind: 'enemyBomb' });
          }
        } else if (enemy.kind === 'mage') {
          enemy.vx = 0; if (seesPlayer) enemy.facing = Math.sign(dx) || enemy.facing;
          if (seesPlayer && enemy.cooldown <= 0) {
            enemy.attack = .45; enemy.cooldown = 3.4;
            const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2), distance = Math.max(1, Math.hypot(dx, dy));
            projectiles.push({ x: enemyCenter - 8, y: enemy.y + 12, w: 17, h: 17, vx: dx / distance * 155, vy: dy / distance * 155, life: 6, damage: 17, kind: 'magicOrb' });
          }
        } else if (enemy.kind === 'totem') {
          enemy.vx = 0;
        }

        if (!['crossbow', 'mage', 'totem'].includes(enemy.kind) && enemy.attack <= 0) {
          enemy.x += enemy.vx * dt; if (enemy.kind !== 'shield' || !detected) enemy.facing = Math.sign(enemy.vx) || enemy.facing;
          if (enemy.x < enemy.left || enemy.x + enemy.w > enemy.right) { enemy.vx *= -1; enemy.x = Math.max(enemy.left, Math.min(enemy.x, enemy.right - enemy.w)); }
        }
      }
      for (const p of projectiles) {
        const previousX = p.x, previousY = p.y;
        p.life -= dt; p.vy += (p.kind === 'grenade' || p.kind === 'freeze' || p.kind === 'enemyBomb' ? 900 : 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const hitWorld = p.kind !== 'magicOrb' && projectileBlockers.some((tile) => overlap(p, tile));
        if (hitWorld && p.kind === 'enemyBomb') { p.x = previousX; p.y = previousY; p.vx *= .55; p.vy = -Math.abs(p.vy) * .38; }
        else if (hitWorld) p.life = 0;
        if (!hitWorld && p.kind === 'arrow') for (const e of enemies) if (!e.dead && overlap(p, e)) { damageEnemy(e, p.damage, Math.sign(p.vx), p.x); p.life = 0; }
        if (!hitWorld && p.kind === 'enemyArrow' && overlap(p, player)) { if (player.roll <= 0) damagePlayer(p.damage, p.x); p.life = 0; }
        if (p.kind === 'magicOrb' && overlap(p, player)) { if (player.roll <= 0) damagePlayer(p.damage, p.x); p.life = 0; burst(p.x, p.y, '#c084fc', 12); }
        if ((p.kind === 'grenade' || p.kind === 'freeze') && p.life <= 0) { enemies.forEach((e) => { const dx = e.x - p.x, dy = e.y - p.y; if (dx * dx + dy * dy < 150 * 150) { damageEnemy(e, p.damage, Math.sign(dx) || 1, p.x); if (p.kind === 'freeze') e.vx *= .3; } }); burst(p.x, p.y, p.kind === 'freeze' ? '#67e8f9' : '#f5b942', 28); shake = 14; }
        if (p.kind === 'enemyBomb' && p.life <= 0) { const dx = player.x + player.w / 2 - p.x, dy = player.y + player.h / 2 - p.y; if (dx * dx + dy * dy < 135 * 135) damagePlayer(p.damage, p.x); explosions.push({ x: p.x, y: p.y, life: .48, maxLife: .48, radius: 145 }); burst(p.x, p.y, '#ff7a45', 32); burst(p.x, p.y, '#fde68a', 18); shake = 14; }
      }
      for (const trap of traps) { trap.life -= dt; for (const e of enemies) if (!e.dead && !trap.triggered && overlap(trap, e)) { trap.triggered = true; trap.life = .35; e.vx *= .15; damageEnemy(e, trap.damage, Math.sign(e.x - trap.x), trap.x + trap.w / 2); } }
      for (const enemy of enemies) if (!enemy.dead) resolveEnemyWalls(enemy);
      for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
      for (const explosion of explosions) explosion.life -= dt;
      for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].life <= 0) projectiles.splice(i, 1);
      for (let i = traps.length - 1; i >= 0; i--) if (traps[i].life <= 0) traps.splice(i, 1);
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
      for (let i = explosions.length - 1; i >= 0; i--) if (explosions[i].life <= 0) explosions.splice(i, 1);
      const targetCameraX = Math.max(0, Math.min(player.x - W * .38, worldW - W));
      const targetCameraY = Math.max(0, Math.min(player.y - H * .78, worldH - H));
      if (Number.isFinite(targetCameraX) && Number.isFinite(targetCameraY)) {
        camera += (targetCameraX - camera) * Math.min(1, dt * 5);
        cameraY += (targetCameraY - cameraY) * Math.min(1, dt * 5);
      }
      shake *= .82;
      // Вход только по E: ArrowUp также отвечает за прыжок и раньше случайно
      // переключал локацию, когда игрок оказывался рядом с дверью.
      if (!activeDoor && tap('KeyE')) {
        const playerCenter = player.x + player.w / 2;
        const nearbyDoor = doors.find((door) => Math.abs(playerCenter - (door.x + door.w / 2)) < 72 && Math.abs(player.y + player.h - (door.y + door.h)) < 30);
        if (nearbyDoor) { activeDoor = nearbyDoor; activeDoor.opening = .55; }
      }
      if (activeDoor) {
        activeDoor.opening -= dt;
        if (activeDoor.opening <= 0) { const destination = activeDoor.destination; activeDoor = null; runProgress.current.maxHp = player.maxHp; runProgress.current.hp = player.maxHp; runProgress.current.cells = cells; setPendingDestination(destination); pausedRef.current = true; setShopOpen(true); refreshShop((value) => value + 1); return; }
      }
      uiTimer -= dt;
      if (uiTimer <= 0) { uiTimer = .08; setHud({ hp: player.hp, maxHp: player.maxHp, cells, kills, grenade: Math.max(0, grenadeCd), trap: Math.max(0, trapCd), message: player.dead ? 'ВЫ ПРОИГРАЛИ' : '' }); }
    };

    const drawCanvas = () => {
      const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
      ctx.save(); ctx.translate(sx, sy);
      const bg = ctx.createRadialGradient(W * .5, H * .38, 40, W * .5, H * .45, W * .72);
      bg.addColorStop(0, theme.center); bg.addColorStop(.5, theme.middle); bg.addColorStop(1, theme.edge); ctx.fillStyle = bg; ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = 'rgba(68,74,119,.14)';
      for (let y = 95; y < H; y += 42) for (let x = -60; x < W + 80; x += 92) { const offset = Math.floor(y / 42) % 2 ? 42 : 0; ctx.fillRect(x + offset, y, 76, 3); }
      ctx.fillStyle = 'rgba(255,255,255,.018)'; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = 'rgba(6,8,20,.38)'; for (let i = 0; i < 12; i++) { const x = ((i * 233 - camera * .18) % 1500) - 100; ctx.fillRect(x, 120 + (i % 3) * 45, 110, 500); }
      const now = performance.now() / 1000;
      for (const torch of torches) {
        const x = ((torch.x - camera * .22) % (W + 220)) - 30, y = ((torch.y - cameraY * .35) % (H + 140)) - 40, flicker = 1 + Math.sin(now * 9 + torch.phase) * .18 + Math.sin(now * 17 + torch.phase) * .08;
        const glow = ctx.createRadialGradient(x, y, 2, x, y, 48 * flicker); glow.addColorStop(0, theme.mist.replace(/\.0\d+\)/, '.3)')); glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glow; ctx.fillRect(x - 55, y - 55, 110, 110);
        ctx.fillStyle = '#5b4336'; ctx.fillRect(x - 3, y + 7, 6, 15); ctx.fillStyle = theme.flame; ctx.fillRect(x - 5 * flicker, y - 8 * flicker, 10 * flicker, 16 * flicker); ctx.fillStyle = theme.flameCore; ctx.fillRect(x - 2 * flicker, y - 5 * flicker, 5 * flicker, 9 * flicker);
      }
      ctx.fillStyle = theme.mist; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(((i * 390 - camera * .08 + now * 8) % 1700) - 180, 470 + i * 42, 250, 38, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.save(); ctx.translate(-camera, -cameraY);
      ctx.globalAlpha = .34; ctx.strokeStyle = theme.stone; ctx.lineWidth = 18;
      for (let x = 250; x < worldW; x += 760) { ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, 235); ctx.arc(x + 145, 235, 145, Math.PI, 0); ctx.lineTo(x + 290, groundY); ctx.stroke(); }
      ctx.globalAlpha = .45; ctx.fillStyle = theme.stone;
      for (const bridge of oneWays) { const floorY = bridge.y < groundY ? groundY : bridge.y < lowerGroundY ? lowerGroundY : deepGroundY; ctx.fillRect(bridge.x + 12, bridge.y + bridge.h, 10, Math.max(0, floorY - bridge.y - bridge.h)); ctx.fillRect(bridge.x + bridge.w - 22, bridge.y + bridge.h, 10, Math.max(0, floorY - bridge.y - bridge.h)); }
      ctx.globalAlpha = 1;
      for (const tile of solids) {
        ctx.fillStyle = theme.stone; ctx.fillRect(tile.x, tile.y, tile.w, tile.h); ctx.fillStyle = theme.mortar;
        for (let y = tile.y + 14; y < tile.y + tile.h; y += 22) { ctx.fillRect(tile.x, y, tile.w, 2); for (let x = tile.x + ((Math.floor((y - tile.y) / 22) % 2) ? 18 : 42); x < tile.x + tile.w; x += 64) ctx.fillRect(x, y - 14, 2, 16); }
        ctx.fillStyle = 'rgba(255,255,255,.055)'; ctx.fillRect(tile.x + 3, tile.y + 5, Math.max(0, tile.w - 6), 2);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let x = tile.x + 28; x < tile.x + tile.w; x += 83) ctx.fillRect(x, tile.y + 25 + ((x / 83) % 3) * 13, 7, 3);
        ctx.shadowColor = theme.accentGlow; ctx.shadowBlur = 9; ctx.fillStyle = theme.accent; ctx.fillRect(tile.x, tile.y, tile.w, 3); ctx.shadowBlur = 0;
      }
      for (const tile of oneWays) { ctx.fillStyle = theme.stone; ctx.fillRect(tile.x, tile.y, tile.w, tile.h); ctx.fillStyle = theme.mortar; for (let x = tile.x + 20; x < tile.x + tile.w; x += 42) ctx.fillRect(x, tile.y + 7, 24, 3); ctx.shadowColor = theme.accentGlow; ctx.shadowBlur = 8; ctx.fillStyle = theme.accent; ctx.fillRect(tile.x, tile.y, tile.w, 3); ctx.shadowBlur = 0; }
      for (const chain of chains) { ctx.strokeStyle = '#69707c'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = chain.y; y < chain.y + chain.length; y += 9) { ctx.moveTo(chain.x - 2, y); ctx.lineTo(chain.x + 2, y + 5); ctx.lineTo(chain.x - 2, y + 9); } ctx.stroke(); }
      for (const item of loot) if (!item.collected) {
        const iy = item.y + Math.sin(now * 2.6 + item.phase) * 4, skill = ['grenade', 'freeze', 'trap'].includes(item.gear.kind), color = item.gear.kind === 'freeze' ? '#67e8f9' : skill ? '#fb923c' : '#e9d5ff';
        ctx.shadowColor = color; ctx.shadowBlur = 13; ctx.fillStyle = '#111827'; ctx.fillRect(item.x - 4, iy - 4, 34, 34); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(item.x - 4, iy - 4, 34, 34); ctx.shadowBlur = 0;
        ctx.fillStyle = color; if (item.gear.kind === 'sword') { ctx.fillRect(item.x + 11, iy, 4, 21); ctx.fillRect(item.x + 5, iy + 17, 16, 4); } else if (item.gear.kind === 'bow') { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(item.x + 11, iy + 13, 10, -1.4, 1.4); ctx.stroke(); } else if (item.gear.kind === 'shield') { ctx.fillRect(item.x + 5, iy + 2, 16, 18); } else { ctx.fillRect(item.x + 5, iy + 5, 16, 16); }
        ctx.fillStyle = 'rgba(4,7,12,.9)'; ctx.fillRect(item.x - 36, iy - 19, 98, 12); ctx.fillStyle = color; ctx.font = 'bold 8px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${item.gear.name} · T${item.gear.tier}`, item.x + 13, iy - 10); ctx.textAlign = 'start';
        if (Math.abs(player.x + player.w / 2 - (item.x + 13)) < 105) {
          const equipped = runProgress.current.loadout[gearSlot(item.gear)], newDamage = Math.round(item.gear.damage * runProgress.current.damage), oldDamage = Math.round(equipped.damage * runProgress.current.damage);
          ctx.fillStyle = 'rgba(3,7,12,.95)'; ctx.fillRect(item.x - 55, iy - 81, 136, 54); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(item.x - 55, iy - 81, 136, 54);
          ctx.font = 'bold 9px ui-sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left'; ctx.fillText(`Старое: ${oldDamage} урона`, item.x - 47, iy - 52); ctx.fillStyle = newDamage >= oldDamage ? '#86efac' : '#fda4af'; ctx.fillText(`Новое:  ${newDamage} урона`, item.x - 47, iy - 37); ctx.textAlign = 'start';
          ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText('E · ЗАМЕНИТЬ', item.x + 13, iy - 68); ctx.textAlign = 'start';
        }
      }
      for (const powerUp of powerUps) if (!powerUp.collected) {
        const py = powerUp.y + Math.sin(now * 3 + powerUp.phase) * 4, color = '#fb7185';
        ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fillStyle = color; ctx.fillRect(powerUp.x + 4, py, 16, 20); ctx.fillRect(powerUp.x, py + 4, 24, 12); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff7ed'; ctx.fillRect(powerUp.x + 10, py + 4, 4, 12); ctx.fillRect(powerUp.x + 6, py + 8, 12, 4);
        ctx.fillStyle = 'rgba(4,7,12,.82)'; ctx.fillRect(powerUp.x - 18, py - 18, 60, 13); ctx.fillStyle = color; ctx.font = 'bold 8px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HP +10%', powerUp.x + 12, py - 9); ctx.textAlign = 'start';
      }
      for (const door of doors) {
        const opening = activeDoor === door ? Math.max(0, door.opening / .55) : 1;
        ctx.fillStyle = 'rgba(3,7,12,.9)'; ctx.fillRect(door.x - 20, door.y - 31, door.w + 40, 17); ctx.fillStyle = theme.accent; ctx.font = 'bold 10px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(door.label, door.x + door.w / 2, door.y - 19); ctx.textAlign = 'start';
        ctx.fillStyle = '#11141c'; ctx.fillRect(door.x - 7, door.y - 9, door.w + 14, door.h + 9); ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.strokeRect(door.x - 4, door.y - 6, door.w + 8, door.h + 6);
        ctx.fillStyle = theme.stone; ctx.fillRect(door.x, door.y, door.w * opening, door.h);
        ctx.fillStyle = theme.accent; ctx.fillRect(door.x + 8, door.y + 12, Math.max(2, (door.w - 16) * opening), 5); ctx.fillRect(door.x + 8, door.y + 34, Math.max(2, (door.w - 16) * opening), 5);
        ctx.fillStyle = theme.flameCore; ctx.fillRect(door.x + door.w - 11, door.y + 35, 4, 4);
        const near = Math.abs(player.x + player.w / 2 - (door.x + door.w / 2)) < 72 && Math.abs(player.y + player.h - (door.y + door.h)) < 30;
        if (near) { ctx.fillStyle = 'rgba(3,7,12,.88)'; ctx.fillRect(door.x - 32, door.y - 35, 112, 22); ctx.fillStyle = theme.accent; ctx.font = 'bold 11px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E  ВОЙТИ', door.x + door.w / 2, door.y - 20); ctx.textAlign = 'start'; }
      }
      for (const trap of traps) { ctx.strokeStyle = trap.triggered ? '#fb7185' : '#f5b942'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(trap.x, trap.y + 10); ctx.lineTo(trap.x + 10, trap.y); ctx.lineTo(trap.x + 20, trap.y + 10); ctx.lineTo(trap.x + 30, trap.y); ctx.lineTo(trap.x + 42, trap.y + 10); ctx.stroke(); }
      for (const enemy of enemies) if (!enemy.dead) {
        if (enemy.kind === 'totem') { ctx.strokeStyle = 'rgba(103,232,249,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 280, 0, Math.PI * 2); ctx.stroke(); }
        if (protectedByTotem(enemy)) { ctx.strokeStyle = enemy.blocked > 0 ? '#e0f2fe' : 'rgba(103,232,249,.65)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, Math.max(enemy.w, enemy.h) * .72, 0, Math.PI * 2); ctx.stroke(); }
        ctx.save(); ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2); if (enemy.facing < 0) ctx.scale(-1, 1);
        const baseColor = enemy.kind === 'zombie' ? '#c93648' : enemy.kind === 'crossbow' ? '#8b5cf6' : enemy.kind === 'bomber' ? '#3186a8' : enemy.kind === 'mage' ? '#7c3aed' : enemy.kind === 'totem' ? '#0e7490' : '#d6a928';
        const bodyColor = enemy.hurt > 0 ? '#fff7ed' : enemy.attack > 0 && enemy.kind === 'zombie' ? '#ff253f' : baseColor;
        ctx.fillStyle = '#171923'; ctx.fillRect(-13, 14, 9, 8); ctx.fillRect(5, 14, 9, 8); ctx.fillRect(-11, 5, 7, 13); ctx.fillRect(5, 5, 7, 13);
        ctx.fillStyle = bodyColor; ctx.fillRect(-13, -7, 26, 18); ctx.fillRect(-17, -5, 6, 18); ctx.fillRect(12, -4, 6, 17);
        ctx.fillStyle = enemy.kind === 'zombie' ? '#9ca37d' : '#d9b38c'; ctx.fillRect(-9, -21, 18, 15); ctx.fillRect(-6, -24, 13, 4);
        ctx.fillStyle = enemy.kind === 'zombie' ? '#d6ef79' : '#fef3c7'; ctx.fillRect(3, -16, 4, 3); ctx.fillStyle = '#24191c'; ctx.fillRect(7, -11, 4, 2);
        if (enemy.kind === 'zombie') { ctx.fillStyle = '#731f2c'; ctx.fillRect(-14, -8, 28, 5); ctx.fillStyle = '#9ca37d'; ctx.fillRect(17, 7, 10, 5); }
        if (enemy.kind === 'crossbow') { ctx.fillStyle = '#4c287e'; ctx.fillRect(-12, -24, 24, 7); ctx.fillRect(-15, -10, 30, 5); ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(23, 4, 9, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = '#e9d5ff'; ctx.fillRect(13, 3, 23, 3); }
        if (enemy.kind === 'shield') { ctx.fillStyle = '#7c5d12'; ctx.fillRect(-14, -10, 28, 6); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-10, -25, 20, 5); ctx.fillStyle = enemy.blocked > 0 ? '#fff7ae' : '#facc15'; ctx.fillRect(13, -17, 14, 34); ctx.fillRect(17, -21, 6, 42); ctx.fillStyle = '#d1d5db'; ctx.fillRect(19, -1, 30, 3); }
        if (enemy.kind === 'bomber') { ctx.fillStyle = '#164e63'; ctx.fillRect(-14, -10, 28, 6); ctx.fillStyle = '#fb923c'; ctx.fillRect(14, -2, 13, 13); ctx.fillStyle = '#fde68a'; ctx.fillRect(19, -7, 3, 7); }
        if (enemy.kind === 'mage') { ctx.fillStyle = '#4c1d95'; ctx.fillRect(-14, -25, 28, 8); ctx.fillStyle = '#c084fc'; ctx.fillRect(16, -6, 4, 29); ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 12; ctx.fillRect(12, -12, 12, 12); ctx.shadowBlur = 0; }
        if (enemy.kind === 'totem') { ctx.fillStyle = '#164e63'; ctx.fillRect(-18, -28, 36, 56); ctx.fillStyle = '#67e8f9'; ctx.fillRect(-12, -20, 24, 5); ctx.fillRect(-4, -10, 8, 26); ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 14; ctx.fillRect(-7, -4, 14, 14); ctx.shadowBlur = 0; }
        ctx.restore();
        const barW = enemy.w + 4; ctx.fillStyle = '#160f13'; ctx.fillRect(enemy.x - 2, enemy.y - 12, barW, 5);
        ctx.fillStyle = enemy.kind === 'zombie' ? '#ef5263' : enemy.kind === 'crossbow' || enemy.kind === 'mage' ? '#a78bfa' : enemy.kind === 'bomber' ? '#38bdf8' : enemy.kind === 'totem' ? '#67e8f9' : '#facc15'; ctx.fillRect(enemy.x - 2, enemy.y - 12, barW * (enemy.hp / enemy.maxHp), 5);
      }
      for (const p of projectiles) { const orb = p.kind === 'magicOrb'; ctx.shadowColor = orb ? '#c084fc' : 'transparent'; ctx.shadowBlur = orb ? 16 : 0; ctx.fillStyle = p.kind === 'grenade' ? '#f5b942' : p.kind === 'freeze' ? '#67e8f9' : p.kind === 'enemyBomb' ? '#ff7a45' : p.kind === 'enemyArrow' || orb ? '#c084fc' : '#dce8e7'; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.shadowBlur = 0; }
      for (const explosion of explosions) {
        const progress = 1 - explosion.life / explosion.maxLife, size = Math.round(explosion.radius * progress), alpha = Math.max(0, 1 - progress);
        ctx.globalAlpha = alpha * .28; ctx.fillStyle = '#ff5a2f'; ctx.fillRect(explosion.x - size, explosion.y - size, size * 2, size * 2);
        ctx.globalAlpha = alpha; ctx.strokeStyle = progress < .45 ? '#fff3a3' : '#ff7a45'; ctx.lineWidth = Math.max(2, Math.round(9 * (1 - progress))); ctx.strokeRect(explosion.x - size, explosion.y - size, size * 2, size * 2);
        const core = Math.max(2, Math.round(34 * (1 - progress))); ctx.fillStyle = '#fff7c2'; ctx.fillRect(explosion.x - core, explosion.y - core, core * 2, core * 2); ctx.globalAlpha = 1;
      }
      for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 3); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); } ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h / 2); if (player.facing < 0) ctx.scale(-1, 1); if (player.roll > 0) { ctx.scale(1.35, .65); ctx.rotate(.08); }
      if (!(player.hurt > 0 && Math.floor(player.hurt * 16) % 2)) {
        ctx.fillStyle = '#17212a'; ctx.fillRect(-12, 15, 9, 12); ctx.fillRect(5, 15, 9, 12); ctx.fillStyle = '#334155'; ctx.fillRect(-11, 5, 8, 14); ctx.fillRect(5, 5, 8, 14);
        ctx.fillStyle = player.roll > 0 ? '#8ff5d9' : '#dce8e7'; ctx.fillRect(-12, -9, 25, 18); ctx.fillStyle = '#66e4c2'; ctx.fillRect(-15, -12, 30, 6); ctx.fillRect(-14, -18, 7, 17);
        ctx.fillStyle = '#d6a77d'; ctx.fillRect(-9, -25, 18, 14); ctx.fillStyle = '#18232b'; ctx.fillRect(-10, -28, 20, 6); ctx.fillRect(-11, -25, 5, 10); ctx.fillStyle = '#e7f8f4'; ctx.fillRect(4, -20, 4, 3);
        ctx.fillStyle = '#ed6a44'; ctx.fillRect(9, -10, 7, 25); ctx.fillRect(-12, 7, 25, 4); ctx.fillStyle = '#d6a77d'; ctx.fillRect(13, -5, 6, 13); ctx.fillRect(-18, -3, 6, 13);
        if (player.guard > 0) { ctx.fillStyle = '#facc15'; ctx.fillRect(15, -18, 12, 36); ctx.strokeStyle = '#fff1a8'; ctx.lineWidth = 2; ctx.strokeRect(15, -18, 12, 36); }
      }
      if (player.attack > .08) { ctx.strokeStyle = '#f8e9b0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(18, -2, 42, -1.2, 1.1); ctx.stroke(); }
      ctx.restore(); ctx.restore();
      if (flash > 0) { ctx.fillStyle = 'rgba(255,80,90,.18)'; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    };

    const loop = (now: number) => { const dt = Math.min((now - last) / 1000, .033); last = now; if (!pausedRef.current) update(dt); drawCanvas(); pressed.clear(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); canvas.removeEventListener('mousedown', mouseDown); };
  }, [started, runKey, sector, location]);

  const gearIcons: Record<GearKind, string> = { sword: '⚔', bow: '➶', shield: '⬟', grenade: '✹', freeze: '❄', trap: '⌁', empty: '·' };
  const slots = runProgress.current.loadout.map((gear, index) => ({ key: String(index + 1), title: gear.name, icon: gearIcons[gear.kind], tier: gear.tier, cd: index === 2 ? hud.grenade : index === 3 ? hud.trap : 0 }));
  const currentTheme = location === 'sewers' ? SECTOR_THEMES[0] : location === 'promenade' ? PROMENADE_THEME : SECTOR_THEMES[1];
  const spendCells = (cost: number) => {
    if (runProgress.current.cells < cost) return false;
    runProgress.current.cells -= cost;
    setHud((current) => ({ ...current, cells: runProgress.current.cells }));
    return true;
  };
  const buyPermanent = (kind: 'health' | 'damage') => {
    const level = kind === 'health' ? permanentProgress.current.maxHpBonus / 10 : Math.round(permanentProgress.current.damageBonus / .08);
    const cost = (kind === 'health' ? 24 : 30) + level * 8;
    if (!spendCells(cost)) return;
    if (kind === 'health') { permanentProgress.current.maxHpBonus += 10; runProgress.current.maxHp += 10; runProgress.current.hp += 10; }
    else { permanentProgress.current.damageBonus += .08; runProgress.current.damage += .08; }
    localStorage.setItem('ashfall-permanent-progress', JSON.stringify(permanentProgress.current));
    refreshShop((value) => value + 1);
  };
  const buyRunUpgrade = (kind: 'health' | 'damage') => {
    const cost = kind === 'health' ? 12 : 15;
    if (!spendCells(cost)) return;
    if (kind === 'health') { runProgress.current.maxHp += 15; runProgress.current.hp = runProgress.current.maxHp; }
    else runProgress.current.damage += .12;
    refreshShop((value) => value + 1);
  };
  const leaveShop = () => {
    setShopOpen(false); pausedRef.current = false; setPaused(false); setLocation(pendingDestination); setSector((value) => value + 1);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#090e12] font-sans text-slate-100 selection:bg-teal-300/30">
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      {shopOpen && <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#07100f]/95 px-4 py-8 backdrop-blur-md">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center"><p className="text-[10px] font-black uppercase tracking-[.45em] text-teal-300">Безопасная комната</p><h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Убежище торговцев</h2><p className="mt-3 text-sm text-slate-500">Клетки: <span className="font-black text-teal-200">{runProgress.current.cells}</span></p></div>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="border border-amber-300/25 bg-[#17130b] p-6 shadow-[0_0_50px_rgba(251,191,36,.06)]"><p className="text-[9px] font-black uppercase tracking-[.3em] text-amber-300">Хранитель кузни</p><h3 className="mt-2 text-xl font-black uppercase">Навсегда</h3><p className="mt-2 text-xs leading-5 text-slate-500">Эти улучшения сохраняются после смерти и для следующих забегов.</p><div className="mt-5 grid gap-3"><button onClick={() => buyPermanent('health')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-amber-300/40"><span><b className="block text-sm text-slate-200">Максимум здоровья +10</b><small className="text-slate-600">Уже получено: +{permanentProgress.current.maxHpBonus}</small></span><strong className="text-amber-300">{24 + permanentProgress.current.maxHpBonus / 10 * 8}</strong></button><button onClick={() => buyPermanent('damage')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-amber-300/40"><span><b className="block text-sm text-slate-200">Урон +8%</b><small className="text-slate-600">Постоянное усиление</small></span><strong className="text-amber-300">{30 + Math.round(permanentProgress.current.damageBonus / .08) * 8}</strong></button></div></section>
            <section className="border border-violet-300/25 bg-[#120e1b] p-6 shadow-[0_0_50px_rgba(167,139,250,.06)]"><p className="text-[9px] font-black uppercase tracking-[.3em] text-violet-300">Странствующий алхимик</p><h3 className="mt-2 text-xl font-black uppercase">На один забег</h3><p className="mt-2 text-xs leading-5 text-slate-500">Сильные дешёвые улучшения исчезают после смерти.</p><div className="mt-5 grid gap-3"><button onClick={() => buyRunUpgrade('health')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-violet-300/40"><span><b className="block text-sm text-slate-200">Здоровье +15</b><small className="text-slate-600">Также полностью лечит</small></span><strong className="text-violet-300">12</strong></button><button onClick={() => buyRunUpgrade('damage')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-violet-300/40"><span><b className="block text-sm text-slate-200">Урон +12%</b><small className="text-slate-600">До конца попытки</small></span><strong className="text-violet-300">15</strong></button></div></section>
          </div>
          <button onClick={leaveShop} className="mx-auto mt-6 block border border-teal-300/50 bg-teal-300/10 px-8 py-3 text-xs font-black uppercase tracking-[.25em] text-teal-100 hover:bg-teal-300/20">Отправиться дальше</button>
        </div>
      </div>}
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col justify-center px-3 py-3 md:px-7 md:py-5">
        <header className="mb-3 flex items-end justify-between gap-4 px-1">
          <div><p className="text-[10px] font-bold uppercase tracking-[.38em] text-teal-300/70">Stage {String(sector).padStart(2, '0')} · {LOCATION_NAMES[location]}</p><h1 className="text-xl font-black uppercase tracking-tight md:text-2xl">Ashfall <span className="font-light text-slate-500">// {currentTheme.subtitle}</span></h1></div>
          <div className="hidden text-right text-[10px] uppercase tracking-[.2em] text-slate-500 sm:block">Цель: исследовать и очистить сектор<br/><span className="text-slate-300">{hud.kills} / {ENEMIES_PER_SECTOR} стражей</span><span className="ml-3 text-amber-300/70">Угроза ×{(1 + (sector - 1) * .18).toFixed(2)}</span></div>
        </header>
        <section className="relative aspect-video w-full overflow-hidden rounded-sm border border-white/10 bg-[#101b23] shadow-[0_30px_90px_rgba(0,0,0,.65)]">
          <canvas ref={canvasRef} width="1280" height="720" className="h-full w-full" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4 md:p-6">
            <div className="w-48 md:w-72"><div className="mb-2 flex items-center gap-3"><span className="text-xs font-black tracking-[.2em]">HP</span><span className="text-[11px] text-slate-400">{hud.hp} / {hud.maxHp}</span></div><div className="h-2 overflow-hidden bg-black/60 ring-1 ring-white/10"><div className="h-full bg-gradient-to-r from-red-700 to-rose-400 transition-[width]" style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }} /></div></div>
            <div className="flex items-center gap-2 border border-teal-300/20 bg-black/40 px-3 py-2"><span className="h-2 w-2 rotate-45 bg-teal-300 shadow-[0_0_12px_#5eead4]"/><span className="text-xs font-bold text-teal-100">{hud.cells}</span><span className="text-[9px] uppercase tracking-widest text-slate-500">клеток</span></div>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 border border-white/10 bg-black/55 px-3 py-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">Location: <span className="text-slate-100">{LOCATION_NAMES[location]}</span></div>
          {hud.message && hud.hp === 0 && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#05070d]/75 backdrop-blur-[2px]"><div className="border-y border-rose-400/40 bg-black/80 px-12 py-7 text-center shadow-[0_0_70px_rgba(244,63,94,.18)]"><p className="text-[10px] font-bold uppercase tracking-[.4em] text-rose-400">Попытка окончена</p><p className="mt-3 text-3xl font-black tracking-[.18em] md:text-5xl">ВЫ ПРОИГРАЛИ</p><p className="mt-3 text-xs uppercase tracking-[.25em] text-slate-500">Постоянные улучшения сохранены</p><button onClick={() => { runProgress.current = freshRun(permanentProgress.current); selectedSlot.current = 0; setActiveSlot(0); setHud({ hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, cells: 0, kills: 0, grenade: 0, trap: 0, message: '' }); setLocation('prison'); setSector(1); setRunKey((n) => n + 1); }} className="pointer-events-auto mt-6 border border-teal-300/50 bg-teal-300/10 px-6 py-3 text-xs font-bold uppercase tracking-[.2em] text-teal-100 hover:bg-teal-300/20">R · начать заново с сектора 1</button></div></div>}
          {hud.message === 'ДВЕРИ ОТКРЫТЫ' && <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center"><div className="border border-teal-300/30 bg-[#071015]/85 px-6 py-3 text-center shadow-[0_0_35px_rgba(45,212,191,.16)]"><p className="text-sm font-black tracking-[.22em] text-teal-100 md:text-lg">ДВЕРИ ОТКРЫТЫ</p><p className="mt-1 text-[8px] uppercase tracking-[.25em] text-teal-300/60">Найдите дверь и нажмите E или ↑</p></div></div>}
          {!started && <div className="absolute inset-0 grid place-items-center bg-[#0a1015]/95 px-6 text-center"><button onClick={() => session ? supabase.auth.signOut() : setShowAuth(true)} disabled={!authReady} className="absolute right-4 top-4 border border-white/15 bg-black/30 px-4 py-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-300 transition hover:border-teal-300/50 hover:text-teal-200 disabled:opacity-40 md:right-6 md:top-6">{session ? 'Выйти из аккаунта' : 'Войти или зарегистрироваться'}</button><div className="max-w-xl"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.45em] text-teal-300">Новая попытка</p><h2 className="mb-4 text-4xl font-black uppercase tracking-tight md:text-6xl">Спустись.<br/><span className="text-slate-500">Выживи.</span></h2><p className="mx-auto mb-8 max-w-md text-sm leading-6 text-slate-400">Исследуй нижние залы: выбирай верхние мосты или безопасный нижний маршрут, ищи стражей в боковых галереях и используй мобильность.</p><button onClick={() => { pausedRef.current = false; setPaused(false); setStarted(true); }} className="border border-teal-300/60 bg-teal-300/10 px-8 py-3 text-xs font-black uppercase tracking-[.28em] text-teal-100 transition hover:bg-teal-300/20">Начать спуск</button><p className="mt-4 text-[9px] uppercase tracking-[.18em] text-slate-600">Можно играть без регистрации</p></div></div>}
          {started && paused && <div className="absolute inset-0 z-20 grid place-items-center bg-[#05090d]/85 px-6 text-center backdrop-blur-sm"><div className="w-full max-w-sm border-y border-teal-300/30 bg-black/60 px-8 py-9"><p className="text-[10px] font-bold uppercase tracking-[.4em] text-teal-300">Игра приостановлена</p><h2 className="mt-3 text-4xl font-black uppercase tracking-tight">Пауза</h2><div className="mt-8 grid gap-3"><button onClick={() => { pausedRef.current = false; setPaused(false); }} className="border border-teal-300/60 bg-teal-300/10 px-6 py-3 text-xs font-black uppercase tracking-[.22em] text-teal-100 hover:bg-teal-300/20">Продолжить</button><button onClick={() => { pausedRef.current = false; setPaused(false); setStarted(false); }} className="border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300">В главное меню</button></div><p className="mt-5 text-[9px] uppercase tracking-[.2em] text-slate-600">Esc — продолжить</p></div></div>}
        </section>
        <div className="pointer-events-none z-10 mx-auto -mt-[52px] mb-2 flex gap-1.5 md:-mt-[60px] md:mb-3 md:gap-2">
          {slots.map((slot, index) => <div key={index} title={slot.title} className={`relative grid h-10 w-10 place-items-center overflow-hidden border bg-[#091116]/85 text-xl shadow-lg backdrop-blur-sm md:h-12 md:w-12 md:text-2xl ${activeSlot === index ? 'border-teal-300 shadow-[0_0_18px_rgba(45,212,191,.25)]' : 'border-white/15'} ${slot.cd > 0 ? 'opacity-60' : ''}`}><span>{slot.icon}</span><span className="absolute left-1 top-0.5 text-[7px] font-black text-slate-400">{slot.key}</span>{slot.cd > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"/>}</div>)}
        </div>
        <footer className="mt-3 hidden items-center justify-center gap-5 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-500 lg:flex"><span><b className="text-slate-300">A D / ← →</b> движение</span><span><b className="text-slate-300">W / Space</b> двойной прыжок</span><span><b className="text-slate-300">1–4</b> выбрать</span><span><b className="text-slate-300">ЛКМ</b> использовать</span><span><b className="text-slate-300">Shift / C</b> перекат</span></footer>
      </div>
    </main>
  );
}
