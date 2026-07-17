export type RelicId = 'blood_charm' | 'berserker_sigil' | 'soul_lantern' | 'wind_feather' | 'shard_heart' | 'iron_oath';

export type Relic = {
  id: RelicId;
  icon: string;
  name: string;
  description: string;
};

export const RELICS: readonly Relic[] = [
  { id: 'blood_charm', icon: '🩸', name: 'Кровавый амулет', description: 'Каждое восьмое убийство восстанавливает одну маску.' },
  { id: 'berserker_sigil', icon: '🔥', name: 'Печать берсерка', description: 'При половине здоровья или меньше урон увеличен на 35%.' },
  { id: 'soul_lantern', icon: '🔮', name: 'Фонарь душ', description: 'Удары дают на 50% больше Души.' },
  { id: 'wind_feather', icon: '🪶', name: 'Перо ветра', description: 'Перекат восстанавливается на 35% быстрее.' },
  { id: 'shard_heart', icon: '💎', name: 'Осколочное сердце', description: 'Враги оставляют вдвое больше осколков.' },
  { id: 'iron_oath', icon: '🛡️', name: 'Железная клятва', description: 'Первый полученный удар в каждой локации блокируется.' },
] as const;

export const chooseRelics = (owned: readonly RelicId[], count = 3): Relic[] => {
  const available = RELICS.filter((relic) => !owned.includes(relic.id));
  return [...available].sort(() => Math.random() - .5).slice(0, count);
};

