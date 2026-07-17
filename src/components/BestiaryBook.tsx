import { useMemo, useState } from 'react';
import { BESTIARY, type BestiaryProgress } from '../game/bestiary';
import { combatProfile } from '../game/bestiaryKnowledge';
import { BestiaryGameModel } from './BestiaryGameModel';

export function BestiaryBook({ progress }: { progress: BestiaryProgress }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? BESTIARY.find((entry) => entry.id === selectedId) : undefined;
  const unlockedCount = useMemo(() => BESTIARY.filter((entry) => (progress[entry.id] || 0) > 0).length, [progress]);

  if (!selected) return <div className="min-h-0">
    <div className="mb-4 flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[.25em] text-red-300/70">Нажми на имя, чтобы открыть запись</p><b className="text-xs text-red-200">{unlockedCount} / {BESTIARY.length} встречено</b></div>
    <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
      {BESTIARY.map((entry) => { const discovered = (progress[entry.id] || 0) > 0; return <button key={entry.id} disabled={!discovered} onClick={() => discovered && setSelectedId(entry.id)} className={`group flex items-center justify-between border p-4 text-left transition ${discovered ? 'border-white/10 bg-black/25 hover:border-red-300/60 hover:bg-red-300/10' : 'cursor-not-allowed border-white/5 bg-black/15 opacity-45'}`}>
        <span><strong className={`block text-xs font-black uppercase ${discovered ? 'text-slate-100 group-hover:text-red-100' : 'text-slate-600'}`}>{discovered ? entry.name : 'Неизвестный враг'}</strong><small className="mt-1 block text-[8px] uppercase tracking-wider text-slate-600">{discovered ? entry.location : 'Запись ещё не открыта'}</small></span>
        <span className={`ml-3 text-[9px] font-black ${discovered ? 'text-emerald-300' : 'text-slate-600'}`}>{discovered ? `${progress[entry.id]} побед` : '???'}</span>
      </button>; })}
    </div>
  </div>;

  const combat = combatProfile(selected), discovered = (progress[selected.id] || 0) > 0;
  return <article className="max-h-[60vh] overflow-y-auto border border-red-200/20 bg-[#120d0b]/95 p-5 text-left md:p-7">
    <button onClick={() => setSelectedId(null)} className="mb-5 border border-white/15 px-4 py-2 text-[9px] font-black uppercase tracking-[.18em] text-slate-300 hover:border-red-300/60 hover:text-red-200">← Назад к списку</button>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-[8px] font-black uppercase tracking-[.3em] text-red-300/70">Отдельная запись бестиария</p><h3 className="mt-2 text-2xl font-black uppercase tracking-wide md:text-4xl">{selected.name}</h3><p className="mt-1 text-[9px] uppercase tracking-[.18em] text-slate-500">{selected.location}</p></div><div className="text-right"><b className="text-[9px] uppercase text-rose-300">Опасность {'◆'.repeat(combat.danger)}{'◇'.repeat(5 - combat.danger)}</b><small className={`mt-2 block text-[9px] ${discovered ? 'text-emerald-300' : 'text-slate-500'}`}>{discovered ? `Побед: ${progress[selected.id]}` : 'Ещё не встречен'}</small></div></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(300px,.9fr)_1.1fr]">
      <div className="aspect-[18/13] overflow-hidden border border-white/10 bg-black/40"><BestiaryGameModel entry={selected}/></div>
      <div><p className="text-sm leading-6 text-slate-300">{selected.description}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><section className="border border-rose-300/20 bg-rose-300/5 p-3"><b className="text-[9px] uppercase tracking-[.18em] text-rose-200">Атака</b><p className="mt-2 text-xs leading-5 text-slate-300">{combat.attack}</p></section><section className="border border-cyan-300/20 bg-cyan-300/5 p-3"><b className="text-[9px] uppercase tracking-[.18em] text-cyan-200">Поведение</b><p className="mt-2 text-xs leading-5 text-slate-300">{combat.behavior}</p></section></div><section className="mt-3 border border-white/10 bg-black/20 p-3"><b className="text-[9px] uppercase tracking-[.18em] text-slate-300">Все особенности</b><ul className="mt-2 grid gap-1 text-xs leading-5 text-slate-400">{combat.features.map((feature) => <li key={feature}>◆ {feature}</li>)}</ul></section><div className="mt-3 border-l-2 border-amber-300/60 bg-amber-300/5 px-4 py-3"><b className="text-[9px] uppercase tracking-[.18em] text-amber-200">Слабость и тактика</b><p className="mt-1 text-xs leading-5 text-amber-50/80">{selected.weakness}</p></div></div>
    </div>
  </article>;
}
