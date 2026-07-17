import { BOSS_TRIALS, trialModifierName, trialRewardTier, type BossTrial, type BossTrialProgress } from '../game/bossTrials';

type Props = { onStart: (trial: BossTrial) => void; progress: BossTrialProgress; rewardMessage?: string };

export function BossTrialsMenu({ onStart, progress, rewardMessage }: Props) {
  const tier = trialRewardTier(progress.seals);
  return <div className="max-h-[58vh] overflow-y-auto pr-2">
    <div className="mb-4 border border-amber-300/25 bg-amber-300/5 p-4">
      <div className="flex items-center justify-between"><b className="text-xs uppercase tracking-[.18em] text-amber-100">Печати испытаний</b><strong className="text-xl text-amber-300">◆ {progress.seals}</strong></div>
      <p className="mt-2 text-[10px] text-slate-400">Первая победа: 3 печати · повторная: 1 · быстрое прохождение: +1</p>
      <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-amber-200/80">Награды: 5 — закалённый клинок · 15 — дополнительная маска · 30 — облик «Владыка арены»</p>
      <div className="mt-3 h-1.5 bg-black/40"><div className="h-full bg-amber-300 transition-all" style={{ width: `${Math.min(100, progress.seals / 30 * 100)}%` }}/></div>
      {tier > 0 && <p className="mt-2 text-[9px] text-emerald-300">Открыто наград: {tier} / 3</p>}
      {rewardMessage && <p className="mt-2 font-bold text-amber-200">{rewardMessage}</p>}
    </div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {BOSS_TRIALS.map((trial) => <article key={trial.id} className="group border border-rose-300/20 bg-[#120b10]/90 p-5 backdrop-blur-md transition hover:border-rose-300/55">
      <p className="text-[8px] font-black uppercase tracking-[.28em] text-rose-300/70">{trialModifierName(trial.modifier)}</p>
      <h3 className="mt-3 text-lg font-black uppercase text-slate-100">{trial.boss}</h3>
      <p className="mt-2 min-h-10 text-[10px] leading-5 text-slate-500">{trial.description}</p>
      {trial.timeLimit && <p className="mt-2 text-xs font-black tabular-nums text-amber-200">⏱ {trial.timeLimit} секунд</p>}
      {progress.records[trial.id] && <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Побед: {progress.records[trial.id].clears} · Рекорд: {progress.records[trial.id].bestTime?.toFixed(1)}с</p>}
      <button onClick={() => onStart(trial)} className="mt-5 w-full border border-rose-300/40 bg-rose-300/5 px-4 py-3 text-[9px] font-black uppercase tracking-[.18em] text-rose-100 transition group-hover:bg-rose-300/15">Войти в испытание</button>
    </article>)}
    </div>
  </div>;
}
