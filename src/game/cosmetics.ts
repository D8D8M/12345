export type CosmeticStyle = { cape: string; maskGlow: string; weapon: string; trail: string; name: string };

export function cosmeticForProgress(achievements: number, bossKills: number): CosmeticStyle {
  if (bossKills >= 4) return { name: 'Королевская тень', cape: '#050505', maskGlow: '#fbbf24', weapon: '#cbd5e1', trail: '#c084fc' };
  if (bossKills >= 1) return { name: 'Пепел босса', cape: '#050505', maskGlow: '#fb923c', weapon: '#cbd5e1', trail: '#f97316' };
  if (achievements >= 4) return { name: 'Лазурный странник', cape: '#050505', maskGlow: '#67e8f9', weapon: '#cbd5e1', trail: '#22d3ee' };
  return { name: 'Павший рыцарь', cape: '#050505', maskGlow: '#ef4444', weapon: '#d1d5db', trail: '#94a3b8' };
}
