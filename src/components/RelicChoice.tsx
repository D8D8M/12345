import type { Relic } from '../game/relics';

type Props = { choices: Relic[]; onChoose: (relic: Relic) => void };

export function RelicChoice({ choices, onChoose }: Props) {
  return <div className="absolute inset-0 z-[45] grid place-items-center overflow-y-auto bg-[#05090d]/90 px-5 py-8 backdrop-blur-md">
    <section className="w-full max-w-4xl text-center">
      <p className="text-[10px] font-black uppercase tracking-[.42em] text-amber-300">Награда за победу</p>
      <h2 className="mt-3 text-3xl font-black uppercase md:text-5xl">Выберите реликвию</h2>
      <p className="mt-3 text-xs text-slate-500">Она останется с вами до конца этого забега.</p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {choices.map((relic) => <button key={relic.id} onClick={() => onChoose(relic)} className="group min-h-52 border border-amber-300/25 bg-[#171208]/90 p-6 text-left transition hover:-translate-y-1 hover:border-amber-200 hover:bg-amber-300/10 hover:shadow-[0_0_40px_rgba(251,191,36,.14)]">
          <span className="grid h-14 w-14 place-items-center border border-amber-300/30 bg-black/30 text-3xl">{relic.icon}</span>
          <strong className="mt-5 block text-lg font-black uppercase text-amber-50">{relic.name}</strong>
          <span className="mt-3 block text-xs leading-5 text-slate-400">{relic.description}</span>
          <span className="mt-5 block text-[9px] font-black uppercase tracking-[.2em] text-amber-300 opacity-50 group-hover:opacity-100">Выбрать</span>
        </button>)}
      </div>
    </section>
  </div>;
}

