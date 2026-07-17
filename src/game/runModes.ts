export type RunMode = 'normal' | 'hardcore' | 'timed' | 'oneLife';

export const TIMED_RUN_SECONDS = 30 * 60;

export const RUN_MODES: Array<{
  id: RunMode;
  icon: string;
  name: string;
  description: string;
}> = [
  { id: 'normal', icon: '⚔', name: 'Обычный', description: 'Сохранения включены. Спокойный путь к трону.' },
  { id: 'hardcore', icon: '☠', name: 'Хардкор', description: 'Без сохранений. Враги сильнее на 35%.' },
  { id: 'timed', icon: '⌛', name: 'На время', description: 'Доберитесь до трона за 30 минут.' },
  { id: 'oneLife', icon: '♥', name: 'Одна жизнь', description: 'Можно продолжить позже, но смерть сотрёт забег.' },
];

export const runModeName = (mode: RunMode) => RUN_MODES.find((item) => item.id === mode)?.name ?? RUN_MODES[0].name;
