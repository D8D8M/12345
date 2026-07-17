import { useEffect, useState } from 'react';
import { runModeName } from '../game/runModes';
import { loadRunRecords, type RunRecord } from '../lib/runRecords';

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function RecordsTable({ userId }: { userId?: string }) {
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setRecords([]); return; }
    setLoading(true); setError('');
    void loadRunRecords()
      .then(setRecords)
      .catch(() => setError('Не удалось загрузить рекорды. Попробуйте позже.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return <p className="border border-white/10 bg-black/25 p-6 text-sm text-slate-400">Войдите в аккаунт, чтобы сохранять и смотреть свои рекорды.</p>;
  if (loading) return <p className="p-6 text-sm text-slate-400">Загружаем летопись забегов…</p>;
  if (error) return <p className="border border-rose-400/20 p-5 text-sm text-rose-300">{error}</p>;
  if (!records.length) return <p className="border border-white/10 bg-black/25 p-6 text-sm text-slate-400">Пока нет завершённых забегов. Первый рекорд ждёт тебя.</p>;

  return <div className="overflow-x-auto border border-white/10 bg-[#07101a]/85">
    <table className="w-full min-w-[680px] text-left text-xs">
      <thead className="border-b border-white/10 text-[9px] uppercase tracking-[.16em] text-slate-500"><tr><th className="p-4">#</th><th className="p-4">Игрок / режим</th><th className="p-4">Время</th><th className="p-4">Убийства</th><th className="p-4">Боссы</th><th className="p-4">Серия</th><th className="p-4">Дата</th></tr></thead>
      <tbody>{records.map((record, index) => <tr key={record.id} className="border-b border-white/5 text-slate-300 last:border-0">
        <td className="p-4 font-black text-amber-200">{index + 1}</td>
        <td className="p-4"><b className="block text-slate-100">{record.player_name}</b><small className="text-slate-500">{runModeName(record.mode)}</small></td>
        <td className="p-4 font-black tabular-nums text-cyan-200">{formatTime(record.completion_seconds)}</td>
        <td className="p-4 tabular-nums">{record.kills}</td><td className="p-4 tabular-nums">{record.bosses_defeated}</td><td className="p-4 tabular-nums">{record.daily_streak} дн.</td>
        <td className="p-4 text-slate-500">{new Date(record.completed_at).toLocaleDateString('ru-RU')}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
