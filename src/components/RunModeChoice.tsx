import { RUN_MODES, type RunMode } from '../game/runModes';

type Props = { value: RunMode; onChange: (mode: RunMode) => void; onBack: () => void; onContinue: () => void };

export function RunModeChoice({ value, onChange, onBack, onContinue }: Props) {
  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#05090d]/95 px-4 py-4 text-center backdrop-blur-md sm:px-6">
    <div className="w-full max-w-5xl">
      <p className="text-[9px] font-black uppercase tracking-[.38em] text-amber-300 sm:text-[10px]">Правила похода</p>
      <h2 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Выберите режим</h2>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {RUN_MODES.map((mode) => <button key={mode.id} onClick={() => onChange(mode.id)} className={`min-h-32 border p-4 text-left transition sm:min-h-36 lg:min-h-40 ${value === mode.id ? 'border-amber-300 bg-amber-300/10 shadow-[0_0_28px_rgba(252,211,77,.14)]' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
          <span className="text-3xl sm:text-4xl">{mode.icon}</span><b className="mt-3 block text-xs font-black uppercase text-slate-100 sm:text-sm">{mode.name}</b>
          <span className="mt-2 block text-[9px] leading-4 text-slate-400 sm:text-[10px]">{mode.description}</span>
        </button>)}
      </div>
      <div className="mt-4 flex justify-center gap-3"><button onClick={onBack} className="border border-white/15 px-5 py-2.5 text-[10px] font-bold uppercase text-slate-400">Назад</button><button onClick={onContinue} className="border border-amber-300/60 bg-amber-300/10 px-6 py-2.5 text-xs font-black uppercase tracking-[.16em] text-amber-100">Выбрать оружие</button></div>
    </div>
  </div>;
}
