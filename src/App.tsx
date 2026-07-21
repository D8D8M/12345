import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { drawWalkingLegs } from './game/drawWalkingLegs';
import { drawShadowDashGhost, type ShadowDashGhost } from './game/drawShadowDash';
import { drawEnemyAttack, drawPlayerBow, drawPlayerSword, drawPlayerWeaponHold, enemyAttackDuration, enemyWeaponFor } from './game/drawCombatAnimations';
import { drawPlayerCape, drawPlayerKnight, drawPlayerLungePose } from './game/drawPlayerKnight';
import { createTeleportPortals, drawTeleportPortal } from './components/TeleportPortals';
import { supabase } from './lib/supabase';
import { createSwampLevel, SWAMP_WORLD, type SwampPlatform } from './game/swampLevel';
import { createSinkingPlatforms, updateSinkingPlatform } from './game/swampHazards';
import { drawMines } from './game/drawMines';
import { drawEarlyEnemy, earlyEnemySizes, earlyEnemySpriteSizes, isEarlyEnemyVariant } from './game/drawEarlyEnemies';
import { drawUniqueBoss, uniqueBossSizes, uniqueBossSpriteSizes } from './game/drawUniqueBoss';
import { BRIDGE_WORLD, bridgeWindAmount, createBridgeLevel, type BridgePlatform } from './game/bridgeLevel';
import { createMinesLevel, MINES_WORLD } from './game/minesLevel';
import { createClockTowerLevel, CLOCK_TOWER_WORLD, type ClockPlatform } from './game/clockTowerLevel';
import { createCryptLevel, CRYPT_WORLD } from './game/cryptLevel';
import { CASTLE_WORLD, createCastleLevel } from './game/castleLevel';
import { isPlatformPlacementSafe, placePlatformsSafely } from './game/platformPlacement';
import { drawCastleBackdrop } from './game/drawCastle';
import { MobileControls } from './components/MobileControls';
import { createGateFragments, drawGateFragments, updateGateFragments, type GateFragment } from './game/prisonGate';
import { drawEnvironmentTile, type EnvironmentTileStyle } from './game/drawEnvironmentTile';
import { drawCryptMechanics, drawMineMechanics, ghostPlatformVisible } from './game/drawUndergroundMechanics';
import { createCastleMirrors, createCrossbowStatues, createThroneColumns, drawCastleMirror, drawCrossbowStatue, drawFinalStoneWall, drawThroneColumn } from './game/finalLocationMechanics';
import { drawParallaxBackground, drawParallaxLayers } from './game/drawParallaxBackground';
import { DailyChallengeCard } from './components/DailyChallengeCard';
import { claimDailyReward, dailyProgress, generateDailyChallenge, loadDailyChallenge, loadDailyReward } from './lib/dailyChallenge';
import { requestBossLine, requestChronicle, requestDeathAdvice, type RunSummary } from './lib/gameAi';
import { chooseRelics, RELICS, RELIC_SYNERGIES, type Relic, type RelicId } from './game/relics';
import { RunMap } from './components/RunMap';
import type { LocationMapSnapshot, RunMapArchive } from './game/mapTypes';
import { RunModeChoice } from './components/RunModeChoice';
import { TIMED_RUN_SECONDS, runModeName, type RunMode } from './game/runModes';
import { BestiaryBook } from './components/BestiaryBook';
import { RecordsTable } from './components/RecordsTable';
import { loadBestiaryProgress, recordBestiaryKill } from './game/bestiary';
import { saveRunRecord } from './lib/runRecords';
import { deleteCloudSave, isCloudSaveDeletion, loadCloudSaves, uploadCloudSave } from './lib/cloudSaves';
import { comboForHits, EMPTY_COMBO, type CombatCombo } from './game/combatCombo';
import { createRoomEvents } from './game/roomEvents';
import { BossTrialsMenu } from './components/BossTrialsMenu';
import { loadBossTrialProgress, recordBossTrialClear, trialRewardTier, type BossTrial } from './game/bossTrials';
import { playCombatHit, playUiSound, startBiomeMusic, stopBiomeMusic } from './game/combatAudio';
import { ELITE_INFO, eliteDamageMultiplier, rollEliteModifier, type EliteModifier } from './game/eliteEnemies';
import { cosmeticForProgress } from './game/cosmetics';
import { loadBestRunGhost, saveBestRunGhost, type GhostFrame } from './game/runGhost';
import { evolveWeapon, weaponBranches, type WeaponBranchId } from './game/weaponUpgrades';
import { LEGACY_UNLOCKS, emptyLegacyProgress, legacyReward, type LegacyProgress, type LegacyUnlockId } from './game/metaProgression';
import { LegacyTree } from './components/LegacyTree';
import { attackDuration, type WeaponKind } from './game/weaponCombatConfig';
import { meleeConfig, meleeWeaponIdForName, type MeleeWeaponId } from './game/meleeWeaponConfigs';
import { equipmentConfig, equipmentIdForName, type EquipmentId } from './game/equipmentConfigs';
import { WeaponManager, type WeaponAnimationState } from './game/weaponSystem';
import { weaponConfig } from './game/weaponRegistry';
import { MerchantHub } from './components/MerchantHub';
import { BOSS_HIT_INVULNERABILITY, BOSS_KNOCKBACK_MULTIPLIER, scaledFreezeDuration } from './game/bossCombat';

type Hud = { hp: number; maxHp: number; shards: number; kills: number; grenade: number; trap: number; message: string };
type Box = { x: number; y: number; w: number; h: number };
type GearKind = WeaponKind | 'empty';
type Gear = { kind: GearKind; name: string; tier: number; damage: number; cooldown: number; branch?: WeaponBranchId; weaponId?: MeleeWeaponId; equipmentId?: EquipmentId };
type WeaponReplacement = { gear: Gear; slots: [number, number]; cost?: number };
type RunProgress = { hp: number; maxHp: number; damage: number; shards: number; cells?: number; relics: RelicId[]; mapArchive: RunMapArchive; loadout: [Gear, Gear, Gear, Gear] };
type PermanentProgress = { maxHpBonus: number; damageBonus: number };
type SavedGame = { savedAt: string; sector: number; location: LocationKind; progress: RunProgress; permanentProgress: PermanentProgress; legacyProgress: LegacyProgress; mode: RunMode; elapsedSeconds: number };
type BindAction = 'left' | 'right' | 'up' | 'down' | 'jump' | 'attack' | 'heal' | 'interact' | 'roll' | 'slot1' | 'slot2' | 'slot3' | 'slot4';
type KeyBindings = Record<BindAction, string>;
type GameSettings = { musicVolume: number; effectsVolume: number; screenShake: boolean; mobileScale: number; mobileOpacity: number; mobileSwapSides: boolean; bindings: KeyBindings };
type LocationKind = 'prison' | 'swamps' | 'mines' | 'clock' | 'crypt' | 'bridge' | 'castle' | 'throne';
type SectorTheme = { name: string; subtitle: string; center: string; middle: string; edge: string; stone: string; mortar: string; accent: string; accentGlow: string; flame: string; flameCore: string; mist: string };
type RunStats = { startedAt: number; kills: number; damageTaken: number; bossesDefeated: number; deathCause?: string };
type DeathSummary = RunStats & { seconds: number; shards: number; location: LocationKind; sector: number; relics: RelicId[] };
type CombatNotice = { id: number; text: string; tone: 'danger' | 'parry' | 'cooldown' };

const LOCATIONS: readonly LocationKind[] = ['prison', 'swamps', 'mines', 'clock', 'crypt', 'bridge', 'castle', 'throne'];
const isLocationKind = (value: unknown): value is LocationKind => typeof value === 'string' && LOCATIONS.includes(value as LocationKind);
const normalizeSave = (value: unknown): SavedGame | null => {
  if (!value || typeof value !== 'object') return null;
  const save = value as Partial<SavedGame>;
  if (!isLocationKind(save.location) || !save.progress || typeof save.sector !== 'number') return null;
  const legacyPermanent = loadLegacyPermanentProgress();
  const permanentProgress = save.permanentProgress ?? legacyPermanent;
  return {
    ...save,
    permanentProgress: {
      maxHpBonus: Math.max(0, Math.min(MAX_PERMANENT_MASKS, Number(permanentProgress.maxHpBonus) || 0)),
      damageBonus: Math.max(0, Number(permanentProgress.damageBonus) || 0),
    },
    legacyProgress: save.legacyProgress ?? emptyLegacyProgress(),
    mode: save.mode ?? 'normal',
    elapsedSeconds: save.elapsedSeconds ?? 0,
    progress: {
      ...save.progress,
      relics: Array.isArray(save.progress.relics) ? save.progress.relics : [],
      mapArchive: save.progress.mapArchive ?? {},
      loadout: save.progress.loadout.map((gear) => gear.kind === 'sword' && !gear.weaponId
        ? { ...gear, weaponId: meleeWeaponIdForName(gear.name) }
        : gear.kind !== 'empty' && !gear.equipmentId
          ? { ...gear, equipmentId: equipmentIdForName(gear.name) }
          : gear) as [Gear, Gear, Gear, Gear],
    },
  } as SavedGame;
};

const ACHIEVEMENTS = [
  { id: 'escape', icon: '🔓', title: 'Первый побег', description: 'Пройти Stage 1 — Синие Разломы.' },
  { id: 'swamp_guide', icon: '🌿', title: 'Проводник болот', description: 'Пройти Stage 2A — Ядовитая Низина.' },
  { id: 'miner', icon: '⛏️', title: 'Забойщик', description: 'Пройти Stage 2B — Заброшенные Шахты.' },
  { id: 'clockmaker', icon: '⚙️', title: 'Часовщик', description: 'Пройти Stage 3 — Часовую Башню.' },
  { id: 'crown_close', icon: '🏰', title: 'Корона близко', description: 'Впервые войти в Королевский Замок.' },
  { id: 'blind_faith', icon: '👁️', title: 'Слепая вера', description: 'Добраться до Тронного зала.' },
  { id: 'steel_whirl', icon: '⚔️', title: 'Стальной вихрь', description: 'Победить 3 врагов менее чем за 5 секунд.' },
  { id: 'return_sender', icon: '🧨', title: 'Возврат отправителю', description: 'Убить Dynamite Tosser его же динамитом.' },
  { id: 'clear_mind', icon: '✨', title: 'Чистый разум', description: 'Зачистить комнату без потери масок.' },
  { id: 'dead_silence', icon: '🗿', title: 'Мертвая тишина', description: 'Уничтожить тотем, пока связанные враги живы.' },
  { id: 'guard_storm', icon: '⚔️', title: 'Гроза гвардии', description: 'Победить Royal Guard, не попав под блок.' },
  { id: 'heavy_wallet', icon: '💎', title: 'Тяжелый кошель', description: 'Накопить 150 Осколков за один забег.' },
  { id: 'steel_nerves', icon: '🛡️', title: 'Стальные нервы', description: 'Купить все маски у Хранителя кузни.' },
  { id: 'full_tank', icon: '🌙', title: 'Полный бак', description: 'Заполнить сосуд Души на 100%.' },
  { id: 'stuntman', icon: '💥', title: 'Каскадер', description: 'Трижды получить урон от шипов в одной комнате.' },
  { id: 'reality_hack', icon: '👾', title: 'Взлом реальности', description: 'Активировать Debug-панель или чит.', secret: true },
] as const;
type AchievementId = typeof ACHIEVEMENTS[number]['id'];

const ENVIRONMENT_PARTICLES = Array.from({ length: 30 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  size: 1 + (index % 4) * .75,
  duration: 12 + (index % 7) * 2.2,
  delay: -(index * 1.73) % 18,
  drift: `${((index * 23) % 70) - 35}px`,
}));

function EnvironmentParticles() {
  return <div className="environment-particles" aria-hidden="true">
    {ENVIRONMENT_PARTICLES.map((particle, index) => <i key={index} style={{
      left: particle.left,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      animationDuration: `${particle.duration}s`,
      animationDelay: `${particle.delay}s`,
      '--particle-drift': particle.drift,
    } as React.CSSProperties}/>)}
  </div>;
}

const MAX_PERMANENT_MASKS = 5;
const SAVE_SLOT_COUNT = 4;
const DEFAULT_BINDINGS: KeyBindings = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', attack: 'KeyJ', heal: 'KeyF', interact: 'KeyE', roll: 'ShiftLeft', slot1: 'Digit1', slot2: 'Digit2', slot3: 'Digit3', slot4: 'Digit4' };
const BINDING_ITEMS: Array<{ action: BindAction; label: string }> = [
  { action: 'left', label: 'Влево' }, { action: 'right', label: 'Вправо' }, { action: 'up', label: 'Вверх / удар вверх' }, { action: 'down', label: 'Вниз / спрыгнуть' },
  { action: 'jump', label: 'Прыжок' }, { action: 'attack', label: 'Атака' }, { action: 'heal', label: 'Лечение Душой' }, { action: 'interact', label: 'Действие' }, { action: 'roll', label: 'Перекат' },
  { action: 'slot1', label: 'Слот 1' }, { action: 'slot2', label: 'Слот 2' }, { action: 'slot3', label: 'Слот 3' }, { action: 'slot4', label: 'Слот 4' },
];
const keyName = (code: string) => ({ Space: 'Пробел', ShiftLeft: 'Левый Shift', ShiftRight: 'Правый Shift', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' }[code] || code.replace(/^Key/, '').replace(/^Digit/, ''));
const loadAchievements = (): AchievementId[] => {
  try { const saved = JSON.parse(localStorage.getItem('false-knight-achievements') || '[]') as AchievementId[]; return saved.filter((id) => ACHIEVEMENTS.some((item) => item.id === id)); }
  catch { return []; }
};

const SECTOR_THEMES: SectorTheme[] = [
  { name: 'Гнилые болота', subtitle: 'ядовитая низина', center: '#203c38', middle: '#112522', edge: '#050d0c', stone: '#293633', mortar: '#121c1a', accent: '#66e38f', accentGlow: '#35d06f', flame: '#b7ef55', flameCore: '#efff9a', mist: 'rgba(91,180,116,.08)' },
  { name: 'Кристальная пещера', subtitle: 'синие разломы', center: '#262d5e', middle: '#141a3d', edge: '#060817', stone: '#303544', mortar: '#151925', accent: '#65b8ed', accentGlow: '#428ddf', flame: '#7ad7ff', flameCore: '#d4f5ff', mist: 'rgba(91,126,220,.09)' },
  { name: 'Древний склеп', subtitle: 'залы забытых', center: '#38264d', middle: '#20162e', edge: '#0a0610', stone: '#37313d', mortar: '#19141d', accent: '#b887db', accentGlow: '#8f55bf', flame: '#ff9d42', flameCore: '#ffe08a', mist: 'rgba(150,103,175,.08)' },
  { name: 'Затопленные руины', subtitle: 'безмолвные каналы', center: '#17384b', middle: '#102631', edge: '#040c12', stone: '#293940', mortar: '#111d22', accent: '#42d8d0', accentGlow: '#1fa8ad', flame: '#65e1ca', flameCore: '#c6fff5', mist: 'rgba(60,173,190,.09)' },
  { name: 'Пепельная кузня', subtitle: 'сердце механизма', center: '#4a2927', middle: '#271516', edge: '#0e0607', stone: '#3d3332', mortar: '#1d1515', accent: '#f07845', accentGlow: '#dc452c', flame: '#ff7b29', flameCore: '#ffe071', mist: 'rgba(210,83,48,.08)' },
];
const LOCATION_NAMES: Record<LocationKind, string> = { prison: 'Prison Cells', swamps: 'Foul Swamps', mines: 'Abandoned Mines', clock: 'Clock Tower', crypt: 'Crypt of the Fallen', bridge: 'Ruined Bridge', castle: 'Royal Castle', throne: 'Throne Room' };
const LOCATION_NAMES_RU: Record<LocationKind, string> = { prison: 'Тюремные камеры', swamps: 'Ядовитая низина', mines: 'Заброшенные шахты', clock: 'Часовая башня', crypt: 'Склеп павших', bridge: 'Разрушенный мост', castle: 'Королевский замок', throne: 'Тронный зал' };
const DEATH_QUOTES = ['Тьма забирает остатки твоей воли...', 'Этот замок помнит твои шаги...', 'Еще одна попытка канула в бездну...', 'Твоя корона все еще далеко...', 'Путь застилает туман...'];
const BOSS_DEATH_LINES: Partial<Record<string, string>> = {
  swampGiant: 'Болото не отпустит тебя… Оно лишь запомнит твой запах.',
  stoneGolem: 'Камень треснул… но гора всё ещё смотрит на тебя.',
  cryptWarden: 'Печати пали. Теперь мёртвые узнают твоё имя.',
  bridgeColossus: 'Ты прошёл мост… но на другой стороне тебя ждёт только корона.',
};
const PROMENADE_THEME: SectorTheme = { name: 'Тропа обречённых', subtitle: 'багровый закат', center: '#61343f', middle: '#351b28', edge: '#10070d', stone: '#42353b', mortar: '#20151b', accent: '#e07878', accentGlow: '#b83f58', flame: '#ffad57', flameCore: '#ffe3a1', mist: 'rgba(190,72,91,.09)' };
const PRISON_THEME: SectorTheme = { name: 'Prison Cells', subtitle: 'drowned stone corridors', center: '#26343d', middle: '#151f27', edge: '#070b0f', stone: '#35434a', mortar: '#182328', accent: '#647f78', accentGlow: '#405f65', flame: '#789b78', flameCore: '#b7c99b', mist: 'rgba(75,105,112,.09)' };
const CRYPT_THEME: SectorTheme = { name: 'Crypt of the Fallen', subtitle: 'the glowing abyss', center: '#241342', middle: '#10091f', edge: '#020207', stone: '#211b31', mortar: '#080611', accent: '#168cff', accentGlow: '#006eff', flame: '#246dff', flameCore: '#8eeaff', mist: 'rgba(40,57,190,.11)' };
const MINES_THEME: SectorTheme = { name: 'Abandoned Mines', subtitle: 'under the dead mountain', center: '#2a211b', middle: '#15110e', edge: '#050403', stone: '#302a26', mortar: '#15110f', accent: '#9a6a3a', accentGlow: '#d08a42', flame: '#d99042', flameCore: '#ffe0a3', mist: 'rgba(105,82,63,.08)' };
const CLOCK_THEME: SectorTheme = { name: 'Clock Tower', subtitle: 'the great ascent', center: '#55321f', middle: '#241511', edge: '#090504', stone: '#4a2921', mortar: '#21100e', accent: '#d6a84b', accentGlow: '#f1b83d', flame: '#e88938', flameCore: '#ffe29a', mist: 'rgba(190,105,43,.09)' };
const CASTLE_THEME: SectorTheme = { name: 'Royal Castle', subtitle: 'the gilded labyrinth', center: '#30182a', middle: '#15152a', edge: '#080713', stone: '#725741', mortar: '#2b1d22', accent: '#e0b94f', accentGlow: '#ffd76a', flame: '#ff9a32', flameCore: '#fff1a6', mist: 'rgba(146,54,73,.06)' };
const themeForLocation = (location: LocationKind) => location === 'prison' ? PRISON_THEME : location === 'swamps' ? SECTOR_THEMES[0] : location === 'mines' ? MINES_THEME : location === 'clock' ? CLOCK_THEME : location === 'crypt' ? CRYPT_THEME : location === 'bridge' ? PROMENADE_THEME : location === 'castle' ? CASTLE_THEME : location === 'throne' ? SECTOR_THEMES[3] : SECTOR_THEMES[1];
const ENEMIES_PER_SECTOR = 28;
const SOUL_HEAL_COST = 100 / 3;
const PLAYER_JUMP_SPEED = 650;
const DOWN_STRIKE_BOUNCE_SPEED = PLAYER_JUMP_SPEED * Math.sqrt(.85);
const PLAYER_HIT_INVULNERABILITY = .5;
const ENEMY_CONTACT_HITBOX_SCALE = .72;
const BOSS_CONTACT_HITBOX_SCALE = .8;
const STARTING_LOADOUT: [Gear, Gear, Gear, Gear] = [
  { kind: 'sword', weaponId: 'rusty_sword', name: 'Ржавый меч', tier: 1, damage: 18, cooldown: .38 },
  { kind: 'bow', equipmentId: 'old_bow', name: 'Старый лук', tier: 1, damage: 13, cooldown: .65 },
  { kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 },
  { kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 },
];
const BASIC_WEAPONS: Gear[] = [
  { kind: 'sword', weaponId: 'rusty_sword', name: 'Ржавый меч', tier: 1, damage: 18, cooldown: .38 },
  { kind: 'shield', equipmentId: 'old_shield', name: 'Старый щит', tier: 1, damage: 10, cooldown: .7 },
  { kind: 'bow', equipmentId: 'old_bow', name: 'Старый лук', tier: 1, damage: 13, cooldown: .65 },
];
const weaponSlots = (gear: Gear): [number, number] => ['sword', 'bow', 'shield'].includes(gear.kind) ? [0, 1] : [2, 3];
const weaponRange = (gear: Gear) => gear.kind === 'sword' ? 62 : gear.kind === 'bow' ? 720 * 1.5 : gear.kind === 'grenade' || gear.kind === 'freeze' ? 600 * .95 + 150 : gear.kind === 'trap' ? 52 : 0;
const emptyPermanentProgress = (): PermanentProgress => ({ maxHpBonus: 0, damageBonus: 0 });
const loadLegacyPermanentProgress = (): PermanentProgress => {
  try { const saved = JSON.parse(localStorage.getItem('ashfall-permanent-progress') || '') as PermanentProgress; return { ...saved, maxHpBonus: saved.maxHpBonus > 5 ? Math.round(saved.maxHpBonus / 10) : saved.maxHpBonus }; }
  catch { return emptyPermanentProgress(); }
};
const freshRun = (permanent: PermanentProgress = { maxHpBonus: 0, damageBonus: 0 }): RunProgress => ({ hp: 5 + permanent.maxHpBonus, maxHp: 5 + permanent.maxHpBonus, damage: 1 + permanent.damageBonus, shards: 0, relics: [], mapArchive: {}, loadout: STARTING_LOADOUT.map((gear) => ({ ...gear })) as [Gear, Gear, Gear, Gear] });
const loadSaveSlots = (): Array<SavedGame | null> => {
  try { const slots = JSON.parse(localStorage.getItem('ashfall-save-slots') || '[]') as unknown[]; return Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => normalizeSave(slots[index])); }
  catch { return Array.from({ length: SAVE_SLOT_COUNT }, () => null); }
};
const loadSettings = (): GameSettings => { try { const saved = JSON.parse(localStorage.getItem('false-knight-settings') || '{}'); const bindings = { ...DEFAULT_BINDINGS, ...(saved.bindings || {}) }; if (bindings.heal === 'KeyQ') bindings.heal = 'KeyF'; return { musicVolume: 55, effectsVolume: 70, screenShake: true, mobileScale: 100, mobileOpacity: 75, mobileSwapSides: false, ...saved, bindings }; } catch { return { musicVolume: 55, effectsVolume: 70, screenShake: true, mobileScale: 100, mobileOpacity: 75, mobileSwapSides: false, bindings: { ...DEFAULT_BINDINGS } }; } };
const loadAutosave = (): SavedGame | null => {
  try { return normalizeSave(JSON.parse(localStorage.getItem('ashfall-autosave') || 'null')); }
  catch { return null; }
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const permanentProgress = useRef<PermanentProgress>(emptyPermanentProgress());
  const runProgress = useRef<RunProgress>(freshRun(permanentProgress.current));
  const selectedSlot = useRef(0);
  const [activeSlot, setActiveSlot] = useState(0);
  const [hud, setHud] = useState<Hud>({ hp: 5, maxHp: 5, shards: 0, kills: 0, grenade: 0, trap: 0, message: '' });
  const [combatCombo, setCombatCombo] = useState<CombatCombo>(EMPTY_COMBO);
  const [soulHud, setSoulHud] = useState(0);
  const [maskHitPulse, setMaskHitPulse] = useState(0);
  const [started, setStarted] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [sector, setSector] = useState(1);
  const [location, setLocation] = useState<LocationKind>('prison');
  const [storyMessage, setStoryMessage] = useState('');
  const [deathQuote, setDeathQuote] = useState(DEATH_QUOTES[0]);
  const [deathAdvice, setDeathAdvice] = useState('');
  const [deathAdviceLoading, setDeathAdviceLoading] = useState(false);
  const [deathScreen, setDeathScreen] = useState<'stats' | 'interrupted'>('stats');
  const [deathSummary, setDeathSummary] = useState<DeathSummary | null>(null);
  const [combatNotice, setCombatNotice] = useState<CombatNotice | null>(null);
  const [chronicle, setChronicle] = useState('');
  const [chronicleLoading, setChronicleLoading] = useState(false);
  const [dailyChallenge, setDailyChallenge] = useState(loadDailyChallenge);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyReward, setDailyReward] = useState(loadDailyReward);
  const [dailyRewardMessage, setDailyRewardMessage] = useState('');
  const runStats = useRef<RunStats>({ startedAt: Date.now(), kills: 0, damageTaken: 0, bossesDefeated: 0 });
  const [ending, setEnding] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [pauseBestiaryOpen, setPauseBestiaryOpen] = useState(false);
  const pauseBestiaryOpenRef = useRef(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<Exclude<LocationKind, 'prison'>>('swamps');
  const [, refreshShop] = useState(0);
  const [menuTab, setMenuTab] = useState<'play' | 'saves' | 'achievements'>('play');
  const [mainMenuScreen, setMainMenuScreen] = useState<'main' | 'saves' | 'settings' | 'achievements' | 'bestiary' | 'records' | 'trials' | 'legacy'>('main');
  const [legacyProgress, setLegacyProgress] = useState(emptyLegacyProgress);
  const legacyAwarded = useRef(false);
  const [bestiaryProgress, setBestiaryProgress] = useState(loadBestiaryProgress);
  const menuSceneRef = useRef<HTMLDivElement>(null);
  const [saveSlots, setSaveSlots] = useState<Array<SavedGame | null>>(loadSaveSlots);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [activeSaveSlot, setActiveSaveSlot] = useState<number | null>(null);
  const [, setAutosave] = useState<SavedGame | null>(loadAutosave);
  const [choosingLoadout, setChoosingLoadout] = useState(false);
  const [choosingMode, setChoosingMode] = useState(false);
  const [runMode, setRunMode] = useState<RunMode>('normal');
  const [bossTrial, setBossTrial] = useState<BossTrial | null>(null);
  const [bossTrialProgress, setBossTrialProgress] = useState(loadBossTrialProgress);
  const [trialRewardMessage, setTrialRewardMessage] = useState('');
  const bossTrialRef = useRef<BossTrial | null>(null);
  const runElapsed = useRef(0);
  const timedGhostFrames = useRef<GhostFrame[]>([]);
  const savedRecordForRun = useRef(false);
  const [elapsedHud, setElapsedHud] = useState(0);
  const [startingWeapons, setStartingWeapons] = useState<GearKind[]>(['sword', 'bow']);
  const [weaponReplacement, setWeaponReplacement] = useState<WeaponReplacement | null>(null);
  const weaponReplacementOpen = useRef(false);
  const dropReplacedWeapon = useRef<(gear: Gear) => void>(() => {});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const settingsRef = useRef(settings);
  const [capturingBinding, setCapturingBinding] = useState<BindAction | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showHitboxes, setShowHitboxes] = useState(false);
  const showHitboxesRef = useRef(false);
  const [godMode, setGodMode] = useState(false);
  const godModeRef = useRef(false);
  const [noClipMode, setNoClipMode] = useState(false);
  const noClipModeRef = useRef(false);
  const debugCommands = useRef({ addMask: 0, killRoom: 0, dailyShards: 0, dailyMask: 0 });
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<AchievementId>>(() => new Set(loadAchievements()));
  const unlockedAchievementsRef = useRef(unlockedAchievements);
  const [achievementToast, setAchievementToast] = useState<(typeof ACHIEVEMENTS)[number] | null>(null);
  const [shopVisit, setShopVisit] = useState(0);
  const [relicClaimedVisit, setRelicClaimedVisit] = useState<number | null>(null);
  const [alchemistRelicOffers, setAlchemistRelicOffers] = useState<Relic[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapArchive, setMapArchive] = useState<RunMapArchive>(() => runProgress.current.mapArchive);
  const mapOpenRef = useRef(false);
  const relicChoiceOpen = useRef(false);
  const bossDeathLineOpen = useRef(false);
  const ironOathReady = useRef(true);
  const achievementToastTimer = useRef<number | null>(null);
  const combatNoticeTimer = useRef<number | null>(null);
  const showCombatNotice = (text: string, tone: CombatNotice['tone'], duration = 900) => {
    if (combatNoticeTimer.current !== null) window.clearTimeout(combatNoticeTimer.current);
    setCombatNotice({ id: Date.now(), text, tone });
    combatNoticeTimer.current = window.setTimeout(() => setCombatNotice(null), duration);
  };
  const summarizeRun = (deathCause?: string): RunSummary => ({
    location: LOCATION_NAMES_RU[location], sector, kills: runStats.current.kills,
    shards: runProgress.current.shards, damageTaken: runStats.current.damageTaken,
    bossesDefeated: runStats.current.bossesDefeated,
    minutes: Math.max(1, Math.round((Date.now() - runStats.current.startedAt) / 60000)),
    weapons: runProgress.current.loadout.filter((gear) => gear.kind !== 'empty').map((gear) => gear.name),
    deathCause: deathCause || runStats.current.deathCause,
  });
  const showBossIntroduction = (boss: string) => {
    setStoryMessage(`${boss} выходит на бой…`);
    void requestBossLine(boss, summarizeRun()).then((line) => {
      setStoryMessage(line);
      window.setTimeout(() => setStoryMessage(''), 4200);
    });
  };
  const writeChronicle = () => {
    setChronicleLoading(true); setChronicle('');
    void requestChronicle(summarizeRun()).then(setChronicle).finally(() => setChronicleLoading(false));
  };
  const equipOrChooseSlot = (gear: Gear) => {
    const slots = weaponSlots(gear);
    const emptySlot = slots.find((slot) => runProgress.current.loadout[slot].kind === 'empty');
    if (emptySlot !== undefined) {
      runProgress.current.loadout[emptySlot] = { ...gear };
      selectedSlot.current = emptySlot;
      setActiveSlot(emptySlot);
      playUiSound(settingsRef.current.effectsVolume, 'pickup');
      refreshShop((value) => value + 1);
      return;
    }
    pausedRef.current = true;
    setPaused(true);
    weaponReplacementOpen.current = true;
    setWeaponReplacement({ gear: { ...gear }, slots });
  };
  const unlockAchievement = (id: AchievementId) => {
    if (unlockedAchievementsRef.current.has(id)) return;
    const next = new Set(unlockedAchievementsRef.current); next.add(id); unlockedAchievementsRef.current = next; setUnlockedAchievements(next);
    localStorage.setItem('false-knight-achievements', JSON.stringify([...next]));
    const achievement = ACHIEVEMENTS.find((item) => item.id === id) || null; setAchievementToast(achievement);
    if (achievementToastTimer.current !== null) window.clearTimeout(achievementToastTimer.current);
    achievementToastTimer.current = window.setTimeout(() => setAchievementToast(null), 3000);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const isFormControl = ['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName);
      // F2 is a global debug shortcut and must keep working while the level
      // selector is focused after changing the location.
      if (event.code === 'F2') { event.preventDefault(); unlockAchievement('reality_hack'); setDebugOpen((open) => !open); return; }
      if (isFormControl) return;
      if (event.code === 'KeyN') { event.preventDefault(); unlockAchievement('reality_hack'); noClipModeRef.current = !noClipModeRef.current; setNoClipMode(noClipModeRef.current); return; }
      if (event.code === 'Backquote') { event.preventDefault(); unlockAchievement('reality_hack'); setDebugOpen((open) => !open); }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

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
    if (!session) { setCloudSaveStatus('local'); return; }
    let cancelled = false;
    setCloudSaveStatus('syncing');
    void loadCloudSaves().then(async (cloudSaves) => {
      const merged = loadSaveSlots();
      for (const cloud of cloudSaves) {
        if (cloud.slot < 0 || cloud.slot >= SAVE_SLOT_COUNT) continue;
        const localTime = merged[cloud.slot] ? Date.parse(merged[cloud.slot]!.savedAt) : 0;
        if (isCloudSaveDeletion(cloud.saveData)) {
          if (Date.parse(cloud.updatedAt) > localTime) merged[cloud.slot] = null;
          continue;
        }
        const cloudSave = normalizeSave(cloud.saveData);
        if (!cloudSave) continue;
        const cloudTime = Date.parse(cloudSave.savedAt || cloud.updatedAt);
        if (!merged[cloud.slot] || cloudTime > localTime) merged[cloud.slot] = cloudSave;
      }
      localStorage.setItem('ashfall-save-slots', JSON.stringify(merged));
      if (!cancelled) setSaveSlots(merged);
      await Promise.all(merged.map((save, slot) => save ? uploadCloudSave(session.user.id, slot, save) : Promise.resolve()));
      if (!cancelled) setCloudSaveStatus('synced');
    }).catch(() => { if (!cancelled) setCloudSaveStatus('error'); });
    return () => { cancelled = true; };
  }, [session?.user.id]);

  useEffect(() => {
    settingsRef.current = settings; localStorage.setItem('false-knight-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!capturingBinding) return;
    const capture = (event: KeyboardEvent) => {
      event.preventDefault(); event.stopPropagation();
      if (event.code === 'Escape') { setCapturingBinding(null); return; }
      const reserved = ['F2', 'Backquote', 'Tab'];
      if (reserved.includes(event.code)) return;
      setSettings((current) => {
        const bindings = { ...current.bindings };
        const conflicting = (Object.keys(bindings) as BindAction[]).find((action) => action !== capturingBinding && bindings[action] === event.code);
        if (conflicting) bindings[conflicting] = bindings[capturingBinding];
        bindings[capturingBinding] = event.code;
        return { ...current, bindings };
      });
      setCapturingBinding(null);
    };
    window.addEventListener('keydown', capture, true);
    return () => window.removeEventListener('keydown', capture, true);
  }, [capturingBinding]);

  const bindingsPanel = (compact = false) => <div>
    <div className="flex items-center justify-between gap-3"><p className="text-[9px] font-black uppercase tracking-[.25em] text-orange-200/70">Управление</p><button onClick={() => setSettings((current) => ({ ...current, bindings: { ...DEFAULT_BINDINGS } }))} className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500 hover:text-cyan-200">Сбросить</button></div>
    <div className={`mt-3 grid grid-cols-2 gap-2 ${compact ? '' : 'md:grid-cols-3'}`}>{BINDING_ITEMS.map(({ action, label }) => <button key={action} onClick={() => setCapturingBinding(action)} className={`border p-3 text-left text-[9px] transition ${capturingBinding === action ? 'border-amber-300 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-black/25 text-slate-400 hover:border-cyan-300/40'}`}><kbd className="font-black text-slate-100">{capturingBinding === action ? 'Нажмите клавишу…' : keyName(settings.bindings[action])}</kbd><span className="mt-1 block">{label}</span></button>)}</div>
    {capturingBinding && <p className="mt-2 text-[9px] text-slate-500">Esc — отмена. Если клавиша занята, привязки поменяются местами.</p>}
  </div>;
  const mobileSettingsPanel = () => <div className="grid gap-3 border-t border-white/10 pt-4">
    <p className="text-[9px] font-black uppercase tracking-[.25em] text-teal-300/70">Управление на телефоне</p>
    <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400"><span className="flex justify-between">Размер кнопок <b>{settings.mobileScale}%</b></span><input type="range" min="75" max="125" value={settings.mobileScale} onChange={(event) => setSettings((current) => ({ ...current, mobileScale: Number(event.target.value) }))} className="accent-teal-300"/></label>
    <label className="grid gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400"><span className="flex justify-between">Прозрачность <b>{settings.mobileOpacity}%</b></span><input type="range" min="35" max="100" value={settings.mobileOpacity} onChange={(event) => setSettings((current) => ({ ...current, mobileOpacity: Number(event.target.value) }))} className="accent-teal-300"/></label>
    <button onClick={() => setSettings((current) => ({ ...current, mobileSwapSides: !current.mobileSwapSides }))} className="flex justify-between border border-white/15 px-3 py-2 text-[9px] font-black uppercase text-slate-300"><span>Поменять стороны</span><span>{settings.mobileSwapSides ? 'Действия слева' : 'Движение слева'}</span></button>
  </div>;

  useEffect(() => {
    if (!started) { stopBiomeMusic(); return; }
    startBiomeMusic(location, settings.musicVolume);
    return stopBiomeMusic;
  }, [started, location, settings.musicVolume]);

  useEffect(() => { settingsOpenRef.current = settingsOpen; }, [settingsOpen]);
  useEffect(() => { showHitboxesRef.current = showHitboxes; }, [showHitboxes]);
  useEffect(() => { pauseBestiaryOpenRef.current = pauseBestiaryOpen; }, [pauseBestiaryOpen]);

  useEffect(() => {
    if (localStorage.getItem('false-knight-daily')?.includes(dailyChallenge.date)) return;
    setDailyLoading(true);
    void generateDailyChallenge().then(setDailyChallenge).finally(() => setDailyLoading(false));
  }, [dailyChallenge.date]);

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = window.setTimeout(() => setDailyChallenge(loadDailyChallenge()), nextDay.getTime() - now.getTime() + 1000);
    return () => window.clearTimeout(timer);
  }, [dailyChallenge.date]);

  useEffect(() => {
    if (!started || dailyReward.completedDate === dailyChallenge.date) return;
    if (dailyProgress(dailyChallenge, summarizeRun()) < dailyChallenge.target) return;
    const claimed = claimDailyReward();
    if (!claimed) return;
    debugCommands.current.dailyShards += 25;
    if (claimed.maskAwarded) {
      permanentProgress.current.maxHpBonus += 1;
      debugCommands.current.dailyMask += 1;
    }
    setDailyReward(claimed.state);
    setDailyRewardMessage(claimed.maskAwarded ? 'Испытание выполнено: +25 осколков и постоянная маска за серию 7 дней!' : 'Испытание выполнено: +25 осколков!');
    window.setTimeout(() => setDailyRewardMessage(''), 5000);
  }, [started, hud.kills, hud.shards, sector, dailyChallenge, dailyReward.completedDate]);

  useEffect(() => {
    if (!ending) return;
    writeChronicle();
    if (!session || savedRecordForRun.current) return;
    savedRecordForRun.current = true;
    const playerName = String(session.user.user_metadata.display_name || session.user.email?.split('@')[0] || 'Странник').slice(0, 24);
    void saveRunRecord({ player_name: playerName, mode: runMode, completion_seconds: Math.floor(runElapsed.current), kills: runStats.current.kills, bosses_defeated: runStats.current.bossesDefeated, daily_streak: dailyReward.streak })
      .catch(() => { savedRecordForRun.current = false; });
  }, [ending]);

  useEffect(() => {
    if (!started) return;
    ironOathReady.current = true;
    const save = () => {
      if (runMode === 'hardcore') return;
      const savedProgress = { ...runProgress.current, hp: runMode === 'checkpoint' ? runProgress.current.maxHp : runProgress.current.hp, loadout: runProgress.current.loadout.map((gear) => ({ ...gear })) as [Gear, Gear, Gear, Gear] };
      const data: SavedGame = { savedAt: new Date().toISOString(), sector, location, permanentProgress: { ...permanentProgress.current }, legacyProgress: { ...legacyProgress, unlocks: [...legacyProgress.unlocks] }, mode: runMode, elapsedSeconds: runElapsed.current, progress: savedProgress };
      localStorage.setItem('ashfall-autosave', JSON.stringify(data)); setAutosave(data);
      if (activeSaveSlot !== null) setSaveSlots((current) => {
        const next = [...current]; next[activeSaveSlot] = data; localStorage.setItem('ashfall-save-slots', JSON.stringify(next));
        if (session) { setCloudSaveStatus('syncing'); void uploadCloudSave(session.user.id, activeSaveSlot, data).then(() => setCloudSaveStatus('synced')).catch(() => setCloudSaveStatus('error')); }
        return next;
      });
    };
    save(); const timer = window.setInterval(save, 10000);
    return () => { window.clearInterval(timer); save(); };
  }, [started, sector, location, activeSaveSlot, runMode, session, legacyProgress]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => setElapsedHud(Math.floor(runElapsed.current)), 500);
    return () => window.clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (location === 'castle') unlockAchievement('crown_close');
    if (location === 'throne') unlockAchievement('blind_faith');
    if (location === 'throne') showBossIntroduction('Правая Рука Короля');
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSoulHud(0);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const touchControls = window.matchMedia('(hover: none) and (pointer: coarse), (max-width: 820px)').matches;
    ctx.imageSmoothingEnabled = false;
    const theme = themeForLocation(location);
    const enemyHealthScale = (1 + (sector - 1) * .18) * (runMode === 'hardcore' ? 1.35 : 1);

    const ZOOM = 1.35;
    let W = Math.max(320, Math.round(canvas.clientWidth || window.innerWidth));
    let H = Math.max(240, Math.round(canvas.clientHeight || window.innerHeight));
    let viewW = W / ZOOM, viewH = H / ZOOM;
    const resizeCanvas = () => {
      const nextWidth = Math.max(320, Math.round(canvas.clientWidth));
      const nextHeight = Math.max(240, Math.round(canvas.clientHeight));
      if (canvas.width === nextWidth && canvas.height === nextHeight) return;
      canvas.width = nextWidth; canvas.height = nextHeight;
      W = nextWidth; H = nextHeight; viewW = W / ZOOM; viewH = H / ZOOM;
      ctx.imageSmoothingEnabled = false;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const throneScene = location === 'throne', prisonLayout = location === 'prison', cryptLayout = location === 'crypt', swampLayout = location === 'swamps', mineLayout = location === 'mines', clockLayout = location === 'clock', bridgeLayout = location === 'bridge', castleLayout = location === 'castle';
    // Prison Cells uses a compact classic-maze plan: a balanced 3x2 grid of
    // medium rooms instead of a stack of narrow vertical shafts.
    const ROOM_COLS = throneScene || clockLayout ? 1 : castleLayout ? 3 : bridgeLayout ? 5 : swampLayout ? 10 : mineLayout ? 3 : prisonLayout ? 3 : cryptLayout ? 5 : 6;
    const ROOM_ROWS = throneScene || swampLayout || bridgeLayout ? 1 : castleLayout || prisonLayout ? 2 : clockLayout ? 8 : mineLayout ? 3 : 5;
    const roomW = throneScene ? 2100 : castleLayout ? CASTLE_WORLD.width / ROOM_COLS : bridgeLayout ? BRIDGE_WORLD.width / ROOM_COLS : clockLayout ? CLOCK_TOWER_WORLD.width : swampLayout ? 700 : mineLayout ? MINES_WORLD.width / ROOM_COLS : prisonLayout ? 760 : cryptLayout ? CRYPT_WORLD.width / ROOM_COLS : 820;
    const roomH = throneScene ? 820 : castleLayout ? CASTLE_WORLD.height / ROOM_ROWS : bridgeLayout ? BRIDGE_WORLD.height : clockLayout ? CLOCK_TOWER_WORLD.height / ROOM_ROWS : swampLayout ? SWAMP_WORLD.height : mineLayout ? MINES_WORLD.height / ROOM_ROWS : prisonLayout ? 680 : cryptLayout ? CRYPT_WORLD.height / ROOM_ROWS : 620, roomMargin = prisonLayout || swampLayout || mineLayout || clockLayout || cryptLayout || bridgeLayout || castleLayout ? 0 : 60;
    const initialRoomId = castleLayout ? ROOM_COLS * (ROOM_ROWS - 1) + Math.floor(ROOM_COLS / 2) : clockLayout ? ROOM_ROWS - 1 : throneScene || cryptLayout || swampLayout || bridgeLayout ? 0 : ROOM_COLS;
    const worldW = roomMargin * 2 + ROOM_COLS * roomW, worldH = roomMargin * 2 + ROOM_ROWS * roomH;
    const groundY = 620, lowerGroundY = 1420, deepGroundY = 2100;
    const layout = (sector - 1) % 3;
    const legacyTerrain: Box[] = [
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
    const legacyCeilings: Box[] = [
      { x: 40, y: 0, w: 760, h: 155 }, { x: 940, y: 0, w: 690, h: 205 }, { x: 1780, y: 0, w: 720, h: 145 },
      { x: 2640, y: 0, w: 620, h: 190 }, { x: 3400, y: 0, w: 690, h: 135 }, { x: 4230, y: 0, w: 700, h: 200 },
      { x: 5070, y: 0, w: 650, h: 150 }, { x: 5860, y: 0, w: 900, h: 185 }, { x: 6960, y: 0, w: 620, h: 130 },
      { x: 7820, y: 0, w: 740, h: 175 },
    ];
    const legacyDividers: Box[] = [
      { x: 800, y: 0, w: 48, h: 390 }, { x: 1630, y: 0, w: 48, h: 420 }, { x: 2500, y: 0, w: 48, h: 350 },
      { x: 3260, y: 0, w: 48, h: 405 }, { x: 4090, y: 0, w: 48, h: 340 }, { x: 4930, y: 0, w: 40, h: 350 },
      { x: 5720, y: 0, w: 48, h: 410 }, { x: 6760, y: 0, w: 48, h: 350 }, { x: 7580, y: 0, w: 48, h: 190 },
    ];
    const legacyUpperFloor: Box[] = [
      { x: 0, y: groundY, w: 2050, h: 100 }, { x: 2250, y: groundY, w: 3750, h: 100 }, { x: 6200, y: groundY, w: worldW - 6200, h: 100 },
    ];
    const legacySolids: Box[] = [
      ...legacyUpperFloor,
      { x: 0, y: lowerGroundY, w: 4300, h: 100 }, { x: 4520, y: lowerGroundY, w: 3080, h: 100 }, { x: 7820, y: lowerGroundY, w: worldW - 7820, h: 100 },
      { x: 0, y: deepGroundY, w: worldW, h: 100 }, { x: 0, y: 0, w: 40, h: worldH }, { x: worldW - 40, y: 0, w: 40, h: worldH }, ...legacyTerrain, ...legacyCeilings, ...legacyDividers,
    ];
    const heightShift = layout === 1 ? 34 : layout === 2 ? -28 : 0;
    const legacyOneWays: Box[] = [
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
    void legacySolids; void legacyOneWays;

    type Room = { id: number; col: number; row: number; x: number; y: number; connections: Set<number> };
    const rooms: Room[] = Array.from({ length: ROOM_COLS * ROOM_ROWS }, (_, id) => ({ id, col: id % ROOM_COLS, row: Math.floor(id / ROOM_COLS), x: roomMargin + (id % ROOM_COLS) * roomW, y: roomMargin + Math.floor(id / ROOM_COLS) * roomH, connections: new Set<number>() }));
    const mazeVisited = new Set<number>([initialRoomId]);
    const mazeStack = [initialRoomId];
    const roomNeighbors = (room: Room) => [room.col > 0 ? room.id - 1 : -1, room.col < ROOM_COLS - 1 ? room.id + 1 : -1, room.row > 0 ? room.id - ROOM_COLS : -1, room.row < ROOM_ROWS - 1 ? room.id + ROOM_COLS : -1].filter((id) => id >= 0);
    while (mazeStack.length) {
      const current = rooms[mazeStack[mazeStack.length - 1]];
      const available = roomNeighbors(current).filter((id) => !mazeVisited.has(id)).sort((a, b) => {
        const aVertical = Math.abs(a - current.id) === ROOM_COLS, bVertical = Math.abs(b - current.id) === ROOM_COLS;
        const orientationBias = cryptLayout || prisonLayout ? Number(bVertical) - Number(aVertical) : mineLayout ? Number(aVertical) - Number(bVertical) : 0;
        return orientationBias || Math.random() - .5;
      });
      if (!available.length) { mazeStack.pop(); continue; }
      const next = available[0]; current.connections.add(next); rooms[next].connections.add(current.id); mazeVisited.add(next); mazeStack.push(next);
    }
    if (prisonLayout) {
      // Hand-authored 3x2 dungeon: horizontal corridors carry the main route,
      // while two hatch links create dead-end branches and a loop between floors.
      for (const room of rooms) room.connections.clear();
      const connect = (from: number, to: number) => { rooms[from].connections.add(to); rooms[to].connections.add(from); };
      connect(0, 1); connect(1, 2);
      connect(3, 4); connect(4, 5);
      connect(1, 4); connect(2, 5);
    } else if (castleLayout) {
      // A mirrored palace plan: every row is traversable, while alternating
      // stair towers create a readable maze instead of one random cave route.
      for (const room of rooms) room.connections.clear();
      const connect = (from: number, to: number) => { rooms[from].connections.add(to); rooms[to].connections.add(from); };
      for (let row = 0; row < ROOM_ROWS; row++) for (let col = 0; col < ROOM_COLS - 1; col++) connect(row * ROOM_COLS + col, row * ROOM_COLS + col + 1);
      for (let row = 0; row < ROOM_ROWS - 1; row++) {
        const stairColumns = (row % 2 ? [0, 2] : [1]).filter((col) => col < ROOM_COLS);
        for (const col of stairColumns) connect(row * ROOM_COLS + col, (row + 1) * ROOM_COLS + col);
      }
    }
    // Дополнительные связи создают редкие кольца и развилки, сохраняя тупики.
    const extraConnectionChance = castleLayout || prisonLayout ? 0 : cryptLayout ? .06 : mineLayout ? .28 : .18;
    for (const room of rooms) if (Math.random() < extraConnectionChance) {
      const candidates = roomNeighbors(room).filter((id) => !room.connections.has(id));
      if (candidates.length) { const next = candidates[Math.floor(Math.random() * candidates.length)]; room.connections.add(next); rooms[next].connections.add(room.id); }
    }
    const loreMessages = ['Подземелье защищает этот мир от ТЕБЯ...', 'Не дайте ему вспомнить, кто он на самом деле', 'Царь возвращается к своему трону...'];
    const loreSigns = throneScene ? [] : rooms.filter(() => Math.random() < .24).map((room, index) => ({ x: room.x + 90 + Math.random() * (roomW - 360), y: room.y + 105 + Math.random() * 170, text: loreMessages[index % loreMessages.length], alpha: .12 + Math.random() * .1 }));

    const terrain: Box[] = [], ceilings: Box[] = [], dividers: Box[] = [], oneWays: Box[] = [];
    const swampLevel = swampLayout ? createSwampLevel() : null;
    const swampPlatforms: SwampPlatform[] = swampLevel?.platforms ?? [];
    const wall = 42, verticalGap = 132, sideGapHeight = 118;
    for (const room of rooms) {
      const leftOpen = room.connections.has(room.id - 1), rightOpen = room.connections.has(room.id + 1);
      const upOpen = room.connections.has(room.id - ROOM_COLS), downOpen = room.connections.has(room.id + ROOM_COLS);
      const gapX = room.x + roomW / 2 - verticalGap / 2;
      const addHorizontalWall = (y: number, open: boolean, target: Box[]) => {
        if (open) { target.push({ x: room.x, y, w: gapX - room.x, h: wall }, { x: gapX + verticalGap, y, w: room.x + roomW - gapX - verticalGap, h: wall }); }
        else target.push({ x: room.x, y, w: roomW, h: wall });
      };
      addHorizontalWall(room.y, upOpen, ceilings);
      addHorizontalWall(room.y + roomH - wall, downOpen, terrain);
      const sideWall = (x: number, open: boolean) => {
        if (open) dividers.push({ x, y: room.y, w: wall, h: roomH - wall - sideGapHeight });
        else dividers.push({ x, y: room.y, w: wall, h: roomH });
      };
      sideWall(room.x, leftOpen); sideWall(room.x + roomW - wall, rightOpen);

      const standardTemplates: Array<Array<[number, number, number]>> = [
        [[80, 330, 185], [500, 245, 185], [105, 160, 185], [490, 115, 190]], // Zigzag
        [[185, 285, 450], [70, 185, 170], [565, 185, 170]], // Bridge
        [[75, 300, 310], [430, 300, 310], [255, 175, 310], [75, 115, 230]], // Corridors
        [[70, 325, 160], [245, 245, 160], [420, 165, 160], [595, 115, 145]], // Stairway
        [[70, 300, 235], [515, 300, 235], [290, 190, 240], [90, 115, 190], [540, 115, 190]], // Split
        [[310, 330, 180], [135, 240, 165], [500, 240, 165], [310, 145, 180]], // Shaft
      ];
      const prisonTemplates: Array<Array<[number, number, number]>> = [
        [[62, 322, 185], [330, 322, 210], [105, 220, 140], [400, 205, 145]],
        [[60, 330, 495], [92, 225, 130], [405, 225, 130]],
        [[65, 320, 145], [238, 320, 125], [395, 320, 155], [220, 205, 180]],
        [[70, 340, 165], [255, 250, 150], [420, 160, 130]],
      ];
      const cryptTemplates: Array<Array<[number, number, number]>> = [
        [[105, 545, 230], [650, 435, 260], [220, 300, 245], [690, 165, 210]],
        [[170, 520, 240], [620, 350, 270], [330, 180, 250]],
        [[90, 470, 270], [670, 470, 270], [390, 265, 260]],
      ];
      const roomTemplates = prisonLayout ? prisonTemplates : cryptLayout ? cryptTemplates : standardTemplates;
      const template = roomTemplates[Math.floor(Math.random() * roomTemplates.length)];
      if (prisonLayout) {
        // Broad alternating landings keep each cell block readable and leave
        // the central line clear for the hatch route between both floors.
        for (let floor = 0, y = room.y + roomH - 175; y > room.y + 90; floor++, y -= 145) {
          const width = floor % 3 === 2 ? roomW - 245 : 245;
          const x = floor % 2 ? room.x + roomW - wall - width - 18 : room.x + wall + 18;
          oneWays.push({ x, y, w: width, h: 16 });
        }
      } else if (castleLayout) {
        // Giant open halls use broad balcony tiers and keep a large empty nave.
        // Keep roughly one long double-jump between tiers; the old .72/.48/.25
        // spacing left vertical gaps of more than 320px and made some balconies
        // impossible to reach.
        const balconyWidth = roomW * .34;
        oneWays.push(
          { x: room.x + wall + 55, y: room.y + roomH * .80, w: balconyWidth, h: 22 },
          { x: room.x + roomW - wall - 55 - balconyWidth, y: room.y + roomH * .80, w: balconyWidth, h: 22 },
          { x: room.x + roomW * .27, y: room.y + roomH * .64, w: roomW * .46, h: 22 },
          { x: room.x + wall + 95, y: room.y + roomH * .48, w: roomW * .28, h: 22 },
          { x: room.x + roomW - wall - 95 - roomW * .28, y: room.y + roomH * .48, w: roomW * .28, h: 22 },
        );
      } else if (!throneScene && location !== 'mines') for (const [offsetX, offsetY, width] of template) oneWays.push({ x: room.x + offsetX, y: room.y + offsetY, w: width, h: 16 });
      if ((upOpen || downOpen) && location !== 'mines') {
        // Узкая лестница покрывает всю высоту комнаты. Последняя ступень
        // находится прямо под проёмом, поэтому до верхнего этажа можно допрыгнуть.
        for (let step = 0, y = room.y + roomH - 120; y > room.y + 45; step++, y -= cryptLayout ? 125 : 95) {
          const stairX = step % 2 ? gapX + verticalGap - 48 : gapX - 58;
          oneWays.push({ x: stairX, y, w: cryptLayout ? 128 : 112, h: 14 });
        }
      }
    }
    if (swampLevel) {
      terrain.splice(0, terrain.length, ...swampLevel.terrain);
      ceilings.splice(0);
      dividers.splice(0, dividers.length, ...swampLevel.boundaries);
      oneWays.splice(0, oneWays.length, ...swampLevel.oneWays);
    }
    const clockLevel = clockLayout ? createClockTowerLevel() : null;
    const clockPlatforms: ClockPlatform[] = clockLevel?.platforms ?? [];
    if (clockLevel) {
      terrain.splice(0, terrain.length, ...clockLevel.terrain);
      ceilings.splice(0); dividers.splice(0);
      oneWays.splice(0, oneWays.length, ...clockPlatforms);
    }
    const cryptLevel = cryptLayout ? createCryptLevel() : null;
    if (cryptLevel) {
      terrain.splice(0, terrain.length, ...cryptLevel.boundary, ...cryptLevel.terraces, ...cryptLevel.crumblingSlabs);
      ceilings.splice(0); dividers.splice(0);
      oneWays.splice(0, oneWays.length, ...cryptLevel.platforms, ...cryptLevel.ghostPlatforms);
    }
    const bridgeLevel = bridgeLayout ? createBridgeLevel() : null;
    const bridgePlatforms: BridgePlatform[] = bridgeLevel?.platforms ?? [];
    if (bridgeLevel) {
      terrain.splice(0, terrain.length, ...bridgeLevel.terrain);
      ceilings.splice(0); dividers.splice(0);
      oneWays.splice(0, oneWays.length, ...bridgePlatforms);
    }
    const minesLevel = mineLayout ? createMinesLevel(rooms.map((room) => ({ ...room, w: roomW, h: roomH })), ROOM_COLS) : null;
    if (minesLevel) { oneWays.push(...minesLevel.platforms); dividers.push(...minesLevel.obstacles); }
    const castleLevel = castleLayout ? createCastleLevel(rooms, roomW, roomH, ROOM_COLS) : null;
    const platformBlockingSolids: Box[] = [...terrain, ...ceilings, ...dividers];
    const platformsToPlace = clockLevel
      ? oneWays.filter((platform) => !clockLevel.exitPlatforms.includes(platform as ClockPlatform))
      : oneWays;
    oneWays.splice(0, oneWays.length, ...placePlatformsSafely(platformsToPlace, platformBlockingSolids, worldW));
    // Platforms directly below a ceiling opening are intentional traversal
    // geometry. The generic headroom filter may remove the last stair because
    // the neighbouring floor slabs are thick, making the room above
    // unreachable. Restore a narrow, centred take-off ledge for every upward
    // connection; it fits completely inside the 132px opening.
    if (!swampLayout && !clockLayout && !cryptLayout && !bridgeLayout && !throneScene) {
      const openingPlatformWidth = 96;
      for (const room of rooms) if (room.connections.has(room.id - ROOM_COLS)) {
        oneWays.push({
          x: room.x + (roomW - openingPlatformWidth) / 2,
          y: room.y + 92,
          w: openingPlatformWidth,
          h: 14,
        });
      }
    }
    // The generic safety pass can discard every low ledge in a room when a
    // template happens to sit too close to a wall. Keep one conservative first
    // step in every grid room so the platform route can always be started from
    // its floor (well within the player's double-jump height).
    if (!swampLayout && !clockLayout && !cryptLayout && !bridgeLayout && !throneScene) {
      const reachableRise = 220;
      const fallbackWidth = 150;
      for (const room of rooms) {
        const floorY = room.y + roomH - wall;
        const hasReachablePlatform = oneWays.some((platform) =>
          platform.x < room.x + roomW
          && platform.x + platform.w > room.x
          && platform.y < floorY
          && floorY - platform.y <= reachableRise,
        );
        if (hasReachablePlatform) continue;

        const fallbackY = floorY - 180;
        const fallbackXs = [room.x + 140, room.x + roomW - 140 - fallbackWidth, room.x + (roomW - fallbackWidth) / 2];
        const fallback = fallbackXs
          .map((x) => ({ x, y: fallbackY, w: fallbackWidth, h: 16 }))
          .find((candidate) =>
            isPlatformPlacementSafe(candidate, platformBlockingSolids, worldW)
            && oneWays.every((platform) =>
              candidate.x + candidate.w <= platform.x
              || candidate.x >= platform.x + platform.w
              || candidate.y + candidate.h <= platform.y
              || candidate.y >= platform.y + platform.h,
            ),
          );
        if (fallback) oneWays.push(fallback);
      }
    }
    // Exit ledges are intentional level geometry. The generic placement filter
    // rejects them because they are close to the tower ceiling, leaving the
    // doors visually suspended, so keep these two permanent platforms intact.
    if (clockLevel) oneWays.push(...clockLevel.exitPlatforms);
    const solids: Box[] = [...terrain, ...ceilings, ...dividers];
    const projectileBlockers = [...solids, ...oneWays];
    // A single massive barrier seals the finale chamber from floor to ceiling.
    // It is removed as one piece only after the Right Hand is defeated.
    const throneArenaGate: Box | null = throneScene ? { x: 960, y: wall, w: 180, h: roomH - 24 } : null;
    if (throneArenaGate) {
      solids.push(throneArenaGate);
      projectileBlockers.push(throneArenaGate);
    }
    if (cryptLevel) for (const secret of cryptLevel.secrets) { solids.push(secret.wall); projectileBlockers.push(secret.wall); }
    type PrisonGate = Box & { opened: boolean };
    // A few connections begin behind iron cell doors. They are real collision
    // objects and must be opened in-place, instead of acting as scene changes.
    const prisonGates: PrisonGate[] = prisonLayout ? rooms
      .filter((room) => room.connections.has(room.id + 1) && room.id !== initialRoomId && room.id % 3 === 1)
      .map((room) => ({ x: room.x + roomW - wall - 3, y: room.y + roomH - wall - sideGapHeight, w: wall + 6, h: sideGapHeight, opened: false })) : [];
    solids.push(...prisonGates); projectileBlockers.push(...prisonGates);
    const stageFourBossFight = location === 'crypt' || location === 'bridge';
    const arenaRoom = rooms[initialRoomId];
    // These custom maps do not use the generated room walls. Their arena gates
    // therefore line up with the actual crypt terrace and final bridge pier.
    const arenaGates: Box[] = cryptLayout
      ? [{ x: 920, y: 44, w: 44, h: 521 }]
      : bridgeLayout
      ? [{ x: 960, y: 0, w: 40, h: 610 }]
      : [];
    if (cryptLayout || bridgeLayout) { solids.push(...arenaGates); projectileBlockers.push(...arenaGates); }
    type EnemyKind = 'zombie' | 'crossbow' | 'shield' | 'bomber' | 'mage' | 'totem' | 'slime' | 'flyer' | 'wraith' | 'boss' | 'rightHand';
    type EnemyVariant = 'rottenPrisoner' | 'summonedPrisoner' | 'cappedArcher' | 'marshSlime' | 'swampTotem' | 'bogShaman' | 'blindMiner' | 'dynamiteTosser' | 'minecartDefender' | 'clockworkSoldier' | 'gearFlyer' | 'towerSniper' | 'wraith' | 'necromancer' | 'cryptTotem' | 'bridgeKnight' | 'gargoyleBomber' | 'royalGuard' | 'royalSorcerer' | 'swampGiant' | 'stoneGolem' | 'cryptWarden' | 'bridgeColossus' | 'rightHand';
    type StatusKind = 'burning' | 'poisoned' | 'electrified' | 'bleeding';
    type StatusEffect = { life: number; tick: number; stacks: number; maskProgress?: number };
    type StatusState = Partial<Record<StatusKind, StatusEffect>>;
    type Enemy = Box & { kind: EnemyKind; variant: EnemyVariant; name: string; vx: number; vy: number; patrolSpeed: number; hp: number; maxHp: number; left: number; right: number; homeY: number; facing: number; alert: number; alertTimer: number; sawPlayer: boolean; turnDelay: number; hurt: number; attack: number; cooldown: number; blocked: number; stunned: number; frozen?: number; statuses?: StatusState; guardTriggered: boolean; defeated: boolean; dead: boolean; dormant?: boolean; specialAttack?: 1 | 2; specialPhase?: number; phaseTwo?: boolean; phaseTransition?: number; elite?: EliteModifier; eliteCooldown?: number; footstepBeat?: number; bossImpactDone?: boolean; spellX?: number; spellY?: number };
    const enemyHurtbox = (enemy: Enemy): Box => enemy.variant === 'bridgeColossus'
      ? { x: enemy.facing > 0 ? enemy.x - 22 : enemy.x - 68, y: enemy.y + 25, w: 210, h: 88 }
      : enemy;
    type Projectile = Box & { vx: number; vy: number; life: number; damage: number; kind: 'arrow' | 'grenade' | 'freeze' | 'enemyArrow' | 'trapArrow' | 'enemyBomb' | 'magicOrb' | 'poisonBurst' | 'gear' | 'wardenSkull' | 'fallingRock'; owner?: Enemy; bounces?: number; reflected?: boolean; originX?: number; blastRadius?: number; freezeSeconds?: number; branch?: WeaponBranchId; pierces?: number };
    type RockWarning = Box & { life: number; delay: number };
    type BossWarning = Box & { life: number; delay: number; hit: boolean; kind: 'spike' | 'geyser' };
    type Hazard = Box & { life: number; kind: 'poison' | 'fire'; tick: number; delay: number };
    type ShardDrop = Box & { vx: number; vy: number; value: number; life: number };
    type Trap = Box & { life: number; damage: number; triggered: boolean };
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; maxLife?: number; shape?: 'square' | 'smoke' | 'shard'; rotation?: number; spin?: number };
    type Explosion = { x: number; y: number; life: number; maxLife: number; radius: number; kind: 'fire' | 'freeze' };
    type Door = Box & { opening: number; destination: Exclude<LocationKind, 'prison'>; label: string };
    type PowerUp = Box & { kind: 'health'; collected: boolean; phase: number };
    type Loot = Box & { gear: Gear; collected: boolean; phase: number; shardValue: number };
    type ExplorationReward = Box & {
      kind: 'goldChest' | 'weaponPedestal' | 'healthAltar';
      collected: boolean;
      phase: number;
      shardValue: number;
      gear?: Gear;
      lore?: string;
    };
    type SpawnEdge = 'left' | 'right' | 'custom';
    // Roll once per level creation and reuse the result for the player, the
    // start room and the entrance door. This prevents those three objects from
    // drifting to different sides after a randomized edge spawn.
    const spawnEdge: SpawnEdge = prisonLayout || mineLayout
      ? (Math.random() < .5 ? 'left' : 'right')
      : swampLayout
      ? 'left'
      : 'custom';
    const edgeStartRow = prisonLayout ? ROOM_ROWS - 1 : mineLayout ? ROOM_ROWS - 1 : 0;
    const edgeStartRoomId = edgeStartRow * ROOM_COLS + (spawnEdge === 'right' ? ROOM_COLS - 1 : 0);
    const startRoomId = prisonLayout || mineLayout ? edgeStartRoomId : initialRoomId;
    // The crypt opens directly in the Warden's arena: the player appears on
    // the safe left side, facing the boss on the right.
    const cryptSpawnSpot = cryptLevel ? { x: 150, y: 509 } : undefined;
    const roomDistance = Array.from({ length: rooms.length }, () => Number.POSITIVE_INFINITY);
    const routeParent = Array.from({ length: rooms.length }, () => -1);
    roomDistance[startRoomId] = 0;
    const distanceQueue = [startRoomId];
    while (distanceQueue.length) {
      const current = distanceQueue.shift()!;
      for (const next of rooms[current].connections) if (!Number.isFinite(roomDistance[next])) { roomDistance[next] = roomDistance[current] + 1; routeParent[next] = current; distanceQueue.push(next); }
    }
    const byDistance = (a: Room, b: Room) => roomDistance[b.id] - roomDistance[a.id];
    const graphDistance = (from: number, to: number) => {
      const distances = Array.from({ length: rooms.length }, () => Number.POSITIVE_INFINITY);
      distances[from] = 0;
      const queue = [from];
      while (queue.length) {
        const current = queue.shift()!;
        if (current === to) return distances[current];
        for (const next of rooms[current].connections) if (!Number.isFinite(distances[next])) { distances[next] = distances[current] + 1; queue.push(next); }
      }
      return 0;
    };
    // Exits are selected by travel distance, not by a prescribed edge or corner.
    const exitSide = (_room: Room) => true;
    const deadEndRooms = rooms.filter((room) => room.connections.size === 1 && room.id !== startRoomId && exitSide(room)).sort(byDistance);
    const distantRooms = rooms.filter((room) => room.id !== startRoomId && exitSide(room) && !deadEndRooms.includes(room)).sort(byDistance);
    const routeDestinations: Array<Exclude<LocationKind, 'prison'>> = location === 'prison' ? ['swamps', 'mines'] : location === 'swamps' ? ['clock'] : location === 'mines' ? ['clock', 'clock'] : location === 'clock' ? ['crypt', 'bridge'] : location === 'crypt' ? ['castle', 'castle'] : location === 'bridge' ? ['castle'] : location === 'castle' ? ['throne', 'throne'] : [];
    const exitCandidates = [...deadEndRooms, ...distantRooms];
    const farthestDistance = exitCandidates.reduce((maximum, room) => Math.max(maximum, roomDistance[room.id]), 0);
    // Keep exits in the farthest band of the map: at most one room transition
    // closer than the most distant reachable room from the player's spawn.
    const minimumExitDistance = Math.max(2, farthestDistance - 1);
    const farExitCandidates = exitCandidates.filter((room) => roomDistance[room.id] >= minimumExitDistance);
    const exitRooms: Room[] = [];
    const usableExitCandidates = farExitCandidates.length >= routeDestinations.length ? farExitCandidates : exitCandidates;
    const keepOriginalExitPlacement = clockLayout || throneScene;
    if (keepOriginalExitPlacement) {
      for (let index = 0; index < routeDestinations.length; index++) {
        const available = usableExitCandidates.filter((room) => !exitRooms.includes(room));
        if (!available.length) break;
        const ranked = index === 0 ? available : available.sort((a, b) => {
          const separation = (room: Room) => Math.min(...exitRooms.map((chosen) => graphDistance(room.id, chosen.id)));
          return separation(b) - separation(a) || roomDistance[b.id] - roomDistance[a.id];
        });
        exitRooms.push(ranked[0]);
      }
    } else if (routeDestinations.length === 1 && usableExitCandidates.length) {
      exitRooms.push([...usableExitCandidates].sort(byDistance)[0]);
    } else if (routeDestinations.length > 1) {
      // Choose both exits as a pair. This prevents a good first choice from
      // forcing the second door into a neighbouring room.
      const pairs: Array<{ rooms: [Room, Room]; separation: number; distance: number }> = [];
      for (let first = 0; first < usableExitCandidates.length; first++) for (let second = first + 1; second < usableExitCandidates.length; second++) {
        const a = usableExitCandidates[first], b = usableExitCandidates[second];
        pairs.push({
          rooms: [a, b],
          separation: graphDistance(a.id, b.id),
          distance: Math.min(roomDistance[a.id], roomDistance[b.id]),
        });
      }
      // Both doors must first be near the opposite end from spawn. Only then
      // maximize the distance between the two exits themselves.
      const bestPair = pairs.sort((a, b) => b.distance - a.distance || b.separation - a.separation)[0];
      if (bestPair) exitRooms.push(...bestPair.rooms);
    }
    if (clockLayout && exitRooms.length === 1 && routeDestinations.length === 2) exitRooms.push(exitRooms[0]);
    const allCryptDoorSpots = cryptLevel ? [
      { x: 120, y: 2653 },
      { x: 1450, y: 2368 },
      { x: 2780, y: 2673 },
      { x: 2350, y: 2003 },
      { x: 560, y: 1818 },
      { x: 1700, y: 1198 },
    ] : [];
    const cryptDoorSpots: Array<{ x: number; y: number }> = [];
    const availableCryptSpots = allCryptDoorSpots
      .filter((spot) => !cryptSpawnSpot || Math.hypot(spot.x - cryptSpawnSpot.x, spot.y - cryptSpawnSpot.y) >= 1250);
    while (cryptDoorSpots.length < routeDestinations.length && availableCryptSpots.length) {
      availableCryptSpots.sort((a, b) => {
        const score = (spot: { x: number; y: number }) => {
          const fromSpawn = cryptSpawnSpot ? Math.hypot(spot.x - cryptSpawnSpot.x, spot.y - cryptSpawnSpot.y) : 0;
          const fromOtherDoor = cryptDoorSpots.length
            ? Math.min(...cryptDoorSpots.map((chosen) => Math.hypot(spot.x - chosen.x, spot.y - chosen.y)))
            : fromSpawn;
          return Math.min(fromSpawn, fromOtherDoor);
        };
        return score(b) - score(a);
      });
      cryptDoorSpots.push(availableCryptSpots.shift()!);
    }
    const chosenDoorSpots: Array<{ x: number; y: number }> = [];
    const supportedDoorSpot = (room: Room) => {
      const supports = [...terrain, ...oneWays].filter((surface) =>
        surface.w >= 98 && surface.x < room.x + roomW && surface.x + surface.w > room.x && surface.y > room.y + 90 && surface.y <= room.y + roomH - wall + 1
      );
      const candidates = supports.flatMap((surface) => [0.2, 0.5, 0.8].map((position) => ({
        x: Math.max(surface.x + 20, Math.min(surface.x + surface.w - 78, surface.x + surface.w * position - 29)),
        y: surface.y - 72,
      }))).filter((spot) => {
        const doorBox = { x: spot.x, y: spot.y, w: 58, h: 72 };
        return ![...terrain, ...ceilings, ...dividers, ...oneWays].some((block) =>
          doorBox.x < block.x + block.w && doorBox.x + doorBox.w > block.x && doorBox.y < block.y + block.h && doorBox.y + doorBox.h > block.y
        );
      });
      if (!candidates.length) return { x: room.x + roomW / 2 - 29, y: room.y + roomH - wall - 72 };
      const startCenter = { x: rooms[startRoomId].x + roomW / 2, y: rooms[startRoomId].y + roomH / 2 };
      return candidates.sort((a, b) => {
        const score = (spot: { x: number; y: number }) => Math.min(
          Math.hypot(spot.x - startCenter.x, spot.y - startCenter.y),
          chosenDoorSpots.length ? Math.min(...chosenDoorSpots.map((chosen) => Math.hypot(spot.x - chosen.x, spot.y - chosen.y))) : Number.POSITIVE_INFINITY,
        );
        return score(b) - score(a);
      })[0];
    };
    const doors: Door[] = exitRooms.map((room, index) => {
      const clockExitPlatform = clockLayout ? clockLevel?.exitPlatforms[index] : undefined;
      const cryptSpot = cryptLayout ? cryptDoorSpots[index % cryptDoorSpots.length] : undefined;
      const supportedSpot = !clockExitPlatform && !cryptSpot && !swampLayout && !bridgeLayout ? supportedDoorSpot(room) : undefined;
      const spot = clockExitPlatform
        ? { x: clockExitPlatform.x + (clockExitPlatform.w - 58) / 2, y: clockExitPlatform.y - 72 }
        : cryptSpot
        ? cryptSpot
        : swampLayout
        ? { x: SWAMP_WORLD.width - wall - 100, y: 3163 }
        : bridgeLayout
        ? { x: BRIDGE_WORLD.width - wall - 58, y: 538 }
        : supportedSpot!;
      chosenDoorSpots.push(spot);
      return {
        x: spot.x,
        y: spot.y,
        w: 58, h: 72, opening: 0, destination: routeDestinations[index], label: LOCATION_NAMES[routeDestinations[index]],
      };
    });
    const stageTwoBossFight = location === 'swamps' || location === 'mines';
    let stageTwoBossRoom = stageTwoBossFight ? (exitRooms[0] || rooms[rooms.length - 1]) : null;
    const bossRoomGates = (room: Room): Box[] => swampLayout ? [
      // The final swamp chamber stays open while exploring. Touching its door
      // drops this gate behind the player until the guardian is defeated.
      { x: SWAMP_WORLD.width - 1100, y: 2935, w: 42, h: 300 },
    ] : [
      ...(room.connections.has(room.id - 1) ? [{ x: room.x, y: room.y + roomH - wall - sideGapHeight, w: wall, h: sideGapHeight }] : []),
      ...(room.connections.has(room.id + 1) ? [{ x: room.x + roomW - wall, y: room.y + roomH - wall - sideGapHeight, w: wall, h: sideGapHeight }] : []),
      ...(room.connections.has(room.id - ROOM_COLS) ? [{ x: room.x + roomW / 2 - verticalGap / 2, y: room.y, w: verticalGap, h: wall }] : []),
      ...(room.connections.has(room.id + ROOM_COLS) ? [{ x: room.x + roomW / 2 - verticalGap / 2, y: room.y + roomH - wall, w: verticalGap, h: wall }] : []),
    ];
    let stageTwoArenaGates: Box[] = stageTwoBossRoom ? bossRoomGates(stageTwoBossRoom) : [];
    if (throneArenaGate) stageTwoArenaGates.push(throneArenaGate);
    // Keep one complete route from the spawn to every exit free of unavoidable hazards.
    const safeRouteRooms = new Set<number>([startRoomId]);
    for (const exitRoom of exitRooms) {
      let roomId = exitRoom.id;
      while (roomId >= 0 && !safeRouteRooms.has(roomId)) { safeRouteRooms.add(roomId); roomId = routeParent[roomId]; }
    }
    const exitRoomIds = new Set(exitRooms.map((room) => room.id));
    const spikeWidth = 90, spikeHeight = 20, minOpenWidth = wall * 4, minHeadroom = wall * 3;
    const spikes: Box[] = bridgeLevel ? [...bridgeLevel.abyssSpikes] : location === 'throne' || clockLayout ? [] : rooms.flatMap((room) => {
      // Spikes are optional decoration: never put them on the guaranteed route, near an exit,
      // on one-way ledges, or on broken floor around a vertical passage.
      if (safeRouteRooms.has(room.id) || exitRoomIds.has(room.id) || (room.id + sector) % 4 !== 0) return [];
      const floorY = room.y + roomH - wall;
      const floorSections = terrain.filter((tile) => tile.y === floorY && tile.x >= room.x && tile.x + tile.w <= room.x + roomW && tile.w >= minOpenWidth);
      for (const floor of floorSections.sort((a, b) => b.w - a.w)) {
        const spike: Box = { x: floor.x + floor.w / 2 - spikeWidth / 2, y: floor.y - spikeHeight, w: spikeWidth, h: spikeHeight };
        const openRoom: Box = { x: spike.x, y: spike.y - minHeadroom, w: spike.w, h: minHeadroom };
        const overheadBlocked = [...ceilings, ...dividers, ...oneWays].some((block) => openRoom.x < block.x + block.w && openRoom.x + openRoom.w > block.x && openRoom.y < block.y + block.h && openRoom.y + openRoom.h > block.y);
        const nearDoor = doors.some((door) => Math.abs(spike.x + spike.w / 2 - (door.x + door.w / 2)) < wall * 4);
        if (!overheadBlocked && !nearDoor) return [spike];
      }
      return [];
    });
    const startRoom = rooms[startRoomId];
    const swampSpawnPlatform = swampPlatforms
      .filter(({ route }) => route === 'main')
      .sort((a, b) => a.x - b.x)[0];
    const bossArenaEntranceX = 150;
    const spawnX = prisonLayout || mineLayout
      ? (spawnEdge === 'left' ? 80 : worldW - 120)
      : clockLayout ? CLOCK_TOWER_WORLD.width / 2
      : bridgeLayout ? 150
      : swampSpawnPlatform ? 80
      : cryptSpawnSpot ? cryptSpawnSpot.x
      : castleLayout ? 100
      : throneScene ? bossArenaEntranceX
      : startRoom.x + 105;
    const spawnY = clockLayout ? CLOCK_TOWER_WORLD.height - 126 : bridgeLayout ? 554 : swampSpawnPlatform ? swampSpawnPlatform.y - 56 : cryptSpawnSpot ? cryptSpawnSpot.y : startRoom.y + roomH - wall - 56;
    const entranceSide: 'left' | 'right' | 'center' = spawnEdge === 'right' ? 'right' : clockLayout ? 'center' : 'left';
    const entranceDoor = {
      x: entranceSide === 'right' ? worldW - 100 : entranceSide === 'center' ? spawnX - 29 : Math.max(42, spawnX - 58),
      y: spawnY - 16,
      w: 58,
      h: 72,
      side: entranceSide,
    };
    const spawnSafeRadius = 240;
    const bossOnlyRoomIds = new Set<number>([...(stageTwoBossFight ? exitRooms.map((room) => room.id) : []), ...(stageFourBossFight ? [arenaRoom.id] : [])]);
    const spawnPlatforms = [...terrain, ...oneWays].filter((platform) => {
      if (platform.w < 90 || platform.y < 70 || platform.y > worldH - 20) return false;
      if (swampLayout && platform.x >= SWAMP_WORLD.width - 1100 && (platform.y === 2585 || platform.y === 3235)) return false;
      if (swampLevel?.rewardNodes.some((node) => node.x === platform.x && node.y === platform.y)) return false;
      const platformRoom = rooms.find((room) => platform.x >= room.x && platform.x < room.x + roomW && platform.y >= room.y && platform.y <= room.y + roomH);
      return !platformRoom || !bossOnlyRoomIds.has(platformRoom.id);
    });
    const biomePools: Record<Exclude<LocationKind, 'throne'>, Array<[EnemyKind, EnemyVariant, string]>> = {
      prison: [['zombie', 'rottenPrisoner', 'Rotten Prisoner'], ['crossbow', 'cappedArcher', 'Hooded Marksman']],
      swamps: [['slime', 'marshSlime', 'Swamp Slime'], ['totem', 'swampTotem', 'Swamp Totem'], ['mage', 'bogShaman', 'Mire Shaman']],
      mines: [['zombie', 'blindMiner', 'Blind Miner'], ['bomber', 'dynamiteTosser', 'Demolisher'], ['shield', 'minecartDefender', 'Cart Guardian']],
      clock: [['zombie', 'clockworkSoldier', 'Watch Soldier'], ['flyer', 'gearFlyer', 'Flying Gear'], ['crossbow', 'towerSniper', 'Tower Sniper']],
      crypt: [['wraith', 'wraith', 'Fallen Phantom'], ['mage', 'necromancer', 'Necromancer'], ['totem', 'cryptTotem', 'Crypt Seal']],
      bridge: [['shield', 'bridgeKnight', 'Bridge Knight'], ['bomber', 'gargoyleBomber', 'Gargoyle Bomber']],
      castle: [['zombie', 'royalGuard', 'Royal Guard'], ['mage', 'royalSorcerer', 'Royal Sorcerer']],
    };
    const enemyPool = location === 'throne' ? [] : biomePools[location] ?? biomePools.prison;
    const kinds = Array.from({ length: location === 'throne' ? 0 : ENEMIES_PER_SECTOR }, (_, index) => enemyPool[index % enemyPool.length]);
    const shuffledPlatforms = [...spawnPlatforms].sort(() => Math.random() - .5).slice(0, kinds.length);
    // Compact outdoor maps can intentionally contain fewer safe ledges than the
    // global enemy target. Never create an enemy without a valid spawn surface.
    const spawnableKinds = kinds.slice(0, shuffledPlatforms.length);
    const enemies: Enemy[] = spawnableKinds.flatMap(([kind, variant, name], index): Enemy[] => {
      const platform = shuffledPlatforms[index];
      const customSize = isEarlyEnemyVariant(variant) ? earlyEnemySizes[variant] : undefined;
      const w = customSize?.w ?? (kind === 'shield' ? 44 : kind === 'totem' ? 40 : 38), h = customSize?.h ?? (kind === 'shield' ? 48 : kind === 'totem' ? 60 : 42);
      // Only true aerial archetypes ignore gravity. Their actual elevated
      // position must be checked, not the platform-level position.
      const flying = kind === 'flyer' || kind === 'wraith';
      const spawnY = flying ? platform.y - h - 100 : platform.y - h;
      const left = platform.x + 10, right = platform.x + platform.w - 10;
      const availableWidth = right - left - w;
      if (availableWidth < 0) return [];
      const candidateXs = Array.from({ length: 13 }, (_, attempt) => attempt === 0
        ? left + availableWidth / 2
        : left + Math.random() * availableWidth);
      const x = candidateXs.find((candidateX) => !solids.some((solid) => solid !== platform
        && candidateX < solid.x + solid.w
        && candidateX + w > solid.x
        && spawnY < solid.y + solid.h
        && spawnY + h > solid.y));
      // Edge platforms can meet a perimeter wall. Skip one without a full gap
      // instead of leaving its enemy embedded in that wall.
      if (x === undefined) return [];
      const royalElite = variant === 'royalGuard' || variant === 'royalSorcerer';
      const elite = kind === 'totem' ? undefined : rollEliteModifier();
      const baseHp = Math.round((kind === 'totem' ? 90 : royalElite ? 145 : kind === 'mage' ? 68 : kind === 'slime' ? 38 : 58) * enemyHealthScale);
      const hp = elite === 'armored' ? Math.round(baseHp * 1.45) : baseHp;
      const speed = variant === 'rottenPrisoner' ? 42 : variant === 'blindMiner' ? 105 : variant === 'clockworkSoldier' ? 125 : variant === 'royalGuard' ? 105 : kind === 'shield' ? 32 : kind === 'bomber' ? 28 : kind === 'slime' ? 55 : 0;
      return [{ kind, variant, name, x, y: spawnY, w, h, vx: speed * (Math.random() < .5 ? -1 : 1), vy: 0, patrolSpeed: speed, hp, maxHp: hp, left, right, homeY: spawnY, facing: 1, alert: 0, alertTimer: 0, sawPlayer: false, turnDelay: 0, hurt: 0, attack: 0, cooldown: .5 + Math.random(), blocked: 0, stunned: 0, guardTriggered: false, defeated: false, dead: false, elite, eliteCooldown: elite === 'teleporter' ? 2.2 + Math.random() * 1.8 : undefined }];
    });
    const bossLocation = location === 'swamps' || location === 'mines';
    if (bossLocation) {
      const bossRoom = exitRooms[0] || rooms[rooms.length - 1], kind: EnemyKind = 'boss';
      const bossVariant: EnemyVariant = location === 'swamps' ? 'swampGiant' : 'stoneGolem';
      const bossSize = uniqueBossSizes[bossVariant], bossHp = 500, bossY = swampLayout ? 3235 - bossSize.h : bossRoom.y + roomH - wall - bossSize.h;
      const bossName = location === 'swamps' ? 'БОЛОТНЫЙ ГИГАНТ' : 'КАМЕННЫЙ ГОЛЕМ';
      enemies.push({ kind, variant: bossVariant, name: bossName, x: bossRoom.x + roomW / 2, y: bossY, w: bossSize.w, h: bossSize.h, vx: 0, vy: 0, patrolSpeed: 72, hp: bossHp, maxHp: bossHp, left: bossRoom.x + wall + 20, right: bossRoom.x + roomW - wall - 20, homeY: bossY, facing: -1, alert: 0, alertTimer: 0, sawPlayer: false, turnDelay: 0, hurt: 0, attack: 0, cooldown: 1, blocked: 0, stunned: 0, guardTriggered: false, defeated: false, dead: false, dormant: true });
    }
    if (throneScene) {
      const bossSize = uniqueBossSizes.rightHand, bossY = startRoom.y + roomH - wall - bossSize.h;
      enemies.push({ kind: 'rightHand', variant: 'rightHand', name: "The King's Right Hand", x: startRoom.x + 650, y: bossY, w: bossSize.w, h: bossSize.h, vx: 0, vy: 0, patrolSpeed: 92, hp: Math.round(620 * enemyHealthScale), maxHp: Math.round(620 * enemyHealthScale), left: startRoom.x + wall + 190, right: startRoom.x + 900, homeY: bossY, facing: -1, alert: .65, alertTimer: .65, sawPlayer: true, turnDelay: 0, hurt: 0, attack: 0, cooldown: .8, blocked: 0, stunned: 0, guardTriggered: false, defeated: false, dead: false, dormant: false });
    }
    if (stageFourBossFight) {
      const variant: EnemyVariant = location === 'crypt' ? 'cryptWarden' : 'bridgeColossus';
      const bossSize = uniqueBossSizes[variant], bossY = bridgeLayout ? 610 - bossSize.h : arenaRoom.y + roomH - wall - bossSize.h;
      enemies.push({ kind: 'boss', variant, name: location === 'crypt' ? 'Страж Склепа' : 'Мостовой Колосс', x: arenaRoom.x + roomW - 245, y: bossY, w: bossSize.w, h: bossSize.h, vx: 0, vy: 0, patrolSpeed: 0, hp: 750, maxHp: 750, left: arenaRoom.x + wall + 45, right: arenaRoom.x + roomW - wall - 45, homeY: bossY, facing: -1, alert: 0, alertTimer: .8, sawPlayer: true, turnDelay: 0, hurt: 0, attack: 0, cooldown: 1.2, blocked: 0, stunned: 0, guardTriggered: false, defeated: false, dead: false, dormant: bridgeLayout });
    }
    const currentTrial = bossTrialRef.current;
    if (currentTrial) {
      for (let index = enemies.length - 1; index >= 0; index--) if (enemies[index].kind !== 'boss' && enemies[index].kind !== 'rightHand') enemies.splice(index, 1);
      for (const boss of enemies) {
        boss.dormant = false; boss.sawPlayer = true; boss.alert = 1;
        if (currentTrial.modifier === 'empowered') { boss.hp *= 2; boss.maxHp *= 2; boss.patrolSpeed *= 1.2; }
      }
    }
    // Keep the whole approach to the initial spawn calm. Patrol paths are
    // checked too, so an enemy cannot immediately walk into the safe area.
    for (let index = enemies.length - 1; index >= 0; index--) {
      const enemy = enemies[index];
      if (enemy.kind === 'boss' || enemy.kind === 'rightHand') continue;
      const spawnCenterX = spawnX + 17;
      const closestPatrolX = Math.max(enemy.left, Math.min(enemy.right, spawnCenterX));
      const dx = closestPatrolX - spawnCenterX;
      const dy = enemy.y + enemy.h / 2 - (spawnY + 28);
      if (Math.hypot(dx, dy) < spawnSafeRadius) enemies.splice(index, 1);
    }
    // Totems are support units: place each one beside a living regular enemy and keep that enemy's patrol nearby.
    for (const totem of enemies.filter((enemy) => enemy.kind === 'totem')) {
      const allies = enemies.filter((enemy) => enemy !== totem && enemy.kind !== 'totem' && enemy.kind !== 'boss' && enemy.kind !== 'rightHand' && !enemy.dead);
      const ally = allies.sort((a, b) => Math.hypot(a.x - totem.x, a.y - totem.y) - Math.hypot(b.x - totem.x, b.y - totem.y))[0];
      if (ally) {
        totem.x = Math.max(ally.left, Math.min(ally.right - totem.w, ally.x + ally.w + 24));
        totem.y = ally.y + ally.h - totem.h; totem.homeY = totem.y; totem.left = totem.x; totem.right = totem.x + totem.w;
        ally.left = Math.max(ally.left, totem.x - 125); ally.right = Math.min(ally.right, totem.x + totem.w + 125);
      }
    }
    // Last line of defence for procedural layouts: discard a regular enemy if
    // its final body intersects a wall or a ground unit has no floor beneath it.
    for (let index = enemies.length - 1; index >= 0; index--) {
      const enemy = enemies[index];
      if (enemy.kind === 'boss' || enemy.kind === 'rightHand') continue;
      const embedded = solids.some((solid) => enemy.x + 3 < solid.x + solid.w && enemy.x + enemy.w - 3 > solid.x
        && enemy.y + 3 < solid.y + solid.h && enemy.y + enemy.h - 3 > solid.y);
      const flying = enemy.kind === 'flyer' || enemy.kind === 'wraith';
      const supported = flying || [...terrain, ...oneWays].some((surface) => enemy.x + enemy.w / 2 >= surface.x
        && enemy.x + enemy.w / 2 <= surface.x + surface.w && Math.abs(enemy.y + enemy.h - surface.y) <= 4);
      if (embedded || !supported) enemies.splice(index, 1);
    }
    const trialBoss = currentTrial ? enemies.find((enemy) => enemy.kind === 'boss' || enemy.kind === 'rightHand') : undefined;
    const player = { x: trialBoss ? Math.max(trialBoss.left + 30, trialBoss.x - 240) : spawnX, y: trialBoss ? trialBoss.homeY + trialBoss.h - 56 : spawnY, w: 34, h: 56, vx: 0, vy: 0, facing: 1, grounded: false, jumps: 0, hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, soul: 0, focus: 0, focusBroken: false, roll: 0, rollCd: 0, attack: 0, attackMax: 0, attackDirection: 0, attackFacing: 1, attackStage: 0, attackHitDone: false, attackGear: null as Gear | null, comboNext: 0, comboExpires: 0, bounceLock: 0, bow: 0, bowMax: 0, bowFired: false, bowGear: null as Gear | null, guard: 0, guardAge: 0, parry: 0, hurt: 0, controlLock: 0, drop: 0, landSquash: 0, landSquashMax: 0, trailTimer: 0, dustTimer: 0, statuses: {} as StatusState, dead: false };
    const weaponManager = new WeaponManager();
    let weaponAnimationState: WeaponAnimationState = 'idle';
    const bossKillCount = ['swampGiant', 'stoneGolem', 'cryptWarden', 'bridgeColossus', 'rightHand'].reduce((total, id) => total + (bestiaryProgress[id] ?? 0), 0);
    const earnedTrialTier = trialRewardTier(loadBossTrialProgress().seals);
    const baseCosmetic = cosmeticForProgress(unlockedAchievements.size, bossKillCount);
    const cosmetic = earnedTrialTier >= 3
      ? { name: 'Владыка арены', cape: '#3f0b18', maskGlow: '#fbbf24', weapon: '#fb7185', trail: '#f59e0b' }
      : baseCosmetic;
    const bestGhost = runMode === 'timed' ? loadBestRunGhost() : null;
    const ghostRecording = timedGhostFrames.current;
    let ghostSampleTimer = 0;
    const castleMirrors = castleLayout ? createCastleMirrors(rooms, roomW, roomH) : [];
    const crossbowStatues = castleLayout ? createCrossbowStatues(rooms, roomW, roomH) : [];
    const throneColumns = throneScene ? createThroneColumns(startRoom.y + wall, startRoom.y + roomH - wall) : [];
    const throne = { x: startRoom.x + roomW - wall - 300, y: startRoom.y + roomH - wall - 150, w: 112, h: 150 };
    const throneGate = { x: startRoom.x + roomW - wall - 96, y: wall, w: 96, h: roomH - 24 };
    const royalArmor = { x: throne.x - 150, y: startRoom.y + roomH - wall - 74, w: 45, h: 74 };
    const checkpoint = { x: player.x, y: player.y };
    let hazardRespawn = { ...checkpoint };
    const teleportPortals = location === 'throne' || location === 'castle' ? [] : createTeleportPortals(rooms, [...terrain, ...oneWays], startRoomId, exitRooms[0]?.id, roomDistance, roomW, roomH);
    const stageTwoRewardPlatforms = location === 'swamps'
      ? swampPlatforms.filter(({ route }) => route === 'main').sort((a, b) => a.y - b.y || b.w - a.w)
      : location === 'mines'
      ? [...oneWays].sort((a, b) => a.y - b.y || b.w - a.w)
      : [];
    const powerUpPlatforms = location === 'throne' ? [] : (stageTwoRewardPlatforms.length
      ? stageTwoRewardPlatforms.slice(0, 1)
      : [...terrain, ...oneWays].sort(() => Math.random() - .5).slice(0, 1));
    const powerUps: PowerUp[] = powerUpPlatforms.map((platform) => ({ x: platform.x + 25 + Math.random() * Math.max(1, platform.w - 70), y: platform.y - 28, w: 24, h: 24, kind: 'health', collected: false, phase: Math.random() * Math.PI * 2 }));
    const lootTemplates: Gear[] = [
      { kind: 'sword', weaponId: 'steel_blade', name: 'Стальной клинок', tier: sector + 1, damage: 25 + sector * 5, cooldown: .32 },
      { kind: 'bow', equipmentId: 'hunter_bow', name: 'Охотничий лук', tier: sector + 1, damage: 19 + sector * 4, cooldown: .52 },
      { kind: 'shield', equipmentId: 'tower_shield', name: 'Башенный щит', tier: sector + 1, damage: 12 + sector * 3, cooldown: .7 },
      { kind: 'grenade', equipmentId: 'fragmentation_bomb', name: 'Осколочная бомба', tier: sector, damage: 45 + sector * 6, cooldown: 5 },
      { kind: 'freeze', equipmentId: 'ice_bomb', name: 'Ледяная бомба', tier: sector, damage: 24 + sector * 4, cooldown: 6 },
      { kind: 'trap', equipmentId: 'toothed_trap', name: 'Зубастый капкан', tier: sector, damage: 38 + sector * 5, cooldown: 8 },
    ];
    const sectorLoot = location === 'throne' ? [] : [...lootTemplates].sort(() => Math.random() - .5).slice(0, 2);
    const deadEndRewardRooms = deadEndRooms.filter((room) => !exitRoomIds.has(room.id));
    const deadEndPlatforms = deadEndRewardRooms.flatMap((room) => [...terrain, ...oneWays]
      .filter((platform) => platform.x >= room.x + wall && platform.x + platform.w <= room.x + roomW - wall && platform.y > room.y + wall && platform.y <= room.y + roomH - wall)
      .sort((a, b) => b.y - a.y)
      .slice(0, 1));
    const lootPlatforms = [...stageTwoRewardPlatforms.slice(1), ...deadEndPlatforms, ...terrain, ...oneWays]
      .filter((platform, index, all) => all.indexOf(platform) === index)
      .slice(0, sectorLoot.length);
    const loot: Loot[] = sectorLoot.map((gear, index) => ({ x: lootPlatforms[index].x + lootPlatforms[index].w / 2 - 13, y: lootPlatforms[index].y - 30, w: 26, h: 26, gear, collected: false, phase: Math.random() * Math.PI * 2, shardValue: 8 + sector * 2 }));
    const eventPlatforms = deadEndRewardRooms.flatMap((room) => [...terrain, ...oneWays].filter((platform) =>
      platform.x >= room.x + wall && platform.x + platform.w <= room.x + roomW - wall
      && platform.y > room.y + wall && platform.y <= room.y + roomH - wall
      && platform.w >= 90 && !lootPlatforms.includes(platform)))
      .sort(() => Math.random() - .5);
    const roomEvents = location === 'throne' ? [] : createRoomEvents(eventPlatforms, sector);
    dropReplacedWeapon.current = (gear) => {
      loot.push({
        x: player.x + player.w / 2 - 13,
        y: player.y + player.h - 30,
        w: 26,
        h: 26,
        gear: { ...gear },
        collected: false,
        phase: Math.random() * Math.PI * 2,
        shardValue: 0,
      });
    };
    const explorationWeapons: Gear[] = [
      { kind: 'sword', weaponId: 'ice_sword', name: 'Ледяной меч', tier: sector + 2, damage: 39 + sector * 6, cooldown: .42 },
      { kind: 'sword', weaponId: 'heavy_axe', name: 'Тяжёлый топор', tier: sector + 2, damage: 55 + sector * 7, cooldown: .68 },
      { kind: 'sword', weaponId: 'fast_daggers', name: 'Быстрые кинжалы', tier: sector + 2, damage: 27 + sector * 5, cooldown: .2 },
    ];
    const explorationRewards: ExplorationReward[] = [...(swampLevel?.rewardNodes ?? []).flatMap((platform): ExplorationReward[] => {
      // Exploration is usually worthwhile, but an occasional empty endpoint
      // keeps the side paths mysterious instead of turning them into a checklist.
      if (Math.random() >= .72) return [];
      const roll = Math.floor(Math.random() * 3);
      return [{
        x: platform.x + platform.w / 2 - 22,
        y: platform.y - 44,
        w: 44,
        h: 44,
        kind: roll === 0 ? 'goldChest' : roll === 1 ? 'weaponPedestal' : 'healthAltar',
        collected: false,
        phase: Math.random() * Math.PI * 2,
        shardValue: 28 + sector * 4,
        gear: roll === 1 ? { ...explorationWeapons[Math.floor(Math.random() * explorationWeapons.length)] } : undefined,
      }];
    }), ...(cryptLevel?.secrets ?? []).map((secret, index): ExplorationReward => ({
      x: secret.reward.x, y: secret.reward.y, w: secret.reward.w, h: secret.reward.h,
      kind: index === 1 ? 'weaponPedestal' : 'goldChest', collected: false, phase: index * 2.1,
      shardValue: secret.reward.kind === 'shardCache' ? 42 : 30 + sector * 4,
      gear: index === 1 ? { kind: 'sword', weaponId: 'forgotten_king_blade', name: 'Клинок забытого короля', tier: 7, damage: 82, cooldown: .34 } : undefined,
      lore: [
        'Фрагмент летописи: «Король запечатал нижние залы, когда камни впервые начали шептать».',
        'Фрагмент летописи: «Клинок не выбирал наследника — он запоминал каждого павшего».',
        'Фрагмент летописи: «Рыцарь уже поднимался к трону. И однажды повернул назад».',
      ][index],
    }))];
    // Interactive objects need breathing room: overlapping prompts made doors,
    // mirrors, portals and loot look like a single unusable object.
    const overlapsWithMargin = (a: Box, b: Box, margin = 54) => a.x - margin < b.x + b.w
      && a.x + a.w + margin > b.x && a.y - margin < b.y + b.h && a.y + a.h + margin > b.y;
    const entranceReserved: Box = { x: entranceDoor.x, y: entranceDoor.y, w: entranceDoor.w, h: entranceDoor.h };
    const doorReserved: Box[] = [entranceReserved, ...doors];
    const blockedMirrorPairs = new Set(castleMirrors
      .filter((mirror) => doorReserved.some((reserved) => overlapsWithMargin(mirror, reserved, 70)))
      .map((mirror) => mirror.pairId));
    for (let index = castleMirrors.length - 1; index >= 0; index--) if (blockedMirrorPairs.has(castleMirrors[index].pairId)) castleMirrors.splice(index, 1);
    const fixedInteractive: Box[] = [
      ...doorReserved,
      ...castleMirrors,
    ];
    for (let index = teleportPortals.length - 1; index >= 0; index--) {
      const portal = teleportPortals[index], portalBox = { x: portal.x - 31, y: portal.y - 72, w: 62, h: 80 };
      if (fixedInteractive.some((reserved) => overlapsWithMargin(portalBox, reserved, 58))) teleportPortals.splice(index, 1);
    }
    if (teleportPortals.length < 2) teleportPortals.splice(0);
    const reservedInteractive: Box[] = [...fixedInteractive, ...teleportPortals.map((portal) => ({ x: portal.x - 31, y: portal.y - 72, w: 62, h: 80 }))];
    const removeCrowded = <T extends Box>(items: T[], margin = 48) => {
      for (let index = items.length - 1; index >= 0; index--) {
        if (reservedInteractive.some((reserved) => overlapsWithMargin(items[index], reserved, margin))) items.splice(index, 1);
        else reservedInteractive.push(items[index]);
      }
    };
    removeCrowded(explorationRewards, 50);
    removeCrowded(roomEvents, 54);
    removeCrowded(loot, 52);
    removeCrowded(powerUps, 42);
    const keys = new Set<string>(), pressed = new Set<string>();
    const projectiles: Projectile[] = [], hazards: Hazard[] = [], shardDrops: ShardDrop[] = [], playerGhosts: ShadowDashGhost[] = [], traps: Trap[] = [], particles: Particle[] = [], gateFragments: GateFragment[] = [], explosions: Explosion[] = [], rockWarnings: RockWarning[] = [], bossWarnings: BossWarning[] = [];
    const sinkingPlatforms = swampLevel ? createSinkingPlatforms(swampPlatforms, terrain, oneWays) : [];
    const roomAt = (x: number, y: number) => rooms.find((room) => x >= room.x && x < room.x + roomW && y >= room.y && y < room.y + roomH)?.id;
    const initialMapRoom = roomAt(player.x + player.w / 2, player.y + player.h / 2) ?? startRoomId;
    const visitedMapRooms = new Set<number>([initialMapRoom]);
    const previousSnapshot = runProgress.current.mapArchive[location];
    const exploredMapAreas = [...(previousSnapshot?.exploredAreas ?? [])];
    const rememberPlayerPath = (force = false) => {
      const x = player.x + player.w / 2, y = player.y + player.h / 2;
      const lastArea = exploredMapAreas[exploredMapAreas.length - 1];
      if (force || !lastArea || Math.hypot(x - lastArea.x, y - lastArea.y) >= 105) { exploredMapAreas.push({ x, y, radius: 185 }); return true; }
      return false;
    };
    rememberPlayerPath(true);
    let lastMapRoom = initialMapRoom;
    const saveMapSnapshot = () => {
      const isExplored = (platform: Box) => exploredMapAreas.some((area) => {
        const closestX = Math.max(platform.x, Math.min(area.x, platform.x + platform.w));
        const closestY = Math.max(platform.y, Math.min(area.y, platform.y + platform.h));
        return Math.hypot(area.x - closestX, area.y - closestY) <= area.radius;
      });
      const snapshot: LocationMapSnapshot = {
        location, worldWidth: worldW, worldHeight: worldH,
        rooms: rooms.map((room) => ({ id: room.id, x: room.x, y: room.y, w: roomW, h: roomH })),
        visitedRoomIds: [...visitedMapRooms],
        exploredAreas: exploredMapAreas,
        platforms: [...terrain.filter(isExplored).map(({ x, y, w, h }) => ({ x, y, w, h, kind: 'solid' as const })), ...oneWays.filter(isExplored).map(({ x, y, w, h }) => ({ x, y, w, h, kind: 'oneWay' as const }))],
        hazards: [
          ...(swampLevel ? [{ ...swampLevel.poison, kind: 'acid' as const }] : []),
          ...(bridgeLevel?.abyssSpikes ?? []).map(({ x, y, w, h }) => ({ x, y, w, h, kind: 'spikes' as const })),
        ].filter(isExplored),
        player: { x: player.x + player.w / 2, y: player.y + player.h / 2 },
      };
      runProgress.current.mapArchive[location] = snapshot;
      if (mapOpenRef.current) setMapArchive({ ...runProgress.current.mapArchive });
    };
    saveMapSnapshot();
    const combatRooms = new Set(enemies.map((enemy) => roomAt(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2)).filter((id): id is number => id !== undefined));
    const damagedRooms = new Set<number>(), clearedRooms = new Set<number>(), spikeFallsByRoom = new Map<number, number>();
    const recentKillTimes: number[] = [];
    const showBossDeathLine = (enemy: Enemy) => {
      const line = BOSS_DEATH_LINES[enemy.variant] ?? `${enemy.name} повержен, но проклятие всё ещё живо…`;
      bossDeathLineOpen.current = true; pausedRef.current = true; setStoryMessage(`«${line}»`);
      window.setTimeout(() => {
        bossDeathLineOpen.current = false; setStoryMessage('');
        if (currentTrial) { bossTrialRef.current = null; setBossTrial(null); setStarted(false); setMainMenuScreen('trials'); pausedRef.current = false; setPaused(false); }
        else { pausedRef.current = false; setPaused(false); }
      }, 3200);
    };
    const clampCamera = (value: number, worldSize: number, viewportSize: number) => Math.max(0, Math.min(value, Math.max(0, worldSize - viewportSize)));
    let camera = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW);
    let cameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
    const enemyNearViewport = (enemy: Enemy, margin = 280) => enemy.x + enemy.w >= camera - margin
      && enemy.x <= camera + viewW + margin
      && enemy.y + enemy.h >= cameraY - margin
      && enemy.y <= cameraY + viewH + margin;
    let grenadeCd = 0, trapCd = 0, kills = 0, shards = runProgress.current.shards, last = performance.now(), gameTime = 0, hitstopUntil = 0, raf = 0, uiTimer = 0, shake = 0, flash = 0, spikeFade = 0, spikeCooldown = 0, hazardRecovery = 0, hazardTeleported = false, safeGroundTime = 0, activeDoor: Door | null = null, stageTwoArenaLocked = throneScene, stageFourArenaLocked = cryptLayout || bridgeLayout, finaleSequence = 0, finaleTimer = 0, finaleBeat = 0, throneGateOpen = false, throneGateNotice = false, servantX = startRoom.x + 70;
    let combo = EMPTY_COMBO, vampireHitCount = 0;
    const torches = Array.from({ length: 42 }, (_, i) => ({ x: 110 + i * 247 + Math.random() * 90, y: 145 + Math.random() * (worldH - 260), phase: Math.random() * Math.PI * 2 }));
    const chains = [...terrain, ...oneWays].filter(() => Math.random() > .72).map((tile) => ({ x: tile.x + 22 + Math.random() * Math.max(10, tile.w - 44), y: tile.y + tile.h, length: 45 + Math.random() * 105 }));
    for (const room of rooms) if (room.connections.has(room.id + ROOM_COLS)) chains.push({ x: room.x + roomW / 2, y: room.y + roomH - wall - 300, length: 345 });

    const overlap = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const lockStageTwoArena = () => {
      if (!stageTwoBossRoom || stageTwoArenaLocked) return;
      const roomCenterX = stageTwoBossRoom.x + roomW / 2;
      const roomCenterY = stageTwoBossRoom.y + roomH / 2;
      for (const gate of stageTwoArenaGates) {
        if (overlap(player, gate)) {
          if (gate.h >= gate.w) {
            player.x = roomCenterX >= gate.x + gate.w / 2 ? gate.x + gate.w : gate.x - player.w;
            player.vx = 0;
          } else {
            player.y = roomCenterY >= gate.y + gate.h / 2 ? gate.y + gate.h : gate.y - player.h;
            player.vy = 0;
          }
          player.controlLock = Math.max(player.controlLock, .1);
        }
        if (!solids.includes(gate)) solids.push(gate);
        if (!projectileBlockers.includes(gate)) projectileBlockers.push(gate);
      }
      stageTwoArenaLocked = true;
    };
    const resolveEnemyWalls = (enemy: Enemy) => {
      for (const wall of solids) if (overlap(enemy, wall)) {
        const enemyCenter = enemy.x + enemy.w / 2, wallCenter = wall.x + wall.w / 2;
        enemy.x = enemyCenter < wallCenter ? wall.x - enemy.w : wall.x + wall.w;
        enemy.vx = enemyCenter < wallCenter ? -Math.abs(enemy.patrolSpeed) : Math.abs(enemy.patrolSpeed);
      }
    };
    const isFlyingEnemy = (enemy: Enemy) => enemy.kind === 'flyer' || enemy.kind === 'wraith';
    const applyEnemyGravity = (enemy: Enemy, dt: number) => {
      if (isFlyingEnemy(enemy)) return;
      // Knockback also affects stationary enemies. Keep every ground enemy over
      // its spawn surface so it cannot be pushed off a map edge.
      const patrolRight = Math.max(enemy.left, enemy.right - enemy.w);
      enemy.x = Math.max(enemy.left, Math.min(enemy.x, patrolRight));
      const oldBottom = enemy.y + enemy.h;
      enemy.vy = Math.min(760, enemy.vy + 1450 * dt); enemy.y += enemy.vy * dt;
      if (enemy.vy < 0) return;
      const landing = [...solids, ...oneWays].filter((tile) => enemy.x + enemy.w > tile.x && enemy.x < tile.x + tile.w && oldBottom <= tile.y + 2 && enemy.y + enemy.h >= tile.y).sort((a, b) => a.y - b.y)[0];
      if (landing) { enemy.y = landing.y - enemy.h; enemy.vy = 0; enemy.homeY = enemy.y; }
    };
    const hasLineOfSight = (x1: number, y1: number, x2: number, y2: number) => !solids.some((block) => {
      const dx = x2 - x1, dy = y2 - y1;
      let entry = 0, exit = 1;
      for (const [origin, delta, min, max] of [[x1, dx, block.x, block.x + block.w], [y1, dy, block.y, block.y + block.h]] as const) {
        if (Math.abs(delta) < .0001) {
          if (origin <= min || origin >= max) return false;
          continue;
        }
        const near = Math.min((min - origin) / delta, (max - origin) / delta);
        const far = Math.max((min - origin) / delta, (max - origin) / delta);
        entry = Math.max(entry, near); exit = Math.min(exit, far);
        if (entry >= exit) return false;
      }
      return entry < 1 && exit > 0;
    });
    const gearSlot = (gear: Gear) => {
      const slots = weaponSlots(gear);
      return slots.find((slot) => runProgress.current.loadout[slot].kind === 'empty') ?? slots[0];
    };
    const tap = (...codes: string[]) => codes.some((code) => pressed.has(code));
    const burst = (x: number, y: number, color: string, count = 9) => {
      for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 260, vy: (Math.random() - .7) * 220, life: .25 + Math.random() * .35, color, size: 2 + Math.random() * 5 });
    };
    const shatterStoneWall = (stoneWall: Box) => {
      const columns = Math.max(6, Math.ceil(stoneWall.w / 16)), rows = 18;
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        const life = 1.15 + Math.random() * .85;
        particles.push({
          x: stoneWall.x + (column + .5) * stoneWall.w / columns,
          y: stoneWall.y + (row + .5) * stoneWall.h / rows,
          vx: (Math.random() - .5) * 420,
          vy: -100 - Math.random() * 310 + row * 8,
          life, maxLife: life,
          color: Math.random() < .45 ? '#8a8178' : Math.random() < .7 ? '#5f5b57' : '#b0a69b',
          size: 5 + Math.random() * 9,
          shape: 'square',
        });
      }
    };
    const dustCloud = (x: number, y: number, force: number, split = false) => {
      const count = Math.round(7 + force * 8);
      for (let i = 0; i < count; i++) {
        const side = split ? (i % 2 ? 1 : -1) : (Math.random() - .5) * .7;
        particles.push({ x: x + (Math.random() - .5) * 18, y: y - Math.random() * 4, vx: side * (45 + Math.random() * 150) * force, vy: -25 - Math.random() * 105 * force, life: .28 + Math.random() * .28, color: 'rgba(248,250,252,.68)', size: 3 + Math.random() * 6 });
      }
    };
    const shadowDashBurst = (direction: number) => {
      const originX = player.x + player.w / 2 - direction * 13;
      const originY = player.y + player.h - 5;
      for (let i = 0; i < 14; i++) {
        const life = .22 + Math.random() * .18;
        particles.push({ x: originX, y: originY - Math.random() * 10, vx: -direction * (90 + Math.random() * 230), vy: -35 - Math.random() * 125, life, maxLife: life, color: i % 3 ? cosmetic.trail : '#ffffff', size: 5 + Math.random() * 9, shape: 'smoke' });
      }
      for (let i = 0; i < 10; i++) {
        const life = .18 + Math.random() * .16;
        particles.push({ x: originX, y: originY - Math.random() * 24, vx: -direction * (190 + Math.random() * 310), vy: (Math.random() - .7) * 190, life, maxLife: life, color: i % 2 ? '#f8fafc' : '#aeb4bf', size: 3 + Math.random() * 7, shape: 'shard', rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * 18 });
      }
    };
    const breakPrisonGate = (gate: PrisonGate, direction: number) => {
      gate.opened = true;
      const solidIndex = solids.indexOf(gate); if (solidIndex >= 0) solids.splice(solidIndex, 1);
      const blockerIndex = projectileBlockers.indexOf(gate); if (blockerIndex >= 0) projectileBlockers.splice(blockerIndex, 1);
      gateFragments.push(...createGateFragments(gate, direction));
      burst(gate.x + gate.w / 2, gate.y + gate.h / 2, '#a9c1b8', 22);
      shake = Math.max(shake, 11); flash = Math.max(flash, .07);
      playArmorBreak();
    };
    const playArmorBreak = () => {
      try {
        const audio = new AudioContext(), now = audio.currentTime;
        [210, 143, 87].forEach((frequency, index) => { const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.type = index === 0 ? 'square' : 'sawtooth'; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(45, now + .32 + index * .06); gain.gain.setValueAtTime(.07 * settingsRef.current.effectsVolume / 100, now + index * .035); gain.gain.exponentialRampToValueAtTime(.001, now + .38); oscillator.connect(gain).connect(audio.destination); oscillator.start(now + index * .035); oscillator.stop(now + .42); });
      } catch { /* Звук может быть заблокирован настройками браузера. */ }
    };
    const playMaskCrack = () => {
      try {
        const audio = new AudioContext(), now = audio.currentTime;
        [320, 210, 135].forEach((frequency, index) => {
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          oscillator.type = 'square'; oscillator.frequency.setValueAtTime(frequency, now + index * .025);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * .45, now + .13);
          gain.gain.setValueAtTime(.045 * settingsRef.current.effectsVolume / 100, now + index * .025); gain.gain.exponentialRampToValueAtTime(.001, now + .16);
          oscillator.connect(gain).connect(audio.destination); oscillator.start(now + index * .025); oscillator.stop(now + .18);
        });
      } catch { /* Звук может быть отключён браузером. */ }
    };
    const playHeartbeat = () => {
      try { const audio = new AudioContext(), now = audio.currentTime; for (let beat = 0; beat < 8; beat++) for (const offset of [0, .18]) { const oscillator = audio.createOscillator(), gain = audio.createGain(), time = now + beat * 1.05 + offset; oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(62, time); oscillator.frequency.exponentialRampToValueAtTime(38, time + .16); gain.gain.setValueAtTime(.001, time); gain.gain.linearRampToValueAtTime(.12, time + .025); gain.gain.exponentialRampToValueAtTime(.001, time + .25); oscillator.connect(gain).connect(audio.destination); oscillator.start(time); oscillator.stop(time + .28); } } catch { /* Без звука при запрете autoplay. */ }
    };
    const protectedByTotem = (enemy: Enemy) => enemy.kind !== 'totem' && enemies.some((totem) => {
      if (totem.dead || totem.kind !== 'totem') return false;
      const dx = enemy.x + enemy.w / 2 - (totem.x + totem.w / 2), dy = enemy.y + enemy.h / 2 - (totem.y + totem.h / 2);
      return totem.variant === 'swampTotem' && dx * dx + dy * dy <= 150 * 150;
    });
    const statusConfig: Record<StatusKind, { duration: number; interval: number; color: string; symbol: string }> = {
      burning: { duration: 4.5, interval: .7, color: '#fb6a32', symbol: '▲' },
      poisoned: { duration: 6, interval: 1, color: '#a3e635', symbol: '●' },
      electrified: { duration: 2.4, interval: .6, color: '#60e7ff', symbol: 'ϟ' },
      bleeding: { duration: 4.2, interval: .65, color: '#fb7185', symbol: '◆' },
    };
    const applyStatus = (target: { statuses?: StatusState }, kind: StatusKind, stacks = 1) => {
      const current = target.statuses?.[kind], config = statusConfig[kind];
      target.statuses ??= {};
      target.statuses[kind] = { life: Math.max(current?.life ?? 0, config.duration), tick: Math.min(current?.tick ?? config.interval, config.interval), stacks: Math.min(3, (current?.stacks ?? 0) + stacks), maskProgress: current?.maskProgress ?? 0 };
    };
    const damageEnemy = (enemy: Enemy, damage: number, direction: number, sourceX: number, grantsSoul = false, bypassGuard = false) => {
      if (enemy.dead || enemy.dormant || enemy.hurt > 0) return;
      const isBoss = enemy.kind === 'boss' || enemy.kind === 'rightHand';
      const wasFrozen = (enemy.frozen ?? 0) > 0;
      enemy.frozen = 0;
      if (protectedByTotem(enemy)) { enemy.blocked = .22; shake = 2; burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#67e8f9', 7); return; }
      const sourceInFront = enemy.facing > 0 ? sourceX > enemy.x + enemy.w / 2 : sourceX < enemy.x + enemy.w / 2;
      if (enemy.kind === 'shield' && enemy.stunned <= 0 && sourceInFront && !bypassGuard) { enemy.blocked = .22; shake = 2; burst(enemy.x + enemy.w / 2 + enemy.facing * 18, enemy.y + 22, '#fde68a', 5); return; }
      if (enemy.variant === 'royalGuard' && sourceInFront && !bypassGuard) { damage *= .5; enemy.guardTriggered = true; }
      const berserkerBonus = runProgress.current.relics.includes('berserker_sigil') && player.hp <= player.maxHp / 2 ? 1.35 : 1;
      enemy.hp -= damage * runProgress.current.damage * berserkerBonus * eliteDamageMultiplier(enemy.elite);
      enemy.hurt = isBoss ? BOSS_HIT_INVULNERABILITY : .16;
      enemy.x += direction * 18 * (isBoss ? BOSS_KNOCKBACK_MULTIPLIER : 1);
      // Ordinary enemies flinch on every hit. Bosses keep winding up, so holding
      // the attack button cannot permanently cancel all of their attacks.
      if (!isBoss) enemy.stunned = Math.max(enemy.stunned, .08);
      shake = Math.max(shake, damage >= 35 ? 8 : 5);
      if ((enemy.kind === 'boss' || enemy.kind === 'rightHand') && !enemy.phaseTwo && enemy.hp > 0 && enemy.hp <= enemy.maxHp * .5) {
        enemy.phaseTwo = true; enemy.phaseTransition = 1.35; enemy.cooldown = 0; enemy.attack = 0; enemy.stunned = 1.05;
        flash = .42; shake = 22; burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#fb7185', 52);
        setStoryMessage(`ВТОРАЯ ФАЗА — ${enemy.name}`);
        window.setTimeout(() => setStoryMessage(''), 1500);
      }
      playCombatHit(settingsRef.current.effectsVolume, damage >= 35 || enemy.kind === 'boss' || enemy.kind === 'rightHand');
      hitstopUntil = Math.max(hitstopUntil, performance.now() + (damage >= 35 ? 48 : 28));
      combo = comboForHits(combo.hits + 1, performance.now());
      setCombatCombo(combo);
      if (runProgress.current.relics.includes('vampire_fang')) {
        vampireHitCount++;
        if (vampireHitCount % 10 === 0) { if (player.hp < player.maxHp) { player.hp++; runProgress.current.hp = player.hp; } if (runProgress.current.relics.includes('soul_lantern')) { player.soul = 100; setSoulHud(100); } burst(player.x + player.w / 2, player.y + 20, '#fb7185', 20); }
      }
      burst(enemy.x + enemy.w / 2, enemy.y + 18, '#ffffff', 9); burst(enemy.x + enemy.w / 2, enemy.y + 18, '#fbbf24', 18);
      if (grantsSoul) { player.soul = Math.min(100, player.soul + (runProgress.current.relics.includes('soul_lantern') ? 16.5 : 11)); setSoulHud(player.soul); if (player.soul >= 100) unlockAchievement('full_tank'); }
      if (enemy.hp <= 0) {
        if (enemy.kind === 'rightHand' && !enemy.defeated) {
          enemy.hp = 0; enemy.defeated = true; enemy.vx = 0; enemy.attack = 0; setStoryMessage('«Ты всё так же хорош, как всегда...»');
          hitstopUntil = performance.now() + 380; flash = .28;
          window.setTimeout(() => {
            enemy.dead = true; stageTwoArenaLocked = false; throneGateOpen = true; setStoryMessage('');
            runStats.current.bossesDefeated++;
            setBestiaryProgress(recordBestiaryKill(enemy.variant));
            shake = 18;
            if (currentTrial) { const reward = recordBossTrialClear(currentTrial, runElapsed.current); setBossTrialProgress(reward.progress); setTrialRewardMessage(`Победа! Получено печатей: +${reward.earned}`); bossTrialRef.current = null; setBossTrial(null); setStarted(false); setMainMenuScreen('trials'); pausedRef.current = false; setPaused(false); return; }
            if (throneArenaGate) shatterStoneWall(throneArenaGate);
            shatterStoneWall(throneGate);
            for (const gate of stageTwoArenaGates) { const solidIndex = solids.indexOf(gate); if (solidIndex >= 0) solids.splice(solidIndex, 1); const blockerIndex = projectileBlockers.indexOf(gate); if (blockerIndex >= 0) projectileBlockers.splice(blockerIndex, 1); }
          }, 2800); return;
        }
        if (enemy.kind === 'totem') {
          const livingLinked = enemies.some((other) => other !== enemy && !other.dead && (enemy.variant === 'cryptTotem' || Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 150));
          if (livingLinked) unlockAchievement('dead_silence');
        }
        if (enemy.variant === 'royalGuard' && !enemy.guardTriggered) unlockAchievement('guard_storm');
        if (enemy.variant === 'wraith') { burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#74b9ff', 32); burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#d9f0ff', 12); }
        const defeatedBoss = enemy.kind === 'boss' || enemy.kind === 'rightHand';
        enemy.dead = true; kills++;
        runStats.current.kills++;
        setBestiaryProgress(recordBestiaryKill(enemy.variant));
        if (defeatedBoss) { runStats.current.bossesDefeated++; hitstopUntil = performance.now() + 380; flash = .28; showBossDeathLine(enemy); }
        if (defeatedBoss && currentTrial) {
          const reward = recordBossTrialClear(currentTrial, runElapsed.current); setBossTrialProgress(reward.progress); setTrialRewardMessage(`Победа! Получено печатей: +${reward.earned}`);
          window.setTimeout(() => { bossTrialRef.current = null; setBossTrial(null); setStarted(false); setMainMenuScreen('trials'); pausedRef.current = false; setPaused(false); }, 900);
        }
        const bloodInterval = runProgress.current.relics.includes('berserker_sigil') && player.hp <= player.maxHp / 2 ? 6 : 8;
        if (runProgress.current.relics.includes('blood_charm') && runStats.current.kills % bloodInterval === 0 && player.hp < player.maxHp) {
          player.hp++; runProgress.current.hp = player.hp; burst(player.x + player.w / 2, player.y + 20, '#fb7185', 18);
        }
        if (enemy.variant === 'cryptWarden' || enemy.variant === 'bridgeColossus' || (stageTwoBossFight && enemy.kind === 'boss')) {
          const gates = stageTwoBossFight ? stageTwoArenaGates : arenaGates;
          for (const gate of gates) { const solidIndex = solids.indexOf(gate); if (solidIndex >= 0) solids.splice(solidIndex, 1); const blockerIndex = projectileBlockers.indexOf(gate); if (blockerIndex >= 0) projectileBlockers.splice(blockerIndex, 1); }
          if (stageTwoBossFight) stageTwoArenaLocked = false;
          else stageFourArenaLocked = false;
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.variant === 'cryptWarden' ? '#c084fc' : '#cbd5e1', 42); shake = 20;
        }
        const killTime = performance.now(); recentKillTimes.push(killTime); while (recentKillTimes.length && killTime - recentKillTimes[0] > 5000) recentKillTimes.shift();
        if (recentKillTimes.length >= 3) unlockAchievement('steel_whirl');
        if (combo.rank === 'S' && runProgress.current.relics.includes('executioner_chain')) { combo = { ...combo, expiresAt: combo.expiresAt + 2500 }; setCombatCombo(combo); }
        const crystalWinter = wasFrozen && runProgress.current.relics.includes('shard_heart') && runProgress.current.relics.includes('frost_shard');
        const dropCount = crystalWinter ? 9 : runProgress.current.relics.includes('shard_heart') ? 6 : 3;
        const comboReward = Math.max(1, Math.round(combo.multiplier));
        for (let drop = 0; drop < dropCount; drop++) shardDrops.push({ x: enemy.x + enemy.w / 2 - 4, y: enemy.y + enemy.h / 2, w: 9, h: 9, vx: (drop - (dropCount - 1) / 2) * 48, vy: -210 - Math.random() * 90, value: comboReward, life: 12 });
        if (enemy.variant === 'marshSlime') hazards.push({ x: enemy.x - 18, y: enemy.y + enemy.h - 8, w: enemy.w + 36, h: 12, life: 3, tick: 0, kind: 'poison', delay: 1 });
        if (enemy.elite === 'explosive') {
          const blastX = enemy.x + enemy.w / 2, blastY = enemy.y + enemy.h / 2;
          const dx = player.x + player.w / 2 - blastX, dy = player.y + player.h / 2 - blastY;
          if (dx * dx + dy * dy < 145 * 145) damagePlayer(24, blastX, undefined, 1, true);
          explosions.push({ x: blastX, y: blastY, life: .55, maxLife: .55, radius: 145, kind: 'fire' });
          burst(blastX, blastY, '#fb923c', 34); shake = Math.max(shake, 14);
        }
        if (wasFrozen && runProgress.current.relics.includes('frost_shard')) {
          const blastX = enemy.x + enemy.w / 2, blastY = enemy.y + enemy.h / 2;
          explosions.push({ x: blastX, y: blastY, life: .5, maxLife: .5, radius: 125, kind: 'freeze' });
          burst(blastX, blastY, '#a5f3fc', 30);
          enemies.forEach((other) => { const dx = other.x + other.w / 2 - blastX, dy = other.y + other.h / 2 - blastY; if (!other.dead && dx * dx + dy * dy < 125 * 125) damageEnemy(other, 28, Math.sign(dx) || 1, blastX); });
        }
        for (let i = 0; i < 12; i++) particles.push({ x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2, vx: (Math.random() - .5) * 210, vy: -70 - Math.random() * 150, life: .7 + Math.random() * .45, color: i % 2 ? '#ef445d' : '#4ea8de', size: 3 + Math.random() * 4 });
      }
    };
    const damageCrossbowStatue = (statue: typeof crossbowStatues[number], damage: number) => {
      if (statue.dead || statue.hurt > 0) return false;
      statue.hp -= damage * runProgress.current.damage;
      statue.hurt = .14;
      shake = Math.max(shake, 4);
      burst(statue.x + statue.w / 2, statue.y + statue.h / 2, '#fbbf24', 10);
      burst(statue.x + statue.w / 2, statue.y + statue.h / 2, '#a59ca5', 8);
      playCombatHit(settingsRef.current.effectsVolume, damage >= 35);
      if (statue.hp <= 0) {
        statue.hp = 0; statue.dead = true;
        shake = Math.max(shake, 10);
        burst(statue.x + statue.w / 2, statue.y + statue.h / 2, '#756f78', 28);
        burst(statue.x + statue.w / 2, statue.y + statue.h / 2, '#fde68a', 12);
      }
      return true;
    };
    const performSwordHit = (gear: Gear) => {
      const melee = meleeConfig(gear.weaponId);
      const attackStep = melee.attacks[player.attackStage];
      const finisher = player.attackStage === melee.attacks.length - 1;
      const counterReady = player.parry >= 100;
      const up = keys.has(settingsRef.current.bindings.up);
      const down = !player.grounded && keys.has(settingsRef.current.bindings.down);
      const evolutionScale = gear.branch === 'brutal' && finisher ? 1.35 : 1;
      const range = 62 * attackStep.hitboxScale * evolutionScale;
      const hit: Box = down
        ? { x: player.x - 12, y: player.y + player.h - 3, w: player.w + 24, h: 68 * attackStep.hitboxScale }
        : up
        ? { x: player.x - 12, y: player.y - 65 * attackStep.hitboxScale, w: player.w + 24, h: 68 * attackStep.hitboxScale }
        : { x: player.attackFacing > 0 ? player.x + player.w : player.x - range, y: player.y + 4, w: range, h: 48 };
      let hitEnemy = false;
      const strikeDamage = gear.damage * attackStep.damageMultiplier * (attackStep.criticalMultiplier ?? 1) * (counterReady ? 3 : 1);
      enemies.forEach((enemy) => { if (!enemy.dead && overlap(hit, enemyHurtbox(enemy))) { hitEnemy = true; const direction = up || down ? Math.sign(enemy.x - player.x) || player.attackFacing : player.attackFacing; const bossTarget = enemy.kind === 'boss' || enemy.kind === 'rightHand'; const execute = gear.branch === 'brutal' && finisher && enemy.hp <= enemy.maxHp * .25; damageEnemy(enemy, execute ? Math.max(strikeDamage, enemy.hp + 1) : strikeDamage, direction, player.x + player.w / 2, true, counterReady || execute); if (gear.branch === 'swift') applyStatus(enemy, 'electrified', finisher ? 2 : 1); if (gear.branch === 'brutal' && finisher && !enemy.dead) applyStatus(enemy, 'bleeding', 2); if (attackStep.freezeSeconds) enemy.frozen = Math.max(enemy.frozen ?? 0, scaledFreezeDuration(attackStep.freezeSeconds, bossTarget)); enemy.x += direction * Math.max(0, attackStep.knockback - 250) * .06 * (bossTarget ? BOSS_KNOCKBACK_MULTIPLIER : 1); } });
      crossbowStatues.forEach((statue) => { if (!statue.dead && overlap(hit, statue)) { hitEnemy = damageCrossbowStatue(statue, strikeDamage) || hitEnemy; } });
      if (counterReady && hitEnemy) { player.parry = 0; shake = 12; flash = .12; burst(player.x + player.w / 2, player.y + 20, '#fde68a', 26); }
      if (down && hitEnemy) {
        player.vy = -DOWN_STRIKE_BOUNCE_SPEED; player.grounded = false; player.bounceLock = .5;
        burst(player.x + player.w / 2, player.y + player.h + 8, '#f8e9b0', 10);
      }
      for (const secret of cryptLevel?.secrets ?? []) if (!secret.broken && overlap(hit, secret.wall)) {
        secret.broken = true; hitEnemy = true; shake = Math.max(shake, 9);
        const solidIndex = solids.indexOf(secret.wall); if (solidIndex >= 0) solids.splice(solidIndex, 1);
        const blockerIndex = projectileBlockers.indexOf(secret.wall); if (blockerIndex >= 0) projectileBlockers.splice(blockerIndex, 1);
        burst(secret.wall.x + secret.wall.w / 2, secret.wall.y + secret.wall.h / 2, '#49648f', 28);
      }
      projectiles.forEach((projectile) => {
        if (!overlap(hit, projectile)) return;
        if (projectile.kind === 'enemyBomb') { projectile.vx = player.facing * 600; projectile.vy = -80; projectile.life = Math.max(projectile.life, .8); projectile.reflected = true; burst(projectile.x, projectile.y, '#fde68a', 8); }
        if (projectile.kind === 'magicOrb') { projectile.life = 0; burst(projectile.x, projectile.y, '#c084fc', 12); }
      });
      if (hitEnemy) flash = Math.max(flash, .035);
    };
    const attackSword = (gear: Gear) => {
      if (player.attack > 0 || player.dead) return;
      const config = meleeConfig(gear.weaponId);
      if (gameTime > player.comboExpires) player.comboNext = 0;
      player.attackStage = player.comboNext;
      player.comboNext = (player.comboNext + 1) % config.attacks.length;
      const attackStep = config.attacks[player.attackStage];
      player.attack = attackDuration(attackStep);
      player.comboExpires = gameTime + player.attack + config.comboResetWindow;
      player.attackMax = player.attack;
      player.attackHitDone = false;
      player.attackGear = gear;
      player.attackFacing = player.facing;
      const up = keys.has(settingsRef.current.bindings.up);
      const down = !player.grounded && keys.has(settingsRef.current.bindings.down);
      player.attackDirection = down ? 1 : up ? -1 : 0;
    };
    const fireBow = (gear: Gear) => {
      const config = equipmentConfig(gear.equipmentId, 'bow');
      if (config.kind !== 'bow') return;
      const arrowX = player.x + (player.facing > 0 ? 32 : -12);
      const hunterVerdict = runProgress.current.relics.includes('hunter_eye') && runProgress.current.relics.includes('executioner_chain') ? 1.25 : 1;
      for (let shot = 0; shot < config.shots; shot++) {
        const offset = shot - (config.shots - 1) / 2;
        projectiles.push({ x: arrowX, y: player.y + 22 + offset * 4, w: 18, h: 4, vx: player.facing * config.projectileSpeed, vy: offset * config.spread * config.projectileSpeed, life: 1.5, damage: gear.damage * config.damageMultiplier * hunterVerdict, kind: 'arrow', originX: arrowX, branch: gear.branch, pierces: gear.branch === 'sniper' ? 1 : 0 });
      }
    };
    const shoot = (gear: Gear) => {
      if (player.bow > 0 || player.dead) return;
      const config = equipmentConfig(gear.equipmentId, 'bow');
      if (config.kind !== 'bow') return;
      player.bow = config.charge + config.recovery;
      player.bowMax = player.bow;
      player.bowFired = false;
      player.bowGear = gear;
    };
    const grenade = (gear: Gear, slot: number) => {
      const remaining = slot === 2 ? grenadeCd : trapCd;
      if (remaining > 0 || player.dead) { if (remaining > 0) showCombatNotice(`Перезарядка: ${remaining.toFixed(1)} с`, 'cooldown', 650); return; }
      if (slot === 2) grenadeCd = gear.cooldown; else trapCd = gear.cooldown;
      const config = equipmentConfig(gear.equipmentId, gear.kind);
      if (config.kind !== 'grenade' && config.kind !== 'freeze') return;
      projectiles.push({ x: player.x + 12, y: player.y + 12, w: 14, h: 14, vx: player.facing * config.projectileSpeed, vy: -90, life: .95 + config.windup, damage: gear.damage * config.damageMultiplier, kind: gear.kind === 'freeze' ? 'freeze' : 'grenade', blastRadius: config.blastRadius, freezeSeconds: config.freezeSeconds, branch: gear.branch });
    };
    const placeTrap = (gear: Gear, slot: number) => {
      const remaining = slot === 2 ? grenadeCd : trapCd;
      if (remaining > 0 || player.dead) { if (remaining > 0) showCombatNotice(`Перезарядка: ${remaining.toFixed(1)} с`, 'cooldown', 650); return; }
      if (slot === 2) grenadeCd = gear.cooldown; else trapCd = gear.cooldown;
      const config = equipmentConfig(gear.equipmentId, 'trap');
      if (config.kind !== 'trap') return;
      traps.push({ x: player.x - (config.width - player.w) / 2, y: player.y + player.h - 10, w: config.width, h: 12, life: config.lifetime, damage: gear.damage * config.damageMultiplier, triggered: false });
    };
    const useSelectedGear = () => {
      if (player.focus > 0) return;
      const slot = selectedSlot.current, gear = runProgress.current.loadout[slot];
      if (gear.kind === 'sword') attackSword(gear);
      else if (gear.kind === 'bow') shoot(gear);
      else if (gear.kind === 'shield') return;
      else if (gear.kind === 'trap') placeTrap(gear, slot);
      else if (gear.kind === 'grenade' || gear.kind === 'freeze') grenade(gear, slot);
    };
    const damagePlayer = (_damage: number, sourceX: number, meleeAttacker?: Enemy, forcedMaskDamage?: number, ignoreGuard = false, bypassInvulnerability = false) => {
      if (godModeRef.current || (!bypassInvulnerability && (player.roll > 0 || player.hurt > 0)) || player.dead) return;
      if (ironOathReady.current && runProgress.current.relics.includes('iron_oath')) { ironOathReady.current = false; if (runProgress.current.relics.includes('blood_charm') && player.hp < player.maxHp) { player.hp++; runProgress.current.hp = player.hp; } shake = 5; burst(player.x + player.w / 2, player.y + 24, '#93c5fd', 18); return; }
      if (player.focus > 0) { player.focus = 0; player.focusBroken = true; burst(player.x + player.w / 2, player.y + 20, '#d7f7ef', 8); }
      const attackInFront = player.facing > 0 ? sourceX > player.x : sourceX < player.x + player.w;
      if (!ignoreGuard && player.guard > 0 && attackInFront) {
        const heldShield = runProgress.current.loadout[selectedSlot.current];
        const shieldConfig = equipmentConfig(heldShield.equipmentId, 'shield');
        const perfectWindow = shieldConfig.kind === 'shield' ? shieldConfig.perfectBlockWindow : .2;
        const parryGain = shieldConfig.kind === 'shield' ? shieldConfig.parryGain : 34;
        if (player.guardAge <= perfectWindow) {
          player.parry = Math.min(100, player.parry + (meleeAttacker ? parryGain : parryGain * .6));
          if (meleeAttacker) { meleeAttacker.stunned = 1.15; meleeAttacker.attack = 0; meleeAttacker.vx = 0; if (meleeAttacker.variant === 'clockworkSoldier' || meleeAttacker.variant === 'gearFlyer') applyStatus(meleeAttacker, 'electrified', 2); }
          if (heldShield.branch === 'reprisal' && meleeAttacker) { damageEnemy(meleeAttacker, heldShield.damage * 1.5, -meleeAttacker.facing, player.x + player.w / 2, false, true); burst(meleeAttacker.x + meleeAttacker.w / 2, meleeAttacker.y + 20, '#fde68a', 18); }
          if (runProgress.current.relics.includes('mirror_shield') && runProgress.current.relics.includes('wind_feather')) player.rollCd = 0;
          showCombatNotice(player.parry >= 100 ? 'Идеальный блок — контрудар готов!' : 'Идеальный блок', 'parry');
          shake = 5; burst(player.x + player.w / 2 + player.facing * 20, player.y + 24, '#fff7ae', 14); return;
        }
        shake = 3; burst(player.x + player.w / 2 + player.facing * 18, player.y + 24, '#fde68a', 7);
        if (heldShield.branch === 'bastion') { player.parry = Math.min(100, player.parry + 8); return; }
      }
      const maskDamage = forcedMaskDamage ?? (meleeAttacker?.kind === 'boss' || meleeAttacker?.kind === 'rightHand' ? 2 : 1);
      const damagedRoom = roomAt(player.x + player.w / 2, player.y + player.h / 2); if (damagedRoom !== undefined) damagedRooms.add(damagedRoom);
      const playerCenterX = player.x + player.w / 2;
      const knockbackDirection = playerCenterX < sourceX ? -1 : playerCenterX > sourceX ? 1 : -player.facing;
      player.hp = Math.max(0, player.hp - maskDamage); runProgress.current.hp = player.hp;
      if (meleeAttacker?.elite === 'vampire' && !meleeAttacker.dead) {
        const healing = Math.max(8, Math.round(meleeAttacker.maxHp * .18));
        meleeAttacker.hp = Math.min(meleeAttacker.maxHp, meleeAttacker.hp + healing);
        burst(meleeAttacker.x + meleeAttacker.w / 2, meleeAttacker.y + 12, '#fb7185', 12);
      }
      runStats.current.damageTaken += maskDamage;
      combo = EMPTY_COMBO; setCombatCombo(EMPTY_COMBO);
      player.hurt = PLAYER_HIT_INVULNERABILITY; player.controlLock = .15; player.vx = knockbackDirection * (meleeAttacker?.variant === 'bridgeKnight' ? 390 : 315); player.vy = -305; player.grounded = false;
      hitstopUntil = performance.now() + 50;
      setMaskHitPulse((value) => value + 1); playMaskCrack();
      shake = 9; flash = .15; burst(player.x + 17, player.y + 25, '#7f1d1d', 18); burst(player.x + 17, player.y + 25, '#1f1723', 10);
      if (player.hp <= 0) {
        player.hp = 0; player.soul = 0; setSoulHud(0); player.dead = true; player.vy = -380;
        const cause = meleeAttacker?.name || (ignoreGuard ? 'опасность окружения' : 'дальний удар');
        runStats.current.deathCause = cause; setDeathQuote(DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)]);
        setDeathSummary({ ...runStats.current, seconds: Math.floor(runElapsed.current), shards, location, sector, relics: [...runProgress.current.relics] });
        if (runMode !== 'checkpoint' && !legacyAwarded.current) { legacyAwarded.current = true; setLegacyProgress((current) => ({ ...current, embers: current.embers + legacyReward(runStats.current.kills, runStats.current.bossesDefeated) })); }
        setDeathScreen('stats');
        setDeathAdvice(''); setDeathAdviceLoading(true);
        void requestDeathAdvice(summarizeRun(cause)).then(setDeathAdvice).finally(() => setDeathAdviceLoading(false));
        if (runMode === 'oneLife' && activeSaveSlot !== null) {
          setSaveSlots((current) => { const next = [...current]; next[activeSaveSlot] = null; localStorage.setItem('ashfall-save-slots', JSON.stringify(next)); return next; });
          localStorage.removeItem('ashfall-autosave'); setAutosave(null);
        }
        burst(player.x + 17, player.y + 25, '#3f4145', 24); burst(player.x + 17, player.y + 25, '#a47b32', 14); burst(player.x + 17, player.y + 18, '#7f1d1d', 6); playArmorBreak();
      }
    };
    const updateEnemyStatuses = (enemy: Enemy, dt: number) => {
      for (const kind of Object.keys(enemy.statuses ?? {}) as StatusKind[]) {
        const effect = enemy.statuses?.[kind]; if (!effect) continue;
        effect.life -= dt; effect.tick -= dt;
        if (kind === 'electrified') enemy.stunned = Math.max(enemy.stunned, .08);
        if (effect.tick <= 0 && !enemy.dead) {
          const damage = kind === 'burning' ? 5 : kind === 'poisoned' ? 4 : kind === 'bleeding' ? 7 : 3;
          damageEnemy(enemy, damage * effect.stacks, 0, enemy.x + enemy.w / 2, false, true);
          burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, statusConfig[kind].color, 5 + effect.stacks * 2);
          if (kind === 'electrified') for (const other of enemies) {
            if (other === enemy || other.dead) continue;
            const dx = other.x - enemy.x, dy = other.y - enemy.y;
            if (dx * dx + dy * dy < 105 * 105) applyStatus(other, 'electrified');
          }
          effect.tick = statusConfig[kind].interval;
        }
        if (effect.life <= 0) delete enemy.statuses?.[kind];
      }
    };
    const updatePlayerStatuses = (dt: number) => {
      for (const kind of Object.keys(player.statuses) as StatusKind[]) {
        const effect = player.statuses[kind]; if (!effect) continue;
        effect.life -= dt; effect.tick -= dt;
        if (kind === 'electrified') player.controlLock = Math.max(player.controlLock, .08);
        if (kind !== 'electrified') {
          const maskRate = kind === 'burning' ? .18 : .14;
          effect.maskProgress = (effect.maskProgress ?? 0) + dt * maskRate * (1 + (effect.stacks - 1) * .35);
          if (effect.maskProgress >= 1 && !player.dead) {
            effect.maskProgress -= 1;
            damagePlayer(1, player.x + player.w / 2, undefined, 1, true, true);
          }
        }
        if (effect.tick <= 0 && !player.dead) {
          burst(player.x + player.w / 2, player.y + player.h / 2, statusConfig[kind].color, 9);
          effect.tick = statusConfig[kind].interval;
        }
        if (effect.life <= 0) delete player.statuses[kind];
      }
    };
    const recoverFromHazard = (sourceX: number) => {
      if (hazardRecovery > 0 || player.dead) return;
      const hpBeforeHit = player.hp;
      damagePlayer(1, sourceX, undefined, 1, true, true);
      if (player.dead || player.hp === hpBeforeHit) return;
      const checkpointFeet = checkpoint.y + player.h;
      const respawnPlatforms = [...terrain, ...oneWays].filter((platform) =>
        platform.w >= player.w + 12
        && !spikes.some((spike) => spike.x < platform.x + platform.w && spike.x + spike.w > platform.x && Math.abs(spike.y - platform.y) < 28));
      const originPlatform = respawnPlatforms
        .filter((platform) => checkpoint.x + player.w > platform.x && checkpoint.x < platform.x + platform.w)
        .sort((a, b) => Math.abs(a.y - checkpointFeet) - Math.abs(b.y - checkpointFeet))[0];
      const originX = originPlatform ? originPlatform.x + originPlatform.w / 2 : checkpoint.x + player.w / 2;
      const originY = originPlatform?.y ?? checkpointFeet;
      const nearbyPlatforms = respawnPlatforms
        .filter((platform) => bridgeLayout || platform !== originPlatform)
        .sort((a, b) => {
          if (bridgeLayout) {
            const distanceA = Math.abs(a.x + a.w / 2 - sourceX);
            const distanceB = Math.abs(b.x + b.w / 2 - sourceX);
            return distanceA - distanceB;
          }
          const distanceA = Math.hypot(a.x + a.w / 2 - originX, a.y - originY);
          const distanceB = Math.hypot(b.x + b.w / 2 - originX, b.y - originY);
          return distanceA - distanceB;
        })
        .slice(0, 2);
      const platformHasEnemy = (platform: Box) => enemies.some((enemy) =>
        !enemy.dead && !enemy.defeated
        && enemy.x + enemy.w / 2 >= platform.x && enemy.x + enemy.w / 2 <= platform.x + platform.w
        && enemy.y < platform.y && enemy.y + enemy.h >= platform.y - 150);
      const safePlatform = nearbyPlatforms.find((platform) => !platformHasEnemy(platform));
      hazardRespawn = safePlatform
        ? { x: safePlatform.x + safePlatform.w / 2 - player.w / 2, y: safePlatform.y - player.h }
        : { ...checkpoint };
      hazardRecovery = .7; hazardTeleported = false; spikeFade = .7; spikeCooldown = .85;
      player.controlLock = Math.max(player.controlLock, .7); player.vx = 0; player.vy = 0;
      keys.clear(); pressed.clear();
    };
    const reset = () => {
      if (runMode === 'checkpoint') {
        runProgress.current.hp = runProgress.current.maxHp;
        setDeathSummary(null); setDeathScreen('stats'); setRunKey((n) => n + 1);
        return;
      }
      runProgress.current = freshRun(permanentProgress.current); selectedSlot.current = 0; setActiveSlot(0);
      setHud({ hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, shards: 0, kills: 0, grenade: 0, trap: 0, message: '' });
      setLocation('prison'); setSector(1); setRunKey((n) => n + 1);
    };

    const keyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (weaponReplacementOpen.current || bossDeathLineOpen.current || settingsOpenRef.current) return;
        const nextOpen = !mapOpenRef.current;
        if (nextOpen) saveMapSnapshot();
        mapOpenRef.current = nextOpen; setMapOpen(nextOpen); setMapArchive({ ...runProgress.current.mapArchive });
        pausedRef.current = nextOpen; setPaused(nextOpen); keys.clear(); pressed.clear();
        return;
      }
      if (e.code === 'Escape') {
        if (weaponReplacementOpen.current || bossDeathLineOpen.current) return;
        if (pauseBestiaryOpenRef.current) { e.preventDefault(); pauseBestiaryOpenRef.current = false; setPauseBestiaryOpen(false); return; }
        if (mapOpenRef.current) { e.preventDefault(); mapOpenRef.current = false; setMapOpen(false); pausedRef.current = false; setPaused(false); return; }
        if (settingsOpenRef.current) { e.preventDefault(); settingsOpenRef.current = false; setSettingsOpen(false); return; }
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        keys.clear(); pressed.clear();
        return;
      }
      if (pausedRef.current) return;
      if ([settingsRef.current.bindings.left, settingsRef.current.bindings.right, settingsRef.current.bindings.down, settingsRef.current.bindings.jump, settingsRef.current.bindings.heal].includes(e.code)) e.preventDefault();
      if (!keys.has(e.code)) pressed.add(e.code);
      keys.add(e.code);
      const slotCodes = [settingsRef.current.bindings.slot1, settingsRef.current.bindings.slot2, settingsRef.current.bindings.slot3, settingsRef.current.bindings.slot4];
      const slot = slotCodes.indexOf(e.code);
      if (slot >= 0) { selectedSlot.current = slot; weaponManager.reset(); setActiveSlot(slot); playUiSound(settingsRef.current.effectsVolume, 'select'); }
      if (e.code === settingsRef.current.bindings.attack) { const gear = runProgress.current.loadout[selectedSlot.current]; if (gear.kind === 'sword' || gear.kind === 'bow') weaponManager.setAttackHeld(true); else useSelectedGear(); }
      if (e.code === 'KeyR' && player.dead) reset();
    };
    const keyUp = (e: KeyboardEvent) => { keys.delete(e.code); if (e.code === settingsRef.current.bindings.attack) weaponManager.setAttackHeld(false); };
    let mouseHeld = false;
    const mouseDown = (e: MouseEvent) => { if (!pausedRef.current && e.button === 0) { e.preventDefault(); mouseHeld = true; const gear = runProgress.current.loadout[selectedSlot.current]; if (gear.kind === 'shield') { player.guard = 1; player.guardAge = 0; } else if (gear.kind === 'sword' || gear.kind === 'bow') weaponManager.setAttackHeld(true); else useSelectedGear(); } };
    const mouseUp = (e: MouseEvent) => { if (e.button === 0) { mouseHeld = false; weaponManager.setAttackHeld(false); player.guard = 0; player.guardAge = 0; } };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    window.addEventListener('mouseup', mouseUp);
    canvas.addEventListener('mousedown', mouseDown);

    const moveAndCollide = (dt: number) => {
      const wasGrounded = player.grounded;
      const oldY = player.y;
      const impactSpeed = player.vy;
      player.x += player.vx * dt;
      for (const tile of solids) if (overlap(player, tile)) {
        const prisonGate = prisonGates.find((gate) => gate === tile && !gate.opened);
        if (prisonGate && player.roll > 0) { breakPrisonGate(prisonGate, Math.sign(player.vx) || player.facing); continue; }
        if (player.vx > 0) player.x = tile.x - player.w; else if (player.vx < 0) player.x = tile.x + tile.w;
        player.vx = 0;
      }
      player.y += player.vy * dt; player.grounded = false;
      for (const tile of solids) if (overlap(player, tile)) {
        if (player.vy > 0) { player.y = tile.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0; if (!wasGrounded && !player.dead) { const hard = impactSpeed > 520; player.landSquash = player.landSquashMax = hard ? .2 : .16; shake = Math.max(shake, hard ? 6 : 2); dustCloud(player.x + player.w / 2, player.y + player.h, hard ? 1.25 : .7, hard); } }
        else if (player.vy < 0) { player.y = tile.y + tile.h; player.vy = 0; }
      }
      if (player.vy >= 0 && player.drop <= 0) for (const tile of oneWays) {
        if ('ghost' in tile && tile.ghost && !ghostPlatformVisible(tile as Box & { phase?: number }, gameTime)) continue;
        const clockPlatform = tile as ClockPlatform;
        if (clockPlatform.disappearing && Math.sin(gameTime * 1.45 + (clockPlatform.phase || 0)) < -.18) continue;
        const oldBottom = oldY + player.h, newBottom = player.y + player.h;
        if (player.x + player.w > tile.x && player.x < tile.x + tile.w && oldBottom <= tile.y + 3 && newBottom >= tile.y) {
          player.y = tile.y - player.h; player.vy = 0; player.grounded = true; player.jumps = 0; if (!wasGrounded && !player.dead) { const hard = impactSpeed > 520; player.landSquash = player.landSquashMax = hard ? .2 : .16; shake = Math.max(shake, hard ? 6 : 2); dustCloud(player.x + player.w / 2, player.y + player.h, hard ? 1.25 : .7, hard); }
        }
      }
    };

    const update = (dt: number) => {
      gameTime += dt;
      runElapsed.current += dt;
      if (currentTrial?.timeLimit && runElapsed.current >= currentTrial.timeLimit && !player.dead) {
        setStoryMessage('Время испытания истекло');
        damagePlayer(player.maxHp, player.x, undefined, player.maxHp, true, true);
      }
      if (runMode === 'timed' && runElapsed.current >= TIMED_RUN_SECONDS && !player.dead) damagePlayer(player.maxHp, player.x, undefined, player.maxHp, true, true);
      if (runMode === 'timed') {
        ghostSampleTimer -= dt;
        if (ghostSampleTimer <= 0) { ghostRecording.push({ t: runElapsed.current, x: player.x, y: player.y, facing: player.facing, location }); ghostSampleTimer = .1; }
      }
      if (debugCommands.current.addMask > 0) {
        debugCommands.current.addMask--; player.maxHp += 1; player.hp = player.maxHp; runProgress.current.maxHp = player.maxHp; runProgress.current.hp = player.hp;
      }
      if (debugCommands.current.dailyShards > 0) {
        shards += debugCommands.current.dailyShards; debugCommands.current.dailyShards = 0; runProgress.current.shards = shards;
      }
      if (debugCommands.current.dailyMask > 0) {
        player.maxHp += debugCommands.current.dailyMask; player.hp += debugCommands.current.dailyMask; debugCommands.current.dailyMask = 0;
        runProgress.current.maxHp = player.maxHp; runProgress.current.hp = player.hp;
      }
      if (debugCommands.current.killRoom > 0) {
        debugCommands.current.killRoom--;
        const currentRoom = rooms.find((room) => player.x + player.w / 2 >= room.x && player.x + player.w / 2 < room.x + roomW && player.y + player.h / 2 >= room.y && player.y + player.h / 2 < room.y + roomH);
        if (currentRoom) enemies.forEach((enemy) => { if (!enemy.dead && enemy.x + enemy.w / 2 >= currentRoom.x && enemy.x + enemy.w / 2 < currentRoom.x + roomW && enemy.y + enemy.h / 2 >= currentRoom.y && enemy.y + enemy.h / 2 < currentRoom.y + roomH) { enemy.dead = true; kills++; burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ef4444', 12); } });
      }
      // Защита от проваливания за геометрию: без неё камера доходила до
      // нижнего левого ограничения и оставалась там без видимого игрока.
      const playerOutOfWorld = !Number.isFinite(player.x) || !Number.isFinite(player.y) || player.x < -120 || player.x > worldW + 120 || player.y > worldH + 80;
      if (playerOutOfWorld && !player.dead && !noClipModeRef.current) {
        player.x = Math.max(48, Math.min(worldW - player.w - 48, checkpoint.x)); player.y = checkpoint.y; player.vx = 0; player.vy = 0; player.grounded = false; player.controlLock = 0;
        camera = Math.max(0, Math.min(player.x - viewW * .38, worldW - viewW));
        cameraY = Math.max(0, Math.min(player.y - viewH * .78, worldH - viewH));
        keys.clear(); pressed.clear();
      }
      if (player.dead) {
        player.vy += 1450 * dt; moveAndCollide(dt); shake *= .82; flash -= dt; uiTimer -= dt;
        if (uiTimer <= 0) { uiTimer = .08; setHud({ hp: 0, maxHp: player.maxHp, shards, kills, grenade: Math.max(0, grenadeCd), trap: Math.max(0, trapCd), message: 'ВЫ ПРОИГРАЛИ' }); }
        return;
      }
      const mapRoom = roomAt(player.x + player.w / 2, player.y + player.h / 2);
      const pathChanged = rememberPlayerPath();
      if (pathChanged) saveMapSnapshot();
      if (mapRoom !== undefined && mapRoom !== lastMapRoom) {
        lastMapRoom = mapRoom; visitedMapRooms.add(mapRoom);
        saveMapSnapshot();
      }
      if (bridgeLayout && player.y + player.h >= 965 && !noClipModeRef.current) {
        damagePlayer(player.maxHp, player.x + player.w / 2, undefined, player.maxHp, true, true);
        return;
      }
      if (location === 'throne') {
        const throneBossAlive = enemies.some((enemy) => enemy.kind === 'rightHand' && !enemy.dead);
        const nearArmor = Math.abs(player.x + player.w / 2 - (royalArmor.x + royalArmor.w / 2)) < 72;
        const nearThrone = Math.abs(player.x + player.w / 2 - (throne.x + throne.w / 2)) < 82;
        if (!throneBossAlive && !finaleSequence && nearArmor && tap(settingsRef.current.bindings.interact)) { setStoryMessage('Доспехи пусты... Царя здесь нет. Но почему они выглядят в точности как мои?'); window.setTimeout(() => setStoryMessage(''), 4200); }
        const nearGate = player.x + player.w > throneGate.x - 34;
        if (!throneGateOpen && player.x + player.w > throneGate.x) { player.x = throneGate.x - player.w; player.vx = Math.min(0, player.vx); }
        if (!throneGateOpen && nearGate && !throneGateNotice) { throneGateNotice = true; setStoryMessage('Выход заблокирован. Трон ждет своего часа...'); window.setTimeout(() => setStoryMessage(''), 2600); }
        if (!nearGate) throneGateNotice = false;
        if (!throneBossAlive && !finaleSequence && nearThrone && tap(settingsRef.current.bindings.interact)) { finaleSequence = 1; finaleTimer = 0; player.x = throne.x + throne.w / 2 - player.w / 2; player.y = throne.y + throne.h - player.h - 12; player.vx = 0; player.vy = 0; playHeartbeat(); }
        if (finaleSequence === 1) {
          finaleTimer += dt; player.vx = 0; player.vy = 0; keys.clear(); pressed.clear(); servantX = Math.min(throne.x - 65, servantX + dt * 260);
          const throneCameraX = Math.max(0, Math.min(throne.x + throne.w / 2 - viewW / 2, worldW - viewW));
          const throneCameraY = Math.max(0, Math.min(throne.y + throne.h / 2 - viewH / 2, worldH - viewH));
          camera += (throneCameraX - camera) * Math.min(1, dt * 2);
          cameraY += (throneCameraY - cameraY) * Math.min(1, dt * 2);
          if (finaleTimer > 2.6 && finaleBeat === 0) { finaleBeat = 1; setStoryMessage('Мой Король! Вы наконец-то вернулись!'); }
          if (finaleTimer > 5.1 && finaleBeat === 1) { finaleBeat = 2; setStoryMessage('Вас так долго не было... Мы думали, вы погибли! Где вы были всё это время?'); }
          if (finaleTimer > 7.4 && finaleBeat === 2) { finaleBeat = 3; throneGateOpen = true; setStoryMessage(''); }
          if (finaleTimer > 9.2) { finaleSequence = 2; setStoryMessage(''); runProgress.current.shards = shards; if (runMode === 'timed') saveBestRunGhost(runElapsed.current, ghostRecording); if (!legacyAwarded.current) { legacyAwarded.current = true; setLegacyProgress((current) => ({ ...current, embers: current.embers + legacyReward(runStats.current.kills, runStats.current.bossesDefeated, true) })); } setEnding(true); }
          return;
        }
      }
      player.roll -= dt; player.rollCd -= dt * (runProgress.current.relics.includes('wind_feather') ? 1.54 : 1); player.attack -= dt; player.bounceLock -= dt; player.bow -= dt; player.hurt -= dt; player.controlLock -= dt; player.drop -= dt; player.landSquash -= dt; player.trailTimer -= dt; player.dustTimer -= dt; grenadeCd -= dt; trapCd -= dt; flash -= dt; spikeFade -= dt; spikeCooldown -= dt;
      if (player.attackGear?.kind === 'sword' && !player.attackHitDone) {
        const attackStep = meleeConfig(player.attackGear.weaponId).attacks[player.attackStage];
        const elapsed = player.attackMax - Math.max(0, player.attack);
        if (elapsed >= attackStep.windup) { player.attackHitDone = true; performSwordHit(player.attackGear); }
      }
      if (player.bowGear && !player.bowFired) {
        const bowConfig = equipmentConfig(player.bowGear.equipmentId, 'bow');
        if (bowConfig.kind === 'bow' && player.bowMax - Math.max(0, player.bow) >= bowConfig.charge) { player.bowFired = true; fireBow(player.bowGear); }
      }
      const heldGearKind = runProgress.current.loadout[selectedSlot.current].kind;
      const managedGear = runProgress.current.loadout[selectedSlot.current];
      const managedId = managedGear.weaponId ?? managedGear.equipmentId;
      const managedConfig = managedId ? weaponConfig(managedId) : undefined;
      if (managedConfig && (heldGearKind === 'sword' || heldGearKind === 'bow') && !player.dead && player.focus <= 0) {
        weaponManager.setAttackHeld(mouseHeld || keys.has(settingsRef.current.bindings.attack));
        const events = weaponManager.update(dt, managedConfig);
        if (events.some((event) => event.type === 'attack-started')) useSelectedGear();
        weaponAnimationState = weaponManager.snapshot(managedConfig).state;
      } else weaponAnimationState = 'idle';
      if (hazardRecovery > 0) {
        hazardRecovery = Math.max(0, hazardRecovery - dt);
        player.controlLock = Math.max(player.controlLock, hazardRecovery); player.vx = 0;
        if (!hazardTeleported && hazardRecovery <= .35) {
          hazardTeleported = true;
          player.x = hazardRespawn.x; player.y = hazardRespawn.y; player.vx = 0; player.vy = 0; player.grounded = false;
          camera = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW);
          cameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
          keys.clear(); pressed.clear();
        }
      }
      const focusKeyHeld = keys.has(settingsRef.current.bindings.heal);
      if (!focusKeyHeld) player.focusBroken = false;
      const wantsFocus = currentTrial?.modifier !== 'noHealing' && focusKeyHeld && !player.focusBroken && player.soul + .0001 >= SOUL_HEAL_COST && player.hp < player.maxHp;
      if (wantsFocus) {
        player.focus += dt; player.vx *= Math.max(0, 1 - dt * 16); player.attack = 0; player.bow = 0; player.bowFired = true; player.bowGear = null;
        if (player.focus >= 1) { player.soul = Math.max(0, player.soul - SOUL_HEAL_COST); player.hp = Math.min(player.maxHp, player.hp + 1); runProgress.current.hp = player.hp; player.focus = 0; setSoulHud(player.soul); burst(player.x + player.w / 2, player.y + 20, '#e8fff8', 18); }
      } else player.focus = 0;
      const focusing = player.focus > 0;
      const controlsLocked = player.controlLock > 0;
      const holdingShield = !controlsLocked && (mouseHeld || keys.has(settingsRef.current.bindings.attack)) && runProgress.current.loadout[selectedSlot.current].kind === 'shield';
      if (holdingShield) { const gear = runProgress.current.loadout[selectedSlot.current]; const config = equipmentConfig(gear.equipmentId, 'shield'); player.guard = 1; player.guardAge += dt; player.vx *= Math.max(0, 1 - dt * (config.kind === 'shield' ? config.movementDamping : 8)); }
      else { player.guard = 0; player.guardAge = 0; }
      const left = keys.has(settingsRef.current.bindings.left), right = keys.has(settingsRef.current.bindings.right);
      if (noClipModeRef.current) {
        const up = keys.has(settingsRef.current.bindings.up), down = keys.has(settingsRef.current.bindings.down);
        const horizontal = Number(right) - Number(left), vertical = Number(down) - Number(up), length = Math.max(1, Math.hypot(horizontal, vertical));
        player.vx = horizontal / length * 520; player.vy = vertical / length * 520;
        player.x = Math.max(0, Math.min(worldW - player.w, player.x + player.vx * dt)); player.y = Math.max(0, Math.min(worldH - player.h, player.y + player.vy * dt));
        player.grounded = false; player.jumps = 0; player.roll = 0; if (horizontal) player.facing = Math.sign(horizontal);
      } else if (player.roll <= 0 && !focusing && !controlsLocked) {
        const target = (Number(right) - Number(left)) * 260;
        player.vx += (target - player.vx) * Math.min(1, dt * (player.grounded ? 15 : 7));
        if (left) player.facing = -1; if (right) player.facing = 1;
      }
      if (!noClipModeRef.current && !focusing && !controlsLocked && tap(settingsRef.current.bindings.roll) && player.rollCd <= 0) { player.roll = .3; player.rollCd = .65; player.vx = player.facing * 440; player.trailTimer = 0; shadowDashBurst(player.facing); }
      if (!noClipModeRef.current && !focusing && !controlsLocked && tap(settingsRef.current.bindings.jump)) {
        if (keys.has(settingsRef.current.bindings.down) && player.grounded) { player.drop = .22; player.grounded = false; player.y += 5; }
        else if (player.grounded || player.jumps < 2) { player.vy = -PLAYER_JUMP_SPEED; player.jumps++; player.grounded = false; dustCloud(player.x + 17, player.y + 55, .65); }
      }
      const nearbyPrisonGate = prisonGates.find((gate) => !gate.opened
        && Math.abs(player.x + player.w / 2 - (gate.x + gate.w / 2)) < 76
        && player.y + player.h > gate.y - 20 && player.y < gate.y + gate.h + 20);
      if (nearbyPrisonGate && tap(settingsRef.current.bindings.interact)) {
        nearbyPrisonGate.opened = true;
        const solidIndex = solids.indexOf(nearbyPrisonGate); if (solidIndex >= 0) solids.splice(solidIndex, 1);
        const blockerIndex = projectileBlockers.indexOf(nearbyPrisonGate); if (blockerIndex >= 0) projectileBlockers.splice(blockerIndex, 1);
        pressed.delete(settingsRef.current.bindings.interact); shake = Math.max(shake, 4);
        burst(nearbyPrisonGate.x + nearbyPrisonGate.w / 2, nearbyPrisonGate.y + nearbyPrisonGate.h / 2, '#789b78', 12);
      }
      const nearbyCart = minesLevel?.carts.find((cart) => !cart.moving
        && Math.abs(player.x + player.w / 2 - (cart.x + cart.w / 2)) < 92
        && Math.abs(player.y + player.h - (cart.y + cart.h)) < 70);
      if (nearbyCart && tap(settingsRef.current.bindings.interact)) {
        nearbyCart.moving = true; nearbyCart.vx = player.facing * 620; pressed.delete(settingsRef.current.bindings.interact);
        shake = Math.max(shake, 5); burst(nearbyCart.x + nearbyCart.w / 2, nearbyCart.y + nearbyCart.h, '#94a3b8', 10);
      }
      if (!noClipModeRef.current) {
        const jumpHeld = keys.has(settingsRef.current.bindings.jump);
        if (bridgeLevel) {
          const windForce = bridgeWindAmount(gameTime, bridgeLevel.wind);
          player.vx += windForce * dt;
        }
        if (clockLevel) for (const vent of clockLevel.vents) {
          const inVent = player.x + player.w > vent.x && player.x < vent.x + vent.w
            && player.y + player.h > vent.y && player.y < vent.y + vent.h;
          if (inVent) {
            // The stream catches a falling player and settles into a gentle
            // upward hover. Holding jump turns that hover into a fast launch.
            const targetVelocity = jumpHeld ? -Math.min(920, vent.strength * .44) : -220;
            const response = 1 - Math.exp(-(jumpHeld ? 12 : 10) * dt);
            player.vy += (targetVelocity - player.vy) * response;
            player.grounded = false;
          }
        }
        if (player.roll > 0) player.vy = 0;
        else {
          if (!jumpHeld && player.bounceLock <= 0 && player.vy < -180) player.vy *= Math.max(0, 1 - dt * 24);
          player.vy = Math.min(player.vy + 1550 * dt, 850);
        }
        moveAndCollide(dt);
        if (clockLevel) for (const gear of clockLevel.gears) {
          const centerX = player.x + player.w / 2, centerY = player.y + player.h / 2;
          const dx = centerX - gear.x, dy = centerY - gear.y, distance = Math.hypot(dx, dy);
          // Use the player's body edge, not only its centre, for tooth contact.
          // This makes jumping onto the visible teeth reliable from a ledge.
          const contactRadius = gear.radius + 40;
          if (distance > gear.radius * .42 && distance < contactRadius && distance > 0) {
            const nx = dx / distance, ny = dy / distance, correction = contactRadius - distance;
            player.x += nx * correction; player.y += ny * correction;
            const tangentX = -ny * gear.speed * gear.radius, tangentY = nx * gear.speed * gear.radius;
            player.vx += (tangentX - player.vx) * Math.min(1, dt * 8);
            player.vy += (tangentY - player.vy) * Math.min(1, dt * 5);
            if (ny < -.45) { player.grounded = true; player.jumps = 0; }
          }
        }
        if (minesLevel) {
          for (const cart of minesLevel.carts) if (cart.moving) {
            cart.x += cart.vx * dt; cart.vx *= Math.max(0, 1 - dt * .7);
            if (cart.x <= cart.minX || cart.x + cart.w >= cart.maxX || Math.abs(cart.vx) < 45) { cart.x = Math.max(cart.minX, Math.min(cart.x, cart.maxX - cart.w)); cart.vx = 0; cart.moving = false; }
            for (const enemy of enemies) if (!enemy.dead && overlap(cart, enemy)) damageEnemy(enemy, 55, Math.sign(cart.vx) || 1, cart.x + cart.w / 2, false, true);
          }
        }
        if (cryptLevel) for (const slab of cryptLevel.crumblingSlabs) {
          const sealsBossArena = stageFourArenaLocked
            && slab.x < arenaGates[0].x
            && slab.x + slab.w > arenaRoom.x
            && slab.y >= arenaRoom.y
            && slab.y <= arenaRoom.y + roomH;
          if (sealsBossArena) {
            slab.state = 'stable';
            slab.timer = 0;
            continue;
          }
          if (slab.state === 'stable' && player.grounded && player.x + player.w > slab.x && player.x < slab.x + slab.w && Math.abs(player.y + player.h - slab.y) < 4) { slab.state = 'cracking'; slab.timer = 1; }
          if (slab.state === 'cracking') { slab.timer -= dt; if (slab.timer <= 0) { slab.state = 'fallen'; const index = solids.indexOf(slab); if (index >= 0) solids.splice(index, 1); const blocker = projectileBlockers.indexOf(slab); if (blocker >= 0) projectileBlockers.splice(blocker, 1); shake = 9; burst(slab.x + slab.w / 2, slab.y, '#776b82', 24); } }
        }
        for (const spike of spikes) if (spikeCooldown <= 0 && overlap(player, spike)) {
          const spikeRoom = roomAt(player.x + player.w / 2, player.y + player.h / 2);
          if (spikeRoom !== undefined) { const falls = (spikeFallsByRoom.get(spikeRoom) || 0) + 1; spikeFallsByRoom.set(spikeRoom, falls); if (falls >= 3) unlockAchievement('stuntman'); }
          recoverFromHazard(spike.x + spike.w / 2);
          break;
        }
        if (swampLevel && overlap(player, swampLevel.poison)) {
          burst(player.x + player.w / 2, SWAMP_WORLD.poisonY + 4, '#b7f52a', 14);
          recoverFromHazard(player.x + player.w / 2);
        }
        for (const platform of sinkingPlatforms) {
          const standing = player.grounded && player.x + player.w > platform.collider.x && player.x < platform.collider.x + platform.collider.w
            && Math.abs(player.y + player.h - platform.collider.y) < 6;
          const oldY = platform.collider.y;
          updateSinkingPlatform(platform, standing, dt);
          if (standing) player.y += platform.collider.y - oldY;
        }
      }
      const checkpointInsideWall = solids.some((tile) => overlap({ x: player.x + 3, y: player.y + 3, w: player.w - 6, h: player.h - 6 }, tile));
      const standingSafely = hazardRecovery <= 0 && player.grounded && player.x >= 48 && player.x + player.w <= worldW - 48 && player.y >= 0 && player.y < worldH - player.h && !checkpointInsideWall && !spikes.some((spike) => overlap({ x: player.x - 12, y: player.y, w: player.w + 24, h: player.h + 8 }, spike)) && !(swampLevel && overlap(player, swampLevel.poison));
      safeGroundTime = standingSafely ? safeGroundTime + dt : 0;
      if (safeGroundTime >= .22) { checkpoint.x = player.x; checkpoint.y = player.y; }
      const nearbyPortal = teleportPortals.find((portal) => Math.abs(player.x + player.w / 2 - portal.x) < 76 && Math.abs(player.y + player.h - portal.y) < 72);
      if (nearbyPortal && !nearbyPortal.active) {
        nearbyPortal.active = true;
        burst(nearbyPortal.x, nearbyPortal.y - 34, '#67e8f9', 24);
        shake = Math.max(shake, 5);
      }
      const activePortals = teleportPortals.filter((portal) => portal.active);
      if (nearbyPortal?.active && activePortals.length > 1 && tap(settingsRef.current.bindings.interact)) {
        const currentIndex = activePortals.indexOf(nearbyPortal);
        const destination = activePortals[(currentIndex + 1) % activePortals.length];
        burst(player.x + player.w / 2, player.y + player.h / 2, '#67e8f9', 20);
        player.x = destination.x - player.w / 2; player.y = destination.y - player.h;
        player.vx = 0; player.vy = 0; player.grounded = false; player.controlLock = .12;
        checkpoint.x = player.x; checkpoint.y = player.y; safeGroundTime = 0;
        camera = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW);
        cameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
        pressed.delete(settingsRef.current.bindings.interact); burst(destination.x, destination.y - 34, '#a5f3fc', 28); shake = 7;
      }
      const playerCenterForAction = player.x + player.w / 2;
      const nearbyDoorForAction = doors.find((door) => Math.abs(playerCenterForAction - (door.x + door.w / 2)) < 72 && Math.abs(player.y + player.h - (door.y + door.h)) < 30);
      // Doors lead to another location, so they must win when their interaction
      // area overlaps a palace mirror.
      const nearbyMirror = nearbyDoorForAction ? undefined : castleMirrors.find((mirror) => Math.abs(playerCenterForAction - (mirror.x + mirror.w / 2)) < 74 && Math.abs(player.y + player.h - (mirror.y + mirror.h)) < 80);
      if (nearbyMirror && tap(settingsRef.current.bindings.interact)) {
        const destination = castleMirrors.find((mirror) => mirror !== nearbyMirror && mirror.pairId === nearbyMirror.pairId);
        if (destination) {
          burst(player.x + player.w / 2, player.y + player.h / 2, '#a78bfa', 24);
          player.x = destination.x + destination.w / 2 - player.w / 2; player.y = destination.y + destination.h - player.h;
          player.vx = 0; player.vy = 0; player.controlLock = .15; checkpoint.x = player.x; checkpoint.y = player.y;
          camera = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW); cameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
          pressed.delete(settingsRef.current.bindings.interact); burst(destination.x + destination.w / 2, destination.y + destination.h / 2, '#67e8f9', 28); shake = 8;
        }
      }
      const shadowDashActive = player.roll > .1;
      if (shadowDashActive && runProgress.current.relics.includes('frost_shard') && runProgress.current.relics.includes('wind_feather')) for (const enemy of enemies) if (!enemy.dead && overlap(player, enemyHurtbox(enemy)) && (enemy.frozen ?? 0) <= 0) { enemy.frozen = scaledFreezeDuration(1.35, enemy.kind === 'boss' || enemy.kind === 'rightHand'); burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#67e8f9', 16); }
      if (shadowDashActive && player.trailTimer <= 0) { playerGhosts.push({ x: player.x, y: player.y, facing: player.facing, life: .24, maxLife: .24 }); player.trailTimer = .055; }
      if (player.grounded && Math.abs(player.vx) > 95 && player.dustTimer <= 0) { burst(player.x + player.w / 2 - player.facing * 10, player.y + player.h - 2, '#7c8793', 3); player.dustTimer = .11; }

      if (stageTwoBossRoom && !stageTwoArenaLocked && roomAt(player.x + player.w / 2, player.y + player.h / 2) === stageTwoBossRoom.id && enemies.some((enemy) => enemy.kind === 'boss' && !enemy.dead && !enemy.dormant)) {
        lockStageTwoArena();
        shake = 12; showBossIntroduction(location === 'swamps' ? 'Болотный Гигант' : 'Каменный Голем');
      }
      const bridgeBoss = bridgeLayout ? enemies.find((enemy) => enemy.variant === 'bridgeColossus' && !enemy.dead) : undefined;
      if (bridgeBoss?.dormant && player.x + player.w / 2 > arenaRoom.x + 300) {
        bridgeBoss.dormant = false; bridgeBoss.sawPlayer = true; bridgeBoss.alertTimer = .8;
        shake = 12; showBossIntroduction('Мостовой Колосс');
      }

      for (const item of loot) if (!item.collected) {
        const nearLoot = Math.abs(player.x + player.w / 2 - (item.x + item.w / 2)) < 68 && Math.abs(player.y + player.h / 2 - (item.y + item.h / 2)) < 72;
        if (!nearLoot || !tap(settingsRef.current.bindings.interact)) continue;
        const gear = item.gear;
        equipOrChooseSlot(gear); shards += item.shardValue; runProgress.current.shards = shards; item.collected = true; pressed.delete(settingsRef.current.bindings.interact); burst(item.x + 13, item.y + 13, '#f8fafc', 20);
      }
      for (const reward of explorationRewards) if (!reward.collected) {
        const nearReward = Math.abs(player.x + player.w / 2 - (reward.x + reward.w / 2)) < 76
          && Math.abs(player.y + player.h / 2 - (reward.y + reward.h / 2)) < 84;
        if (!nearReward || !tap(settingsRef.current.bindings.interact)) continue;
        reward.collected = true;
        pressed.delete(settingsRef.current.bindings.interact);
        if (reward.kind === 'goldChest') {
          for (let drop = 0; drop < 12; drop += 1) shardDrops.push({
            x: reward.x + reward.w / 2,
            y: reward.y + 8,
            w: 9,
            h: 9,
            vx: (drop - 5.5) * 28,
            vy: -260 - Math.random() * 150,
            value: Math.max(1, Math.round(reward.shardValue / 12)),
            life: 14,
          });
          setStoryMessage('Большой золотой сундук рассыпается осколками!');
        } else if (reward.kind === 'weaponPedestal' && reward.gear) {
          equipOrChooseSlot(reward.gear);
          setStoryMessage(`Найдено оружие: ${reward.gear.name}`);
        } else {
          const wasWounded = player.hp < player.maxHp;
          if (wasWounded) player.hp = player.maxHp;
          else { player.maxHp += 1; player.hp += 1; }
          runProgress.current.hp = player.hp;
          runProgress.current.maxHp = player.maxHp;
          setStoryMessage(wasWounded ? 'Алтарь исцеляет раны.' : 'Алтарь увеличивает запас здоровья на 1 маску.');
        }
        if (reward.lore) setStoryMessage(reward.lore);
        window.setTimeout(() => setStoryMessage(''), reward.lore ? 4800 : 1800);
        burst(reward.x + reward.w / 2, reward.y + reward.h / 2, reward.kind === 'goldChest' ? '#fbbf24' : '#a78bfa', 28);
      }
      for (const event of roomEvents) if (!event.resolved) {
        if (event.kind === 'parkour' && event.active) {
          event.timer = (event.timer ?? 0) - dt;
          const target = event.targetX !== undefined && event.targetY !== undefined
            ? { x: event.targetX, y: event.targetY, w: 36, h: 48 }
            : null;
          if (target && overlap(player, target)) {
            const reward = 24 + sector * 4;
            shards += reward; runProgress.current.shards = shards; event.resolved = true;
            setStoryMessage(`Испытание пройдено! Получено ${reward} осколков.`);
            burst(target.x + 18, target.y + 24, '#22d3ee', 32);
            window.setTimeout(() => setStoryMessage(''), 2600);
            continue;
          }
          if ((event.timer ?? 0) <= 0) {
            event.active = false;
            setStoryMessage('Время вышло. Маяк погас — попробуй снова.');
            window.setTimeout(() => setStoryMessage(''), 2400);
          }
        }
        const nearEvent = Math.abs(player.x + player.w / 2 - (event.x + event.w / 2)) < 78
          && Math.abs(player.y + player.h / 2 - (event.y + event.h / 2)) < 88;
        if (event.kind === 'leverPuzzle' && nearEvent) {
          const directions = ['left', 'up', 'right'] as const;
          const input = directions.find((direction) => tap(settingsRef.current.bindings[direction]));
          if (input) {
            pressed.delete(settingsRef.current.bindings[input]);
            const expected = event.sequence?.[event.sequenceProgress ?? 0];
            event.sequenceProgress = input === expected ? (event.sequenceProgress ?? 0) + 1 : 0;
            if ((event.sequenceProgress ?? 0) >= (event.sequence?.length ?? 3)) {
              const reward = 30 + sector * 5;
              shards += reward; runProgress.current.shards = shards; event.resolved = true;
              setStoryMessage(`Механизм открыт! В тайнике ${reward} осколков.`);
              burst(event.x + event.w / 2, event.y + 20, '#a78bfa', 30);
              window.setTimeout(() => setStoryMessage(''), 2800);
            } else if (input !== expected) {
              setStoryMessage('Неверная последовательность — рычаги сброшены.');
              window.setTimeout(() => setStoryMessage(''), 1800);
            }
          }
          continue;
        }
        const choseFountainShards = event.kind === 'fountain' && nearEvent && tap(settingsRef.current.bindings.attack);
        if (!nearEvent || (!tap(settingsRef.current.bindings.interact) && !choseFountainShards)) continue;
        pressed.delete(settingsRef.current.bindings.interact); pressed.delete(settingsRef.current.bindings.attack);
        if (event.kind === 'cursedChest') {
          if (player.hp <= 1) { setStoryMessage('Алтарь требует хотя бы одну маску в жертву.'); continue; }
          player.hp -= 1; runProgress.current.hp = player.hp;
          shards += 40; runProgress.current.shards = shards;
          setStoryMessage('Проклятый алтарь забирает маску и отдаёт 40 осколков. Реликвии теперь хранит алхимик.');
        } else if (event.kind === 'fountain') {
          if (choseFountainShards) {
            const reward = 18 + sector * 3; shards += reward; runProgress.current.shards = shards;
            setStoryMessage(`Вода превращается в ${reward} осколков.`);
          } else {
            const wasWounded = player.hp < player.maxHp;
            if (wasWounded) player.hp = player.maxHp; else { player.maxHp += 1; player.hp += 1; }
            runProgress.current.hp = player.hp; runProgress.current.maxHp = player.maxHp;
            setStoryMessage(wasWounded ? 'Фонтан полностью исцеляет тебя.' : 'Благословение фонтана добавляет 1 маску здоровья.');
          }
        } else if (event.kind === 'parkour') {
          if (event.targetX === undefined || event.targetY === undefined) continue;
          event.active = true; event.timer = 12;
          setStoryMessage('Испытание началось: доберись до голубого маяка за 12 секунд!');
          window.setTimeout(() => setStoryMessage(''), 2600);
          continue;
        } else {
          const cost = 15 + sector * 2;
          if (shards < cost || player.hp >= player.maxHp) {
            setStoryMessage(player.hp >= player.maxHp ? 'Странник: «Ты и так цел. Возвращайся после боя».' : `Странник просит ${cost} осколков за лечение.`);
            window.setTimeout(() => setStoryMessage(''), 3200);
            continue;
          }
          shards -= cost; player.hp = player.maxHp; runProgress.current.shards = shards; runProgress.current.hp = player.hp;
          setStoryMessage(`Странник полностью исцеляет тебя за ${cost} осколков.`);
        }
        event.resolved = true; burst(event.x + event.w / 2, event.y + 20, event.kind === 'cursedChest' ? '#c084fc' : '#fbbf24', 28);
        window.setTimeout(() => setStoryMessage(''), 3200);
      }
      for (const powerUp of powerUps) if (!powerUp.collected && overlap(player, powerUp)) {
        powerUp.collected = true;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        runProgress.current.hp = player.hp; burst(powerUp.x + 12, powerUp.y + 12, '#fb7185', 18);
      }

      updatePlayerStatuses(dt);

      for (const enemy of enemies) if (!enemy.dead && !enemy.dormant) {
        if (enemy.phaseTransition !== undefined) enemy.phaseTransition = Math.max(0, enemy.phaseTransition - dt);
        // Enemies remain spawned across the whole map, but their AI and timers sleep
        // until they enter the expanded camera area.
        if (!enemyNearViewport(enemy)) continue;
        enemy.hurt -= dt; enemy.cooldown -= dt; enemy.blocked -= dt; enemy.stunned -= dt; enemy.frozen = (enemy.frozen ?? 0) - dt;
        updateEnemyStatuses(enemy, dt);
        if (enemy.elite === 'teleporter') enemy.eliteCooldown = (enemy.eliteCooldown ?? 3) - dt;
        if (enemy.defeated) { enemy.vx = 0; continue; }
        const isBoss = enemy.kind === 'boss' || enemy.kind === 'rightHand';
        const contactHitboxScale = isBoss ? BOSS_CONTACT_HITBOX_SCALE : ENEMY_CONTACT_HITBOX_SCALE;
        const contactInsetX = enemy.w * (1 - contactHitboxScale) / 2;
        const contactInsetY = enemy.h * (1 - contactHitboxScale) / 2;
        const contactHitbox: Box = {
          x: enemy.x + contactInsetX,
          y: enemy.y + contactInsetY,
          w: enemy.w - contactInsetX * 2,
          h: enemy.h - contactInsetY * 2,
        };
        if (overlap(contactHitbox, player)) damagePlayer(1, enemy.x + enemy.w / 2, enemy, 1);
        if (enemy.frozen > 0) { enemy.vx = 0; enemy.vy = 0; enemy.attack = 0; continue; }
        if (enemy.stunned > 0) { enemy.vx = 0; enemy.attack = 0; continue; }
        const enemyCenter = enemy.x + enemy.w / 2, playerCenter = player.x + player.w / 2;
        const playerCenterY = player.y + player.h / 2, enemyCenterY = enemy.y + enemy.h / 2;
        const dx = playerCenter - enemyCenter, dyToPlayer = playerCenterY - enemyCenterY, sameLevel = Math.abs(dyToPlayer) < 55;
        const horizontalGap = Math.max(0, Math.abs(dx) - (enemy.w + player.w) / 2);
        const sightRange = enemy.variant === 'rottenPrisoner' ? 150 : enemy.kind === 'crossbow' ? 340 : enemy.kind === 'boss' || enemy.kind === 'rightHand' ? 560 : enemy.kind === 'mage' ? 580 : enemy.kind === 'flyer' || enemy.kind === 'wraith' ? 5 * 40 : enemy.kind === 'zombie' ? 7 * 40 : enemy.kind === 'bomber' ? 290 : enemy.kind === 'totem' ? 260 : 5 * 40;
        const distanceToPlayer = Math.hypot(dx, dyToPlayer);
        if (enemy.elite === 'teleporter' && (enemy.eliteCooldown ?? 1) <= 0 && distanceToPlayer < 520) {
          const oldX = enemy.x, oldY = enemy.y;
          const targetX = player.x + (Math.random() < .5 ? -1 : 1) * (100 + Math.random() * 90);
          enemy.x = Math.max(enemy.left, Math.min(enemy.right - enemy.w, targetX));
          if (enemy.kind === 'flyer' || enemy.kind === 'wraith') enemy.y = player.y - 35 + (Math.random() - .5) * 100;
          enemy.facing = Math.sign(player.x - enemy.x) || enemy.facing; enemy.vx = 0; enemy.attack = 0; enemy.eliteCooldown = 3.4 + Math.random() * 1.8;
          burst(oldX + enemy.w / 2, oldY + enemy.h / 2, '#c084fc', 16); burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#c084fc', 16);
        }
        const canTargetAcrossLevels = ['bomber', 'mage', 'flyer', 'wraith', 'totem'].includes(enemy.kind);
        // Only solid terrain blocks aggro; one-way platforms intentionally do not participate in this LOS test.
        const seesPlayer = distanceToPlayer <= sightRange && (canTargetAcrossLevels || sameLevel) && hasLineOfSight(enemyCenter, enemyCenterY, playerCenter, playerCenterY);
        if (seesPlayer && !enemy.sawPlayer) { enemy.sawPlayer = true; enemy.alertTimer = .5; enemy.attack = 0; enemy.vx = 0; if (enemy.variant === 'cappedArcher') enemy.cooldown = 0; }
        else if (!seesPlayer) enemy.sawPlayer = false;
        if (enemy.alertTimer > 0) { enemy.alertTimer = Math.max(0, enemy.alertTimer - dt); enemy.vx = 0; enemy.attack = 0; continue; }
        if (enemy.kind === 'shield') enemy.alert = seesPlayer ? Math.min(.65, enemy.alert + dt) : Math.max(0, enemy.alert - dt * 2);
        const detected = enemy.kind === 'shield' ? seesPlayer && enemy.alert >= .55 : seesPlayer;
        const wasAttacking = enemy.attack > 0; enemy.attack -= dt;

        if (enemy.kind === 'zombie' || enemy.kind === 'shield' || enemy.kind === 'slime' || enemy.kind === 'boss' || enemy.kind === 'rightHand') {
          if (detected && enemy.attack <= 0) {
            const direction = Math.sign(dx) || enemy.facing;
            enemy.vx = direction * (enemy.variant === 'rottenPrisoner' ? 65 : enemy.variant === 'blindMiner' ? 205 : enemy.variant === 'clockworkSoldier' ? 245 : enemy.variant === 'royalGuard' ? 185 : enemy.kind === 'slime' ? 90 : enemy.kind === 'zombie' ? 155 : enemy.kind === 'boss' ? 125 : enemy.kind === 'rightHand' ? 150 : 38);
            if (enemy.kind === 'shield' && direction !== enemy.facing) { enemy.vx = 0; enemy.turnDelay += dt; if (enemy.turnDelay >= .55) { enemy.facing = direction; enemy.turnDelay = 0; } }
            else { enemy.facing = direction; enemy.turnDelay = 0; }
          } else if (!detected && enemy.attack <= 0) { enemy.vx = (Math.sign(enemy.vx) || enemy.facing) * enemy.patrolSpeed; enemy.turnDelay = 0; }
        }
        if (enemy.kind === 'zombie') {
          const rotten = enemy.variant === 'rottenPrisoner', windup = rotten ? .6 : enemy.variant === 'blindMiner' ? .16 : enemy.variant === 'clockworkSoldier' ? .18 : enemy.variant === 'royalGuard' ? .16 : .3;
          const attackRange = enemy.variant === 'clockworkSoldier' ? 70 : 48;
          if (detected && horizontalGap <= attackRange && sameLevel && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = windup; enemy.cooldown = rotten ? 1.75 : enemy.variant === 'blindMiner' ? .48 : enemy.variant === 'royalGuard' ? .45 : .9; enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          const playerStillInFront = dx * enemy.facing >= -4;
          if (wasAttacking && enemy.attack <= 0 && horizontalGap <= attackRange + 8 && sameLevel && playerStillInFront) damagePlayer(18, enemyCenter, enemy);
        } else if (enemy.kind === 'slime') {
          if (detected && enemy.cooldown <= 0) { enemy.vy = -390; enemy.vx = Math.sign(dx) * 145; enemy.cooldown = 1.25; }
        } else if (enemy.kind === 'shield') {
          if (detected && Math.abs(dx) < 64 && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = .36; enemy.cooldown = 1.15; enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          if (wasAttacking && enemy.attack <= 0 && detected && Math.abs(dx) < 78) damagePlayer(7, enemyCenter, enemy);
        } else if (stageTwoBossFight && enemy.kind === 'boss') {
          enemy.facing = Math.sign(dx) || enemy.facing;
          if (detected && enemy.cooldown <= 0 && enemy.attack <= 0) {
            enemy.specialAttack = enemy.specialAttack === 1 ? 2 : 1;
            enemy.attack = enemy.specialAttack === 1 ? .8 : 1.05;
            enemy.bossImpactDone = false;
            enemy.cooldown = (enemy.specialAttack === 1 ? 2.35 : 2.8) * (enemy.phaseTwo ? .62 : 1);
            enemy.vx = 0;
            if (enemy.specialAttack === 1) {
              showCombatNotice(location === 'swamps' ? 'Опасность снизу — двигайся!' : 'Шипы снизу — уходи из зоны!', 'danger', 1100);
              const floorY = stageTwoBossRoom!.y + roomH - wall;
              const warningCount = enemy.phaseTwo ? 3 : 1;
              for (let warning = 0; warning < warningCount; warning++) bossWarnings.push({ x: Math.max(stageTwoBossRoom!.x + wall + 8, Math.min(playerCenter - 28 + (warning - 1) * 105, stageTwoBossRoom!.x + roomW - wall - 64)), y: floorY - 10, w: 56, h: 10, delay: .8 + warning * .12, life: .35, hit: false, kind: location === 'swamps' ? 'geyser' : 'spike' });
              shake = 7;
            }
          }
          if (enemy.specialAttack === 2 && enemy.attack < .7 && enemy.attack > .12) {
            enemy.vx = enemy.facing * 760; enemy.x += enemy.vx * dt;
            if (overlap(enemy, player)) damagePlayer(26, enemyCenter, enemy);
          } else enemy.vx = 0;
          if (enemy.variant === 'swampGiant' && enemy.attack > 0 && enemy.attack < .38 && !enemy.bossImpactDone) {
            enemy.bossImpactDone = true; shake = Math.max(shake, 15);
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h - 8, '#6a4a2f', 32);
            burst(enemy.x + enemy.w / 2, enemy.y + enemy.h - 8, '#8eb06a', 18);
          }
        } else if (enemy.variant === 'cryptWarden' || enemy.variant === 'bridgeColossus') {
          enemy.facing = Math.sign(dx) || enemy.facing;
          if (enemy.cooldown <= 0 && enemy.attack <= 0) {
            enemy.specialAttack = enemy.specialAttack === 1 ? 2 : 1; enemy.attack = 1.25; enemy.cooldown = enemy.phaseTwo ? 1.75 : 3.1; enemy.vx = 0;
            if (enemy.specialAttack === 2 && enemy.variant === 'cryptWarden') {
              for (let i = 0; i < (enemy.phaseTwo ? 5 : 3); i++) projectiles.push({ x: enemyCenter - 9, y: enemy.y + 25, w: 18, h: 18, vx: enemy.facing * (80 + i * 75), vy: -430 - i * 45, life: 3, damage: 20, kind: 'wardenSkull', owner: enemy });
              shake = 9;
            }
            if (enemy.specialAttack === 2 && enemy.variant === 'bridgeColossus') {
              showCombatNotice('Камнепад — следи за метками!', 'danger', 1200);
              for (let i = 0; i < (enemy.phaseTwo ? 6 : 3); i++) rockWarnings.push({ x: arenaRoom.x + 150 + Math.random() * (roomW - 330), y: arenaRoom.y + roomH - wall - 12, w: 82, h: 12, life: .5, delay: i * (enemy.phaseTwo ? .28 : .55) });
              shake = 12;
            }
          }
          if (enemy.specialAttack === 1 && enemy.attack < .78 && enemy.attack > .18) {
            enemy.vx = enemy.facing * (enemy.variant === 'cryptWarden' ? 720 : 830); enemy.x += enemy.vx * dt;
            const attackBox: Box = enemy.variant === 'cryptWarden' ? { x: enemy.facing > 0 ? enemy.x : enemy.x - 185, y: enemy.y + 48, w: enemy.w + 185, h: 64 } : { x: enemy.x - 18, y: enemy.y - 12, w: enemy.w + 36, h: 62 };
            if (overlap(attackBox, player) && (enemy.variant !== 'bridgeColossus' || !keys.has(settingsRef.current.bindings.down))) damagePlayer(28, enemyCenter, enemy);
          } else enemy.vx = 0;
        } else if (enemy.kind === 'boss' || enemy.kind === 'rightHand') {
          const reach = enemy.kind === 'rightHand' ? 105 : 88;
          if (detected && Math.abs(dx) < reach && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = enemy.phaseTwo ? .28 : .42; enemy.cooldown = (enemy.kind === 'rightHand' ? .72 : 1) * (enemy.phaseTwo ? .55 : 1); enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          if (wasAttacking && enemy.attack <= 0) {
            if (detected && Math.abs(dx) < reach + 18) damagePlayer(enemy.kind === 'rightHand' ? 30 : 23, enemyCenter, enemy);
          }
        } else if (enemy.kind === 'crossbow') {
          enemy.vx = 0; if (seesPlayer) enemy.facing = Math.sign(dx) || enemy.facing;
          if (seesPlayer && enemy.cooldown <= 0 && enemy.attack <= 0) { enemy.attack = enemy.variant === 'cappedArcher' ? .8 : .35; enemy.cooldown = enemy.variant === 'towerSniper' ? 1.9 : 2.6; }
          if (wasAttacking && enemy.attack <= 0 && seesPlayer) {
            projectiles.push({ x: enemyCenter + enemy.facing * 18, y: enemy.y + 21, w: 22, h: 5, vx: enemy.facing * (enemy.variant === 'towerSniper' ? 510 : 430), vy: enemy.variant === 'towerSniper' ? Math.sign(dyToPlayer) * 120 : 0, life: 3.2, damage: 14, kind: enemy.variant === 'towerSniper' ? 'gear' : 'enemyArrow', bounces: enemy.variant === 'towerSniper' ? 2 : 0 });
          }
        } else if (enemy.kind === 'bomber') {
          if (detected) { enemy.vx = 0; enemy.facing = Math.sign(dx) || enemy.facing; }
          else enemy.vx = (Math.sign(enemy.vx) || enemy.facing) * enemy.patrolSpeed;
          if (detected && enemy.cooldown <= 0) {
            enemy.attack = .35; enemy.cooldown = 3.2;
          }
          if (wasAttacking && enemy.attack <= 0 && detected) {
            const directDistance = Math.max(1, Math.hypot(dx, dyToPlayer));
            const bombVx = dx / directDistance * 500, bombVy = dyToPlayer / directDistance * 500;
            projectiles.push({ x: enemyCenter + enemy.facing * 14, y: enemy.y + 5, w: 13, h: 13, vx: bombVx, vy: bombVy, life: enemy.variant === 'dynamiteTosser' ? 1.5 : 2.4, damage: 20, kind: 'enemyBomb', owner: enemy });
          }
        } else if (enemy.kind === 'mage') {
          enemy.vx = 0; if (seesPlayer) enemy.facing = Math.sign(dx) || enemy.facing;
          if (seesPlayer && enemy.cooldown <= 0) {
            enemy.attack = .45; enemy.cooldown = 4;
            if (enemy.variant === 'bogShaman') { enemy.spellX = playerCenter; enemy.spellY = player.y + player.h; }
          }
          if (wasAttacking && enemy.attack <= 0 && seesPlayer) {
            if (enemy.variant === 'bogShaman') projectiles.push({ x: (enemy.spellX ?? playerCenter) - 28, y: (enemy.spellY ?? player.y + player.h) - 12, w: 56, h: 78, vx: 0, vy: -95, life: .9, damage: 17, kind: 'poisonBurst', owner: enemy });
            else if (enemy.variant === 'necromancer') {
              const hp = Math.round(32 * enemyHealthScale), summonedSize = earlyEnemySizes.summonedPrisoner; enemies.push({ kind: 'zombie', variant: 'summonedPrisoner', name: 'Summoned Prisoner', x: enemy.x + enemy.facing * 45, y: enemy.homeY + enemy.h - summonedSize.h, w: summonedSize.w, h: summonedSize.h, vx: enemy.facing * 42, vy: 0, patrolSpeed: 42, hp, maxHp: hp, left: enemy.left, right: enemy.right, homeY: enemy.homeY + enemy.h - summonedSize.h, facing: enemy.facing, alert: 0, alertTimer: 0, sawPlayer: false, turnDelay: 0, hurt: 0, attack: 0, cooldown: 1, blocked: 0, stunned: 0, guardTriggered: false, defeated: false, dead: false });
            } else { const dy = player.y + player.h / 2 - (enemy.y + enemy.h / 2), distance = Math.max(1, Math.hypot(dx, dy)); projectiles.push({ x: enemyCenter - 8, y: enemy.y + 12, w: 17, h: 17, vx: dx / distance * 155, vy: dy / distance * 155, life: 4 + Math.random() * 2, damage: 17, kind: 'magicOrb', owner: enemy }); }
          }
        } else if (enemy.kind === 'flyer' || enemy.kind === 'wraith') {
          if (detected) { const distance = Math.max(1, Math.hypot(dx, dyToPlayer)), speed = enemy.kind === 'wraith' ? 145 : 225; enemy.vx += (dx / distance * speed - enemy.vx) * Math.min(1, dt * 3); enemy.vy += (dyToPlayer / distance * speed - enemy.vy) * Math.min(1, dt * 3); enemy.x += enemy.vx * dt; enemy.y += enemy.vy * dt; }
        } else if (enemy.kind === 'totem') {
          enemy.vx = 0;
        }

        if (!['crossbow', 'mage', 'totem', 'flyer', 'wraith', 'slime'].includes(enemy.kind) && enemy.attack <= 0) {
          enemy.x += enemy.vx * dt; if (enemy.kind !== 'shield' || !detected) enemy.facing = Math.sign(enemy.vx) || enemy.facing;
          if (enemy.x < enemy.left || enemy.x + enemy.w > enemy.right) { enemy.vx *= -1; enemy.x = Math.max(enemy.left, Math.min(enemy.x, enemy.right - enemy.w)); }
        }
        if (enemy.variant === 'bridgeKnight' && Math.abs(enemy.vx) > 12 && enemy.attack <= 0) {
          const beat = Math.floor(gameTime * 2.5);
          if (enemy.footstepBeat !== beat) { enemy.footstepBeat = beat; shake = Math.max(shake, 3); burst(enemy.x + enemy.w / 2, enemy.y + enemy.h, '#8d969a', 3); }
        }
      }
      for (const statue of crossbowStatues) {
        if (statue.dead) continue;
        statue.hurt = Math.max(0, statue.hurt - dt);
        statue.cooldown -= dt;
        if (statue.cooldown <= 0) {
          statue.cooldown += 2;
          projectiles.push({ x: statue.x + statue.w / 2 + statue.facing * 38, y: statue.y + statue.h / 2 - 2, w: 24, h: 5, vx: statue.facing * 690, vy: 0, life: 2.3, damage: 16, kind: 'trapArrow' });
          burst(statue.x + statue.w / 2 + statue.facing * 42, statue.y + statue.h / 2, '#fde68a', 5);
        }
      }
      for (const p of projectiles) {
        if (p.kind === 'magicOrb' && p.owner?.dead) { p.life = 0; continue; }
        const previousX = p.x, previousY = p.y;
        if (p.kind === 'magicOrb') {
          const dx = player.x + player.w / 2 - (p.x + p.w / 2), dy = player.y + player.h / 2 - (p.y + p.h / 2), distance = Math.max(1, Math.hypot(dx, dy));
          const desiredVx = dx / distance * 165, desiredVy = dy / distance * 165, steering = Math.min(1, dt * 2.4);
          p.vx += (desiredVx - p.vx) * steering; p.vy += (desiredVy - p.vy) * steering;
          const counterProjectile = projectiles.find((other) => other !== p && other.life > 0 && (other.kind === 'arrow' || other.kind === 'grenade' || other.kind === 'freeze') && overlap(p, other));
          const counterTrap = traps.find((trap) => trap.life > 0 && overlap(p, trap));
          if (counterProjectile || counterTrap) {
            p.life = 0;
            if (counterProjectile?.kind === 'arrow') counterProjectile.life = 0;
            if (counterTrap) { counterTrap.triggered = true; counterTrap.life = Math.min(counterTrap.life, .35); }
            burst(p.x + p.w / 2, p.y + p.h / 2, '#c084fc', 12);
            burst(p.x + p.w / 2, p.y + p.h / 2, '#f8fafc', 7);
            continue;
          }
        }
        p.life -= dt; p.vy += (p.kind === 'grenade' || p.kind === 'freeze' || p.kind === 'enemyBomb' || p.kind === 'wardenSkull' || p.kind === 'fallingRock' ? 900 : 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'arrow' && p.life > 0) for (const statue of crossbowStatues) {
          if (!statue.dead && overlap(p, statue)) { damageCrossbowStatue(statue, p.damage); p.life = 0; break; }
        }
        // The Royal Sorcerer's orb is ethereal enough to cross one-way
        // platforms, but room walls, floors, ceilings and closed gates still
        // stop it. Other projectiles keep their existing collision rules.
        const worldBlockers = p.kind === 'poisonBurst'
          ? []
          : p.kind === 'magicOrb' && p.owner?.variant === 'royalSorcerer'
          ? solids
          : projectileBlockers;
        const hitWorld = worldBlockers.some((tile) => overlap(p, tile));
        if (hitWorld && p.kind === 'enemyBomb') { p.x = previousX; p.y = previousY; p.vx *= .55; p.vy = -Math.abs(p.vy) * .38; }
        else if (hitWorld && p.kind === 'gear' && (p.bounces || 0) > 0) { p.x = previousX; p.y = previousY; p.bounces = (p.bounces || 0) - 1; p.vx *= -1; p.vy *= -1; }
        else if (hitWorld) p.life = 0;
        if (p.life > 0 && !hitWorld && p.kind === 'arrow') for (const e of enemies) if (!e.dead && overlap(p, enemyHurtbox(e))) { const distance = Math.abs(p.x - (p.originX ?? p.x)), relicLongShot = runProgress.current.relics.includes('hunter_eye') && distance >= 360, verdict = p.branch === 'sniper' ? 1 + Math.min(.9, distance / 700) : 1; damageEnemy(e, p.damage * verdict * (relicLongShot ? 1.5 : 1), Math.sign(p.vx), p.x, true, p.branch === 'sniper'); if (p.branch === 'frost' && !e.dead) e.frozen = Math.max(e.frozen ?? 0, scaledFreezeDuration(1.35, e.kind === 'boss' || e.kind === 'rightHand')); if ((p.pierces ?? 0) > 0) p.pierces = (p.pierces ?? 0) - 1; else { p.life = 0; break; } }
        if (!hitWorld && p.kind === 'grenade' && p.life > 0) for (const enemy of enemies) if (!enemy.dead && overlap(p, enemyHurtbox(enemy))) { p.x += p.w / 2; p.y += p.h / 2; p.life = 0; break; }
        if (!hitWorld && (p.kind === 'enemyArrow' || p.kind === 'trapArrow' || p.kind === 'gear' || p.kind === 'poisonBurst') && overlap(p, player)) { if (player.roll <= 0) { damagePlayer(p.damage, p.x); if (p.kind === 'poisonBurst') applyStatus(player, 'poisoned'); else if (p.kind === 'gear') applyStatus(player, 'electrified'); } p.life = 0; }
        if (p.kind === 'magicOrb' && overlap(p, player)) { if (holdingShield) { burst(p.x, p.y, '#fde68a', 14); player.parry = Math.min(100, player.parry + 35); } else if (player.roll <= 0) damagePlayer(p.damage, p.x); p.life = 0; burst(p.x, p.y, '#c084fc', 12); }
        if ((p.kind === 'wardenSkull' || p.kind === 'fallingRock') && overlap(p, player)) { damagePlayer(p.damage, p.x, p.owner); p.life = 0; burst(p.x, p.y, p.kind === 'wardenSkull' ? '#c084fc' : '#9ca3af', 14); }
        if (p.kind === 'enemyBomb' && p.reflected) for (const enemy of enemies) if (!enemy.dead && overlap(p, enemyHurtbox(enemy))) { const wasAlive = !enemy.dead; damageEnemy(enemy, runProgress.current.relics.includes('mirror_shield') ? 144 : 48, Math.sign(p.vx) || 1, p.x); if (wasAlive && enemy.dead && enemy.variant === 'dynamiteTosser') unlockAchievement('return_sender'); p.life = 0; break; }
        if ((p.kind === 'grenade' || p.kind === 'freeze') && p.life <= 0) {
          const hellMix = p.kind === 'grenade' && runProgress.current.relics.includes('powder_seal') && runProgress.current.relics.includes('berserker_sigil');
          const clusterScale = p.branch === 'cluster' ? 1.35 : 1;
          const blastRadius = (hellMix ? Math.max(188, p.blastRadius ?? 150) : (p.blastRadius ?? 150)) * clusterScale;
          enemies.forEach((enemy) => {
            const dx = enemy.x - p.x, dy = enemy.y - p.y;
            if (dx * dx + dy * dy >= blastRadius * blastRadius) return;
            const wasFrozen = (enemy.frozen ?? 0) > 0;
            damageEnemy(enemy, p.damage * (hellMix ? 1.35 : 1) * (p.kind === 'freeze' && p.branch === 'cluster' && wasFrozen ? 1.65 : 1), Math.sign(dx) || 1, p.x, true);
            if (p.kind === 'freeze' && !enemy.dead) enemy.frozen = scaledFreezeDuration(p.branch === 'alchemist' ? 4.5 : (p.freezeSeconds ?? 1), enemy.kind === 'boss' || enemy.kind === 'rightHand');
            else if (!enemy.dead) applyStatus(enemy, p.branch === 'alchemist' ? 'poisoned' : 'burning', 2);
          });
          if (p.kind === 'grenade' && (runProgress.current.relics.includes('powder_seal') || p.branch === 'alchemist')) hazards.push({ x: p.x - 70, y: p.y - 18, w: 140, h: 36, life: p.branch === 'alchemist' ? 6 : 4, tick: 0, delay: 0, kind: p.branch === 'alchemist' ? 'poison' : 'fire' });
          if (p.branch === 'cluster') for (let fragment = 0; fragment < 4; fragment++) { const angle = fragment * Math.PI / 2; const x = p.x + Math.cos(angle) * blastRadius * .48, y = p.y + Math.sin(angle) * blastRadius * .48; explosions.push({ x, y, life: .36, maxLife: .36, radius: blastRadius * .38, kind: p.kind === 'freeze' ? 'freeze' : 'fire' }); burst(x, y, p.kind === 'freeze' ? '#cffafe' : '#fde68a', 9); }
          explosions.push({ x: p.x, y: p.y, life: .52, maxLife: .52, radius: blastRadius, kind: p.kind === 'freeze' ? 'freeze' : 'fire' });
          burst(p.x, p.y, p.kind === 'freeze' ? '#67e8f9' : '#f5b942', hellMix || p.branch === 'cluster' ? 40 : 28); shake = hellMix || p.branch === 'cluster' ? 19 : 14;
        }
        if (p.kind === 'enemyBomb' && p.life <= 0) { const dx = player.x + player.w / 2 - p.x, dy = player.y + player.h / 2 - p.y; if (!p.reflected && dx * dx + dy * dy < 135 * 135) { damagePlayer(p.damage, p.x); applyStatus(player, 'burning', 2); } if (p.reflected) enemies.forEach((enemy) => { const ex = enemy.x + enemy.w / 2 - p.x, ey = enemy.y + enemy.h / 2 - p.y; if (!enemy.dead && ex * ex + ey * ey < 135 * 135) { const wasAlive = !enemy.dead; damageEnemy(enemy, runProgress.current.relics.includes('mirror_shield') ? 144 : 48, Math.sign(ex) || 1, p.x); applyStatus(enemy, 'burning', 2); if (wasAlive && enemy.dead && enemy.variant === 'dynamiteTosser') unlockAchievement('return_sender'); } }); explosions.push({ x: p.x, y: p.y, life: .48, maxLife: .48, radius: 145, kind: 'fire' }); burst(p.x, p.y, '#ff7a45', 32); burst(p.x, p.y, '#fde68a', 18); shake = 14; }
      }
      for (const warning of rockWarnings) {
        if (warning.delay > 0) { warning.delay -= dt; continue; }
        warning.life -= dt;
        if (warning.life <= 0 && warning.delay >= 0) { projectiles.push({ x: warning.x + 12, y: arenaRoom.y + 20, w: 58, h: 58, vx: 0, vy: 90, life: 2, damage: 24, kind: 'fallingRock' }); warning.delay = -1; }
      }
      for (const warning of bossWarnings) {
        if (warning.delay > 0) { warning.delay -= dt; continue; }
        warning.life -= dt;
        const strike: Box = { x: warning.x, y: warning.y - 105, w: warning.w, h: 115 };
        if (!warning.hit && overlap(player, strike)) { warning.hit = true; damagePlayer(24, warning.x + warning.w / 2, undefined, 1, true); }
      }
      for (const hazard of hazards) {
        if (hazard.delay > 0) { hazard.delay -= dt; continue; }
        hazard.life -= dt; hazard.tick -= dt;
        if (hazard.kind === 'poison' && hazard.tick <= 0 && overlap(player, hazard)) { applyStatus(player, 'poisoned'); hazard.tick = .8; }
        if (hazard.kind === 'fire' && hazard.tick <= 0) { enemies.forEach((enemy) => { if (!enemy.dead && overlap(enemy, hazard)) damageEnemy(enemy, 8, Math.sign(enemy.x - hazard.x) || 1, hazard.x + hazard.w / 2); }); hazard.tick = .55; }
      }
      for (const shard of shardDrops) {
        shard.life -= dt; shard.vy += 620 * dt;
        const dx = player.x + player.w / 2 - shard.x, dy = player.y + player.h / 2 - shard.y, distance = Math.hypot(dx, dy);
        if (distance < 150) { shard.vx += dx * dt * 14; shard.vy += dy * dt * 14; }
        shard.x += shard.vx * dt; shard.y += shard.vy * dt;
        if (distance < 28) { shards += shard.value; runProgress.current.shards = shards; if (shards >= 150) unlockAchievement('heavy_wallet'); shard.life = 0; burst(shard.x, shard.y, '#fbbf24', 5); }
      }
      for (const trap of traps) { trap.life -= dt; for (const e of enemies) if (!e.dead && !trap.triggered && overlap(trap, enemyHurtbox(e))) { trap.triggered = true; trap.life = .35; e.vx *= .15; damageEnemy(e, trap.damage, Math.sign(e.x - trap.x), trap.x + trap.w / 2, true); } }
      for (const enemy of enemies) if (!enemy.dead && !enemy.dormant && enemyNearViewport(enemy)) applyEnemyGravity(enemy, dt);
      for (const enemy of enemies) if (!enemy.dead && !enemy.dormant && enemy.kind !== 'wraith' && enemyNearViewport(enemy)) resolveEnemyWalls(enemy);
      for (const roomId of combatRooms) if (!clearedRooms.has(roomId) && !enemies.some((enemy) => !enemy.dead && roomAt(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2) === roomId)) { clearedRooms.add(roomId); if (!damagedRooms.has(roomId)) unlockAchievement('clear_mind'); }
      for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.shape === 'smoke' ? 80 : 520) * dt; if (p.rotation !== undefined) p.rotation += (p.spin ?? 0) * dt; }
      updateGateFragments(gateFragments, dt);
      for (const ghost of playerGhosts) ghost.life -= dt;
      for (const explosion of explosions) explosion.life -= dt;
      for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].life <= 0) projectiles.splice(i, 1);
      for (let i = traps.length - 1; i >= 0; i--) if (traps[i].life <= 0) traps.splice(i, 1);
      for (let i = hazards.length - 1; i >= 0; i--) if (hazards[i].life <= 0) hazards.splice(i, 1);
      for (let i = shardDrops.length - 1; i >= 0; i--) if (shardDrops[i].life <= 0) shardDrops.splice(i, 1);
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
      for (let i = playerGhosts.length - 1; i >= 0; i--) if (playerGhosts[i].life <= 0) playerGhosts.splice(i, 1);
      for (let i = explosions.length - 1; i >= 0; i--) if (explosions[i].life <= 0) explosions.splice(i, 1);
      for (let i = rockWarnings.length - 1; i >= 0; i--) if (rockWarnings[i].delay < 0) rockWarnings.splice(i, 1);
      for (let i = bossWarnings.length - 1; i >= 0; i--) if (bossWarnings[i].life <= 0) bossWarnings.splice(i, 1);
      // Camera coordinates are the top-left corner of the viewport in world space.
      // Follow the player's centre continuously; only the outer world bounds may stop it.
      const targetCameraX = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW);
      const targetCameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
      if (Number.isFinite(targetCameraX) && Number.isFinite(targetCameraY)) {
        // Exponential smoothing keeps the same feel at different frame rates.
        const follow = 1 - Math.exp(-(castleLayout ? 4.4 : 7) * dt);
        camera = clampCamera(camera + (targetCameraX - camera) * follow, worldW, viewW);
        cameraY = clampCamera(cameraY + (targetCameraY - cameraY) * follow, worldH, viewH);
      }
      if (clockLevel && player.hurt <= 0) for (const gear of clockLevel.gears) {
        const dx = player.x + player.w / 2 - gear.x, dy = player.y + player.h / 2 - gear.y;
        if (gear.dangerous && dx * dx + dy * dy < (gear.radius * .42) ** 2) { damagePlayer(1, gear.x); break; }
      }
      shake *= .82;
      // Вход только по E: ArrowUp также отвечает за прыжок и раньше случайно
      // переключал локацию, когда игрок оказывался рядом с дверью.
      const bossGateLocked = enemies.some((enemy) => (enemy.kind === 'boss' || enemy.kind === 'rightHand') && !enemy.dead && !enemy.dormant);
      if (!activeDoor && tap(settingsRef.current.bindings.interact)) {
        const playerCenter = player.x + player.w / 2;
        const nearbyDoor = nearbyDoorForAction;
        const dormantBoss = stageTwoBossFight
          ? enemies.find((enemy) => enemy.kind === 'boss' && !enemy.dead && enemy.dormant)
          : undefined;
        if (nearbyDoor && dormantBoss) {
          // This interaction starts the arena encounter; it must never fall
          // through to the normal location-transition handling for this door.
          activeDoor = null;
          pressed.delete(settingsRef.current.bindings.interact);
          const selectedBossRoom = rooms.find((room) => nearbyDoor.x >= room.x && nearbyDoor.x < room.x + roomW && nearbyDoor.y >= room.y && nearbyDoor.y < room.y + roomH);
          if (selectedBossRoom) {
            stageTwoBossRoom = selectedBossRoom;
            stageTwoArenaGates = bossRoomGates(selectedBossRoom);
            dormantBoss.x = Math.max(selectedBossRoom.x + wall + 20, nearbyDoor.x - dormantBoss.w - 105);
            dormantBoss.y = swampLayout ? 3235 - dormantBoss.h : selectedBossRoom.y + roomH - wall - dormantBoss.h;
            dormantBoss.homeY = dormantBoss.y;
            dormantBoss.left = selectedBossRoom.x + wall + 20;
            dormantBoss.right = selectedBossRoom.x + roomW - wall - 20;
            dormantBoss.facing = Math.sign(playerCenter - (dormantBoss.x + dormantBoss.w / 2)) || -1;
          }
          dormantBoss.dormant = false; dormantBoss.sawPlayer = true; dormantBoss.alertTimer = .8;
          lockStageTwoArena(); shake = 12;
          // Closing the arena can briefly move the player off the last sampled
          // floor. Preserve the position at the chapel door instead of letting
          // hazard recovery send the player back to the level entrance.
          checkpoint.x = player.x; checkpoint.y = player.y;
          safeGroundTime = 0; hazardRecovery = 0; hazardTeleported = false;
          camera = clampCamera(player.x + player.w / 2 - viewW / 2, worldW, viewW);
          cameraY = clampCamera(player.y + player.h / 2 - viewH / 2, worldH, viewH);
          showBossIntroduction(location === 'swamps' ? 'Болотный Гигант' : location === 'mines' ? 'Каменный Голем' : 'Правая Рука Короля');
        } else if (nearbyDoor && !bossGateLocked) { activeDoor = nearbyDoor; activeDoor.opening = .55; playUiSound(settingsRef.current.effectsVolume, 'door'); }
      }
      if (activeDoor) {
        activeDoor.opening -= dt;
        if (activeDoor.opening <= 0) { const destination = activeDoor.destination; activeDoor = null; if (location === 'prison') unlockAchievement('escape'); else if (location === 'swamps') unlockAchievement('swamp_guide'); else if (location === 'mines') unlockAchievement('miner'); else if (location === 'clock') unlockAchievement('clockmaker'); runProgress.current.maxHp = player.maxHp; runProgress.current.hp = player.maxHp; runProgress.current.shards = shards; writeChronicle(); setPendingDestination(destination); setShopVisit((visit) => visit + 1); setAlchemistRelicOffers(chooseRelics(runProgress.current.relics)); pausedRef.current = true; setShopOpen(true); refreshShop((value) => value + 1); return; }
      }
      uiTimer -= dt;
      if (uiTimer <= 0) { uiTimer = .08; setHud({ hp: player.hp, maxHp: player.maxHp, shards, kills, grenade: Math.max(0, grenadeCd), trap: Math.max(0, trapCd), message: player.dead ? 'ВЫ ПРОИГРАЛИ' : '' }); }
    };

    const drawCanvas = () => {
      const sx = settingsRef.current.screenShake ? (Math.random() - .5) * shake : 0, sy = settingsRef.current.screenShake ? (Math.random() - .5) * shake : 0;
      ctx.save(); ctx.translate(sx, sy);
      drawParallaxBackground(ctx, location, W, H);
      const now = gameTime;
      for (const enemy of enemies) if (!enemy.dead && (enemy.variant === 'cryptWarden' || enemy.variant === 'bridgeColossus') && enemy.specialAttack === 1 && enemy.attack > .78) {
        const length = enemy.variant === 'bridgeColossus' ? 330 : 260, startX = enemy.facing > 0 ? enemy.x + enemy.w : enemy.x - length;
        ctx.save(); ctx.globalAlpha = .22 + Math.sin(now * 20) * .1; ctx.fillStyle = '#ef4444'; ctx.fillRect(startX, enemy.y + 20, length, enemy.h - 30); ctx.globalAlpha = .9; ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 2; ctx.setLineDash([12, 7]); ctx.strokeRect(startX, enemy.y + 20, length, enemy.h - 30); ctx.setLineDash([]); ctx.restore();
      }
      if (bridgeLayout) {
        if (bridgeLevel) {
          const windForce = bridgeWindAmount(now, bridgeLevel.wind);
          if (Math.abs(windForce) > 30) for (let i = 0; i < 22; i += 1) {
            const direction = Math.sign(windForce), travel = (now * (360 + i * 7)) % (W + 260);
            const x = direction > 0 ? travel - 180 : W - travel + 180, y = 85 + (i * 73) % Math.max(120, H - 150);
            ctx.strokeStyle = `rgba(255,255,255,${.18 + (i % 4) * .08})`; ctx.lineWidth = 2 + i % 2;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - direction * (75 + i % 5 * 18), y + (i % 3 - 1) * 3); ctx.stroke();
          }
        }
      }
      drawParallaxLayers(ctx, location, W, H, camera, cameraY);
      ctx.fillStyle = 'rgba(68,74,119,.14)';
      if (!bridgeLayout) for (let y = 95; y < H; y += 42) for (let x = -60; x < W + 80; x += 92) { const offset = Math.floor(y / 42) % 2 ? 42 : 0; ctx.fillRect(x + offset, y, 76, 3); }
      ctx.fillStyle = 'rgba(255,255,255,.018)'; for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 1);
      ctx.fillStyle = 'rgba(6,8,20,.38)'; if (!bridgeLayout) for (let i = 0; i < 12; i++) { const x = ((i * 233 - camera * .18) % 1500) - 100; ctx.fillRect(x, 120 + (i % 3) * 45, 110, 500); }
      if (!bridgeLayout && !castleLayout) for (const torch of torches) {
        const x = ((torch.x - camera * .22) % (W + 220)) - 30, y = ((torch.y - cameraY * .35) % (H + 140)) - 40, flicker = 1 + Math.sin(now * 9 + torch.phase) * .18 + Math.sin(now * 17 + torch.phase) * .08;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(x, y, 2, x, y, 64 * flicker);
        glow.addColorStop(0, 'rgba(255,214,128,.24)'); glow.addColorStop(.3, 'rgba(255,154,55,.115)'); glow.addColorStop(1, 'rgba(255,112,24,0)');
        ctx.fillStyle = glow; ctx.fillRect(x - 74, y - 74, 148, 148);
        ctx.restore();
        ctx.fillStyle = '#5b4336'; ctx.fillRect(x - 3, y + 7, 6, 15);
        ctx.save(); ctx.shadowColor = theme.flame; ctx.shadowBlur = 10 * flicker;
        ctx.fillStyle = theme.flame; ctx.fillRect(x - 5 * flicker, y - 8 * flicker, 10 * flicker, 16 * flicker);
        ctx.shadowColor = theme.flameCore; ctx.shadowBlur = 5 * flicker;
        ctx.fillStyle = theme.flameCore; ctx.fillRect(x - 2 * flicker, y - 5 * flicker, 5 * flicker, 9 * flicker); ctx.restore();
      }
      ctx.fillStyle = theme.mist; if (!bridgeLayout && !castleLayout) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(((i * 390 - camera * .08 + now * 8) % 1700) - 180, 470 + i * 42, 250, 38, 0, 0, Math.PI * 2); ctx.fill(); }
      const sceneZoom = ZOOM + (finaleSequence ? .16 : 0); ctx.save(); ctx.scale(sceneZoom, sceneZoom); ctx.translate(-camera, -cameraY);
      if (!swampLayout && !cryptLayout) for (const room of rooms) {
        ctx.fillStyle = castleLayout ? ((room.col + room.row) % 2 ? '#21172a' : '#191a2c') : cryptLayout ? 'rgba(3,1,10,.44)' : room.connections.size === 1 ? 'rgba(45,64,61,.16)' : 'rgba(8,14,18,.16)';
        ctx.fillRect(room.x + wall, room.y + wall, roomW - wall * 2, roomH - wall * 2);
        ctx.strokeStyle = castleLayout ? 'rgba(224,185,79,.2)' : cryptLayout ? 'rgba(22,140,255,.08)' : 'rgba(255,255,255,.035)'; ctx.lineWidth = 3;
        ctx.strokeRect(room.x + wall, room.y + wall, roomW - wall * 2, roomH - wall * 2);
        if (prisonLayout) {
          // Repeating barred cell fronts turn the wide rooms into prison corridors.
          for (let cellX = room.x + 105; cellX < room.x + roomW - 100; cellX += 165) {
            ctx.fillStyle = '#11191d'; ctx.fillRect(cellX - 8, room.y + 62, 82, 108);
            ctx.strokeStyle = '#52645f'; ctx.lineWidth = 5; ctx.strokeRect(cellX - 8, room.y + 62, 82, 108);
            for (let barX = cellX + 5; barX < cellX + 68; barX += 15) { ctx.fillStyle = '#293b3d'; ctx.fillRect(barX, room.y + 65, 5, 102); }
            ctx.fillStyle = '#71877b'; ctx.fillRect(cellX + 58, room.y + 112, 8, 7);
          }
        }
      }
      if (castleLevel) drawCastleBackdrop(ctx, castleLevel, now);
      for (const mirror of castleMirrors) {
        const besideDoor = doors.some((door) => Math.abs(player.x + player.w / 2 - (door.x + door.w / 2)) < 72 && Math.abs(player.y + player.h - (door.y + door.h)) < 30);
        const nearby = !besideDoor && Math.abs(player.x + player.w / 2 - (mirror.x + mirror.w / 2)) < 74 && Math.abs(player.y + player.h - (mirror.y + mirror.h)) < 80;
        drawCastleMirror(ctx, mirror, now, nearby);
      }
      for (const statue of crossbowStatues) drawCrossbowStatue(ctx, statue);
      if (cryptLevel) for (const column of cryptLevel.columns) {
        ctx.globalAlpha = .35 + column.depth * .35;
        const gradient = ctx.createLinearGradient(column.x, 0, column.x + column.w, 0);
        gradient.addColorStop(0, '#080611'); gradient.addColorStop(.5, '#30234b'); gradient.addColorStop(1, '#05040c');
        ctx.fillStyle = gradient; ctx.fillRect(column.x, column.y, column.w, column.h);
        ctx.fillStyle = '#3e3260'; ctx.fillRect(column.x - 13, column.y, column.w + 26, 18);
        ctx.fillRect(column.x - 17, column.y + column.h - 22, column.w + 34, 22);
        ctx.globalAlpha = 1;
      }
      ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left'; for (const sign of loreSigns) { ctx.globalAlpha = sign.alpha; ctx.fillStyle = '#c9a46a'; ctx.fillText(sign.text, sign.x, sign.y); ctx.fillStyle = '#4b1d22'; ctx.fillRect(sign.x - 8, sign.y + 7, 4, 4); } ctx.globalAlpha = 1;
      ctx.globalAlpha = .45; ctx.fillStyle = theme.stone;
      for (const bridge of oneWays) { ctx.fillRect(bridge.x + 10, bridge.y + bridge.h, 8, 24); ctx.fillRect(bridge.x + bridge.w - 18, bridge.y + bridge.h, 8, 24); }
      ctx.globalAlpha = 1;
      const stoneStyle: EnvironmentTileStyle = { material: 'stone', base: bridgeLayout ? '#858b91' : castleLayout ? '#66503f' : theme.stone, dark: bridgeLayout ? '#454b52' : theme.mortar, edge: bridgeLayout ? '#c4c9cd' : theme.accent, moss: swampLayout ? '#718c35' : prisonLayout ? '#48635a' : cryptLayout ? '#293c72' : '#39483e', wet: prisonLayout || swampLayout || cryptLayout };
      for (const tile of solids) drawEnvironmentTile(ctx, tile, stoneStyle);
      for (const tile of oneWays) {
        const clockPlatform = tile as ClockPlatform;
        if (clockPlatform.disappearing) {
          const visibility = Math.sin(now * 1.45 + (clockPlatform.phase || 0));
          ctx.globalAlpha = visibility < -.18 ? .12 : Math.max(.28, .7 + visibility * .3);
        }
        const bridgePlatform = tile as BridgePlatform;
        if (bridgeLayout && bridgePlatform.kind === 'suspension') {
          ctx.strokeStyle = '#66534d'; ctx.lineWidth = 4; ctx.beginPath();
          ctx.moveTo(tile.x, tile.y - 32); ctx.quadraticCurveTo(tile.x + tile.w / 2, tile.y + 24, tile.x + tile.w, tile.y - 32); ctx.stroke();
          for (let x = tile.x; x < tile.x + tile.w; x += 28) { ctx.fillStyle = '#aeb2b6'; ctx.fillRect(x, tile.y, 23, tile.h); ctx.fillStyle = '#777c82'; ctx.fillRect(x + 2, tile.y + 5, 19, 3); }
        } else {
          const wooden = prisonLayout || swampLayout || mineLayout || castleLayout;
          drawEnvironmentTile(ctx, tile, { ...stoneStyle, material: wooden ? 'wood' : 'stone', base: castleLayout ? '#694326' : prisonLayout ? '#493629' : swampLayout ? '#554125' : mineLayout ? '#60432c' : stoneStyle.base, dark: wooden ? '#21150f' : stoneStyle.dark, edge: wooden ? '#8a6940' : stoneStyle.edge });
        }
        ctx.globalAlpha = 1;
      }
      if (cryptLevel) for (const secret of cryptLevel.secrets) if (!secret.broken) {
        const { wall: cracked } = secret;
        ctx.fillStyle = '#181324'; ctx.fillRect(cracked.x, cracked.y, cracked.w, cracked.h);
        ctx.shadowColor = '#168cff'; ctx.shadowBlur = 8; ctx.strokeStyle = '#347fd1'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cracked.x + 8, cracked.y + 12); ctx.lineTo(cracked.x + 30, cracked.y + 46); ctx.lineTo(cracked.x + 15, cracked.y + 79); ctx.lineTo(cracked.x + 38, cracked.y + 116); ctx.lineTo(cracked.x + 22, cracked.y + 151); ctx.stroke(); ctx.shadowBlur = 0;
      }
      if (clockLevel) {
        for (const vent of clockLevel.vents) {
          ctx.fillStyle = '#261710'; ctx.fillRect(vent.x, vent.y + vent.h - 22, vent.w, 22);
          for (let x = vent.x + 12; x < vent.x + vent.w; x += 24) { ctx.fillStyle = '#9a6a38'; ctx.fillRect(x, vent.y + vent.h - 20, 7, 18); }
          ctx.strokeStyle = 'rgba(238,224,184,.35)'; ctx.lineWidth = 3;
          for (let stream = 0; stream < 9; stream += 1) { const x = vent.x + 18 + stream * (vent.w - 36) / 8, rise = (now * 230 + stream * 83 + vent.phase * 50) % vent.h; ctx.beginPath(); ctx.moveTo(x, vent.y + vent.h - rise); ctx.lineTo(x + Math.sin(now * 3 + stream) * 9, vent.y + vent.h - rise - 72); ctx.stroke(); }
        }
        for (const chain of clockLevel.chains) { ctx.strokeStyle = '#8c632f'; ctx.lineWidth = 4; for (let y = chain.y; y < chain.y + chain.length; y += 15) { ctx.beginPath(); ctx.ellipse(chain.x, y, 6, 9, (Math.floor(y / 15) % 2) * Math.PI / 2, 0, Math.PI * 2); ctx.stroke(); } }
        for (const gear of clockLevel.gears) { ctx.save(); ctx.translate(gear.x, gear.y); ctx.rotate(now * gear.speed + gear.phase); ctx.fillStyle = '#7b4825'; ctx.strokeStyle = '#e0ad4f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, gear.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); for (let tooth = 0; tooth < 12; tooth += 1) { ctx.rotate(Math.PI / 6); ctx.fillStyle = tooth % 2 ? '#b87930' : '#d3a348'; ctx.fillRect(gear.radius - 3, -4, 40, 8); } ctx.fillStyle = '#21100c'; ctx.beginPath(); ctx.arc(0, 0, gear.radius * .32, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
      if (minesLevel) drawMines(ctx, minesLevel);
      if (minesLevel) drawMineMechanics(ctx, minesLevel.carts);
      const cartPrompt = minesLevel?.carts.find((cart) => !cart.moving
        && Math.abs(player.x + player.w / 2 - (cart.x + cart.w / 2)) < 92
        && Math.abs(player.y + player.h - (cart.y + cart.h)) < 70);
      if (cartPrompt) {
        const centerX = cartPrompt.x + cartPrompt.w / 2;
        const promptY = cartPrompt.y - 24;
        ctx.fillStyle = 'rgba(3,7,12,.95)'; ctx.fillRect(centerX - 73, promptY, 146, 18);
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1; ctx.strokeRect(centerX - 73, promptY, 146, 18);
        ctx.fillStyle = '#fde68a'; ctx.font = 'bold 9px ui-sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('E · ТОЛКНУТЬ ВАГОНЕТКУ', centerX, promptY + 12); ctx.textAlign = 'start';
      }
      if (cryptLevel) drawCryptMechanics(ctx, cryptLevel.crumblingSlabs, cryptLevel.ghostPlatforms, now);
      if (swampLevel) {
        const poison = swampLevel.poison;
        const arenaLeft = SWAMP_WORLD.width - 1100, arenaRoof = 2585, arenaFloor = 3235, entranceTop = 2935;
        // A compact physical chamber grown inside a massive dead tree.
        ctx.fillStyle = 'rgba(12,20,14,.9)'; ctx.fillRect(arenaLeft, arenaRoof, 1100, arenaFloor - arenaRoof);
        ctx.fillStyle = '#342719'; ctx.fillRect(arenaLeft, arenaRoof, 1100, 42); ctx.fillRect(SWAMP_WORLD.width - 42, arenaRoof, 42, arenaFloor - arenaRoof);
        ctx.fillRect(arenaLeft, arenaRoof, 42, entranceTop - arenaRoof);
        ctx.fillStyle = '#49351f'; ctx.fillRect(arenaLeft, arenaFloor, 1100, 34);
        ctx.fillStyle = '#594126';
        for (let x = arenaLeft; x < SWAMP_WORLD.width; x += 72) { ctx.fillRect(x, arenaRoof + 8 + (x % 3) * 5, 58, 18); }
        ctx.strokeStyle = '#71813a'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(arenaLeft, arenaRoof + 5); ctx.quadraticCurveTo(arenaLeft + 360, arenaRoof - 105, SWAMP_WORLD.width, arenaRoof + 8); ctx.stroke();
        ctx.fillStyle = 'rgba(166,210,65,.12)';
        for (let x = arenaLeft + 90; x < SWAMP_WORLD.width - 40; x += 145) { ctx.beginPath(); ctx.arc(x, arenaRoof + 165 + (x % 4) * 70, 42, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#171d13'; ctx.fillRect(arenaLeft - 8, entranceTop - 16, 58, 16);
        ctx.fillStyle = '#879239'; ctx.fillRect(arenaLeft - 5, entranceTop - 16, 52, 4);
        const sludge = ctx.createLinearGradient(0, poison.y, 0, poison.y + poison.h); sludge.addColorStop(0, '#b4ef2b'); sludge.addColorStop(.18, '#668f18'); sludge.addColorStop(1, '#24340e');
        ctx.fillStyle = sludge; ctx.fillRect(poison.x, poison.y, poison.w, poison.h);
        ctx.fillStyle = '#d9ff62';
        for (let x = 8; x < worldW; x += 34) { const wave = Math.sin(now * 3.2 + x * .035) * 5; ctx.fillRect(x, poison.y + wave, 19, 4); }
        for (const platform of swampPlatforms) {
          if (platform.kind === 'hummock') {
            ctx.fillStyle = '#493721'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
            ctx.fillStyle = '#687b2c'; ctx.fillRect(platform.x, platform.y, platform.w, 16);
            ctx.fillStyle = '#93a83a'; for (let x = platform.x + 8; x < platform.x + platform.w; x += 24) ctx.fillRect(x, platform.y - 5 - (x % 3) * 2, 15, 8);
            ctx.fillStyle = '#302719'; for (let y = platform.y + 45; y < platform.y + platform.h; y += 54) ctx.fillRect(platform.x + 18 + (y % 5) * 17, y, 34, 8);
          } else if (platform.kind === 'bridge') {
            ctx.strokeStyle = '#6d5532'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(platform.x, platform.y - 18); ctx.quadraticCurveTo(platform.x + platform.w / 2, platform.y + 18, platform.x + platform.w, platform.y - 18); ctx.stroke();
            for (let x = platform.x; x < platform.x + platform.w; x += 28) { ctx.fillStyle = x % 56 ? '#725337' : '#876342'; ctx.fillRect(x, platform.y, 24, platform.h); }
          } else {
            ctx.fillStyle = platform.kind === 'branch' ? '#4a3521' : '#755538'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
            ctx.fillStyle = '#879239'; ctx.fillRect(platform.x + 5, platform.y, platform.w - 10, 4);
            if (platform.kind === 'swing') { ctx.strokeStyle = '#66543a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(platform.x + 12, platform.y); ctx.lineTo(platform.x + 12, platform.y - 175); ctx.moveTo(platform.x + platform.w - 12, platform.y); ctx.lineTo(platform.x + platform.w - 12, platform.y - 175); ctx.stroke(); }
          }
        }
      }
      for (const gate of prisonGates) if (!gate.opened) {
        ctx.fillStyle = '#11191d'; ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
        ctx.strokeStyle = '#647f78'; ctx.lineWidth = 3; ctx.strokeRect(gate.x + 2, gate.y + 2, gate.w - 4, gate.h - 4);
        ctx.fillStyle = '#35484a'; for (let x = gate.x + 7; x < gate.x + gate.w - 3; x += 10) ctx.fillRect(x, gate.y + 4, 4, gate.h - 8);
        const near = Math.abs(player.x + player.w / 2 - (gate.x + gate.w / 2)) < 76 && player.y + player.h > gate.y - 20 && player.y < gate.y + gate.h + 20;
        if (near) { ctx.fillStyle = 'rgba(3,7,12,.9)'; ctx.fillRect(gate.x - 31, gate.y - 27, 106, 19); ctx.fillStyle = '#9bb7a8'; ctx.font = 'bold 10px ui-sans-serif'; ctx.fillText('E · ОТКРЫТЬ', gate.x - 18, gate.y - 14); }
      }
      drawGateFragments(ctx, gateFragments);
      for (const chain of chains) { ctx.strokeStyle = '#69707c'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = chain.y; y < chain.y + chain.length; y += 9) { ctx.moveTo(chain.x - 2, y); ctx.lineTo(chain.x + 2, y + 5); ctx.lineTo(chain.x - 2, y + 9); } ctx.stroke(); }
      if (location === 'throne') {
        const throneBossAlive = enemies.some((enemy) => enemy.kind === 'rightHand' && !enemy.dead);
        const hallLeft = startRoom.x + wall, hallTop = startRoom.y + wall, hallFloor = startRoom.y + roomH - wall;
        ctx.fillStyle = '#070a10'; ctx.fillRect(hallLeft, hallTop, roomW - wall * 2, roomH - wall * 2);
        for (const columnX of [hallLeft + 65, hallLeft + 245, hallLeft + 505, hallLeft + roomW - wall * 2 - 90]) { ctx.fillStyle = '#161a23'; ctx.fillRect(columnX, hallTop + 28, 46, hallFloor - hallTop - 28); ctx.fillStyle = '#292e3a'; ctx.fillRect(columnX - 10, hallTop + 20, 66, 14); ctx.fillRect(columnX - 12, hallFloor - 25, 70, 25); ctx.fillStyle = '#090c12'; ctx.fillRect(columnX + 9, hallTop + 45, 8, hallFloor - hallTop - 78); }
        const glassX = throne.x - 92, glassY = hallTop + 34, glassW = throne.w + 184, glassH = 190;
        const glassGlow = ctx.createLinearGradient(glassX, glassY, glassX, glassY + glassH); glassGlow.addColorStop(0, '#453052'); glassGlow.addColorStop(.55, '#a94f50'); glassGlow.addColorStop(1, '#e79152'); ctx.fillStyle = glassGlow; ctx.fillRect(glassX, glassY, glassW, glassH);
        ctx.strokeStyle = '#211d29'; ctx.lineWidth = 9; ctx.strokeRect(glassX, glassY, glassW, glassH); ctx.beginPath(); ctx.moveTo(glassX + glassW / 2, glassY); ctx.lineTo(glassX + glassW / 2, glassY + glassH); ctx.moveTo(glassX, glassY + 72); ctx.lineTo(glassX + glassW, glassY + 72); ctx.moveTo(glassX + 22, glassY); ctx.lineTo(glassX + glassW - 20, glassY + glassH); ctx.moveTo(glassX + glassW - 30, glassY); ctx.lineTo(glassX + 38, glassY + glassH); ctx.stroke();
        const ray = ctx.createLinearGradient(glassX, glassY + glassH, throne.x, hallFloor); ray.addColorStop(0, 'rgba(255,168,85,.22)'); ray.addColorStop(1, 'rgba(255,168,85,0)'); ctx.fillStyle = ray; ctx.beginPath(); ctx.moveTo(glassX + 20, glassY + glassH); ctx.lineTo(glassX + glassW - 20, glassY + glassH); ctx.lineTo(throne.x + throne.w + 120, hallFloor); ctx.lineTo(throne.x - 105, hallFloor); ctx.closePath(); ctx.fill();
        for (const bannerX of [hallLeft + 145, hallLeft + roomW - wall * 2 - 195]) { ctx.fillStyle = '#541927'; ctx.beginPath(); ctx.moveTo(bannerX, hallTop + 25); ctx.lineTo(bannerX + 55, hallTop + 25); ctx.lineTo(bannerX + 48, hallTop + 164); ctx.lineTo(bannerX + 34, hallTop + 147); ctx.lineTo(bannerX + 19, hallTop + 174); ctx.lineTo(bannerX + 6, hallTop + 139); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#84642d'; ctx.fillRect(bannerX - 6, hallTop + 19, 67, 6); }
        ctx.fillStyle = '#302713'; ctx.fillRect(throne.x, throne.y, throne.w, throne.h); ctx.fillStyle = '#9b762e'; ctx.fillRect(throne.x + 8, throne.y + 8, throne.w - 16, 8); ctx.fillRect(throne.x + 12, throne.y + 20, 8, throne.h - 20); ctx.fillRect(throne.x + throne.w - 20, throne.y + 20, 8, throne.h - 20); ctx.fillStyle = '#5c1830'; ctx.fillRect(throne.x + 22, throne.y + 25, throne.w - 44, throne.h - 35);
        ctx.fillStyle = '#b58a38'; ctx.fillRect(royalArmor.x + 5, royalArmor.y, 35, 9); ctx.fillRect(royalArmor.x, royalArmor.y + 14, 45, 34); ctx.fillStyle = '#f0c65a'; ctx.fillRect(royalArmor.x + 8, royalArmor.y + 18, 29, 5); ctx.fillStyle = '#151619'; ctx.fillRect(royalArmor.x + 12, royalArmor.y + 4, 22, 8); ctx.fillStyle = '#77612d'; ctx.fillRect(royalArmor.x + 7, royalArmor.y + 48, 11, 26); ctx.fillRect(royalArmor.x + 27, royalArmor.y + 48, 11, 26);
        ctx.fillStyle = '#10141c'; ctx.beginPath(); ctx.moveTo(throne.x - 17, throne.y + throne.h); ctx.lineTo(throne.x - 17, throne.y - 5); ctx.lineTo(throne.x + 5, throne.y - 35); ctx.lineTo(throne.x + throne.w / 2, throne.y - 70); ctx.lineTo(throne.x + throne.w - 5, throne.y - 35); ctx.lineTo(throne.x + throne.w + 17, throne.y - 5); ctx.lineTo(throne.x + throne.w + 17, throne.y + throne.h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#765724'; ctx.fillRect(throne.x - 10, throne.y + 5, 7, throne.h - 5); ctx.fillRect(throne.x + throne.w + 3, throne.y + 5, 7, throne.h - 5); ctx.fillRect(throne.x + 7, throne.y + throne.h - 19, throne.w - 14, 7); ctx.fillStyle = '#681c2c'; ctx.fillRect(throne.x + 14, throne.y - 4, throne.w - 28, 50); ctx.fillRect(throne.x + 8, throne.y + 50, throne.w - 16, 23); ctx.fillStyle = '#3b0e19'; ctx.fillRect(throne.x + 20, throne.y + 3, 4, 36); ctx.fillRect(throne.x + throne.w - 24, throne.y, 3, 39);
        ctx.strokeStyle = '#343a45'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(throne.x - 8, throne.y + 42); ctx.lineTo(throne.x + 10, throne.y + 27); ctx.lineTo(throne.x + 2, throne.y + 14); ctx.moveTo(throne.x + throne.w + 7, throne.y + 52); ctx.lineTo(throne.x + throne.w - 11, throne.y + 35); ctx.lineTo(throne.x + throne.w - 2, throne.y + 19); ctx.stroke();
        if (!throneBossAlive && !finaleSequence && Math.abs(player.x + player.w / 2 - (royalArmor.x + royalArmor.w / 2)) < 72) { ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.fillRect(royalArmor.x - 40, royalArmor.y - 28, 130, 19); ctx.fillStyle = '#e7c66d'; ctx.font = 'bold 9px monospace'; ctx.fillText('E · ОСМОТРЕТЬ', royalArmor.x - 25, royalArmor.y - 15); }
        if (!throneBossAlive && !finaleSequence && Math.abs(player.x + player.w / 2 - (throne.x + throne.w / 2)) < 82) { ctx.fillStyle = 'rgba(0,0,0,.88)'; ctx.fillRect(throne.x - 28, throne.y - 28, 128, 19); ctx.fillStyle = '#f0c65a'; ctx.font = 'bold 9px monospace'; ctx.fillText('E · СЕСТЬ НА ТРОН', throne.x - 19, throne.y - 15); }
        if (finaleSequence) { const kneeling = finaleTimer > 2.1, servantFloor = hallFloor; ctx.fillStyle = '#d1a77d'; ctx.fillRect(servantX - 6, servantFloor - (kneeling ? 43 : 62), 17, 13); ctx.fillStyle = '#2b3039'; ctx.fillRect(servantX - 10, servantFloor - (kneeling ? 30 : 49), 25, kneeling ? 25 : 38); ctx.fillStyle = '#7f2434'; ctx.fillRect(servantX - 14, servantFloor - (kneeling ? 34 : 53), 33, 9); ctx.fillStyle = '#151922'; ctx.fillRect(servantX - 8, servantFloor - 7, 12, 7); ctx.fillRect(servantX + (kneeling ? 2 : 7), servantFloor - 7, kneeling ? 20 : 10, 7); ctx.fillStyle = '#9b7634'; ctx.fillRect(servantX - 5, servantFloor - (kneeling ? 39 : 58), 15, 3); }
        if (!throneGateOpen) drawFinalStoneWall(ctx, throneGate);
      }
      for (const column of throneColumns) drawThroneColumn(ctx, column);
      for (const spike of spikes) {
        ctx.fillStyle = '#05070a'; ctx.fillRect(spike.x - 3, spike.y + spike.h - 5, spike.w + 6, 8);
        for (let x = spike.x; x < spike.x + spike.w; x += 15) { ctx.beginPath(); ctx.moveTo(x, spike.y + spike.h); ctx.lineTo(x + 7, spike.y); ctx.lineTo(x + 15, spike.y + spike.h); ctx.closePath(); ctx.fillStyle = '#252a31'; ctx.fill(); ctx.strokeStyle = '#020305'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#e2e8f0'; ctx.fillRect(x + 6, spike.y + 3, 2, 6); }
        ctx.fillStyle = '#9a6b22'; ctx.fillRect(spike.x, spike.y + spike.h - 4, spike.w, 4); ctx.fillStyle = '#fbbf24'; ctx.fillRect(spike.x + 4, spike.y + spike.h - 4, spike.w - 8, 1);
      }
      // A second, screen-space light pass is drawn after the level geometry so
      // torchlight softly washes over nearby walls and platforms as it flickers.
      if (!bridgeLayout && !castleLayout) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
        for (const torch of torches) {
          const x = ((torch.x - camera * .22) % (W + 220)) - 30, y = ((torch.y - cameraY * .35) % (H + 140)) - 40;
          const pulse = 1 + Math.sin(now * 7.5 + torch.phase) * .055 + Math.sin(now * 13.7 + torch.phase * 1.6) * .025;
          const light = ctx.createRadialGradient(x, y, 8, x, y, 112 * pulse);
          light.addColorStop(0, 'rgba(255,205,115,.105)'); light.addColorStop(.42, 'rgba(255,145,48,.045)'); light.addColorStop(1, 'rgba(255,105,24,0)');
          ctx.fillStyle = light; ctx.fillRect(x - 125, y - 125, 250, 250);
        }
        ctx.restore();
      }
      for (const reward of explorationRewards) {
        const centerX = reward.x + reward.w / 2, baseY = reward.y + reward.h;
        const aura = ctx.createRadialGradient(centerX, baseY - 24, 4, centerX, baseY - 24, 92);
        aura.addColorStop(0, reward.collected ? 'rgba(99,102,241,.09)' : 'rgba(139,92,246,.3)');
        aura.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = aura; ctx.fillRect(centerX - 92, baseY - 116, 184, 150);
        for (const side of [-1, 1]) {
          const torchX = centerX + side * 52;
          ctx.fillStyle = '#392e48'; ctx.fillRect(torchX - 3, baseY - 28, 6, 28);
          ctx.shadowColor = '#8b5cf6'; ctx.shadowBlur = reward.collected ? 5 : 16;
          ctx.fillStyle = reward.collected ? '#4c3c70' : '#8b5cf6';
          ctx.beginPath(); ctx.arc(torchX, baseY - 34 + Math.sin(now * 5 + reward.phase + side) * 2, 7, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
        if (!reward.collected) for (let mote = 0; mote < 8; mote += 1) {
          const drift = Math.sin(now * .9 + reward.phase + mote * 1.7) * 28;
          const dustY = baseY - 12 - ((now * 18 + mote * 19 + reward.phase * 10) % 90);
          ctx.globalAlpha = .25 + (mote % 3) * .16; ctx.fillStyle = mote % 2 ? '#c4b5fd' : '#60a5fa';
          ctx.beginPath(); ctx.arc(centerX + drift, dustY, 1.5 + mote % 2, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (reward.collected) continue;
        const bobY = reward.y + Math.sin(now * 2.4 + reward.phase) * 3;
        ctx.shadowColor = reward.kind === 'goldChest' ? '#fbbf24' : '#8b5cf6'; ctx.shadowBlur = 15;
        if (reward.kind === 'goldChest') {
          ctx.fillStyle = '#7c4a18'; ctx.fillRect(reward.x, bobY + 15, reward.w, 27); ctx.fillStyle = '#d99b2b'; ctx.fillRect(reward.x - 2, bobY + 8, reward.w + 4, 14); ctx.fillStyle = '#fde68a'; ctx.fillRect(centerX - 4, bobY + 19, 8, 12);
        } else if (reward.kind === 'weaponPedestal') {
          ctx.fillStyle = '#403553'; ctx.fillRect(reward.x + 3, bobY + 31, reward.w - 6, 11); ctx.fillStyle = '#75618f'; ctx.fillRect(reward.x + 8, bobY + 23, reward.w - 16, 9); ctx.fillStyle = '#bae6fd'; ctx.fillRect(centerX - 3, bobY - 3, 6, 27); ctx.fillRect(centerX - 12, bobY + 17, 24, 4);
        } else {
          ctx.fillStyle = '#44335c'; ctx.fillRect(reward.x + 5, bobY + 32, reward.w - 10, 10); ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(centerX, bobY + 15, 14, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(centerX, bobY + 15, 7, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
        if (Math.abs(player.x + player.w / 2 - centerX) < 105) {
          const label = touchControls ? (reward.kind === 'weaponPedestal' ? 'НАЖМИТЕ НА ОРУЖИЕ' : 'НАЖМИТЕ НА ОБЪЕКТ') : reward.kind === 'goldChest' ? 'E · ОТКРЫТЬ СУНДУК' : reward.kind === 'healthAltar' ? 'E · КОСНУТЬСЯ АЛТАРЯ' : `E · ВЗЯТЬ ${reward.gear?.name ?? 'ОРУЖИЕ'}`;
          ctx.font = 'bold 9px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(3,7,12,.92)'; ctx.fillRect(centerX - 78, bobY - 27, 156, 18); ctx.fillStyle = '#ddd6fe'; ctx.fillText(label, centerX, bobY - 15); ctx.textAlign = 'start';
        }
      }
      for (const event of roomEvents) if (!event.resolved) {
        const centerX = event.x + event.w / 2, bobY = event.y + Math.sin(now * 2.5 + event.phase) * 3;
        const color = event.kind === 'cursedChest' ? '#c084fc' : event.kind === 'fountain' ? '#67e8f9' : event.kind === 'parkour' ? '#22d3ee' : event.kind === 'leverPuzzle' ? '#a78bfa' : '#fbbf24';
        ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.fillStyle = '#15121c'; ctx.fillRect(event.x, bobY + 12, event.w, 42);
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(event.x, bobY + 12, event.w, 42); ctx.shadowBlur = 0;
        ctx.fillStyle = color; ctx.font = 'bold 24px ui-sans-serif'; ctx.textAlign = 'center';
        const eventSymbol = event.kind === 'cursedChest' ? '◆' : event.kind === 'fountain' ? '♒' : event.kind === 'parkour' ? '⚑' : event.kind === 'leverPuzzle' ? '⇆' : '⚖';
        ctx.fillText(eventSymbol, centerX, bobY + 42);
        if (event.kind === 'parkour' && event.active && event.targetX !== undefined && event.targetY !== undefined) {
          const targetPulse = 1 + Math.sin(now * 7) * .12;
          ctx.save(); ctx.translate(event.targetX + 18, event.targetY + 24); ctx.scale(targetPulse, targetPulse);
          ctx.strokeStyle = '#22d3ee'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18; ctx.lineWidth = 3; ctx.strokeRect(-18, -24, 36, 48); ctx.restore();
          ctx.fillStyle = '#67e8f9'; ctx.font = 'bold 10px ui-sans-serif'; ctx.fillText(`${Math.max(0, event.timer ?? 0).toFixed(1)}с`, event.targetX + 18, event.targetY - 8);
        }
        if (Math.abs(player.x + player.w / 2 - centerX) < 105) {
          const sequence = event.sequence?.map((direction, index) => index < (event.sequenceProgress ?? 0) ? '✓' : direction === 'left' ? '←' : direction === 'right' ? '→' : '↑').join(' ');
          const label = event.kind === 'cursedChest' ? 'E · ОТДАТЬ 1 HP ЗА РЕЛИКВИЮ' : event.kind === 'fountain' ? 'E · ЗДОРОВЬЕ / АТАКА · ОСКОЛКИ' : event.kind === 'parkour' ? (event.active ? `ДОБЕРИСЬ ДО МАЯКА · ${(event.timer ?? 0).toFixed(1)}с` : 'E · НАЧАТЬ ИСПЫТАНИЕ') : event.kind === 'leverPuzzle' ? `РЫЧАГИ: ${sequence}` : 'E · ПОМОЩЬ СТРАННИКА';
          ctx.fillStyle = 'rgba(3,7,12,.94)'; ctx.fillRect(centerX - 93, bobY - 15, 186, 19); ctx.fillStyle = color; ctx.font = 'bold 8px ui-sans-serif'; ctx.fillText(label, centerX, bobY - 2);
        }
        ctx.textAlign = 'start';
      }
      for (const item of loot) if (!item.collected) {
        const iy = item.y + Math.sin(now * 2.6 + item.phase) * 4, skill = ['grenade', 'freeze', 'trap'].includes(item.gear.kind), color = item.gear.kind === 'freeze' ? '#67e8f9' : skill ? '#fb923c' : '#e9d5ff';
        ctx.shadowColor = color; ctx.shadowBlur = 13; ctx.fillStyle = '#24170d'; ctx.fillRect(item.x - 8, iy + 5, 42, 22); ctx.fillStyle = '#6b451f'; ctx.fillRect(item.x - 6, iy - 3, 38, 13); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(item.x - 8, iy + 5, 42, 22); ctx.strokeRect(item.x - 6, iy - 3, 38, 13); ctx.fillStyle = '#fbbf24'; ctx.fillRect(item.x + 10, iy + 7, 7, 9); ctx.shadowBlur = 0;
        ctx.fillStyle = color; if (item.gear.kind === 'sword') { ctx.fillRect(item.x + 11, iy, 4, 21); ctx.fillRect(item.x + 5, iy + 17, 16, 4); } else if (item.gear.kind === 'bow') { ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(item.x + 11, iy + 13, 10, -1.4, 1.4); ctx.stroke(); } else if (item.gear.kind === 'shield') { ctx.fillRect(item.x + 5, iy + 2, 16, 18); } else { ctx.fillRect(item.x + 5, iy + 5, 16, 16); }
        ctx.fillStyle = 'rgba(4,7,12,.9)'; ctx.fillRect(item.x - 45, iy - 22, 116, 12); ctx.fillStyle = color; ctx.font = 'bold 8px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${item.gear.name} · ${item.shardValue} 💎`, item.x + 13, iy - 13); ctx.textAlign = 'start';
        if (Math.abs(player.x + player.w / 2 - (item.x + 13)) < 105) {
          const equipped = runProgress.current.loadout[gearSlot(item.gear)], newDamage = Math.round(item.gear.damage * runProgress.current.damage), oldDamage = Math.round(equipped.damage * runProgress.current.damage);
          ctx.fillStyle = 'rgba(3,7,12,.95)'; ctx.fillRect(item.x - 55, iy - 81, 136, 54); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(item.x - 55, iy - 81, 136, 54);
          ctx.font = 'bold 9px ui-sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left'; ctx.fillText(`Старое: ${oldDamage} урона`, item.x - 47, iy - 52); ctx.fillStyle = newDamage >= oldDamage ? '#86efac' : '#fda4af'; ctx.fillText(`Новое:  ${newDamage} урона`, item.x - 47, iy - 37); ctx.textAlign = 'start';
          ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(touchControls ? 'НАЖМИТЕ НА ОРУЖИЕ' : 'E · ЗАМЕНИТЬ', item.x + 13, iy - 68); ctx.textAlign = 'start';
        }
      }
      for (const powerUp of powerUps) if (!powerUp.collected) {
        const py = powerUp.y + Math.sin(now * 3 + powerUp.phase) * 4, color = '#fb7185';
        ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(powerUp.x + 12, py); ctx.lineTo(powerUp.x + 24, py + 12); ctx.lineTo(powerUp.x + 12, py + 24); ctx.lineTo(powerUp.x, py + 12); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff7ed'; ctx.beginPath(); ctx.arc(powerUp.x + 12, py + 12, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(4,7,12,.82)'; ctx.fillRect(powerUp.x - 18, py - 18, 60, 13); ctx.fillStyle = color; ctx.font = 'bold 8px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MASK +1', powerUp.x + 12, py - 9); ctx.textAlign = 'start';
      }
      const activePortalCount = teleportPortals.filter((portal) => portal.active).length;
      for (const portal of teleportPortals) {
        const nearby = Math.abs(player.x + player.w / 2 - portal.x) < 76 && Math.abs(player.y + player.h - portal.y) < 72;
        drawTeleportPortal(ctx, portal, now, nearby, activePortalCount);
      }
      if (entranceDoor) {
        ctx.fillStyle = 'rgba(3,7,12,.9)';
        ctx.fillRect(entranceDoor.x - 7, entranceDoor.y - 9, entranceDoor.w + 14, entranceDoor.h + 9);
        ctx.strokeStyle = theme.accent; ctx.lineWidth = 3;
        ctx.strokeRect(entranceDoor.x - 4, entranceDoor.y - 6, entranceDoor.w + 8, entranceDoor.h + 6);
        ctx.fillStyle = theme.stone; ctx.fillRect(entranceDoor.x, entranceDoor.y, entranceDoor.w, entranceDoor.h);
        ctx.fillStyle = theme.accent;
        ctx.fillRect(entranceDoor.x + 8, entranceDoor.y + 12, entranceDoor.w - 16, 5);
        ctx.fillRect(entranceDoor.x + 8, entranceDoor.y + 34, entranceDoor.w - 16, 5);
        ctx.fillStyle = theme.flameCore;
        ctx.fillRect(entranceDoor.x + (entranceDoor.side === 'left' ? entranceDoor.w - 11 : 7), entranceDoor.y + 35, 4, 4);
      }
      for (const door of doors) {
        const locked = enemies.some((enemy) => (enemy.kind === 'boss' || enemy.kind === 'rightHand') && !enemy.dead && !enemy.dormant);
        const opening = activeDoor === door ? Math.max(0, door.opening / .55) : 1;
        ctx.fillStyle = 'rgba(3,7,12,.9)'; ctx.fillRect(door.x - 20, door.y - 31, door.w + 40, 17); ctx.fillStyle = locked ? '#9f3030' : theme.accent; ctx.font = 'bold 10px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(door.label, door.x + door.w / 2, door.y - 19); ctx.textAlign = 'start';
        ctx.fillStyle = '#11141c'; ctx.fillRect(door.x - 7, door.y - 9, door.w + 14, door.h + 9); ctx.strokeStyle = theme.accent; ctx.lineWidth = 3; ctx.strokeRect(door.x - 4, door.y - 6, door.w + 8, door.h + 6);
        ctx.fillStyle = theme.stone; ctx.fillRect(door.x, door.y, door.w * opening, door.h);
        ctx.fillStyle = theme.accent; ctx.fillRect(door.x + 8, door.y + 12, Math.max(2, (door.w - 16) * opening), 5); ctx.fillRect(door.x + 8, door.y + 34, Math.max(2, (door.w - 16) * opening), 5);
        ctx.fillStyle = theme.flameCore; ctx.fillRect(door.x + door.w - 11, door.y + 35, 4, 4);
        const near = Math.abs(player.x + player.w / 2 - (door.x + door.w / 2)) < 72 && Math.abs(player.y + player.h - (door.y + door.h)) < 30;
        if (near) { ctx.fillStyle = 'rgba(3,7,12,.88)'; ctx.fillRect(door.x - 45, door.y - 35, 138, 22); ctx.fillStyle = locked ? '#ef4444' : theme.accent; ctx.font = `bold ${touchControls ? 9 : 11}px ui-sans-serif`; ctx.textAlign = 'center'; ctx.fillText(locked ? 'ПОБЕДИТЕ БОССА' : touchControls ? 'НАЖМИТЕ НА ДВЕРЬ' : 'E  ВОЙТИ', door.x + door.w / 2, door.y - 20); ctx.textAlign = 'start'; }
      }
      for (const trap of traps) { ctx.strokeStyle = trap.triggered ? '#fb7185' : '#f5b942'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(trap.x, trap.y + 10); ctx.lineTo(trap.x + 10, trap.y); ctx.lineTo(trap.x + 20, trap.y + 10); ctx.lineTo(trap.x + 30, trap.y); ctx.lineTo(trap.x + 42, trap.y + 10); ctx.stroke(); }
      for (const warning of rockWarnings) if (warning.delay <= 0) { ctx.globalAlpha = .28 + Math.sin(now * 22) * .16; ctx.fillStyle = '#ef4444'; ctx.fillRect(warning.x, warning.y, warning.w, warning.h); ctx.globalAlpha = 1; }
      for (const warning of bossWarnings) {
        if (warning.delay > 0) {
          ctx.globalAlpha = .35 + Math.sin(now * 24) * .2; ctx.fillStyle = warning.kind === 'geyser' ? '#a3e635' : '#ef4444'; ctx.fillRect(warning.x, warning.y, warning.w, warning.h); ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = warning.kind === 'geyser' ? '#84cc16' : '#94a3b8';
          ctx.beginPath(); ctx.moveTo(warning.x, warning.y); ctx.lineTo(warning.x + warning.w / 2, warning.y - 105); ctx.lineTo(warning.x + warning.w, warning.y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = warning.kind === 'geyser' ? '#d9f99d' : '#e2e8f0'; ctx.fillRect(warning.x + warning.w / 2 - 3, warning.y - 91, 6, 55);
        }
      }
      if (stageTwoArenaLocked) for (const gate of stageTwoArenaGates) {
        if (location === 'throne') drawFinalStoneWall(ctx, gate);
        else { ctx.fillStyle = '#171b1d'; ctx.fillRect(gate.x, gate.y, gate.w, gate.h); ctx.strokeStyle = location === 'swamps' ? '#65a30d' : '#f59e0b'; ctx.lineWidth = 3; ctx.strokeRect(gate.x + 2, gate.y + 2, gate.w - 4, gate.h - 4); }
      }
      if (stageFourArenaLocked) for (const gate of arenaGates) { ctx.fillStyle = '#171b1d'; ctx.fillRect(gate.x, gate.y, gate.w, gate.h); ctx.strokeStyle = cryptLayout ? '#a855f7' : '#94a3b8'; ctx.lineWidth = 3; ctx.strokeRect(gate.x + 2, gate.y + 2, gate.w - 4, gate.h - 4); }
      for (const hazard of hazards) { if (hazard.delay > 0) continue; const fire = hazard.kind === 'fire'; ctx.globalAlpha = Math.min(.72, hazard.life); ctx.fillStyle = fire ? '#b93818' : '#65a30d'; ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h); ctx.fillStyle = fire ? '#ffb347' : '#bef264'; for (let x = hazard.x + 6; x < hazard.x + hazard.w; x += 16) ctx.fillRect(x, hazard.y - 3 - Math.sin(now * 8 + x) * (fire ? 7 : 3), 5, fire ? 9 : 5); ctx.globalAlpha = 1; }
      for (const shard of shardDrops) { ctx.save(); ctx.translate(shard.x + 4, shard.y + 4); ctx.rotate(Math.PI / 4); ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10; ctx.fillStyle = '#f59e0b'; ctx.fillRect(-5, -5, 10, 10); ctx.fillStyle = '#fef3c7'; ctx.fillRect(-2, -4, 3, 6); ctx.restore(); }
      for (const enemy of enemies) if (!enemy.dead && enemy.variant === 'bogShaman' && enemy.attack > 0 && enemy.spellX !== undefined && enemy.spellY !== undefined) {
        const charge = 1 - enemy.attack / .45;
        ctx.save(); ctx.translate(enemy.spellX, enemy.spellY);
        ctx.globalAlpha = .45 + charge * .4; ctx.strokeStyle = charge > .72 ? '#f7fee7' : '#a3e635'; ctx.shadowColor = '#65ff62'; ctx.shadowBlur = 10 + charge * 14; ctx.lineWidth = 2 + charge * 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 31 - charge * 8, 9 - charge * 2, 0, 0, Math.PI * 2); ctx.stroke();
        for (let rune = 0; rune < 4; rune++) { const angle = now * 3 + rune * Math.PI / 2; ctx.fillStyle = '#d9f99d'; ctx.fillRect(Math.cos(angle) * 22 - 2, Math.sin(angle) * 6 - 2, 4, 4); }
        ctx.restore();
      }
      const cryptHidden = location === 'crypt' && enemies.some((enemy) => !enemy.dead && enemy.variant === 'cryptTotem');
      for (const enemy of enemies) if (!enemy.dead && !enemy.dormant) {
        if (!enemyNearViewport(enemy, 80)) continue;
        { const active = Object.keys(enemy.statuses ?? {}) as StatusKind[]; active.forEach((kind, index) => { const config = statusConfig[kind]; ctx.save(); ctx.fillStyle = config.color; ctx.shadowColor = config.color; ctx.shadowBlur = 7; ctx.font = 'bold 13px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(config.symbol, enemy.x + enemy.w / 2 + (index - (active.length - 1) / 2) * 13, enemy.y - 17); ctx.restore(); }); }
        if (enemy.elite) {
          const info = ELITE_INFO[enemy.elite], pulse = 1 + Math.sin(now * 5) * .08;
          ctx.save(); ctx.strokeStyle = info.color; ctx.shadowColor = info.color; ctx.shadowBlur = 12; ctx.globalAlpha = .68;
          ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, Math.max(enemy.w, enemy.h) * .7 * pulse, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.fillStyle = info.color; ctx.font = 'bold 13px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${info.symbol} ${info.label}`, enemy.x + enemy.w / 2, enemy.y - 18); ctx.restore();
        }
        if ((enemy.variant === 'cappedArcher' || enemy.variant === 'towerSniper') && enemy.attack > 0 && enemy.alertTimer <= 0) { const sniper = enemy.variant === 'towerSniper'; ctx.save(); ctx.globalAlpha = sniper ? .75 : .28 + (.8 - enemy.attack) * .35; ctx.strokeStyle = sniper ? '#59ff67' : '#ef4444'; ctx.shadowColor = sniper ? '#59ff67' : 'transparent'; ctx.shadowBlur = sniper ? 7 : 0; ctx.lineWidth = sniper ? 2 : 1; ctx.setLineDash(sniper ? [] : [7, 7]); ctx.beginPath(); ctx.moveTo(enemy.x + enemy.w / 2 + enemy.facing * 18, enemy.y + 16); ctx.lineTo(player.x + player.w / 2, player.y + player.h / 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        if (enemy.alertTimer > 0) { const rise = Math.sin((.5 - enemy.alertTimer) / .5 * Math.PI) * 9; ctx.save(); ctx.translate(enemy.x + enemy.w / 2, enemy.y - 26 - rise); ctx.fillStyle = '#facc15'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10; ctx.font = 'bold 25px monospace'; ctx.textAlign = 'center'; ctx.fillText('!', 0, 0); ctx.restore(); }
        if (enemy.kind === 'totem' && enemy.variant === 'swampTotem') { ctx.strokeStyle = 'rgba(163,230,53,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 150, 0, Math.PI * 2); ctx.stroke(); }
        if (protectedByTotem(enemy)) { ctx.strokeStyle = enemy.blocked > 0 ? '#e0f2fe' : 'rgba(103,232,249,.65)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, Math.max(enemy.w, enemy.h) * .72, 0, Math.PI * 2); ctx.stroke(); }
        if (enemy.stunned > 0) { ctx.fillStyle = '#fde68a'; const spin = Math.floor(now * 8) % 3; ctx.fillRect(enemy.x + 4 + spin * 9, enemy.y - 22, 5, 5); ctx.fillRect(enemy.x + enemy.w - 10 - spin * 5, enemy.y - 29, 4, 4); }
        if (enemy.phaseTwo) { ctx.save(); ctx.strokeStyle = enemy.phaseTransition ? '#fff1f2' : '#fb7185'; ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 18; ctx.globalAlpha = .45 + Math.sin(now * 8) * .15; ctx.lineWidth = enemy.phaseTransition ? 7 : 3; ctx.beginPath(); ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, Math.max(enemy.w, enemy.h) * (.66 + Math.sin(now * 5) * .04), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        if ((enemy.frozen ?? 0) > 0) {
          const freezePulse = .72 + Math.sin(now * 11) * .14;
          ctx.save(); ctx.globalAlpha = freezePulse; ctx.strokeStyle = '#67e8f9'; ctx.fillStyle = '#d9faff'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 16; ctx.lineWidth = 3;
          ctx.strokeRect(enemy.x - 3, enemy.y - 3, enemy.w + 6, enemy.h + 6);
          for (let crystal = 0; crystal < 5; crystal++) { const angle = crystal * Math.PI * .4 + now * .25, radius = Math.max(enemy.w, enemy.h) * .62; const x = enemy.x + enemy.w / 2 + Math.cos(angle) * radius, y = enemy.y + enemy.h / 2 + Math.sin(angle) * radius; ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 3); ctx.lineTo(0, 7); ctx.lineTo(-4, 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
          ctx.restore();
        }
        ctx.save(); if ((enemy.frozen ?? 0) > 0) { ctx.filter = 'brightness(.9) sepia(1) saturate(5) hue-rotate(155deg)'; ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 14; } if (cryptHidden && enemy.variant !== 'cryptTotem') ctx.globalAlpha = .12; ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2); if (enemy.alertTimer > 0) ctx.scale(1.08, .92); if (enemy.facing < 0) ctx.scale(-1, 1); if (enemy.defeated) { ctx.translate(0, 17); ctx.scale(1, .62); }
        if (enemy.variant === 'cryptWarden' || enemy.variant === 'bridgeColossus') {
          const spriteSize = uniqueBossSpriteSizes[enemy.variant]; ctx.scale(enemy.w / spriteSize.w, enemy.h / spriteSize.h);
          const attackProgress = enemy.attack > 0 ? Math.max(0, Math.min(1, 1 - enemy.attack / 1.25)) : 0;
          drawUniqueBoss(ctx, enemy.variant, now, attackProgress, Math.abs(enemy.vx) > 20); ctx.restore();
          const barW = 300, barX = enemy.x + enemy.w / 2 - barW / 2;
          ctx.fillStyle = 'rgba(2,3,8,.9)'; ctx.fillRect(barX - 5, enemy.y - 48, barW + 10, 29); ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 12px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(enemy.name, enemy.x + enemy.w / 2, enemy.y - 36); ctx.fillStyle = '#25132d'; ctx.fillRect(barX, enemy.y - 30, barW, 8); ctx.fillStyle = enemy.variant === 'cryptWarden' ? '#a855f7' : '#ef4444'; ctx.fillRect(barX, enemy.y - 30, barW * Math.max(0, enemy.hp / enemy.maxHp), 8); ctx.textAlign = 'start';
          continue;
        }
        if (enemy.variant === 'swampGiant' || enemy.variant === 'stoneGolem' || enemy.variant === 'rightHand') {
          const spriteSize = uniqueBossSpriteSizes[enemy.variant]; ctx.scale(enemy.w / spriteSize.w, enemy.h / spriteSize.h);
          const duration = enemy.variant === 'rightHand' ? (enemy.phaseTwo ? .28 : .42) : enemy.specialAttack === 1 ? .8 : 1.05;
          const attackProgress = enemy.attack > 0 ? Math.max(0, Math.min(1, 1 - enemy.attack / duration)) : 0;
          drawUniqueBoss(ctx, enemy.variant, now, attackProgress, Math.abs(enemy.vx) > 20); ctx.restore();
          const barW = enemy.w + 8;
          ctx.fillStyle = '#160f13'; ctx.fillRect(enemy.x - 4, enemy.y - 12, barW, 6);
          ctx.fillStyle = enemy.variant === 'swampGiant' ? '#65e342' : enemy.variant === 'stoneGolem' ? '#f97316' : '#d4af37';
          ctx.fillRect(enemy.x - 4, enemy.y - 12, barW * Math.max(0, enemy.hp / enemy.maxHp), 6);
          continue;
        }
        if (isEarlyEnemyVariant(enemy.variant)) {
          const spriteSize = earlyEnemySpriteSizes[enemy.variant]; ctx.scale(enemy.w / spriteSize.w, enemy.h / spriteSize.h);
          const attackDuration = enemyAttackDuration(enemy.kind, enemy.variant);
          const attackProgress = enemy.attack > 0 ? Math.max(0, Math.min(1, 1 - enemy.attack / attackDuration)) : 0;
          drawEarlyEnemy(ctx, { variant: enemy.variant, time: now, vx: enemy.vx, vy: enemy.vy, attack: enemy.attack, attackProgress, hurt: enemy.hurt, blocked: enemy.blocked, stunned: enemy.stunned, defeated: enemy.defeated });
          ctx.restore();
          const barW = enemy.w + 4;
          ctx.fillStyle = '#160f13'; ctx.fillRect(enemy.x - 2, enemy.y - 12, barW, 5);
          ctx.fillStyle = enemy.kind === 'zombie' ? '#ef5263' : enemy.kind === 'crossbow' || enemy.kind === 'mage' ? '#a78bfa' : enemy.kind === 'bomber' ? '#f97316' : enemy.kind === 'totem' ? '#65e342' : '#84cc16';
          ctx.fillRect(enemy.x - 2, enemy.y - 12, barW * Math.max(0, enemy.hp / enemy.maxHp), 5);
          continue;
        }
        const palette: Partial<Record<EnemyVariant, string>> = { rottenPrisoner: '#64745b', cappedArcher: '#8b6b45', marshSlime: '#65a30d', swampTotem: '#6b4f2a', bogShaman: '#4d7c0f', blindMiner: '#b7791f', dynamiteTosser: '#92400e', minecartDefender: '#475569', clockworkSoldier: '#b08d45', gearFlyer: '#64748b', towerSniper: '#0e7490', wraith: '#7c6da8', necromancer: '#581c87', cryptTotem: '#312e81', bridgeKnight: '#78716c', gargoyleBomber: '#52525b', royalGuard: '#b91c1c', royalSorcerer: '#7e22ce' };
        const baseColor = palette[enemy.variant] || (enemy.kind === 'boss' ? '#7f1d1d' : enemy.kind === 'rightHand' ? '#b08a3c' : '#d6a928');
        const bodyColor = enemy.hurt > 0 ? (enemy.kind === 'boss' ? '#ef4444' : '#fff7ed') : enemy.attack > 0 && enemy.kind === 'zombie' ? '#ff253f' : baseColor;
        const enemyHasLegs = !['totem', 'slime', 'flyer', 'wraith'].includes(enemy.kind);
        if (enemyHasLegs) {
          const movement = Math.min(1, Math.max(0, (Math.abs(enemy.vx) - 8) / 90));
          drawWalkingLegs(ctx, { phase: now * (4.2 + movement * 6.2), moving: movement > .04 && enemy.stunned <= 0 && !enemy.defeated, movement, legColor: '#171923', bootColor: '#080a10' });
        }
        ctx.fillStyle = bodyColor; ctx.fillRect(-13, -7, 26, 18); ctx.fillRect(-17, -5, 6, 18); ctx.fillRect(12, -4, 6, 17);
        ctx.fillStyle = enemy.kind === 'zombie' ? '#9ca37d' : '#d9b38c'; ctx.fillRect(-9, -21, 18, 15); ctx.fillRect(-6, -24, 13, 4);
        ctx.fillStyle = enemy.kind === 'zombie' ? '#d6ef79' : '#fef3c7'; ctx.fillRect(3, -16, 4, 3); ctx.fillStyle = '#24191c'; ctx.fillRect(7, -11, 4, 2);
        if (enemy.kind === 'zombie') { ctx.fillStyle = '#731f2c'; ctx.fillRect(-14, -8, 28, 5); ctx.fillStyle = '#9ca37d'; ctx.fillRect(17, 7, 10, 5); }
        if (enemy.kind === 'crossbow') { ctx.fillStyle = '#4c287e'; ctx.fillRect(-12, -24, 24, 7); ctx.fillRect(-15, -10, 30, 5); ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(23, 4, 9, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = '#e9d5ff'; ctx.fillRect(13, 3, 23, 3); }
        if (enemy.kind === 'shield') { ctx.fillStyle = '#7c5d12'; ctx.fillRect(-14, -10, 28, 6); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(-10, -25, 20, 5); ctx.fillStyle = enemy.blocked > 0 ? '#fff7ae' : '#facc15'; ctx.fillRect(13, -17, 14, 34); ctx.fillRect(17, -21, 6, 42); ctx.fillStyle = '#d1d5db'; ctx.fillRect(19, -1, 30, 3); }
        if (enemy.kind === 'bomber') { ctx.fillStyle = '#164e63'; ctx.fillRect(-14, -10, 28, 6); ctx.fillStyle = '#fb923c'; ctx.fillRect(14, -2, 13, 13); ctx.fillStyle = '#fde68a'; ctx.fillRect(19, -7, 3, 7); }
        if (enemy.kind === 'mage') { ctx.fillStyle = '#4c1d95'; ctx.fillRect(-14, -25, 28, 8); ctx.fillStyle = '#c084fc'; ctx.fillRect(16, -6, 4, 29); ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 12; ctx.fillRect(12, -12, 12, 12); ctx.shadowBlur = 0; }
        if (enemy.kind === 'totem') { ctx.fillStyle = '#164e63'; ctx.fillRect(-18, -28, 36, 56); ctx.fillStyle = '#67e8f9'; ctx.fillRect(-12, -20, 24, 5); ctx.fillRect(-4, -10, 8, 26); ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 14; ctx.fillRect(-7, -4, 14, 14); ctx.shadowBlur = 0; }
        if (enemy.variant === 'royalGuard') { ctx.fillStyle = '#d4af55'; ctx.fillRect(-15, -13, 30, 5); ctx.fillRect(-11, -28, 22, 5); }
        drawEnemyAttack(ctx, enemyWeaponFor(enemy.kind), enemy.variant, enemy.attack, enemyAttackDuration(enemy.kind, enemy.variant), now);
        if (enemy.kind === 'boss' || enemy.kind === 'rightHand') { ctx.fillStyle = enemy.kind === 'rightHand' ? '#d4af55' : '#9f3030'; ctx.fillRect(-18, -13, 36, 7); if (enemy.attack <= 0) { ctx.fillStyle = '#d1d5db'; ctx.fillRect(18, -5, 38, 5); ctx.fillRect(48, -10, 8, 15); } }
        ctx.restore();
        { const barW = enemy.w + 4; ctx.fillStyle = '#160f13'; ctx.fillRect(enemy.x - 2, enemy.y - 12, barW, 5); ctx.fillStyle = enemy.kind === 'zombie' ? '#ef5263' : enemy.kind === 'crossbow' || enemy.kind === 'mage' ? '#a78bfa' : enemy.kind === 'bomber' ? '#38bdf8' : enemy.kind === 'totem' ? '#67e8f9' : '#facc15'; ctx.fillRect(enemy.x - 2, enemy.y - 12, barW * Math.max(0, enemy.hp / enemy.maxHp), 5); }
      }
      const stageTwoBoss = stageTwoArenaLocked ? enemies.find((enemy) => (enemy.kind === 'boss' || enemy.kind === 'rightHand') && !enemy.dead && !enemy.dormant) : undefined;
      if (stageTwoBoss) {
        const barW = Math.min(520, viewW - 160), barX = camera + (viewW - barW) / 2, barY = cameraY + viewH - 42;
        ctx.fillStyle = 'rgba(3,7,12,.92)'; ctx.fillRect(barX - 12, barY - 25, barW + 24, 43);
        ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 13px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(stageTwoBoss.name, camera + viewW / 2, barY - 9);
        ctx.fillStyle = '#2b1217'; ctx.fillRect(barX, barY, barW, 11); ctx.fillStyle = location === 'swamps' ? '#65a30d' : '#f59e0b'; ctx.fillRect(barX, barY, barW * Math.max(0, stageTwoBoss.hp / stageTwoBoss.maxHp), 11); ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 11); ctx.textAlign = 'start';
      }
      for (const p of projectiles) {
        if (p.kind === 'poisonBurst') {
          const age = 1 - p.life / .9;
          ctx.save(); ctx.globalAlpha = Math.max(.2, 1 - age * .65); ctx.shadowColor = '#65ff62'; ctx.shadowBlur = 20;
          const gradient = ctx.createLinearGradient(p.x, p.y + p.h, p.x, p.y);
          gradient.addColorStop(0, '#3f6212'); gradient.addColorStop(.45, '#84cc16'); gradient.addColorStop(1, 'rgba(217,249,157,0)');
          ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(p.x + 5, p.y + p.h); ctx.quadraticCurveTo(p.x - 5, p.y + 35, p.x + p.w / 2, p.y); ctx.quadraticCurveTo(p.x + p.w + 5, p.y + 35, p.x + p.w - 5, p.y + p.h); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#d9f99d'; ctx.lineWidth = 2; for (let vein = 0; vein < 3; vein++) { const x = p.x + 13 + vein * 15; ctx.beginPath(); ctx.moveTo(x, p.y + p.h - 5); ctx.quadraticCurveTo(x - 8, p.y + 40, x + 3, p.y + 12); ctx.stroke(); }
          ctx.restore(); continue;
        }
        const orb = p.kind === 'magicOrb'; ctx.shadowColor = orb ? '#c084fc' : 'transparent'; ctx.shadowBlur = orb ? 16 : 0; ctx.fillStyle = p.kind === 'gear' ? '#94a3b8' : p.kind === 'grenade' ? '#f5b942' : p.kind === 'freeze' ? '#67e8f9' : p.kind === 'enemyBomb' ? '#ff7a45' : p.kind === 'enemyArrow' || orb ? '#c084fc' : '#dce8e7'; ctx.fillRect(p.x, p.y, p.w, p.h); if (p.kind === 'trapArrow') { ctx.fillStyle = '#7c2d12'; ctx.fillRect(p.x - Math.sign(p.vx) * 7, p.y - 2, 8, 9); } if (p.kind === 'gear') { ctx.strokeStyle = '#e2e8f0'; ctx.strokeRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6); } ctx.shadowBlur = 0;
      }
      for (const explosion of explosions) {
        const progress = 1 - explosion.life / explosion.maxLife, size = Math.round(explosion.radius * progress), alpha = Math.max(0, 1 - progress);
        const frozen = explosion.kind === 'freeze';
        ctx.globalAlpha = alpha * .22; ctx.fillStyle = frozen ? '#22d3ee' : '#ff5a2f'; ctx.beginPath(); ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha; ctx.strokeStyle = frozen ? (progress < .45 ? '#ecfeff' : '#67e8f9') : (progress < .45 ? '#fff3a3' : '#ff7a45'); ctx.lineWidth = Math.max(2, Math.round(9 * (1 - progress))); ctx.beginPath(); ctx.arc(explosion.x, explosion.y, size, 0, Math.PI * 2); ctx.stroke();
        const core = Math.max(2, Math.round(34 * (1 - progress))); ctx.fillStyle = frozen ? '#cffafe' : '#fff7c2'; ctx.beginPath(); ctx.arc(explosion.x, explosion.y, core, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      for (const ghost of playerGhosts) drawShadowDashGhost(ctx, ghost, player.w, player.h, now);
      if (bestGhost?.frames.length) {
        const locationFrames = bestGhost.frames.filter((item) => item.location === location);
        const frame = locationFrames.find((item) => item.t >= runElapsed.current) ?? locationFrames[locationFrames.length - 1];
        if (frame) { ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = '#67e8f9'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 16; ctx.fillRect(frame.x, frame.y, player.w, player.h); ctx.fillStyle = '#e0f2fe'; ctx.fillRect(frame.x + (frame.facing > 0 ? 22 : 7), frame.y + 12, 5, 4); ctx.restore(); }
      }
      for (const p of particles) {
        const alpha = p.maxLife ? Math.max(0, p.life / p.maxLife) : Math.min(1, p.life * 3);
        ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
        if (!p.shape || p.shape === 'square') ctx.fillRect(p.x, p.y, p.size, p.size);
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation ?? 0);
          if (p.shape === 'smoke') { ctx.beginPath(); ctx.arc(0, 0, p.size * (.65 + (1 - alpha) * .65), 0, Math.PI * 2); ctx.fill(); }
          else { ctx.beginPath(); ctx.moveTo(-p.size, -1); ctx.lineTo(p.size, -p.size * .22); ctx.lineTo(p.size * .45, p.size * .28); ctx.closePath(); ctx.fill(); }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      { const active = Object.keys(player.statuses) as StatusKind[]; active.forEach((kind, index) => { const config = statusConfig[kind]; ctx.save(); ctx.fillStyle = config.color; ctx.shadowColor = config.color; ctx.shadowBlur = 8; ctx.font = 'bold 14px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText(config.symbol, player.x + player.w / 2 + (index - (active.length - 1) / 2) * 14, player.y - 25); ctx.restore(); }); }
      if (player.parry > 0) {
        const barX = player.x - 8, barY = player.y - 18, barW = player.w + 16;
        ctx.fillStyle = 'rgba(3,7,12,.85)'; ctx.fillRect(barX - 2, barY - 2, barW + 4, 8);
        ctx.fillStyle = player.parry >= 100 ? '#fde68a' : '#38bdf8'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = player.parry >= 100 ? 12 : 4;
        ctx.fillRect(barX, barY, barW * player.parry / 100, 4); ctx.shadowBlur = 0;
      }
      if (player.focus > 0) { const pulse = 24 + player.focus * 22; ctx.strokeStyle = `rgba(220,255,247,${.25 + player.focus * .65})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player.x + player.w / 2, player.y + player.h / 2, pulse, 0, Math.PI * 2); ctx.stroke(); }
      ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h);
      const idleBreath = player.grounded && Math.abs(player.vx) < 25 ? 1 + Math.sin(now * 3.2) * .025 : 1;
      const jumpStretch = !player.grounded && player.vy < -60 ? Math.min(.12, (-player.vy - 60) / 4200) : 0;
      const squashProgress = player.landSquash > 0 && player.landSquashMax > 0 ? player.landSquash / player.landSquashMax : 0;
      const squashAmount = Math.sin(squashProgress * Math.PI) * .2;
      const dashScaleX = player.roll > .1 ? 1.3 : 1;
      const dashScaleY = player.roll > .1 ? .8 : 1;
      const spriteScaleY = idleBreath * (1 + jumpStretch) * (1 - squashAmount) * dashScaleY;
      const spriteScaleX = (1 - jumpStretch * .65) * (1 + squashAmount * .9) * dashScaleX;
      ctx.scale(spriteScaleX, spriteScaleY); ctx.translate(0, -player.h / 2); if (player.facing < 0) ctx.scale(-1, 1); if (player.roll > 0) ctx.rotate(.08);
      if (!player.dead) {
        const damageBlink = player.hurt > 0 && Math.floor(player.hurt * 22) % 2 === 0;
        if (player.hurt > 0) ctx.globalAlpha = damageBlink ? .3 : 1;
        const knightPose = { time: now, speed: Math.abs(player.vx), grounded: player.grounded, rolling: player.roll > 0, damaged: damageBlink };
        if (player.roll > 0) drawPlayerLungePose(ctx, now, damageBlink, cosmetic.cape, cosmetic.maskGlow);
        else {
          drawPlayerCape(ctx, knightPose, cosmetic.cape);
          const runAmount = player.grounded ? Math.min(1, Math.max(0, (Math.abs(player.vx) - 8) / 210)) : 0;
          drawWalkingLegs(ctx, { phase: now * (4.4 + runAmount * 6.4), moving: runAmount > .04, movement: runAmount, strideScale: 1.18, liftScale: 1.1, legColor: '#34343f', bootColor: '#15151b', legWidth: 8, bootWidth: 9, bootHeight: 9 });
          drawPlayerKnight(ctx, knightPose, cosmetic.maskGlow);
        }
        if (player.guard > 0) { const shield = runProgress.current.loadout[selectedSlot.current]; const config = equipmentConfig(shield.equipmentId, 'shield'); const perfect = player.guardAge <= (config.kind === 'shield' ? config.perfectBlockWindow : .2); ctx.shadowColor = perfect ? '#fff7ae' : '#facc15'; ctx.shadowBlur = perfect ? 16 : 5; ctx.fillStyle = perfect ? '#fff7ae' : '#facc15'; ctx.fillRect(15, -18, shield.equipmentId === 'tower_shield' ? 16 : 12, 36); ctx.strokeStyle = '#fff1a8'; ctx.lineWidth = 2; ctx.strokeRect(15, -18, shield.equipmentId === 'tower_shield' ? 16 : 12, 36); ctx.shadowBlur = 0; }
      }
      ctx.save();
      if (player.attack > 0 && player.attackFacing !== player.facing) ctx.scale(-1, 1);
      if (weaponAnimationState === 'idle' && player.attack <= 0 && player.bow <= 0 && player.guard <= 0) drawPlayerWeaponHold(ctx, runProgress.current.loadout[selectedSlot.current].kind, cosmetic.weapon);
      drawPlayerSword(ctx, player.attack, player.attackMax, player.attackDirection, cosmetic.weapon, player.attackStage);
      ctx.restore();
      drawPlayerBow(ctx, player.bow, player.bowMax);
      ctx.restore(); ctx.restore();
      if (showHitboxesRef.current) {
        ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#22d3ee'; ctx.strokeRect(player.x, player.y, player.w, player.h);
        ctx.strokeStyle = '#f472b6'; for (const enemy of enemies) if (!enemy.dead) { const box = enemyHurtbox(enemy); ctx.strokeRect(box.x, box.y, box.w, box.h); }
        ctx.strokeStyle = 'rgba(250,204,21,.65)'; for (const solid of solids) ctx.strokeRect(solid.x, solid.y, solid.w, solid.h);
        ctx.strokeStyle = '#ef4444'; for (const warning of bossWarnings) ctx.strokeRect(warning.x, warning.y - 105, warning.w, 115); for (const warning of rockWarnings) ctx.strokeRect(warning.x, warning.y - 590, warning.w, 602);
        ctx.setLineDash([]); ctx.restore();
      }
      if (flash > 0) { ctx.fillStyle = 'rgba(255,80,90,.18)'; ctx.fillRect(0, 0, W, H); }
      if (spikeFade > 0) { const progress = .7 - spikeFade, alpha = progress < .35 ? progress / .35 : Math.max(0, (.7 - progress) / .35); ctx.fillStyle = `rgba(2,4,8,${Math.min(1, alpha)})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    };

    const loop = (now: number) => {
      const rawDt = Math.min((now - last) / 1000, .05); last = now;
      if (!pausedRef.current && combo.hits > 0 && now >= combo.expiresAt) { combo = EMPTY_COMBO; setCombatCombo(EMPTY_COMBO); }
      if (!pausedRef.current && now >= hitstopUntil) update(Math.min(rawDt, .033));
      drawCanvas(); pressed.clear(); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { saveMapSnapshot(); dropReplacedWeapon.current = () => {}; cancelAnimationFrame(raf); window.removeEventListener('resize', resizeCanvas); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('mouseup', mouseUp); canvas.removeEventListener('mousedown', mouseDown); };
  }, [started, runKey, sector, location, runMode]);

  const gearIcons: Record<GearKind, string> = { sword: '⚔', bow: '➶', shield: '⬟', grenade: '✹', freeze: '❄', trap: '⌁', empty: '·' };
  const slots = runProgress.current.loadout.map((gear, index) => ({ key: String(index + 1), title: gear.name, icon: gearIcons[gear.kind], tier: gear.tier, cd: index === 2 ? hud.grenade : index === 3 ? hud.trap : 0 }));
  const currentTheme = themeForLocation(location);
  const spendShards = (cost: number) => {
    if (runProgress.current.shards < cost) return false;
    runProgress.current.shards -= cost;
    setHud((current) => ({ ...current, shards: runProgress.current.shards }));
    return true;
  };
  const buyPermanent = (kind: 'health' | 'damage') => {
    if (kind === 'health' && permanentProgress.current.maxHpBonus >= MAX_PERMANENT_MASKS) return;
    const level = kind === 'health' ? permanentProgress.current.maxHpBonus : Math.round(permanentProgress.current.damageBonus / .08);
    const cost = (kind === 'health' ? 45 : 30) + level * (kind === 'health' ? 20 : 8);
    if (!spendShards(cost)) return;
    if (kind === 'health') { permanentProgress.current.maxHpBonus += 1; runProgress.current.maxHp += 1; runProgress.current.hp += 1; if (permanentProgress.current.maxHpBonus >= MAX_PERMANENT_MASKS) unlockAchievement('steel_nerves'); }
    else { permanentProgress.current.damageBonus += .08; runProgress.current.damage += .08; }
    refreshShop((value) => value + 1);
  };
  const buyRunUpgrade = (kind: 'health' | 'damage') => {
    const cost = kind === 'health' ? 8 : 15;
    if (!spendShards(cost)) return;
    if (kind === 'health') runProgress.current.hp = runProgress.current.maxHp;
    else runProgress.current.damage += .12;
    refreshShop((value) => value + 1);
  };
  const merchantWeapons: Array<{ gear: Gear; cost: number }> = [
    { gear: { kind: 'sword', weaponId: 'merchant_blade', name: 'Клинок торговца', tier: sector + 1, damage: 27 + sector * 5, cooldown: .31 }, cost: 18 + sector * 2 },
    { gear: { kind: 'bow', equipmentId: 'precision_bow', name: 'Точный лук', tier: sector + 1, damage: 21 + sector * 4, cooldown: .48 }, cost: 20 + sector * 2 },
    { gear: sector % 2 ? { kind: 'grenade', equipmentId: 'heavy_bomb', name: 'Тяжёлая бомба', tier: sector, damage: 50 + sector * 6, cooldown: 4.5 } : { kind: 'freeze', equipmentId: 'frost_orb', name: 'Морозная сфера', tier: sector, damage: 28 + sector * 4, cooldown: 5.5 }, cost: 24 + sector * 2 },
  ];
  const buyWeapon = (offer: { gear: Gear; cost: number }) => {
    const slots = weaponSlots(offer.gear);
    const emptySlot = slots.find((slot) => runProgress.current.loadout[slot].kind === 'empty');
    if (emptySlot === undefined) {
      weaponReplacementOpen.current = true;
      setWeaponReplacement({ gear: { ...offer.gear }, slots, cost: offer.cost });
      return;
    }
    if (!spendShards(offer.cost)) return;
    runProgress.current.loadout[emptySlot] = { ...offer.gear };
    selectedSlot.current = emptySlot; setActiveSlot(emptySlot); refreshShop((value) => value + 1);
  };
  const evolveEquippedWeapon = (slot: number, branchId: WeaponBranchId) => {
    const gear = runProgress.current.loadout[slot];
    const branch = weaponBranches(gear.kind).find((item) => item.id === branchId);
    const cost = 24 + gear.tier * 6;
    if (!branch || gear.branch || !spendShards(cost)) return;
    runProgress.current.loadout[slot] = evolveWeapon(gear, branch);
    playUiSound(settingsRef.current.effectsVolume, 'pickup'); refreshShop((value) => value + 1);
  };
  const unlockLegacy = (id: LegacyUnlockId) => {
    const item = LEGACY_UNLOCKS.find((entry) => entry.id === id);
    if (!item || legacyProgress.unlocks.includes(id) || legacyProgress.embers < item.cost) return;
    const next = { embers: legacyProgress.embers - item.cost, unlocks: [...legacyProgress.unlocks, id] };
    setLegacyProgress(next);
  };
  const takeAlchemistRelic = (relic: Relic) => {
    const ownedCount = runProgress.current.relics.length;
    if (relicClaimedVisit === shopVisit || ownedCount >= 4 || runProgress.current.relics.includes(relic.id)) return;
    if (ownedCount >= 3 && !spendShards(100)) return;
    runProgress.current.relics.push(relic.id);
    playUiSound(settingsRef.current.effectsVolume, 'relic');
    const synergy = RELIC_SYNERGIES.find(({ ids }) => ids.every((id) => runProgress.current.relics.includes(id)) && (ids as readonly RelicId[]).includes(relic.id));
    setStoryMessage(synergy ? `СИНЕРГИЯ: ${synergy.name} — ${synergy.description}` : `Получена реликвия «${relic.name}».`);
    window.setTimeout(() => setStoryMessage(''), synergy ? 4200 : 2400);
    setRelicClaimedVisit(shopVisit); refreshShop((value) => value + 1);
  };
  const replaceWeaponInSlot = (slot: number) => {
    if (!weaponReplacement || !weaponReplacement.slots.includes(slot)) return;
    if (weaponReplacement.cost !== undefined && !spendShards(weaponReplacement.cost)) { weaponReplacementOpen.current = false; setWeaponReplacement(null); return; }
    const replacedGear = runProgress.current.loadout[slot];
    runProgress.current.loadout[slot] = { ...weaponReplacement.gear };
    playUiSound(settingsRef.current.effectsVolume, 'pickup');
    if (replacedGear.kind !== 'empty') dropReplacedWeapon.current(replacedGear);
    selectedSlot.current = slot; setActiveSlot(slot); weaponReplacementOpen.current = false; setWeaponReplacement(null); refreshShop((value) => value + 1);
    if (!shopOpen) { pausedRef.current = false; setPaused(false); }
  };
  const cancelWeaponReplacement = () => {
    const replacement = weaponReplacement;
    if (replacement && replacement.cost === undefined) dropReplacedWeapon.current(replacement.gear);
    weaponReplacementOpen.current = false;
    setWeaponReplacement(null);
    if (!shopOpen) { pausedRef.current = false; setPaused(false); }
  };
  const leaveShop = () => {
    setShopOpen(false); pausedRef.current = false; setPaused(false); setLocation(pendingDestination); setSector((value) => value + 1);
  };
  const persistSaveSlots = (nextSlots: Array<SavedGame | null>) => {
    setSaveSlots(nextSlots); localStorage.setItem('ashfall-save-slots', JSON.stringify(nextSlots));
  };
  const deleteSave = (slot: number) => {
    if (!window.confirm(`Стереть сохранение в слоте ${slot + 1}?`)) return;
    const nextSlots = [...saveSlots]; nextSlots[slot] = null; persistSaveSlots(nextSlots);
    if (activeSaveSlot === slot) setActiveSaveSlot(null);
    if (session) { setCloudSaveStatus('syncing'); void deleteCloudSave(session.user.id, slot).then(() => setCloudSaveStatus('synced')).catch(() => setCloudSaveStatus('error')); }
  };

  const respawnAtLocationStart = () => {
    runProgress.current.hp = runProgress.current.maxHp;
    setDeathSummary(null); setDeathScreen('stats'); setDeathAdvice('');
    pausedRef.current = false; setPaused(false); setRunKey((value) => value + 1);
  };
  const beginNewInSlot = (slot: number) => {
    permanentProgress.current = emptyPermanentProgress();
    setLegacyProgress(emptyLegacyProgress());
    setActiveSaveSlot(slot); setRunMode('normal'); setStartingWeapons(['sword', 'bow']); setChoosingMode(true);
  };
  const startNewGame = () => {
    bossTrialRef.current = null; setBossTrial(null);
    localStorage.removeItem('ashfall-autosave'); setAutosave(null);
    setEnding(false); setStoryMessage(''); setShopVisit(0); setRelicClaimedVisit(null); setDeathSummary(null); setDeathScreen('stats'); setCombatNotice(null);
    runStats.current = { startedAt: Date.now(), kills: 0, damageTaken: 0, bossesDefeated: 0 }; legacyAwarded.current = false; savedRecordForRun.current = false; runElapsed.current = 0; timedGhostFrames.current = []; setElapsedHud(0); setDeathAdvice(''); setChronicle('');
    runProgress.current = freshRun(permanentProgress.current); selectedSlot.current = 0; setActiveSlot(0); setLocation('prison'); setSector(1);
    setMapArchive({}); mapOpenRef.current = false; setMapOpen(false);
    const chosen = startingWeapons.map((kind) => ({ ...BASIC_WEAPONS.find((gear) => gear.kind === kind)! }));
    const emptyGear = (): Gear => ({ kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 });
    runProgress.current.loadout = [chosen[0], chosen[1], emptyGear(), emptyGear()] as [Gear, Gear, Gear, Gear];
    if (legacyProgress.unlocks.includes('vitality')) { runProgress.current.maxHp++; runProgress.current.hp++; }
    if (legacyProgress.unlocks.includes('arsenal')) runProgress.current.loadout = runProgress.current.loadout.map((gear) => gear.kind === 'empty' ? gear : ({ ...gear, tier: 2, damage: Math.round(gear.damage * 1.2) })) as [Gear, Gear, Gear, Gear];
    if (legacyProgress.unlocks.includes('fortune')) runProgress.current.shards = 20;
    if (legacyProgress.unlocks.includes('relicLore')) { const relic = chooseRelics([], 1)[0]; if (relic) runProgress.current.relics.push(relic.id); }
    setHud({ hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, shards: runProgress.current.shards, kills: 0, grenade: 0, trap: 0, message: '' });
    pausedRef.current = false; setPaused(false); setChoosingLoadout(false); setChoosingMode(false); setRunKey((value) => value + 1); setStarted(true);
  };
  const startBossTrial = (trial: BossTrial) => {
    const progress = freshRun(permanentProgress.current);
    const rewardTier = trialRewardTier(bossTrialProgress.seals);
    if (rewardTier >= 1) progress.damage += .1;
    if (rewardTier >= 2) { progress.maxHp += 1; progress.hp += 1; }
    progress.loadout = [{ ...BASIC_WEAPONS[0], damage: 34, tier: 4 }, { ...BASIC_WEAPONS[2], damage: 25, tier: 4 }, { kind: 'grenade', equipmentId: 'fragmentation_bomb', name: 'Осколочная бомба', tier: 3, damage: 55, cooldown: 5 }, { kind: 'empty', name: 'Пусто', tier: 0, damage: 0, cooldown: 0 }];
    runProgress.current = progress; runStats.current = { startedAt: Date.now(), kills: 0, damageTaken: 0, bossesDefeated: 0 };
    bossTrialRef.current = trial; setBossTrial(trial); setTrialRewardMessage(''); setDeathSummary(null); setDeathScreen('stats'); runElapsed.current = 0; setElapsedHud(0); setLocation(trial.location); setSector(trial.location === 'throne' ? 6 : trial.location === 'crypt' || trial.location === 'bridge' ? 4 : 2);
    setHud({ hp: progress.hp, maxHp: progress.maxHp, shards: 0, kills: 0, grenade: 0, trap: 0, message: '' });
    selectedSlot.current = 0; setActiveSlot(0); pausedRef.current = false; setPaused(false); setStoryMessage(`${trial.boss}: ${trial.description}`); setRunKey((value) => value + 1); setStarted(true);
    window.setTimeout(() => setStoryMessage(''), 3500);
  };
  const toggleStartingWeapon = (kind: GearKind) => {
    setStartingWeapons((current) => current.includes(kind) ? current.filter((item) => item !== kind) : current.length < 2 ? [...current, kind] : current);
  };
  const loadGame = (save: SavedGame, slot?: number) => {
    bossTrialRef.current = null; setBossTrial(null);
    permanentProgress.current = { ...save.permanentProgress };
    setLegacyProgress({ ...save.legacyProgress, unlocks: [...save.legacyProgress.unlocks] });
    runStats.current = { startedAt: Date.now(), kills: 0, damageTaken: 0, bossesDefeated: 0 }; setDeathSummary(null); setDeathScreen('stats'); setRunMode(save.mode); runElapsed.current = save.elapsedSeconds; setElapsedHud(Math.floor(save.elapsedSeconds)); setDeathAdvice(''); setChronicle('');
    const migratedMaxHp = save.progress.maxHp > 20 ? 5 + save.permanentProgress.maxHpBonus : Math.max(1, Math.round(save.progress.maxHp));
    const migratedHp = save.progress.hp > 20 ? Math.max(1, Math.round(migratedMaxHp * Math.min(1, save.progress.hp / save.progress.maxHp))) : Math.min(migratedMaxHp, Math.max(0, Math.round(save.progress.hp)));
    const migratedShards = save.progress.shards ?? save.progress.cells ?? 0;
    runProgress.current = { ...save.progress, hp: migratedHp, maxHp: migratedMaxHp, shards: migratedShards, cells: undefined, relics: save.progress.relics ?? [], mapArchive: save.progress.mapArchive ?? {}, loadout: save.progress.loadout.map((gear) => ({ ...gear })) as [Gear, Gear, Gear, Gear] };
    setMapArchive({ ...runProgress.current.mapArchive }); mapOpenRef.current = false; setMapOpen(false);
    selectedSlot.current = 0; setActiveSlot(0); setLocation(save.location); setSector(save.sector);
    setHud({ hp: migratedHp, maxHp: migratedMaxHp, shards: migratedShards, kills: 0, grenade: 0, trap: 0, message: '' });
    if (slot !== undefined) setActiveSaveSlot(slot); setDebugOpen(false); setSettingsOpen(false); pausedRef.current = false; setPaused(false); setRunKey((value) => value + 1); setStarted(true);
  };
  const toggleGodMode = () => { unlockAchievement('reality_hack'); const next = !godModeRef.current; godModeRef.current = next; setGodMode(next); };
  const toggleNoClipMode = () => { unlockAchievement('reality_hack'); const next = !noClipModeRef.current; noClipModeRef.current = next; setNoClipMode(next); };
  const debugGiveShards = () => { unlockAchievement('reality_hack'); runProgress.current.shards += 100; setHud((current) => ({ ...current, shards: runProgress.current.shards })); };
  const debugAddMask = () => { unlockAchievement('reality_hack'); debugCommands.current.addMask += 1; };
  const debugKillRoom = () => { unlockAchievement('reality_hack'); debugCommands.current.killRoom += 1; };
  const debugSelectLevel = (value: string) => {
    unlockAchievement('reality_hack');
    const [nextLocation, nextSector] = value.split(':') as [LocationKind, string];
    if (!nextLocation) return;
    setEnding(false); setStoryMessage(''); setShopOpen(false); pausedRef.current = false; setPaused(false);
    runProgress.current.hp = runProgress.current.maxHp; setHud((current) => ({ ...current, hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, message: '' }));
    setLocation(nextLocation); setSector(Number(nextSector)); setRunKey((value) => value + 1); setStarted(true);
  };
  const returnToMainMenu = () => {
    pausedRef.current = false; setPaused(false); mapOpenRef.current = false; setMapOpen(false); setShopOpen(false); setDebugOpen(false); setSettingsOpen(false); setEnding(false); setStoryMessage(''); setChoosingLoadout(false); setSoulHud(0);
    setHud((current) => ({ ...current, hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, kills: 0, grenade: 0, trap: 0, message: '' })); setMenuTab('play'); setMainMenuScreen('main'); setStarted(false);
  };
  const finishRunToMainMenu = () => {
    localStorage.removeItem('ashfall-autosave'); setAutosave(null);
    runProgress.current = freshRun(permanentProgress.current); selectedSlot.current = 0; setActiveSlot(0);
    setHud({ hp: runProgress.current.hp, maxHp: runProgress.current.maxHp, shards: 0, kills: 0, grenade: 0, trap: 0, message: '' }); setSoulHud(0);
    pausedRef.current = false; setPaused(false); setShopOpen(false); setDebugOpen(false); setSettingsOpen(false); setStoryMessage(''); setEnding(false); setChoosingLoadout(false);
    godModeRef.current = false; noClipModeRef.current = false; setGodMode(false); setNoClipMode(false);
    setLocation('prison'); setSector(1); setMenuTab('play'); setMainMenuScreen('main'); setStarted(false);
  };
  const moveMenuParallax = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width - .5, y = (event.clientY - rect.top) / rect.height - .5;
    menuSceneRef.current?.style.setProperty('--menu-parallax-x', `${x}`); menuSceneRef.current?.style.setProperty('--menu-parallax-y', `${y}`);
  };

  return (
    <main className="h-screen h-dvh overflow-hidden bg-[#090e12] font-sans text-slate-100 selection:bg-teal-300/30">
      {!started && !choosingLoadout && !choosingMode && mainMenuScreen === 'main' && <button onClick={() => setMainMenuScreen('legacy')} className="fixed bottom-6 left-6 z-[120] border border-orange-300/45 bg-black/55 px-4 py-3 text-xs font-black uppercase tracking-wider text-orange-100">Наследие · {legacyProgress.embers} 🔥</button>}
      {!started && mainMenuScreen === 'legacy' && <div className="fixed inset-0 z-[130] overflow-y-auto bg-[#080b12]/95 p-6 backdrop-blur-md"><section className="mx-auto max-w-5xl"><button onClick={() => setMainMenuScreen('main')} className="mb-6 border border-white/15 px-4 py-2 text-xs text-slate-300">← Главное меню</button><h2 className="mb-6 text-3xl font-black uppercase">Наследие рыцаря</h2><LegacyTree progress={legacyProgress} onUnlock={unlockLegacy}/></section></div>}
      {!started && !choosingLoadout && !choosingMode && <div ref={menuSceneRef} onMouseMove={moveMenuParallax} className="dead-menu fixed inset-0 z-[90] overflow-hidden bg-[#10152d] text-slate-100">
        <EnvironmentParticles/>
        <div className="dead-menu-sky"/><div className="dead-menu-sun"/>
        <svg className="dead-menu-clouds-svg dead-menu-clouds-far" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g className="cloud-bank cloud-bank-a"><circle cx="120" cy="180" r="62"/><circle cx="185" cy="153" r="91"/><circle cx="274" cy="176" r="72"/><circle cx="337" cy="196" r="48"/><path d="M55 206Q140 164 230 195T390 205Q350 244 90 235Z"/></g><g className="cloud-bank cloud-bank-b"><circle cx="710" cy="112" r="48"/><circle cx="765" cy="87" r="73"/><circle cx="840" cy="108" r="60"/><circle cx="900" cy="126" r="41"/><path d="M650 137Q744 99 824 129T950 142Q886 171 690 164Z"/></g><g className="cloud-bank cloud-bank-c"><circle cx="1245" cy="205" r="70"/><circle cx="1320" cy="163" r="105"/><circle cx="1420" cy="194" r="82"/><circle cx="1491" cy="218" r="49"/><path d="M1170 233Q1280 181 1380 220T1555 237Q1480 274 1210 265Z"/></g></svg>
        <div className="dead-menu-sea"/>
        <svg className="dead-menu-castle" viewBox="0 0 900 720" preserveAspectRatio="xMidYMax meet" aria-label="Силуэт готического замка"><defs><linearGradient id="castleStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#20263a"/><stop offset="1" stopColor="#0a101b"/></linearGradient><linearGradient id="rockStone" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#131b29"/><stop offset="1" stopColor="#050a11"/></linearGradient><filter id="windowGlow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path className="castle-rock" fill="url(#rockStone)" d="M30 720L70 610 128 574 170 500 223 535 278 476 327 518 388 462 438 503 495 448 542 493 611 465 660 525 726 507 770 568 838 600 884 720Z"/><path className="castle-rock-detail" d="M116 690l63-152 35 118 74-153 42 167 94-187 45 172 76-176 54 181 91-126 39 156"/><g fill="url(#castleStone)" stroke="#30374a" strokeWidth="3"><path d="M184 574V328h118v246Z"/><path d="M210 328l33-102 34 102Z"/><path d="M232 226V118h22v108Z"/><path d="M221 123l24-60 25 60Z"/><path d="M305 574V382h120v192Z"/><path d="M326 382v-48h17v20h20v-20h18v20h21v-20h18v48Z"/><path d="M409 574V262h142v312Z"/><path d="M428 262l52-142 53 142Z"/><path d="M470 120V44h23v76Z"/><path d="M493 50l70 20-70 24Z" className="castle-flag"/><path d="M540 574V348h114v226Z"/><path d="M563 348l34-111 35 111Z"/><path d="M587 238V147h20v91Z"/><path d="M607 153l59 18-59 23Z" className="castle-flag castle-flag-small"/><path d="M645 574V298h102v276Z"/><path d="M661 298l35-126 36 126Z"/><path d="M137 574V415h68v159Z"/><path d="M145 415l26-81 27 81Z"/><path d="M738 574V404h77v170Z"/><path d="M746 404l30-91 30 91Z"/><path d="M272 505h413v69H272Z"/><path d="M272 505v-42h22v21h24v-21h23v21h25v-21h23v21h25v-21h24v21h25v-21h24v21h25v-21h23v21h26v-21h23v21h25v-21h23v42Z"/></g><g className="castle-windows" fill="#f2a15f" filter="url(#windowGlow)"><path d="M233 378q10-20 20 0v30h-20Z"/><rect x="235" y="465" width="16" height="39" rx="8"/><path d="M352 426q9-17 18 0v25h-18Z"/><path d="M466 298q12-25 24 0v39h-24Z"/><rect x="468" y="391" width="20" height="48" rx="10"/><path d="M584 397q9-18 18 0v29h-18Z"/><rect x="681" y="351" width="15" height="38" rx="7"/><path d="M770 453q8-16 16 0v24h-16Z"/></g><g className="castle-masonry" stroke="#3c4252" strokeWidth="3" opacity=".38"><path d="M190 430h105M312 470h105M416 362h128M548 456h99M657 435h83"/><path d="M220 335v-38M375 510v-42M520 480v-47M713 510v-42"/></g></svg>
        <svg className="dead-menu-castle-gothic" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-label="Мрачный готический замок"><defs><linearGradient id="gothicCastle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#262342"/><stop offset=".48" stopColor="#11162a"/><stop offset="1" stopColor="#02050a"/></linearGradient><linearGradient id="gothicRock" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#101426"/><stop offset="1" stopColor="#010307"/></linearGradient><filter id="slitGlow" x="-300%" y="-100%" width="700%" height="300%"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path fill="url(#gothicRock)" d="M8 760 42 683 78 655 103 586 138 611 171 524 203 572 246 478 278 536 325 450 357 514 401 432 442 489 486 407 518 477 568 420 604 498 655 438 688 522 735 475 769 555 817 526 852 617 902 596 940 681 992 716 1000 760Z"/><path className="gothic-rock-cuts" d="m71 720 92-174 19 143 83-179 26 193 102-236 28 221 94-244 33 249 91-213 31 218 92-154 28 166 80-87 26 95"/><g fill="url(#gothicCastle)"><path d="M105 612V430h74v182ZM112 430l30-116 30 116ZM134 315v-82h14v82Z"/><path d="M170 612V366h116v246ZM184 366v-30h10v14h13v-14h10v14h13v-14h10v14h13v-14h10v14h13v16Z"/><path d="M269 612V286h93v326ZM279 286l36-171 37 171ZM309 116V56h12v60Z"/><path d="M343 612V392h96v220ZM354 392v-27h9v13h12v-13h9v13h12v-13h9v13h12v-13h10v27Z"/><path d="M421 612V173h118v439ZM433 173l45-168 47 168ZM470 8V0h15v8Z"/><path className="castle-flag" d="M485 25v-9l74 15-74 25V42Z"/><path d="M523 612V337h78v275ZM531 337l30-139 31 139ZM555 199v-54h12v54Z"/><path d="M588 612V255h102v357ZM598 255l40-157 40 157ZM632 99V47h13v52Z"/><path className="castle-flag castle-flag-small" d="M645 62V50l59 16-59 21V75Z"/><path d="M677 612V404h88v208ZM688 404v-26h9v13h11v-13h9v13h11v-13h9v13h12v-13h9v26Z"/><path d="M749 612V322h102v290ZM760 322l38-151 40 151ZM792 172v-58h13v58Z"/><path d="M841 612V445h64v167ZM848 445l25-96 26 96Z"/><path d="M155 552h711v60H155ZM155 552v-34h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v17h13v-17h12v34Z"/></g><g className="gothic-windows" fill="#ffad4d" filter="url(#slitGlow)"><path d="M140 468h5v21h-5ZM220 420h5v25h-5ZM310 337h5v30h-5ZM389 455h5v22h-5ZM475 238h6v35h-6ZM475 350h6v38h-6ZM558 397h5v26h-5ZM636 314h5v30h-5ZM636 426h5v24h-5ZM797 383h5v31h-5ZM870 493h4v20h-4Z"/></g></svg>
        <svg className="dead-menu-castle-details" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><filter id="deepWindowGlow" x="-400%" y="-150%" width="900%" height="400%"><feGaussianBlur stdDeviation="3.2" result="a"/><feGaussianBlur in="SourceGraphic" stdDeviation=".7" result="b"/><feMerge><feMergeNode in="a"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g className="gothic-clean-roofs" fill="#17182e"><path d="M166 369 228 184 290 369Z"/><path d="M338 395 390 230 444 395Z"/><path d="M671 407 721 235 771 407Z"/></g><g className="gothic-extra-windows" fill="#e97827" filter="url(#deepWindowGlow)"><path d="M126 482h3v16h-3Zm13 45h3v18h-3Zm17-76h3v15h-3ZM198 407h3v18h-3Zm18 55h3v16h-3Zm22-90h3v19h-3Zm22 124h3v17h-3ZM293 316h3v19h-3Zm17 59h3v16h-3Zm21 57h3v20h-3ZM365 421h3v17h-3Zm20 55h3v20h-3Zm22-108h3v17h-3ZM449 225h3v20h-3Zm16 59h3v17h-3Zm18 66h3v21h-3Zm19 62h3v18h-3ZM543 367h3v17h-3Zm16 53h3v20h-3Zm18 69h3v16h-3ZM610 286h3v19h-3Zm17 59h3v17h-3Zm18 58h3v21h-3Zm18 73h3v16h-3ZM696 429h3v18h-3Zm18 51h3v16h-3Zm21-91h3v19h-3ZM772 350h3v17h-3Zm17 55h3v20h-3Zm20 63h3v17h-3Zm22-104h3v16h-3ZM858 469h3v18h-3Zm15 47h3v15h-3Z"/></g><g className="gothic-torn-flags" fill="#0b0d18"><path d="M485 18 548 30 532 38 550 46 515 49 485 57Z"/><path d="M645 51 700 65 681 72 696 81 670 78 645 88Z"/></g><path className="gothic-rock-foreground" d="M5 760 38 699 69 681 96 620 123 650 153 574 181 628 214 544 247 604 283 512 311 590 354 494 382 574 427 468 459 566 501 479 536 579 577 503 612 593 656 518 689 612 727 548 761 635 803 582 837 659 880 625 913 698 954 675 1000 731 1000 760Z"/></svg>
        <svg className="dead-menu-castle-solid" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-label="Монолитный силуэт готического замка"><defs><linearGradient id="solidCastleGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1934"/><stop offset=".5" stopColor="#0b1020"/><stop offset="1" stopColor="#010205"/></linearGradient><filter id="solidWindowGlow" x="-500%" y="-200%" width="1100%" height="500%"><feGaussianBlur stdDeviation="3.1" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path className="solid-castle-shape" fill="url(#solidCastleGradient)" d="M5 760 34 700 66 678 91 612 121 640 151 557 180 616 217 525 249 592 286 494 320 574 359 471 394 562 431 452 468 553 510 466 546 568 590 493 626 582 670 516 708 606 748 548 785 631 826 585 859 659 902 626 936 697 973 681 1000 724V760ZM98 620V420H171V620L134 246ZM112 420 134 246 158 420ZM128 247V205H140V247ZM169 620V352H282V620L225 152ZM178 352 225 152 274 352ZM218 153V100H232V153ZM280 620V395H366V620L323 235ZM289 395 323 235 358 395ZM365 620V286H444V620L405 113ZM374 286 405 113 437 286ZM398 114V70H412V114ZM442 620V170H548V620L494 18ZM452 170 494 18 539 170ZM487 20V2H501V20L558 33 538 41 558 50 523 52 501 63V70H487ZM546 620V333H620V620L583 184ZM554 333 583 184 613 333ZM577 185V139H589V185ZM618 620V250H710V620L664 87ZM627 250 664 87 702 250ZM658 89V46H671V89L720 59 707 73 723 82 696 87 671 104V112H658ZM708 620V374H790V620L749 211ZM717 374 749 211 782 374ZM743 212V167H756V212ZM788 620V322H875V620L832 173ZM797 322 832 173 867 322ZM826 174V127H839V174ZM873 620V438H929V620L901 328ZM880 438 901 328 923 438ZM150 620V535H895V620ZM150 535V505H161V520H174V505H185V520H198V505H209V520H222V505H233V520H246V505H257V520H270V505H281V520H294V505H305V520H318V505H329V520H342V505H353V520H366V505H377V520H390V505H401V520H414V505H425V520H438V505H449V520H462V505H473V520H486V505H497V520H510V505H521V520H534V505H545V520H558V505H569V520H582V505H593V520H606V505H617V520H630V505H641V520H654V505H665V520H678V505H689V520H702V505H713V520H726V505H737V520H750V505H761V520H774V505H785V520H798V505H809V520H822V505H833V520H846V505H857V520H870V505H881V520H895V535Z"/><g className="solid-castle-windows" fill="#ed7a2c" filter="url(#solidWindowGlow)"><path d="M132 455h3v17h-3ZM132 506h3v18h-3ZM223 397h3v18h-3ZM223 449h3v17h-3ZM223 497h3v19h-3ZM322 426h3v18h-3ZM322 478h3v17h-3ZM404 331h3v20h-3ZM404 390h3v17h-3ZM404 448h3v19h-3ZM493 223h3v21h-3ZM493 286h3v18h-3ZM493 350h3v21h-3ZM493 416h3v18h-3ZM582 378h3v18h-3ZM582 435h3v20h-3ZM663 297h3v20h-3ZM663 359h3v18h-3ZM663 423h3v20h-3ZM748 414h3v18h-3ZM748 466h3v17h-3ZM831 363h3v20h-3ZM831 425h3v18h-3ZM900 477h3v18h-3Z"/></g></svg>
        <svg className="dead-menu-castle-architecture" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-label="Асимметричный средневековый замок"><defs><linearGradient id="architectureGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c1a36"/><stop offset=".52" stopColor="#0b1020"/><stop offset="1" stopColor="#010205"/></linearGradient><filter id="architectureWindowGlow" x="-500%" y="-250%" width="1100%" height="600%"><feGaussianBlur stdDeviation="3" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path className="castle-architecture-shape" fill="url(#architectureGradient)" d="M5 760 44 694 83 671 109 604 146 631 181 555 219 604 261 523 298 588 344 496 382 576 431 472 469 568 519 489 559 579 612 514 655 596 707 540 750 621 805 574 850 648 906 622 945 699 986 687 1000 726V760ZM142 617V398H264V617ZM151 398 203 208 255 398ZM252 617V495H425V617ZM252 495V463H266V480H282V463H296V480H312V463H326V480H342V463H356V480H372V463H386V480H402V463H416V495ZM397 617V278H623V617ZM409 278 510 67 611 278ZM611 617V506H739V617ZM611 506V477H624V492H640V477H653V492H669V477H682V492H698V477H711V492H727V477H739V506ZM714 617V394Q714 356 752 342H849Q887 356 887 394V617ZM720 394V369H733V383H748V369H761V383H776V369H789V383H804V369H817V383H832V369H845V383H860V369H873V394ZM844 617V458H927V617ZM850 458 885 316 921 458Z"/><g className="castle-architecture-windows" fill="#ec812f" filter="url(#architectureWindowGlow)"><path d="M201 438h4v18h-4ZM201 507h4v17h-4ZM508 332h5v21h-5ZM508 424h5v22h-5ZM798 438h4v17h-4ZM798 505h4v16h-4ZM883 489h4v17h-4Z"/></g></svg>
        <svg className="dead-menu-castle-window-details" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="#ec812f" filter="url(#architectureWindowGlow)"><path d="M181 473h3v15h-3ZM223 548h3v16h-3ZM465 310h4v18h-4ZM548 304h4v18h-4ZM462 382h4v17h-4ZM552 388h4v17h-4ZM463 482h4v18h-4ZM550 490h4v17h-4ZM760 413h3v15h-3ZM837 414h3v15h-3ZM760 476h3v16h-3ZM837 482h3v16h-3ZM870 536h3v15h-3ZM899 531h3v15h-3Z"/></g></svg>
        <svg className="dead-menu-castle-battlements" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path fill="url(#architectureGradient)" d="M728 358V326h12v16h15v-16h12v16h15v-16h12v16h15v-16h12v16h15v-16h12v16h15v-16h12v32Z"/></svg>
        <div className="dead-menu-mist"/><div className="dead-menu-cliff"/>
        <svg className="dead-menu-clouds-svg dead-menu-clouds-near" viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g className="cloud-bank cloud-bank-a"><circle cx="90" cy="390" r="80"/><circle cx="176" cy="350" r="118"/><circle cx="280" cy="386" r="91"/><circle cx="365" cy="409" r="59"/><path d="M15 425Q150 349 275 409T430 438Q340 474 65 466Z"/></g><g className="cloud-bank cloud-bank-c"><circle cx="940" cy="300" r="79"/><circle cx="1030" cy="253" r="126"/><circle cx="1145" cy="292" r="94"/><circle cx="1240" cy="325" r="64"/><path d="M850 346Q1000 260 1130 329T1325 360Q1210 401 902 389Z"/></g></svg><div className="dead-menu-grain"/>
        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6 md:p-10"><div><p className="text-[9px] font-black uppercase tracking-[.48em] text-cyan-200/70">Проклятое королевство</p><h1 className="mt-2 text-2xl font-black uppercase tracking-[.12em] text-slate-100 drop-shadow-[0_3px_8px_rgba(0,0,0,.8)] md:text-4xl">False Knight</h1></div><button onClick={() => session ? supabase.auth.signOut() : setShowAuth(true)} disabled={!authReady} className="dead-menu-account border border-white/15 bg-black/20 px-4 py-2 text-[9px] font-black uppercase tracking-[.18em] text-slate-300">{session ? 'Выйти' : 'Войти'}</button></header>
        <div className="dead-menu-content absolute inset-0 z-10 flex items-center px-7 pb-8 pt-24 md:px-14 lg:px-24">
          {mainMenuScreen === 'main' ? <section className="dead-menu-main w-full max-w-xl"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.4em] text-orange-200/70">Память ждёт в стенах замка</p><nav className="grid justify-start gap-1"><button onClick={() => setMainMenuScreen('saves')} className="dead-menu-item">Играть</button><button onClick={() => setMainMenuScreen('settings')} className="dead-menu-item">Настройки</button><button onClick={() => setMainMenuScreen('bestiary')} className="dead-menu-item">Книга врагов</button><button onClick={() => setMainMenuScreen('trials')} className="dead-menu-item">Испытания боссов</button><button onClick={() => setMainMenuScreen('records')} className="dead-menu-item">Таблица рекордов</button><button onClick={() => setMainMenuScreen('achievements')} className="dead-menu-item">Достижения</button></nav><p className="mt-6 max-w-sm border-l border-cyan-200/30 pl-4 text-[10px] leading-5 text-slate-300/55">Поднимись со дна Подземелья. Верни утраченную силу и узнай, кому принадлежит пустой трон.</p><DailyChallengeCard challenge={dailyChallenge} progress={dailyProgress(dailyChallenge, summarizeRun())} loading={dailyLoading} completed={dailyReward.completedDate === dailyChallenge.date} streak={dailyReward.streak}/></section> : <section className="dead-submenu w-full"><div className="mb-5 flex items-end justify-between border-b border-white/15 pb-4"><div><button onClick={() => setMainMenuScreen('main')} className="mb-3 text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/70 hover:text-cyan-100">← Главное меню</button><h2 className="text-2xl font-black uppercase tracking-[.08em] md:text-4xl">{mainMenuScreen === 'saves' ? 'Выбор слота' : mainMenuScreen === 'settings' ? 'Настройки' : mainMenuScreen === 'bestiary' ? 'Книга врагов и боссов' : mainMenuScreen === 'records' ? 'Таблица рекордов' : mainMenuScreen === 'trials' ? 'Испытания боссов' : 'Достижения'}</h2></div>{mainMenuScreen === 'achievements' && <b className="text-xs text-amber-200">{unlockedAchievements.size} / {ACHIEVEMENTS.length}</b>}</div>
            {mainMenuScreen === 'saves' && <div><p className={`mb-3 text-[9px] font-black uppercase tracking-[.18em] ${cloudSaveStatus === 'error' ? 'text-rose-300' : cloudSaveStatus === 'synced' ? 'text-emerald-300' : 'text-slate-500'}`}>{cloudSaveStatus === 'local' ? 'Сохранения только на этом устройстве — войдите для синхронизации' : cloudSaveStatus === 'syncing' ? '☁ Синхронизация сохранений…' : cloudSaveStatus === 'synced' ? '☁ Сохранения синхронизированы' : 'Не удалось связаться с облаком — локальная копия сохранена'}</p><div className="dead-slots-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{saveSlots.map((save, index) => <article key={index} className="dead-slot relative min-h-52 border border-white/15 bg-[#07101a]/85 p-4 backdrop-blur-md"><p className="text-[8px] font-black uppercase tracking-[.25em] text-slate-500">Слот {index + 1}</p>{save ? <><button onClick={() => deleteSave(index)} title="Сбросить прогресс" className="absolute right-3 top-3 border border-rose-400/20 px-2 py-1 text-[8px] uppercase text-rose-300/70 hover:border-rose-300/60 hover:text-rose-200">☠ Сбросить прогресс</button><button onClick={() => loadGame(save, index)} className="dead-slot-button mt-11 w-full border border-cyan-200/40 bg-cyan-300/5 px-3 py-3 text-[10px] font-black uppercase tracking-[.1em] text-cyan-50">Продолжить (Обычный режим)</button><p className="mt-5 border-t border-white/10 pt-4 text-[9px] leading-5 text-slate-400">Уровень: <b className="text-slate-100">{LOCATION_NAMES_RU[save.location]}</b><br/>Осколки: <b className="text-amber-200">{save.progress.shards ?? save.progress.cells ?? 0} 💎</b><br/>Здоровье: <b className="text-rose-200">{save.progress.hp}/5 🩸</b></p></> : <div className="grid h-40 place-items-center"><button onClick={() => beginNewInSlot(index)} className="dead-slot-button w-full border border-cyan-200/40 bg-cyan-300/5 px-3 py-3 text-[10px] font-black uppercase tracking-[.1em] text-cyan-50">Новый забег (Обычный режим)</button></div>}</article>)}</div></div>}
            {mainMenuScreen === 'settings' && <div className="dead-settings mx-auto grid max-w-4xl gap-5 rounded-sm border border-white/15 bg-[#07101a]/85 p-5 backdrop-blur-md md:grid-cols-2 md:p-7"><div className="grid content-start gap-5"><label className="grid gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-300"><span className="flex justify-between">Громкость музыки <b className="text-cyan-200">{settings.musicVolume}%</b></span><input type="range" min="0" max="100" value={settings.musicVolume} onChange={(event) => setSettings((current) => ({ ...current, musicVolume: Number(event.target.value) }))} className="accent-cyan-300"/></label><label className="grid gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-300"><span className="flex justify-between">Громкость эффектов <b className="text-cyan-200">{settings.effectsVolume}%</b></span><input type="range" min="0" max="100" value={settings.effectsVolume} onChange={(event) => setSettings((current) => ({ ...current, effectsVolume: Number(event.target.value) }))} className="accent-cyan-300"/></label><button onClick={() => setSettings((current) => ({ ...current, screenShake: !current.screenShake }))} className={`flex justify-between border px-4 py-3 text-[10px] font-black uppercase tracking-[.15em] ${settings.screenShake ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/15 text-slate-500'}`}><span>Тряска экрана</span><span>{settings.screenShake ? 'Включена' : 'Выключена'}</span></button>{mobileSettingsPanel()}</div>{bindingsPanel(true)}</div>}
            {mainMenuScreen === 'achievements' && <div className="dead-achievements-grid grid max-h-[58vh] gap-3 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-4">{ACHIEVEMENTS.map((achievement) => { const unlocked = unlockedAchievements.has(achievement.id); return <article key={achievement.id} className={`achievement-card min-h-36 border p-4 backdrop-blur-md ${unlocked ? 'achievement-card-unlocked border-amber-300/60 bg-[#211b10]/90' : 'border-white/10 bg-[#07101a]/85 grayscale'}`}><div className="flex items-start justify-between"><span className="text-2xl">{unlocked ? achievement.icon : '◇'}</span><small className={unlocked ? 'text-amber-200' : 'text-slate-600'}>{unlocked ? 'Открыто' : 'Закрыто'}</small></div><h3 className={`mt-3 text-xs font-black uppercase ${unlocked ? 'text-amber-50' : 'text-slate-500'}`}>{achievement.title}</h3><p className="mt-2 text-[9px] leading-4 text-slate-500">{'secret' in achievement && achievement.secret && !unlocked ? 'Секретное достижение' : achievement.description}</p></article>})}</div>}
            {mainMenuScreen === 'bestiary' && <BestiaryBook progress={bestiaryProgress}/>}
            {mainMenuScreen === 'records' && <RecordsTable userId={session?.user.id}/>}
            {mainMenuScreen === 'trials' && <BossTrialsMenu onStart={startBossTrial} progress={bossTrialProgress} rewardMessage={trialRewardMessage}/>}
          </section>}
        </div><footer className="absolute bottom-5 right-6 z-20 text-[8px] uppercase tracking-[.22em] text-slate-300/35">Версия странника · Обычный режим</footer>
      </div>}
      {!started && menuTab === 'saves' && !choosingLoadout && <div className="fixed inset-x-[5vw] bottom-[10vh] top-[18vh] z-[60] overflow-y-auto border border-cyan-300/15 bg-[#071016]/98 p-5 text-left shadow-[0_30px_90px_rgba(0,0,0,.85)] backdrop-blur-md md:p-7">
        <div className="sticky top-0 z-10 flex items-end justify-between border-b border-white/10 bg-[#071016]/95 pb-4"><div><p className="text-[9px] font-black uppercase tracking-[.35em] text-cyan-300">Хроники падшего</p><h2 className="mt-1 text-2xl font-black uppercase md:text-3xl">Выберите слот</h2></div><button onClick={() => setMenuTab('play')} className="border border-white/15 px-3 py-2 text-[9px] font-black uppercase text-slate-400 hover:border-cyan-300/50 hover:text-cyan-200">Назад</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">{saveSlots.map((save, index) => <article key={index} className={`save-slot-card relative min-h-52 overflow-hidden border p-5 ${activeSaveSlot === index ? 'border-cyan-300/60' : 'border-white/10'}`}><div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-300/5 blur-3xl"/><p className="text-[9px] font-black uppercase tracking-[.28em] text-slate-500">Слот сохранения {index + 1}</p>{save ? <><button onClick={() => deleteSave(index)} title="Стереть этот слот" className="absolute right-4 top-4 z-10 border border-rose-400/20 bg-black/30 px-2 py-1.5 text-[8px] font-bold uppercase text-rose-300/70 transition hover:border-rose-300/60 hover:text-rose-200">☠ Сбросить забег</button><button onClick={() => loadGame(save, index)} className="save-slot-primary mt-6 w-full border border-cyan-300/45 bg-cyan-300/10 px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-cyan-100">Продолжить (Обычный режим)</button><div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-[10px] tracking-wide text-slate-400"><p><span className="text-slate-600">Текущий уровень:</span> <b className="text-slate-200">{LOCATION_NAMES[save.location]}</b></p><p><span className="text-slate-600">Собрано осколков:</span> <b className="text-amber-200">{save.progress.shards ?? save.progress.cells ?? 0} 💎</b></p><p><span className="text-slate-600">Запас здоровья:</span> <b className="text-rose-200">{save.progress.hp} / 5 🩸</b></p></div></> : <div className="grid min-h-36 place-items-center"><div className="w-full"><p className="mb-5 text-center text-[10px] uppercase tracking-[.22em] text-slate-700">Пустая хроника</p><button onClick={() => beginNewInSlot(index)} className="save-slot-primary w-full border border-cyan-300/40 bg-cyan-300/5 px-5 py-3 text-xs font-black uppercase tracking-[.12em] text-cyan-100">Новый забег (Обычный режим)</button></div></div>}</article>)}</div>
      </div>}
      {!started && menuTab === 'achievements' && <div className="fixed inset-x-[5vw] bottom-[10vh] top-[18vh] z-[60] overflow-y-auto border border-amber-300/15 bg-[#0a1015]/98 p-5 text-left shadow-[0_30px_90px_rgba(0,0,0,.8)] backdrop-blur-md md:p-7">
        <div className="sticky top-0 z-10 flex items-end justify-between border-b border-white/10 bg-[#0a1015]/95 pb-3"><div><p className="text-[9px] font-black uppercase tracking-[.35em] text-amber-300">False Knight</p><h2 className="mt-1 text-2xl font-black uppercase">Достижения</h2></div><div className="flex items-center gap-3"><b className="text-xs text-amber-200">{unlockedAchievements.size} / {ACHIEVEMENTS.length}</b><button onClick={() => setMenuTab('play')} className="border border-white/15 px-3 py-2 text-[9px] font-black uppercase text-slate-400 hover:border-amber-300/50 hover:text-amber-200">Закрыть</button></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{ACHIEVEMENTS.map((achievement) => { const unlocked = unlockedAchievements.has(achievement.id); return <article key={achievement.id} className={`achievement-card min-h-36 border p-4 ${unlocked ? 'achievement-card-unlocked border-amber-300/60 bg-amber-300/10' : 'border-white/10 bg-black/25 grayscale'}`}><div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center border text-xl ${unlocked ? 'border-amber-300/50 bg-amber-300/10' : 'border-white/10 bg-white/5 opacity-35'}`}>{unlocked ? achievement.icon : '◇'}</span><span className={`text-[7px] font-black uppercase tracking-[.15em] ${unlocked ? 'text-amber-200' : 'text-slate-600'}`}>{unlocked ? 'Разблокировано' : 'Заблокировано'}</span></div><h3 className={`mt-3 text-xs font-black uppercase ${unlocked ? 'text-amber-50' : 'text-slate-500'}`}>{achievement.title}</h3><p className="mt-2 text-[9px] leading-4 text-slate-500">{'secret' in achievement && achievement.secret && !unlocked ? 'Секретное достижение' : achievement.description}</p></article>})}</div>
      </div>}
      {achievementToast && <div key={achievementToast.id} className="achievement-toast fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] items-center gap-4 border border-amber-300/70 bg-[#171108]/95 p-4 text-left shadow-[0_0_40px_rgba(251,191,36,.25)] backdrop-blur-md"><span className="grid h-11 w-11 shrink-0 place-items-center border border-amber-300/50 bg-amber-300/10 text-2xl">{achievementToast.icon}</span><span><small className="block text-[8px] font-black uppercase tracking-[.2em] text-amber-300">Достижение разблокировано</small><b className="mt-1 block text-sm text-amber-50">{achievementToast.title}</b></span></div>}
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      {weaponReplacement && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/85 px-4 backdrop-blur-md">
        <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-teal-300/35 bg-[#071116] p-6 text-center shadow-[0_0_70px_rgba(45,212,191,.14)] md:p-8">
          <p className="text-[9px] font-black uppercase tracking-[.35em] text-teal-300">Замена оружия</p>
          <h2 className="mt-3 text-2xl font-black uppercase md:text-4xl">Выберите ячейку</h2>
          <p className="mt-3 text-xs text-slate-400">Новое оружие: <b className="text-slate-100">{weaponReplacement.gear.name}</b></p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">{weaponReplacement.slots.map((slot) => {
            const equipped = runProgress.current.loadout[slot];
            const incoming = weaponReplacement.gear;
            const damageMultiplier = runProgress.current.damage;
            const oldDamage = Math.round(equipped.damage * damageMultiplier);
            const newDamage = Math.round(incoming.damage * damageMultiplier);
            const oldSpeed = equipped.cooldown > 0 ? 1 / equipped.cooldown : 0;
            const newSpeed = incoming.cooldown > 0 ? 1 / incoming.cooldown : 0;
            const comparisons = [
              { label: 'Уровень', oldValue: equipped.tier, newValue: incoming.tier, diff: incoming.tier - equipped.tier, digits: 0 },
              { label: 'Урон', oldValue: oldDamage, newValue: newDamage, diff: newDamage - oldDamage, digits: 0 },
              { label: 'Атак/сек', oldValue: oldSpeed, newValue: newSpeed, diff: newSpeed - oldSpeed, digits: 2 },
              { label: 'Урон/сек', oldValue: oldDamage * oldSpeed, newValue: newDamage * newSpeed, diff: newDamage * newSpeed - oldDamage * oldSpeed, digits: 1 },
              { label: 'Дальность', oldValue: weaponRange(equipped), newValue: weaponRange(incoming), diff: weaponRange(incoming) - weaponRange(equipped), digits: 0, suffix: ' ед.' },
            ];
            return <button key={slot} onClick={() => replaceWeaponInSlot(slot)} className="group border border-white/15 bg-black/30 p-4 text-left transition hover:border-teal-300/70 hover:bg-teal-300/10">
              <span className="text-[9px] font-black uppercase tracking-[.18em] text-teal-300">Заменить ячейку {slot + 1}</span>
              <span className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="min-w-0"><small className="block text-[8px] font-bold uppercase tracking-wider text-slate-600">Текущее</small><b className="mt-1 block text-2xl">{gearIcons[equipped.kind]}</b><strong className="mt-1 block truncate text-xs text-slate-300">{equipped.name}</strong></span>
                <b className="text-lg text-slate-600 transition group-hover:translate-x-1 group-hover:text-teal-300">→</b>
                <span className="min-w-0"><small className="block text-[8px] font-bold uppercase tracking-wider text-teal-400/70">Новое</small><b className="mt-1 block text-2xl">{gearIcons[incoming.kind]}</b><strong className="mt-1 block truncate text-xs text-teal-100">{incoming.name}</strong></span>
              </span>
              <span className="mt-4 block border-t border-white/10 pt-2">{comparisons.map((stat) => <span key={stat.label} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 py-1 text-[10px]"><span className="text-slate-500">{stat.label}</span><span className="tabular-nums text-slate-500">{stat.oldValue.toFixed(stat.digits)}{stat.suffix}</span><span className="text-slate-700">→</span><span className={`min-w-[4.5rem] text-right font-bold tabular-nums ${stat.diff > .005 ? 'text-emerald-300' : stat.diff < -.005 ? 'text-rose-300' : 'text-slate-300'}`}>{stat.newValue.toFixed(stat.digits)}{stat.suffix} <small>({stat.diff > .005 ? '+' : ''}{stat.diff.toFixed(stat.digits)}{stat.suffix})</small></span></span>)}</span>
            </button>;
          })}</div>
          <button onClick={cancelWeaponReplacement} className="mt-5 border border-white/10 px-5 py-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500 hover:border-white/30 hover:text-slate-300">Не заменять</button>
        </section>
      </div>}
      {settingsOpen && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 px-4 backdrop-blur-md"><section className="w-full max-w-2xl border border-cyan-300/25 bg-[#081116] p-6 shadow-[0_0_70px_rgba(34,211,238,.1)] md:p-8"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.35em] text-cyan-300">False Knight</p><h2 className="mt-2 text-3xl font-black uppercase">Настройки</h2></div><button onClick={() => setSettingsOpen(false)} className="border border-white/15 px-3 py-2 text-xs text-slate-400 hover:border-cyan-300/50">✕</button></div><div className="mt-7 grid gap-5"><label className="grid gap-2 text-xs font-bold uppercase tracking-[.14em] text-slate-300"><span className="flex justify-between">Громкость музыки <b className="text-cyan-200">{settings.musicVolume}%</b></span><input type="range" min="0" max="100" value={settings.musicVolume} onChange={(event) => setSettings((current) => ({ ...current, musicVolume: Number(event.target.value) }))} className="accent-cyan-300"/></label><label className="grid gap-2 text-xs font-bold uppercase tracking-[.14em] text-slate-300"><span className="flex justify-between">Громкость эффектов <b className="text-cyan-200">{settings.effectsVolume}%</b></span><input type="range" min="0" max="100" value={settings.effectsVolume} onChange={(event) => setSettings((current) => ({ ...current, effectsVolume: Number(event.target.value) }))} className="accent-cyan-300"/></label><button onClick={() => setSettings((current) => ({ ...current, screenShake: !current.screenShake }))} className={`flex justify-between border px-4 py-3 text-xs font-black uppercase tracking-[.14em] ${settings.screenShake ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-200' : 'border-white/15 text-slate-500'}`}><span>Тряска экрана</span><span>{settings.screenShake ? 'Вкл' : 'Выкл'}</span></button></div><div className="mt-7 border-t border-white/10 pt-5"><p className="text-[9px] font-black uppercase tracking-[.25em] text-slate-500">Управление</p><div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400 md:grid-cols-3">{[['WASD / стрелки','Движение'],['ЛКМ / J','Атака'],['S + ЛКМ в воздухе','Удар вниз'],['F','Лечение Душой'],['E','Действие'],['Shift / C','Перекат']].map(([key, action]) => <div key={key} className="border border-white/10 bg-black/25 p-3"><kbd className="font-black text-slate-100">{key}</kbd><span className="mt-1 block">{action}</span></div>)}</div></div></section></div>}
      {ending && <div className="ending-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-black px-6 py-10 text-center"><div className="ending-lore grid gap-3"><p className="ending-line text-lg text-slate-300 md:text-2xl">...Я искал Короля-Тирана, чтобы спасти это королевство.</p><p className="ending-line text-lg text-slate-300 md:text-2xl" style={{ animationDelay: '3.5s' }}>Но Король-Тиран — это я. Рыцарь всё это время бежал от собственного отражения.</p><p className="ending-line text-2xl font-black text-amber-200 md:text-4xl" style={{ animationDelay: '7s' }}>Круг замкнулся.</p><p className="ending-line text-sm uppercase tracking-[.3em] text-slate-500" style={{ animationDelay: '10.5s' }}>Спасибо за игру в False Knight!</p></div><section className="ending-summary w-full max-w-lg border-y border-amber-300/25 bg-[#050608] px-7 py-7 shadow-[0_0_70px_rgba(251,146,60,.09)]"><h2 className="text-3xl font-black uppercase tracking-[.16em] text-amber-50 md:text-4xl">Конец забега</h2><div className="mx-auto mt-5 max-w-sm border-y border-white/10 py-4 text-xs text-slate-400"><p className="flex justify-between"><span>Осколков собрано:</span><b className="text-amber-200">{runProgress.current.shards} 💎</b></p></div><div className="mt-5 border border-amber-300/15 bg-amber-300/5 p-4 text-sm leading-6 text-slate-300"><p className="mb-2 text-[8px] font-black uppercase tracking-[.3em] text-amber-300">Летопись забега</p>{chronicleLoading ? 'Хронист записывает последние строки…' : chronicle}</div><button onClick={finishRunToMainMenu} className="ending-menu-button mt-6 border border-cyan-300/45 bg-cyan-300/10 px-7 py-4 text-xs font-black uppercase tracking-[.16em] text-cyan-50">Вернуться в главное меню</button></section></div>}
      {shopOpen && <MerchantHub origin={location === 'throne' ? 'castle' : location} shards={runProgress.current.shards} interactKey={settings.bindings.interact} onLeave={leaveShop}
        forge={<div className="grid gap-3 md:grid-cols-2"><button onClick={() => buyPermanent('health')} className="border border-amber-300/25 bg-amber-300/5 p-4 text-left hover:border-amber-300"><b className="block text-sm">Укрепить здоровье +1 маска</b><small className="text-slate-500">Постоянное улучшение этого слота</small><strong className="mt-3 block text-amber-200">{45 + permanentProgress.current.maxHpBonus * 20} ◆</strong></button><button onClick={() => buyPermanent('damage')} className="border border-amber-300/25 bg-amber-300/5 p-4 text-left hover:border-amber-300"><b className="block text-sm">Закалить оружие +8% урона</b><small className="text-slate-500">Постоянное улучшение этого слота</small><strong className="mt-3 block text-amber-200">{30 + Math.round(permanentProgress.current.damageBonus / .08) * 8} ◆</strong></button></div>}
        alchemist={<div><p className="mb-4 text-xs text-slate-400">Можно взять одну реликвию за посещение. Первые три бесплатны, четвёртая стоит 100 осколков.</p>{relicClaimedVisit === shopVisit ? <p className="border border-emerald-300/30 bg-emerald-300/5 p-5 text-sm text-emerald-200">В этом убежище реликвия уже получена.</p> : runProgress.current.relics.length >= 4 ? <p className="border border-white/10 p-5 text-sm text-slate-500">Достигнут предел: 4 реликвии.</p> : <div className="grid gap-3 md:grid-cols-3">{alchemistRelicOffers.map((relic) => <button key={relic.id} onClick={() => takeAlchemistRelic(relic)} className="border border-violet-300/25 bg-violet-300/5 p-4 text-left hover:border-violet-300"><span className="text-3xl">{relic.icon}</span><b className="mt-3 block text-sm text-violet-100">{relic.name}</b><small className="mt-2 block leading-5 text-slate-500">{relic.description}</small><strong className="mt-3 block text-amber-200">{runProgress.current.relics.length < 3 ? 'Бесплатно' : '100 ◆'}</strong></button>)}</div>}</div>}
        weapons={<div className="grid gap-3 md:grid-cols-3">{merchantWeapons.map((offer) => <button key={`${offer.gear.kind}-${offer.gear.name}`} onClick={() => buyWeapon(offer)} className="border border-rose-300/25 bg-rose-300/5 p-4 text-left hover:border-rose-300"><span className="text-3xl">{gearIcons[offer.gear.kind]}</span><b className="mt-2 block text-sm">{offer.gear.name}</b><small className="text-slate-500">T{offer.gear.tier} · урон {offer.gear.damage}</small><strong className="mt-3 block text-rose-200">{offer.cost} ◆</strong></button>)}</div>}
        evolution={<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{runProgress.current.loadout.map((gear, slot) => gear.kind !== 'empty' && weaponBranches(gear.kind).length > 0 ? <article key={`${slot}-${gear.name}`} className="border border-cyan-300/20 bg-cyan-300/5 p-3"><b className="text-xs">{gearIcons[gear.kind]} {gear.name}</b>{gear.branch ? <p className="mt-3 text-[10px] text-emerald-300">Эволюция уже завершена</p> : <div className="mt-3 grid gap-2">{weaponBranches(gear.kind).map((branch) => <button key={branch.id} onClick={() => evolveEquippedWeapon(slot, branch.id)} className="border border-cyan-300/20 p-2 text-left text-[10px] hover:border-cyan-300"><strong className="block text-cyan-100">{branch.name}</strong><span className="text-slate-500">{branch.description}</span><b className="mt-1 block text-amber-200">{24 + gear.tier * 6} ◆</b></button>)}</div>}</article> : null)}</div>}
      />}
      {false && shopOpen && <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#07100f]/95 px-4 py-8 backdrop-blur-md">
        <div className="w-full max-w-6xl">
          <div className="mb-6 text-center"><p className="text-[10px] font-black uppercase tracking-[.45em] text-teal-300">Безопасная комната</p><h2 className="mt-2 text-3xl font-black uppercase md:text-5xl">Убежище торговцев</h2><p className="mt-3 text-sm text-slate-500">Осколки: <span className="font-black text-amber-200">{runProgress.current.shards}</span></p>{(chronicleLoading || chronicle) && <p className="mx-auto mt-4 max-w-2xl border-y border-amber-300/15 py-3 text-xs leading-5 text-amber-50/70">{chronicleLoading ? 'Хронист записывает пройденный путь…' : chronicle}</p>}</div>
          <p className="mb-3 text-center text-[9px] font-bold uppercase tracking-[.18em] text-amber-300/70">Все цены указаны в Осколках</p>
          <div className="grid gap-4 md:grid-cols-3">
            <section className="border border-amber-300/25 bg-[#17130b] p-6 shadow-[0_0_50px_rgba(251,191,36,.06)]"><p className="text-[9px] font-black uppercase tracking-[.3em] text-amber-300">Хранитель кузни</p><h3 className="mt-2 text-xl font-black uppercase">Навсегда в этом слоте</h3><p className="mt-2 text-xs leading-5 text-slate-500">Эти улучшения сохраняются после смерти только в текущей игре. Новый слот начнётся без них.</p><div className="mt-5 grid gap-3"><button onClick={() => buyPermanent('health')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-amber-300/40"><span><b className="block text-sm text-slate-200">Максимум здоровья +1 маска</b><small className="text-slate-600">Получено масок: +{permanentProgress.current.maxHpBonus}</small></span><strong className="text-amber-300">{45 + permanentProgress.current.maxHpBonus * 20}</strong></button><button onClick={() => buyPermanent('damage')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-amber-300/40"><span><b className="block text-sm text-slate-200">Урон +8%</b><small className="text-slate-600">Постоянное усиление этого слота</small></span><strong className="text-amber-300">{30 + Math.round(permanentProgress.current.damageBonus / .08) * 8}</strong></button></div></section>
            <section className="border border-violet-300/25 bg-[#120e1b] p-6 shadow-[0_0_50px_rgba(167,139,250,.06)]"><p className="text-[9px] font-black uppercase tracking-[.3em] text-violet-300">Странствующий алхимик</p><h3 className="mt-2 text-xl font-black uppercase">На один забег</h3><p className="mt-2 text-xs leading-5 text-slate-500">Сильные дешёвые улучшения исчезают после смерти.</p><div className="mt-5 grid gap-3"><button onClick={() => buyRunUpgrade('health')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-violet-300/40"><span><b className="block text-sm text-slate-200">Полное исцеление</b><small className="text-slate-600">Восстанавливает все маски</small></span><strong className="text-violet-300">8</strong></button><button onClick={() => buyRunUpgrade('damage')} className="flex items-center justify-between border border-white/10 bg-black/25 p-4 text-left transition hover:border-violet-300/40"><span><b className="block text-sm text-slate-200">Урон +12%</b><small className="text-slate-600">До конца попытки</small></span><strong className="text-violet-300">15</strong></button></div></section>
            <section className="border border-rose-300/25 bg-[#190d10] p-6 shadow-[0_0_50px_rgba(251,113,133,.06)]"><p className="text-[9px] font-black uppercase tracking-[.3em] text-rose-300">Оружейник</p><h3 className="mt-2 text-xl font-black uppercase">Оружие</h3><p className="mt-2 text-xs leading-5 text-slate-500">Предложения усиливаются с каждым сектором и действуют до конца забега.</p><div className="mt-5 grid gap-3">{merchantWeapons.map((offer) => <button key={offer.gear.kind} onClick={() => buyWeapon(offer)} className="flex items-center justify-between border border-white/10 bg-black/25 p-3 text-left transition hover:border-rose-300/40"><span className="flex min-w-0 items-center gap-3"><b className="text-2xl">{gearIcons[offer.gear.kind]}</b><span className="min-w-0"><strong className="block truncate text-xs text-slate-200">{offer.gear.name}</strong><small className="text-slate-600">T{offer.gear.tier} · урон {offer.gear.damage}</small></span></span><strong className="ml-2 text-rose-300">{offer.cost}</strong></button>)}</div></section>
          </div>
          <section className="mt-4 border border-cyan-300/25 bg-[#09151a] p-5"><p className="text-[9px] font-black uppercase tracking-[.3em] text-cyan-300">Ветки мастерства</p><h3 className="mt-2 text-xl font-black uppercase">Эволюция оружия</h3><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{runProgress.current.loadout.map((gear, slot) => gear.kind !== 'empty' && weaponBranches(gear.kind).length > 0 ? <article key={`${slot}-${gear.name}`} className="border border-white/10 bg-black/25 p-3"><b className="text-xs text-slate-100">{gearIcons[gear.kind]} {gear.name}</b>{gear.branch ? <p className="mt-3 text-[10px] text-emerald-300">Ветка освоена</p> : <div className="mt-3 grid gap-2">{weaponBranches(gear.kind).map((branch) => <button key={branch.id} onClick={() => evolveEquippedWeapon(slot, branch.id)} className="border border-cyan-300/20 p-2 text-left text-[10px] hover:border-cyan-300/60"><strong className="block text-cyan-100">{branch.name}</strong><span className="text-slate-500">{branch.description}</span><b className="mt-1 block text-amber-200">{24 + gear.tier * 6} 💎</b></button>)}</div>}</article> : null)}</div></section>
          <button onClick={leaveShop} className="mx-auto mt-6 block border border-teal-300/50 bg-teal-300/10 px-8 py-3 text-xs font-black uppercase tracking-[.25em] text-teal-100 hover:bg-teal-300/20">Отправиться дальше</button>
        </div>
      </div>}
      <div className="relative flex h-full min-h-0 w-full flex-col justify-center">
        {!started && choosingMode && <RunModeChoice value={runMode} onChange={setRunMode} onBack={() => setChoosingMode(false)} onContinue={() => { setChoosingMode(false); setChoosingLoadout(true); }}/>} 
        {started && <header className="flex shrink-0 items-end justify-between gap-4 px-4 py-2 md:px-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[.38em] text-teal-300/70">Stage {String(sector).padStart(2, '0')} · {LOCATION_NAMES[location]}</p><h1 className="text-xl font-black uppercase tracking-tight md:text-2xl">False Knight <span className="font-light text-slate-500">// {currentTheme.subtitle}</span></h1></div>
          <div className="text-right text-[9px] font-black uppercase tracking-[.15em] text-amber-200"><p>{runModeName(runMode)}</p><p className={runMode === 'timed' && TIMED_RUN_SECONDS - elapsedHud < 120 ? 'text-rose-300' : 'text-slate-400'}>{runMode === 'timed' ? `${String(Math.max(0, Math.floor((TIMED_RUN_SECONDS - elapsedHud) / 60))).padStart(2, '0')}:${String(Math.max(0, TIMED_RUN_SECONDS - elapsedHud) % 60).padStart(2, '0')}` : `${String(Math.floor(elapsedHud / 60)).padStart(2, '0')}:${String(elapsedHud % 60).padStart(2, '0')}`}</p></div>
        </header>}
        <div className="flex min-h-0 flex-1 items-center justify-center">
        <section className="relative h-full min-h-0 w-full overflow-hidden bg-[#101b23]">
          <canvas
            ref={canvasRef}
            width="1280"
            height="720"
            className="block h-full w-full"
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse') return;
              event.preventDefault();
              window.dispatchEvent(new KeyboardEvent('keydown', { code: settings.bindings.interact, bubbles: true }));
              window.dispatchEvent(new KeyboardEvent('keyup', { code: settings.bindings.interact, bubbles: true }));
            }}
          />
          <EnvironmentParticles/>
          {started && <MobileControls slots={slots} activeSlot={activeSlot} paused={paused} bindings={settings.bindings} scale={settings.mobileScale} opacity={settings.mobileOpacity} swapSides={settings.mobileSwapSides} />}
          {started && mapOpen && <RunMap archive={mapArchive} currentLocation={location} onClose={() => { mapOpenRef.current = false; setMapOpen(false); pausedRef.current = false; setPaused(false); }}/>} 
          {started && runProgress.current.relics.length > 0 && <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex gap-1.5 border border-amber-300/15 bg-black/55 p-2">
            {runProgress.current.relics.map((id) => { const relic = RELICS.find((item) => item.id === id); return relic ? <span key={id} title={`${relic.name}: ${relic.description}`} className="grid h-7 w-7 place-items-center border border-amber-300/20 bg-amber-300/5 text-base">{relic.icon}</span> : null; })}
          </div>}
          {started && debugOpen && <aside className="absolute bottom-12 left-3 z-[35] w-64 border border-cyan-300/30 bg-[#050b10]/90 p-3 text-left shadow-[0_12px_40px_rgba(0,0,0,.65)] backdrop-blur-md md:bottom-4 md:left-4">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.28em] text-cyan-300">Developer</p><h3 className="text-sm font-black uppercase text-slate-100">Debug Panel</h3></div><button type="button" onClick={() => setDebugOpen(false)} aria-label="Закрыть Debug Panel" title="Закрыть" className="grid h-7 w-7 place-items-center border border-white/15 text-base text-slate-400 transition hover:border-cyan-300/60 hover:text-cyan-100">×</button></div>
            <div className="grid gap-2 text-[9px] font-bold uppercase tracking-[.08em]">
              <button onClick={toggleGodMode} className={`border px-3 py-2 text-left transition ${godMode ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-200' : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300/40'}`}>Бессмертие: {godMode ? 'ВКЛ' : 'ВЫКЛ'}</button>
              <button onClick={() => setShowHitboxes((value) => !value)} className={`border px-3 py-2 text-left transition ${showHitboxes ? 'border-fuchsia-300/70 bg-fuchsia-300/15 text-fuchsia-100' : 'border-white/15 bg-white/5 text-slate-300 hover:border-fuchsia-300/40'}`}>Хитбоксы: {showHitboxes ? 'ВКЛ' : 'ВЫКЛ'}</button>
              <button onClick={toggleNoClipMode} className={`border px-3 py-2 text-left transition ${noClipMode ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300/40'}`}>NoClip Mode [N]: {noClipMode ? 'ВКЛ' : 'ВЫКЛ'}</button>
              <button onClick={debugGiveShards} className="border border-white/15 bg-white/5 px-3 py-2 text-left text-slate-300 hover:border-amber-300/50 hover:text-amber-200">+100 Осколков</button>
              <button onClick={debugAddMask} className="border border-white/15 bg-white/5 px-3 py-2 text-left text-slate-300 hover:border-rose-300/50 hover:text-rose-200">+1 Максимальная маска</button>
              <label className="mt-1 text-[8px] tracking-[.18em] text-slate-500">Выбор уровня</label>
              <select value={`${location}:${sector}`} onChange={(event) => { debugSelectLevel(event.currentTarget.value); event.currentTarget.blur(); }} className="border border-white/15 bg-[#091116] px-2 py-2 text-[9px] text-slate-200 outline-none focus:border-cyan-300/60">
                <option value="prison:1">Stage 1 — Cells</option><option value="swamps:2">Stage 2A — Swamps</option><option value="mines:2">Stage 2B — Mines</option><option value="clock:3">Stage 3 — Clock Tower</option><option value="crypt:4">Stage 4A — Crypt</option><option value="bridge:4">Stage 4B — Bridge</option><option value="castle:5">Stage 5 — Castle</option><option value="throne:6">Final — Throne Room</option>
              </select>
              <button onClick={debugKillRoom} className="mt-1 border border-red-400/30 bg-red-950/20 px-3 py-2 text-left text-red-200 hover:border-red-300/70">Убить врагов в комнате</button>
            </div>
            <p className="mt-3 text-[7px] uppercase tracking-[.16em] text-slate-600">Ё/~ или F2 — закрыть · N — NoClip</p>
          </aside>}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-4 md:p-6">
            <div className="relative flex max-w-[260px] flex-wrap gap-2 md:max-w-[360px]">{Array.from({ length: hud.maxHp }, (_, index) => { const filled = index < hud.hp, justBroken = !filled && index === hud.hp; return <span key={`${index}-${justBroken ? maskHitPulse : 0}`} className={`mask-icon ${filled ? 'mask-icon-full' : 'mask-icon-empty'} ${justBroken ? 'mask-icon-crack' : ''}`}><i/><b/></span>; })}{maskHitPulse > 0 && <span key={`mask-shards-${maskHitPulse}`} className="pointer-events-none absolute left-0 top-2 h-8 w-24">{Array.from({ length: 8 }, (_, index) => <i key={index} className="mask-hud-shard" style={{ left: `${8 + index * 7}px`, animationDelay: `${index * .018}s` }}/>)}</span>}</div>
            <div className="flex items-center gap-2 border border-amber-300/20 bg-black/40 px-3 py-2"><span className="h-2 w-2 rotate-45 bg-amber-300 shadow-[0_0_12px_#f59e0b]"/><span className="text-xs font-bold text-amber-100">{hud.shards}</span><span className="text-[9px] uppercase tracking-widest text-slate-500">осколков</span></div>
          </div>
          <div className="soul-vessel pointer-events-none absolute left-[220px] top-3 h-12 w-12 md:left-[330px] md:top-5 md:h-14 md:w-14"><div className="soul-liquid" style={{ height: `${soulHud}%`, opacity: soulHud > 0 ? 1 : 0 }}><i/><b/></div><span className="soul-glass-shine"/></div>
          {combatCombo.hits > 0 && <div className="pointer-events-none absolute right-4 top-20 z-20 min-w-28 border-r-4 border-amber-300 bg-black/70 px-4 py-2 text-right md:right-6"><b className={`text-3xl font-black ${combatCombo.rank === 'S' ? 'text-amber-300' : combatCombo.rank === 'A' ? 'text-rose-300' : 'text-cyan-200'}`}>{combatCombo.rank}</b><span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-300">{combatCombo.hits} combo</span><small className="block text-[8px] uppercase tracking-wider text-amber-200">награда ×{combatCombo.multiplier.toFixed(1)}</small></div>}
          {bossTrial && <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 border border-rose-300/40 bg-black/75 px-5 py-2 text-center shadow-[0_0_30px_rgba(251,113,133,.15)]"><small className="block text-[7px] font-black uppercase tracking-[.25em] text-rose-300">Испытание босса</small><b className="text-xs uppercase text-slate-100">{bossTrial.boss}</b>{bossTrial.timeLimit && <strong className="ml-3 tabular-nums text-amber-200">{Math.max(0, bossTrial.timeLimit - elapsedHud)}с</strong>}{bossTrial.modifier === 'noHealing' && <span className="ml-3 text-[9px] font-black uppercase text-violet-300">Лечение запрещено</span>}</div>}
          {storyMessage && <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center px-6"><p className="max-w-2xl border-y border-amber-300/25 bg-black/85 px-7 py-4 text-center text-sm font-semibold leading-6 text-amber-50 shadow-[0_0_35px_rgba(0,0,0,.65)] md:text-lg">{storyMessage}</p></div>}
          {combatNotice && <div key={combatNotice.id} className="combat-notice pointer-events-none absolute inset-x-0 top-[22%] z-30 flex justify-center px-5"><p className={`border px-5 py-2 text-center text-xs font-black uppercase tracking-[.16em] shadow-2xl md:text-sm ${combatNotice.tone === 'danger' ? 'border-rose-300/60 bg-rose-950/90 text-rose-100' : combatNotice.tone === 'parry' ? 'border-amber-200/70 bg-amber-950/90 text-amber-100' : 'border-cyan-300/50 bg-slate-950/90 text-cyan-100'}`}>{combatNotice.text}</p></div>}
          {dailyRewardMessage && <div className="pointer-events-none absolute inset-x-0 top-24 z-30 flex justify-center px-6"><p className="max-w-xl border border-emerald-300/40 bg-[#07150f]/95 px-6 py-4 text-center text-sm font-black text-emerald-200 shadow-2xl">{dailyRewardMessage}</p></div>}
          {started && hud.message && hud.hp === 0 && deathSummary && <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#05070d]/90 px-4 py-6 backdrop-blur-[3px]">
            {deathScreen === 'stats' ? <section className="death-stats-card pointer-events-auto w-full max-w-2xl border-y border-cyan-300/35 bg-black/85 px-6 py-7 text-center shadow-[0_0_80px_rgba(34,211,238,.12)] md:px-10">
              <p className="text-[9px] font-black uppercase tracking-[.42em] text-cyan-300">Итоги забега</p><h2 className="mt-3 text-3xl font-black uppercase tracking-tight md:text-5xl">Статистика похода</h2>
              <div className="mt-6 grid grid-cols-2 gap-2 text-left md:grid-cols-3">{[
                ['Время', `${String(Math.floor(deathSummary.seconds / 60)).padStart(2, '0')}:${String(deathSummary.seconds % 60).padStart(2, '0')}`], ['Локация', LOCATION_NAMES_RU[deathSummary.location]], ['Сектор', String(deathSummary.sector)], ['Врагов побеждено', String(deathSummary.kills)], ['Боссов побеждено', String(deathSummary.bossesDefeated)], ['Получено урона', `${deathSummary.damageTaken} масок`], ['Осколков собрано', String(deathSummary.shards)], ['Причина смерти', deathSummary.deathCause || 'неизвестно'], ['Реликвий', String(deathSummary.relics.length)],
              ].map(([label, value]) => <div key={label} className="border border-white/10 bg-white/[.03] p-3"><small className="block text-[8px] font-bold uppercase tracking-[.15em] text-slate-500">{label}</small><b className="mt-1 block text-sm text-slate-100">{value}</b></div>)}</div>
              {runMode === 'checkpoint'
                ? <button onClick={respawnAtLocationStart} className="mt-6 border border-emerald-300/55 bg-emerald-300/10 px-7 py-3 text-xs font-black uppercase tracking-[.2em] text-emerald-50 hover:bg-emerald-300/20">Возродиться в начале локации</button>
                : <button onClick={() => setDeathScreen('interrupted')} className="mt-6 border border-cyan-300/55 bg-cyan-300/10 px-7 py-3 text-xs font-black uppercase tracking-[.2em] text-cyan-50 hover:bg-cyan-300/20">Продолжить</button>}
            </section> : <section className="pointer-events-auto max-w-2xl border-y border-rose-400/40 bg-black/80 px-7 py-7 text-center shadow-[0_0_70px_rgba(244,63,94,.18)] md:px-12"><p className="text-[10px] font-bold uppercase tracking-[.4em] text-rose-400">Красная искра погасла</p><p className="mt-4 text-lg font-semibold leading-8 text-slate-200 md:text-2xl">«{deathQuote}»</p><p className="mt-3 text-2xl font-black uppercase tracking-[.12em] md:text-4xl">Твой поход прерван</p><div className="mt-4 border border-cyan-300/15 bg-cyan-300/5 px-4 py-3 text-xs leading-5 text-cyan-50"><b className="mb-1 block text-[8px] uppercase tracking-[.24em] text-cyan-300">Совет хранителя</b>{deathAdviceLoading ? 'Хранитель изучает твой бой…' : deathAdvice}</div><p className="mt-3 text-xs uppercase tracking-[.25em] text-slate-500">Постоянные улучшения сохранены</p><button onClick={() => { pausedRef.current = false; setPaused(false); setMenuTab('play'); setStarted(false); setChoosingLoadout(true); }} className="mt-6 border border-teal-300/50 bg-teal-300/10 px-6 py-3 text-xs font-bold uppercase tracking-[.2em] text-teal-100 hover:bg-teal-300/20">Выбрать оружие и начать заново</button></section>}
          </div>}
          {hud.message === 'ДВЕРИ ОТКРЫТЫ' && <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center"><div className="border border-teal-300/30 bg-[#071015]/85 px-6 py-3 text-center shadow-[0_0_35px_rgba(45,212,191,.16)]"><p className="text-sm font-black tracking-[.22em] text-teal-100 md:text-lg">ДВЕРИ ОТКРЫТЫ</p><p className="mt-1 text-[8px] uppercase tracking-[.25em] text-teal-300/60"><span className="desktop-interaction-hint">Найдите дверь и нажмите E</span><span className="mobile-interaction-hint">Подойдите и нажмите на дверь</span></p></div></div>}
          {!started && <div className="absolute inset-0 z-20 bg-[#0a1015]/95 px-5 py-5 text-center md:px-8 md:py-6">
            <div className="flex items-center justify-between gap-3"><nav className="flex flex-wrap gap-2"><button onClick={() => setMenuTab('play')} className={`border px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] ${menuTab === 'play' ? 'border-teal-300/60 text-teal-200' : 'border-white/10 text-slate-500'}`}>Играть</button><button onClick={() => setMenuTab('saves')} className={`border px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] ${menuTab === 'saves' ? 'border-teal-300/60 text-teal-200' : 'border-white/10 text-slate-500'}`}>Сохранения</button><button onClick={() => setMenuTab('achievements')} className={`border px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] ${menuTab === 'achievements' ? 'border-amber-300/60 text-amber-200' : 'border-white/10 text-slate-500'}`}>Достижения</button><button onClick={() => setSettingsOpen(true)} className="border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-500 hover:border-cyan-300/50 hover:text-cyan-200">Настройки</button></nav><button onClick={() => session ? supabase.auth.signOut() : setShowAuth(true)} disabled={!authReady} className="border border-white/15 bg-black/30 px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] text-slate-300 transition hover:border-teal-300/50 hover:text-teal-200 disabled:opacity-40">{session ? 'Выйти' : 'Войти'}</button></div>
            {menuTab === 'play' ? <div className="grid h-[calc(100%-45px)] place-items-center"><div className="max-w-2xl"><h2 className="mb-4 text-4xl font-black uppercase tracking-tight md:text-6xl">False <span className="text-slate-500">Knight</span></h2><p className="mx-auto mb-7 max-w-xl text-sm leading-6 text-slate-400">Ты — дух без памяти, скованный тяжёлыми стальными доспехами. Поднимись через заброшенные уровни замка, сокруши пятерых Лордов и узнай, почему тебя назвали Ложным Рыцарем.</p><div className="mx-auto grid max-w-xs gap-3"><button onClick={() => setMenuTab('saves')} className="border border-amber-300/60 bg-amber-300/10 px-8 py-3 text-xs font-black uppercase tracking-[.24em] text-amber-100 hover:bg-amber-300/20">Новая игра</button><button onClick={() => setMenuTab('saves')} disabled={!saveSlots.some(Boolean)} className="border border-white/15 px-8 py-3 text-xs font-bold uppercase tracking-[.24em] text-slate-300 disabled:cursor-not-allowed disabled:opacity-30">Продолжить</button></div></div></div> : menuTab === 'saves' ? <div className="mx-auto mt-5 max-w-5xl"><p className="text-[10px] font-black uppercase tracking-[.35em] text-teal-300">Выберите слот</p><div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{saveSlots.map((save, index) => <section key={index} className={`border bg-black/25 p-4 text-left ${activeSaveSlot === index ? 'border-teal-300/60' : 'border-white/10'}`}><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">Слот {index + 1}</p>{save ? <><h3 className="mt-3 text-sm font-black">Stage {String(save.sector).padStart(2, '0')} — {LOCATION_NAMES[save.location]}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">Осколки: {save.progress.shards ?? save.progress.cells ?? 0}<br/>Маски: {save.progress.hp}/{save.progress.maxHp}<br/>{new Date(save.savedAt).toLocaleString('ru-RU')}</p><div className="mt-4 grid gap-2"><button onClick={() => loadGame(save, index)} className="border border-teal-300/40 py-2 text-[9px] font-bold uppercase text-teal-200">Продолжить</button><button onClick={() => deleteSave(index)} className="border border-rose-400/20 py-2 text-[8px] uppercase text-rose-300">Стереть</button></div></> : <><p className="my-6 text-xs text-slate-700">Пустой слот</p><button onClick={() => beginNewInSlot(index)} className="w-full border border-amber-300/40 py-2 text-[9px] font-bold uppercase text-amber-200">Начать игру</button></>}</section>)}</div></div> : <div className="mx-auto mt-7 max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.35em] text-amber-300">Достижения</p><div className="mt-5 grid gap-3 md:grid-cols-2">{[{title:'Первый шаг',done:saveSlots.some(Boolean),text:'Начать первый забег'},{title:'Восхождение',done:saveSlots.some((save) => (save?.sector || 0) >= 3),text:'Добраться до Clock Tower'},{title:'Коллекционер',done:saveSlots.some((save) => (save?.progress.shards || 0) >= 100),text:'Собрать 100 Осколков'},{title:'Возвращение',done:saveSlots.some((save) => save?.location === 'throne'),text:'Добраться до Тронного зала'}].map((achievement) => <div key={achievement.title} className={`border p-4 text-left ${achievement.done ? 'border-amber-300/40 bg-amber-300/10' : 'border-white/10 bg-black/20 opacity-45'}`}><b className="text-sm text-slate-100">{achievement.done ? '◆ ' : '◇ '}{achievement.title}</b><p className="mt-1 text-[10px] text-slate-500">{achievement.text}</p></div>)}</div></div>}
          </div>}
          {!started && choosingLoadout && <div className="absolute inset-0 z-30 grid place-items-center bg-[#071015]/95 px-5 text-center backdrop-blur-md"><div className="w-full max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.4em] text-teal-300">Подготовка к забегу</p><h2 className="mt-3 text-3xl font-black uppercase md:text-5xl">Выберите 2 оружия</h2><div className="mt-7 grid grid-cols-3 gap-3">{BASIC_WEAPONS.map((gear) => { const selected = startingWeapons.includes(gear.kind); return <button key={gear.kind} onClick={() => toggleStartingWeapon(gear.kind)} className={`relative grid aspect-square place-items-center border p-3 transition ${selected ? 'border-teal-300 bg-teal-300/10 shadow-[0_0_25px_rgba(45,212,191,.15)]' : 'border-white/10 bg-black/25 text-slate-500 hover:border-white/30'}`}><span className="text-4xl md:text-6xl">{gearIcons[gear.kind]}</span><span className="mt-2 text-[9px] font-black uppercase tracking-[.12em] md:text-xs">{gear.name}</span>{selected && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center bg-teal-300 text-[10px] font-black text-slate-950">✓</span>}</button>})}</div><p className="mt-4 text-xs text-slate-500">Выбрано: {startingWeapons.length} / 2</p><div className="mt-6 flex justify-center gap-3"><button onClick={() => setChoosingLoadout(false)} className="border border-white/10 px-5 py-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Назад</button><button onClick={startNewGame} disabled={startingWeapons.length !== 2} className="border border-teal-300/60 bg-teal-300/10 px-7 py-3 text-xs font-black uppercase tracking-[.2em] text-teal-100 disabled:cursor-not-allowed disabled:opacity-30">Начать забег</button></div></div></div>}
          {started && paused && !relicChoiceOpen.current && !mapOpen && <div className="absolute inset-0 z-20 grid place-items-center overflow-y-auto bg-[#05090d]/85 px-4 py-4 text-center backdrop-blur-sm">{pauseBestiaryOpen ? <div className="w-full max-w-6xl border-y border-red-300/30 bg-black/75 px-4 py-5 md:px-7"><div className="mb-4 flex items-end justify-between border-b border-white/10 pb-3 text-left"><div><p className="text-[9px] font-black uppercase tracking-[.32em] text-red-300/70">Игра приостановлена</p><h2 className="mt-1 text-2xl font-black uppercase md:text-3xl">Книга врагов и боссов</h2></div><button onClick={() => setPauseBestiaryOpen(false)} className="border border-white/15 px-4 py-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-300 hover:border-red-300/50 hover:text-red-200">Назад</button></div><BestiaryBook progress={bestiaryProgress}/></div> : <div className="w-full max-w-lg border-y border-teal-300/30 bg-black/60 px-8 py-6"><p className="text-[10px] font-bold uppercase tracking-[.4em] text-teal-300">Игра приостановлена</p><h2 className="mt-2 text-3xl font-black uppercase tracking-tight">Пауза</h2><DailyChallengeCard challenge={dailyChallenge} progress={dailyProgress(dailyChallenge, summarizeRun())} loading={dailyLoading} completed={dailyReward.completedDate === dailyChallenge.date} streak={dailyReward.streak}/><div className="mt-5 grid gap-2"><button onClick={() => { pausedRef.current = false; setPaused(false); }} className="border border-teal-300/60 bg-teal-300/10 px-6 py-3 text-xs font-black uppercase tracking-[.22em] text-teal-100 hover:bg-teal-300/20">Продолжить</button><button onClick={() => setPauseBestiaryOpen(true)} className="border border-red-300/30 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] text-red-200 transition hover:border-red-300/60 hover:bg-red-300/10">Книга врагов и боссов</button><button onClick={() => setSettingsOpen(true)} className="border border-cyan-300/30 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/10">Настройки</button><button onClick={returnToMainMenu} className="border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[.22em] text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300">В главное меню</button></div><p className="mt-3 text-[9px] uppercase tracking-[.2em] text-slate-600">Esc — продолжить</p></div>}</div>}
        </section>
        </div>
        {started && <div className="desktop-weapon-slots pointer-events-none z-10 mx-auto -mt-[60px] mb-1 flex flex-col items-center gap-1">
          <div className="flex gap-2">{slots.map((slot, index) => <div key={index} title={slot.title} className={`relative grid h-12 w-12 place-items-center overflow-hidden border bg-[#091116]/85 text-2xl shadow-lg backdrop-blur-sm ${activeSlot === index ? 'border-teal-300 shadow-[0_0_18px_rgba(45,212,191,.25)]' : 'border-white/15'} ${slot.cd > 0 ? 'opacity-60' : ''}`}><span>{slot.icon}</span><span className="absolute left-1 top-0.5 text-[7px] font-black text-slate-400">{slot.key}</span>{slot.cd > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"/>}</div>)}</div>
          <p className="max-w-[96vw] truncate text-[7px] font-medium uppercase tracking-[.09em] text-slate-200/35 [text-shadow:0_1px_3px_#000]">{keyName(settings.bindings.left)}/{keyName(settings.bindings.right)} движение · {keyName(settings.bindings.jump)} прыжок · {keyName(settings.bindings.attack)} атака · {keyName(settings.bindings.roll)} перекат · {keyName(settings.bindings.heal)} лечение · {keyName(settings.bindings.interact)} действие · Tab карта · Esc пауза</p>
        </div>}
      </div>
    </main>
  );
}
