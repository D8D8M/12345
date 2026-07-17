import { useMemo, useState } from 'react';
import { BESTIARY, type BestiaryProgress } from '../game/bestiary';
import { BestiaryPortrait } from './BestiaryPortrait';

export function BestiaryBook({ progress }: { progress: BestiaryProgress }) {
  const firstUnlocked = BESTIARY.find((entry) => (progress[entry.id] || 0) > 0);
  const [selectedId, setSelectedId] = useState(firstUnlocked?.id ?? BESTIARY[0].id);
  const selected = BESTIARY.find((entry) => entry.id === selectedId) ?? BESTIARY[0];
  const unlocked = (progress[selected.id] || 0) > 0;
  const unlockedCount = useMemo(() => BESTIARY.filter((entry) => (progress[entry.id] || 0) > 0).length, [progress]);
  return <div className="bestiary-book grid min-h-0 gap-4 lg:grid-cols-[minmax(240px,.8fr)_1.4fr]">
    <aside className="bestiary-list grid max-h-[54vh] grid-cols-2 gap-2 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-2">
      {BESTIARY.map((entry) => { const open = (progress[entry.id] || 0) > 0; return <button key={entry.id} onClick={() => setSelectedId(entry.id)} className={`bestiary-list-item border p-2 text-left ${selected.id === entry.id ? 'border-red-300/70 bg-red-300/10' : 'border-white/10 bg-black/20'}`}>
        <span className={`block text-[9px] font-black uppercase ${open ? 'text-slate-100' : 'text-slate-600'}`}>{open ? entry.name : 'Неизвестная запись'}</span>
        <small className="mt-1 block text-[8px] text-slate-600">{open ? `${progress[entry.id]} побед` : 'Не открыто'}</small>
      </button>; })}
    </aside>
    <article className="bestiary-page relative overflow-hidden border border-red-200/20 bg-[#120d0b]/90 p-5 text-left md:p-7">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.3em] text-red-300/70">Запись охотника</p><h3 className="mt-2 text-xl font-black uppercase tracking-wide md:text-3xl">{unlocked ? selected.name : 'Неизвестное существо'}</h3></div><b className="text-xs text-red-200">{unlockedCount} / {BESTIARY.length}</b></div>
      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]"><div className="aspect-[6/5] border border-white/10 bg-black/35"><BestiaryPortrait entry={selected} locked={!unlocked}/></div>
        {unlocked ? <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">{selected.location}</p><p className="mt-4 text-sm leading-6 text-slate-300">{selected.description}</p><div className="mt-5 border-l-2 border-amber-300/60 bg-amber-300/5 px-4 py-3"><b className="text-[9px] uppercase tracking-[.18em] text-amber-200">Слабость</b><p className="mt-1 text-xs leading-5 text-amber-50/80">{selected.weakness}</p></div><p className="mt-5 text-xs text-slate-500">Побед одержано: <b className="text-2xl text-red-200">{progress[selected.id]}</b></p></div> : <div className="grid content-center"><p className="text-sm leading-6 text-slate-500">Изображение, описание и слабости появятся после первой победы над этим противником.</p></div>}
      </div>
    </article>
  </div>;
}
