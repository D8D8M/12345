import { supabase } from './supabase';
import type { RunSummary } from './gameAi';

export type DailyChallenge = {
  date: string;
  kind: 'kills' | 'shards' | 'survival';
  target: number;
  title: string;
  description: string;
};
export type DailyRewardState = { completedDate: string | null; lastCompletedDate: string | null; streak: number };

const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => dateKey();
const fallbackChallenge = (): DailyChallenge => {
  const date = today();
  const variants: Omit<DailyChallenge, 'date'>[] = [
    { kind: 'kills', target: 12, title: 'Жатва безмолвия', description: 'Победи 12 врагов за один забег.' },
    { kind: 'shards', target: 40, title: 'Осколки короны', description: 'Собери 40 осколков за один забег.' },
    { kind: 'survival', target: 3, title: 'Стальная воля', description: 'Доберись до третьего сектора.' },
  ];
  const seed = [...date].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { date, ...variants[seed % variants.length] };
};

export const loadDailyChallenge = (): DailyChallenge => {
  const fallback = fallbackChallenge();
  try {
    const saved = JSON.parse(localStorage.getItem('false-knight-daily') || 'null') as DailyChallenge | null;
    return saved?.date === fallback.date ? saved : fallback;
  } catch { return fallback; }
};

export const generateDailyChallenge = async (): Promise<DailyChallenge> => {
  const challenge = fallbackChallenge();
  try {
    const { data, error } = await supabase.functions.invoke('ai', { body: {
      system: 'Ты создаёшь задания для игры «Восхождение к престолу». Верни только JSON без markdown: {"title":"...","description":"..."}. Русский язык, мрачный стиль, коротко.',
      prompt: `Укрась название и описание задания, не меняя условие: ${challenge.description}`,
    } });
    if (error) throw error;
    const parsed = JSON.parse(String(data?.text || '').replace(/```json|```/g, '').trim()) as { title?: string; description?: string };
    if (parsed.title) challenge.title = parsed.title.slice(0, 60);
    if (parsed.description) challenge.description = parsed.description.slice(0, 120);
  } catch { /* Офлайн-вариант уже готов. */ }
  localStorage.setItem('false-knight-daily', JSON.stringify(challenge));
  return challenge;
};

export const dailyProgress = (challenge: DailyChallenge, run: RunSummary) => challenge.kind === 'kills'
  ? run.kills : challenge.kind === 'shards' ? run.shards : run.sector;

const EMPTY_REWARD: DailyRewardState = { completedDate: null, lastCompletedDate: null, streak: 0 };
export const loadDailyReward = (): DailyRewardState => {
  try {
    const saved = JSON.parse(localStorage.getItem('false-knight-daily-reward') || 'null') as DailyRewardState | null;
    return saved ? { ...EMPTY_REWARD, ...saved } : EMPTY_REWARD;
  } catch { return EMPTY_REWARD; }
};

export const claimDailyReward = (): { state: DailyRewardState; maskAwarded: boolean } | null => {
  const current = loadDailyReward();
  const currentDate = today();
  if (current.completedDate === currentDate) return null;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const streak = current.lastCompletedDate === dateKey(yesterday) ? current.streak + 1 : 1;
  const state = { completedDate: currentDate, lastCompletedDate: currentDate, streak };
  localStorage.setItem('false-knight-daily-reward', JSON.stringify(state));
  return { state, maskAwarded: streak % 7 === 0 };
};
