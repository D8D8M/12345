import { useEffect, useState } from 'react';

type Props = { onMainMenu: () => void };
type Scene = 'aftermath' | 'realization' | 'ascent' | 'throne' | 'ending' | 'credits';

const CREDITS = ['FALSE KNIGHT', 'Каноничная концовка', 'История, мир и разработка', 'Создано в nFactorial Teens', 'Спасибо за игру'];

export function CanonicalEnding({ onMainMenu }: Props) {
  const [scene, setScene] = useState<Scene>('aftermath');

  useEffect(() => {
    const cues = [
      window.setTimeout(() => setScene('realization'), 4300),
      window.setTimeout(() => setScene('ascent'), 8500),
      window.setTimeout(() => setScene('throne'), 12200),
      window.setTimeout(() => setScene('ending'), 15800),
    ];
    return () => cues.forEach(window.clearTimeout);
  }, []);

  if (scene === 'credits') return <div className="canonical-ending fixed inset-0 z-[150] grid place-items-center bg-black px-6 text-center"><div className="canonical-credits space-y-7">{CREDITS.map((line, index) => <p key={line} className={index === 0 ? 'text-4xl font-black tracking-[.2em] text-amber-100' : 'text-xs uppercase tracking-[.3em] text-slate-400'}>{line}</p>)}</div><button onClick={() => setScene('ending')} className="absolute bottom-8 border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-[.18em] text-slate-300">Назад</button></div>;

  return <div className={`canonical-ending canonical-ending-${scene} fixed inset-0 z-[150] overflow-hidden bg-black text-center`} role="dialog" aria-modal="true" aria-label="Финальная катсцена">
    <div className="canonical-hall" aria-hidden="true">
      <div className="canonical-window"/><div className="canonical-stage"/><div className="canonical-throne"/>
      <div className="canonical-stranger"/><div className="canonical-king"><span className="canonical-held-crown">♛</span></div>
    </div>
    {scene === 'aftermath' && <section className="canonical-caption" aria-live="polite"><small>После последнего удара</small><p>Клинки Незнакомца выскальзывают из его рук. Он падает у подножия Трона.</p></section>}
    {scene === 'realization' && <section className="canonical-caption" aria-live="polite"><small>Правда</small><p>Король опускается рядом с поверженным врагом и видит в его мести след собственных прошлых грехов.</p></section>}
    {scene === 'ascent' && <section className="canonical-caption" aria-live="polite"><small>Возвращение</small><p>Король поднимает корону и медленно восходит по ступеням.</p></section>}
    {scene === 'throne' && <section className="canonical-caption" aria-live="polite"><small>Новый виток</small><p>Корона вновь ложится на его голову. Король занимает Трон, а за окнами уже собираются новые мстители.</p></section>}
    {scene === 'ending' && <section className="canonical-panel absolute left-1/2 top-1/2 z-10 w-[min(90vw,680px)] -translate-x-1/2 -translate-y-1/2 border-y border-amber-200/30 bg-black/80 px-7 py-9 md:px-12">
      <p className="text-[10px] font-black uppercase tracking-[.48em] text-rose-400">Каноничная концовка</p>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-[.08em] text-amber-100 md:text-5xl">Цикл тирании</h1>
      <p className="mt-7 text-sm leading-7 text-slate-300 md:text-base">Трон снова ваш, но месть не закончилась — она лишь выбрала новых наследников.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => setScene('credits')} className="border border-amber-200/50 bg-amber-200/10 px-7 py-3 text-xs font-black uppercase tracking-[.18em] text-amber-100">Титры</button><button onClick={onMainMenu} className="border border-white/20 px-7 py-3 text-xs font-black uppercase tracking-[.18em] text-slate-300">Главное меню</button></div>
    </section>}
  </div>;
}
