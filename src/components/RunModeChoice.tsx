import { RUN_MODES, type RunMode } from '../game/runModes';

type Props = { value: RunMode; onChange: (mode: RunMode) => void; onBack: () => void; onContinue: () => void };

export function RunModeChoice({ value, onChange, onBack, onContinue }: Props) {
  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#05090d]/95 px-5 py-8 text-center backdrop-blur-md">
    <div className="w-full max-w-4xl">
      <p className="text-[10px] font-black uppercase tracking-[.4em] text-amber-300">Правила похода</p>
      <h2 className="mt-3 text-3xl font-black uppercase md:text-5xl">Выберите режим</h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RUN_MODES.map((mode) => <button key={mode.id} onClick={() => onChange(mode.id)} className={`min-h-48 border p-5 text-left transition ${value === mode.id ? 'border-amber-300 bg-amber-300/10 shadow-[0_0_28px_rgba(252,211,77,.14)]' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
          <span className="text-4xl">{mode.icon}</span><b className="mt-5 block text-sm font-black uppercase text-slate-100">{mode.name}</b>
          <span className="mt-3 block text-[10px] leading-5 text-slate-400">{mode.description}</span>
        </button>)}
      </div>
      <div className="mt-7 flex justify-center gap-3"><button onClick={onBack} className="border border-white/15 px-5 py-3 text-[10px] font-bold uppercase text-slate-400">Назад</button><button onClick={onContinue} className="border border-amber-300/60 bg-amber-300/10 px-7 py-3 text-xs font-black uppercase tracking-[.18em] text-amber-100">Выбрать оружие</button></div>
    </div>
  </div>;
}
