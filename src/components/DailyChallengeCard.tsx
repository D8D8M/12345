import type { DailyChallenge } from '../lib/dailyChallenge';

type Props = { challenge: DailyChallenge; progress: number; loading: boolean; completed: boolean; streak: number };

export function DailyChallengeCard({ challenge, progress, loading, completed, streak }: Props) {
  const done = completed || progress >= challenge.target;
  return <section aria-disabled={completed} className={`mt-5 border p-4 text-left ${completed ? 'border-emerald-300/30 bg-emerald-950/20 opacity-80' : done ? 'border-emerald-300/40 bg-emerald-300/10' : 'border-amber-300/25 bg-black/25'}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[8px] font-black uppercase tracking-[.3em] text-amber-300">Испытание дня</p>
        <h3 className="mt-2 text-sm font-black text-slate-100">{loading ? 'Хронист пишет новое испытание…' : challenge.title}</h3>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">{challenge.description}</p>
        <p className="mt-2 text-[9px] text-amber-200/70">Награда сегодня: 25 осколков · Серия: {streak}/7</p>
        <p className="mt-1 text-[9px] font-bold text-rose-200/80">Выполняй испытания 7 дней подряд — получишь постоянную маску.</p>
      </div>
      <b className={done ? 'text-emerald-300' : 'text-amber-200'}>{completed ? '🔒' : `${Math.min(progress, challenge.target)}/${challenge.target}`}</b>
    </div>
    {completed && <p className="mt-3 border-t border-emerald-300/20 pt-3 text-[9px] font-black uppercase tracking-[.2em] text-emerald-300">🔒 Испытание завершено · Счётчик заблокирован до нового дня</p>}
  </section>;
}
