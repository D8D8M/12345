import { LEGACY_UNLOCKS, type LegacyProgress, type LegacyUnlockId } from '../game/metaProgression';

type Props = { progress: LegacyProgress; onUnlock: (id: LegacyUnlockId) => void };

export function LegacyTree({ progress, onUnlock }: Props) {
  return <div className="mx-auto max-w-5xl"><p className="mb-5 text-sm text-slate-400">Пепел памяти сохраняется между всеми забегами. Доступно: <b className="text-orange-200">{progress.embers} 🔥</b></p><div className="grid gap-4 md:grid-cols-2">{LEGACY_UNLOCKS.map((item) => { const owned = progress.unlocks.includes(item.id); return <button key={item.id} disabled={owned || progress.embers < item.cost} onClick={() => onUnlock(item.id)} className={`border p-5 text-left transition ${owned ? 'border-emerald-300/40 bg-emerald-300/10' : 'border-white/15 bg-black/30 enabled:hover:border-orange-300/60 disabled:opacity-55'}`}><span className="text-3xl">{item.icon}</span><b className="mt-3 block uppercase text-slate-100">{item.name}</b><span className="mt-2 block text-xs leading-5 text-slate-400">{item.description}</span><strong className={owned ? 'mt-4 block text-emerald-200' : 'mt-4 block text-orange-200'}>{owned ? 'Открыто' : `${item.cost} 🔥`}</strong></button>; })}</div></div>;
}
