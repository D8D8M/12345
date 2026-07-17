import { supabase } from './supabase';

export type RunSummary = {
  location: string;
  sector: number;
  kills: number;
  shards: number;
  damageTaken: number;
  bossesDefeated: number;
  minutes: number;
  weapons: string[];
  deathCause?: string;
};

const askGameAi = async (prompt: string, fallback: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai', {
      body: {
        prompt,
        system: 'Ты внутриигровой рассказчик мрачной русскоязычной игры False Knight. Отвечай только запрошенным текстом, без markdown, безопасно и не более 35 слов.',
      },
    });
    if (error) throw error;
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    return text || fallback;
  } catch {
    return fallback;
  }
};

const facts = (run: RunSummary) => JSON.stringify(run);

export const requestDeathAdvice = (run: RunSummary) => askGameAi(
  `Дай один конкретный полезный совет после смерти игрока. Данные забега: ${facts(run)}`,
  run.damageTaken >= 5 ? 'Не спеши в следующую атаку: дождись удара врага, сделай перекат и бей во время его паузы.' : 'Сохраняй дистанцию и оставляй один рывок для отступления.',
);

export const requestBossLine = (boss: string, run: RunSummary) => askGameAi(
  `Напиши одну короткую угрожающую реплику босса «${boss}» при встрече с игроком. Учти забег: ${facts(run)}`,
  `«Ты слишком долго поднимался сюда, рыцарь. Теперь падение будет особенно долгим.»`,
);

export const requestChronicle = (run: RunSummary) => askGameAi(
  `Напиши эпилог-летопись завершённого забега в 2 коротких предложениях. Данные: ${facts(run)}`,
  `Ложный Рыцарь прошёл сквозь тьму и собрал ${run.shards} осколков. Замок навсегда запомнил его шаги.`,
);
