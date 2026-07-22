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
        system: 'Ты внутриигровой рассказчик мрачной русскоязычной игры «Восхождение к престолу». Отвечай только запрошенным текстом, без markdown, безопасно и не более 35 слов.',
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

export const STRANGER_BETRAYAL_LINES: [string, string] = [
  '',
  'Я собирался просто заколоть тебя и забрать трон... Но какая ирония! Тот, кого я использовал как пешку — это и есть тот самый Король-Тиран, сломавший мою жизнь!',
];

export const requestStrangerBetrayalLines = (run: RunSummary) => Promise.all([
  Promise.resolve(''),
  askGameAi(`Продолжи раскрытие Незнакомца перед финальным боем. Сохрани все факты: он хотел заколоть героя и забрать трон, но герой оказался Королём-Тираном, сломавшим его жизнь. Исходная реплика: «${STRANGER_BETRAYAL_LINES[1]}». Данные пути: ${facts(run)}`, STRANGER_BETRAYAL_LINES[1]),
]);

export const ASSISTANT_LAST_WORDS = 'За что?.. Ваше Величество... Вы ведь сами... лично приказали мне не подпускать вас к трону, если вы вернетесь без разума... Я лишь исполнял ваш последний приказ...';

export const requestAssistantLastWords = async (run: RunSummary) => {
  const line = await askGameAi(
    `Верни предсмертную реплику Помощника дословно, не меняя ни одного слова и не добавляя ремарок: «${ASSISTANT_LAST_WORDS}». Контекст пути: ${facts(run)}`,
    ASSISTANT_LAST_WORDS,
  );
  const withoutQuotes = line.replace(/^[«"]|[»"]$/g, '').trim();
  return withoutQuotes === ASSISTANT_LAST_WORDS ? withoutQuotes : ASSISTANT_LAST_WORDS;
};

export const requestChronicle = (run: RunSummary) => askGameAi(
  `Напиши эпилог-летопись завершённого забега в 2 коротких предложениях. Данные: ${facts(run)}`,
  `Ложный Рыцарь прошёл сквозь тьму и собрал ${run.shards} осколков. Замок навсегда запомнил его шаги.`,
);

const strangerFallbacks = [
  'Не торопись доверять тишине. Монстры короля часто ждут именно того мгновения, когда путник решит, что опасность миновала.',
  'Собирай осколки и береги силы. Дорога к дворцу длиннее, чем кажется отсюда.',
  'Я не знаю, кем ты был прежде. Но сейчас королевству нужен тот, кто не отступит перед короной.',
  'Слуги короля сохранили лишь обрывки разума. Не позволяй их облику заставить тебя забыть, кем они когда-то были.',
];

export const requestStrangerLine = async (run: RunSummary, conversation: number, previousLine = '') => {
  const fallback = strangerFallbacks.find((line, index) => index >= (conversation - 1) % strangerFallbacks.length && line !== previousLine)
    ?? strangerFallbacks.find((line) => line !== previousLine)
    ?? strangerFallbacks[0];
  const line = await askGameAi(
    `Это разговор №${conversation}. Игрок снова подошёл к Незнакомцу в чёрном. Дай одну новую короткую реплику: совет, мрачное наблюдение или слух о злом короле. Обязательно отличай её от предыдущей реплики: «${previousLine || 'это первый дополнительный разговор'}». Скрытая истина сюжета: игрок сам является королём, но Незнакомец этого совершенно не знает, не подозревает и считает игрока и короля разными людьми. Не раскрывай тайну и не намекай, что Незнакомец её знает. Не повторяй вступление. Данные пути игрока: ${facts(run)}`,
    fallback,
  );
  return line.trim().toLocaleLowerCase('ru-RU') === previousLine.trim().toLocaleLowerCase('ru-RU') ? fallback : line;
};
