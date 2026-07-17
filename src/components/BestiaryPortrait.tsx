import type { BestiaryEntry } from '../game/bestiary';

export function BestiaryPortrait({ entry, locked = false }: { entry: BestiaryEntry; locked?: boolean }) {
  const ranged = entry.role === 'ranged', beast = entry.role === 'beast';
  return <svg viewBox="0 0 180 150" className={`h-full w-full ${locked ? 'opacity-20 grayscale' : ''}`} aria-label={locked ? 'Неизвестный враг' : `Изображение: ${entry.name}`}>
    <defs><radialGradient id={`mist-${entry.id}`}><stop stopColor={entry.color} stopOpacity=".32"/><stop offset="1" stopColor="#02050a" stopOpacity="0"/></radialGradient></defs>
    <rect width="180" height="150" fill={`url(#mist-${entry.id})`}/>
    <ellipse cx="90" cy="134" rx="55" ry="8" fill="#000" opacity=".65"/>
    {entry.role === 'boss' && <path d="M55 48 66 17 83 43 97 11 113 44 130 19 137 54Z" fill={entry.color} opacity=".75"/>}
    {beast ? <path d="M42 101 57 65 84 55 111 64 141 48 131 79 148 101 119 116 67 117Z" fill={entry.color} stroke="#e2e8f0" strokeOpacity=".28" strokeWidth="3"/> : <><path d="M59 119 65 68Q66 43 90 42t25 26l8 51Z" fill={entry.color} stroke="#e2e8f0" strokeOpacity=".28" strokeWidth="3"/><path d="M70 47Q90 18 110 47L103 67H77Z" fill="#111827"/><path d="M54 75 30 107M122 74l27 35" stroke={entry.color} strokeWidth="10" strokeLinecap="round"/></>}
    <path d="M77 66h8m12 0h8" stroke="#fff7c2" strokeWidth="4" strokeLinecap="square"/>
    {ranged && <path d="M132 42q34 31 0 69m0-35h36" fill="none" stroke="#d8b4fe" strokeWidth="4"/>}
    {!locked && ranged && <circle r="4" fill="#fff7c2"><animateMotion path="M132 76 H174" dur="1.5s" repeatCount="indefinite"/></circle>}
    {entry.role === 'mystic' && <circle cx="143" cy="57" r="13" fill={entry.color} opacity=".82"><animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite"/></circle>}
    {!locked && (entry.role === 'warrior' || entry.role === 'boss') && <path d="M128 76 164 54" stroke="#fff7c2" strokeWidth="5" strokeLinecap="round"><animate attributeName="opacity" values=".2;1;.2" dur="1.2s" repeatCount="indefinite"/></path>}
    {locked && <text x="90" y="92" textAnchor="middle" fill="#fff" fontSize="54" fontWeight="900">?</text>}
  </svg>;
}
