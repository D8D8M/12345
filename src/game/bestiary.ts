export type BestiaryEntry = {
  id: string; name: string; location: string; description: string; weakness: string;
  role: 'beast' | 'warrior' | 'ranged' | 'mystic' | 'boss'; color: string;
};

export type BestiaryProgress = Record<string, number>;

export const BESTIARY: BestiaryEntry[] = [
  { id:'rottenPrisoner', name:'Гнилой узник', location:'Тюремные камеры', description:'Бывший пленник, которого проклятие не отпустило даже после смерти.', weakness:'Медлителен: перекатись за спину после его замаха.', role:'warrior', color:'#9ca37d' },
  { id:'summonedPrisoner', name:'Призванный узник', location:'Тюремные камеры', description:'Хрупкая оболочка, поднятая чужой некромантией.', weakness:'Уничтожь призывателя или бей сразу после появления.', role:'warrior', color:'#b6c77c' },
  { id:'cappedArcher', name:'Стрелок в капюшоне', location:'Тюремные камеры', description:'Молчаливый охотник, караулящий длинные коридоры.', weakness:'Сближайся перекатами между выстрелами.', role:'ranged', color:'#a78bfa' },
  { id:'marshSlime', name:'Болотная слизь', location:'Ядовитая низина', description:'Живая жижа, вобравшая яд и кости утонувших.', weakness:'Держись выше и атакуй в момент приземления.', role:'beast', color:'#84cc16' },
  { id:'swampTotem', name:'Болотный тотем', location:'Ядовитая низина', description:'Резной идол, защищающий ближайших тварей колдовским полем.', weakness:'Главная цель: разбей тотем прежде остальных врагов.', role:'mystic', color:'#67e8f9' },
  { id:'bogShaman', name:'Топяной шаман', location:'Ядовитая низина', description:'Служитель трясины, метающий сгустки болотной порчи.', weakness:'Лук прерывает его заклинания с безопасной дистанции.', role:'mystic', color:'#c084fc' },
  { id:'blindMiner', name:'Слепой шахтёр', location:'Заброшенные шахты', description:'Он не видит свет, но безошибочно слышит шаги на камне.', weakness:'Перепрыгни рывок и атакуй сзади.', role:'warrior', color:'#d6a928' },
  { id:'dynamiteTosser', name:'Подрывник', location:'Заброшенные шахты', description:'Безумец, для которого любой спор решается связкой динамита.', weakness:'Отрази его бомбу щитом или быстро сократи дистанцию.', role:'ranged', color:'#fb923c' },
  { id:'minecartDefender', name:'Страж вагонетки', location:'Заброшенные шахты', description:'Закованный рудокоп, не оставивший свой пост.', weakness:'Уязвим после разгона и столкновения.', role:'warrior', color:'#b08968' },
  { id:'clockworkSoldier', name:'Часовой солдат', location:'Часовая башня', description:'Точный механизм с единственным приказом: охранять подъём.', weakness:'Заморозь или ударь во время перезавода.', role:'warrior', color:'#d4a84b' },
  { id:'gearFlyer', name:'Летучая шестерня', location:'Часовая башня', description:'Сломанный часовой дрон с острыми зубьями.', weakness:'Лук и удар вверх не дают ей держать высоту.', role:'beast', color:'#94a3b8' },
  { id:'towerSniper', name:'Башенный снайпер', location:'Часовая башня', description:'Стрелок, чей зелёный прицел редко промахивается.', weakness:'Прячься за стенами и атакуй после выстрела.', role:'ranged', color:'#59ff67' },
  { id:'wraith', name:'Призрак павшего', location:'Склеп павших', description:'Остаток воли воина, просочившийся сквозь печати.', weakness:'Не стой на месте: бей после его проявления.', role:'mystic', color:'#a78bfa' },
  { id:'necromancer', name:'Некромант', location:'Склеп павших', description:'Хранитель запретных имён, поднимающий новых слуг.', weakness:'Игнорируй призванных и прерви ритуал вблизи.', role:'mystic', color:'#c084fc' },
  { id:'cryptTotem', name:'Печать склепа', location:'Склеп павших', description:'Древняя печать, скрывающая союзников во мраке.', weakness:'Её уничтожение раскрывает всех скрытых врагов.', role:'mystic', color:'#168cff' },
  { id:'bridgeKnight', name:'Рыцарь моста', location:'Разрушенный мост', description:'Безымянный защитник пути к королевскому замку.', weakness:'Обойди защиту перекатом и нанеси быстрый удар.', role:'warrior', color:'#cbd5e1' },
  { id:'gargoyleBomber', name:'Горгулья-бомбардир', location:'Разрушенный мост', description:'Каменный хищник, сбрасывающий заряд с высоты.', weakness:'Следи за тенью, уклонись и отвечай из лука.', role:'beast', color:'#94a3b8' },
  { id:'royalGuard', name:'Королевский гвардеец', location:'Королевский замок', description:'Последний дисциплинированный солдат павшей короны.', weakness:'Фронтальная броня крепка — заходи за спину.', role:'warrior', color:'#d4af55' },
  { id:'royalSorcerer', name:'Королевский чародей', location:'Королевский замок', description:'Придворный маг, превративший верность в тёмную силу.', weakness:'Дави вблизи, пока он готовит сферу.', role:'mystic', color:'#e879f9' },
  { id:'swampGiant', name:'Болотный гигант', location:'Ядовитая низина · Босс', description:'Исполин, выросший из корней, ила и древней ярости.', weakness:'Прыгай через ударную волну и бей после тяжёлого замаха.', role:'boss', color:'#65e342' },
  { id:'stoneGolem', name:'Каменный голем', location:'Заброшенные шахты · Босс', description:'Сердце мёртвой горы, заключённое в ходячую броню.', weakness:'Его ядро открывается после сокрушительной атаки.', role:'boss', color:'#f97316' },
  { id:'cryptWarden', name:'Смотритель склепа', location:'Склеп павших · Босс', description:'Тюремщик мёртвых и хозяин нерушимых печатей.', weakness:'Уклоняйся от черепов и атакуй между ритуалами.', role:'boss', color:'#a855f7' },
  { id:'bridgeColossus', name:'Колосс моста', location:'Разрушенный мост · Босс', description:'Живая крепость, поставленная закрыть путь к короне.', weakness:'Держись рядом с ногами после его наскока.', role:'boss', color:'#ef4444' },
  { id:'rightHand', name:'Правая рука короля', location:'Тронный зал · Босс', description:'Совершенный клинок короля — и последнее лицо из прошлого героя.', weakness:'Не жадничай: отражай серии щитом и отвечай одним ударом.', role:'boss', color:'#d4af37' },
];

const STORAGE_KEY = 'false-knight-bestiary';
export const loadBestiaryProgress = (): BestiaryProgress => {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as BestiaryProgress; return value && typeof value === 'object' ? value : {}; }
  catch { return {}; }
};
export const recordBestiaryKill = (id: string): BestiaryProgress => {
  const progress = loadBestiaryProgress();
  progress[id] = (Number(progress[id]) || 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
};
