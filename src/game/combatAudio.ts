type Biome = 'prison' | 'swamps' | 'mines' | 'clock' | 'crypt' | 'bridge' | 'castle' | 'throne';

let context: AudioContext | null = null;
let musicTimer: number | null = null;
let musicStep = 0;

const getContext = () => {
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
};

const BIOME_NOTES: Record<Biome, number[]> = {
  prison: [98, 116, 110, 82], swamps: [73, 82, 69, 92], mines: [65, 98, 73, 87], clock: [147, 185, 165, 220],
  crypt: [82, 78, 62, 93], bridge: [110, 131, 98, 147], castle: [123, 155, 185, 138], throne: [55, 82, 73, 49],
};

export function startBiomeMusic(biome: Biome, volume: number) {
  stopBiomeMusic();
  if (volume <= 0) return;
  try {
    const audio = getContext();
    const playNote = () => {
      const now = audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = biome === 'clock' ? 'triangle' : biome === 'swamps' ? 'sine' : 'sawtooth';
      oscillator.frequency.value = BIOME_NOTES[biome][musicStep++ % 4];
      gain.gain.setValueAtTime(.001, now); gain.gain.linearRampToValueAtTime(.035 * volume / 100, now + .18); gain.gain.exponentialRampToValueAtTime(.001, now + 1.7);
      oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + 1.8);
    };
    playNote(); musicTimer = window.setInterval(playNote, biome === 'throne' ? 900 : 1350);
  } catch { /* Autoplay may be disabled by the browser. */ }
}

export function stopBiomeMusic() { if (musicTimer !== null) window.clearInterval(musicTimer); musicTimer = null; }

export function playCombatHit(volume: number, heavy = false) {
  if (volume <= 0) return;
  try {
    const audio = getContext(), now = audio.currentTime;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = heavy ? 'sawtooth' : 'square'; oscillator.frequency.setValueAtTime(heavy ? 125 : 230, now); oscillator.frequency.exponentialRampToValueAtTime(heavy ? 42 : 80, now + .11);
    gain.gain.setValueAtTime((heavy ? .11 : .065) * volume / 100, now); gain.gain.exponentialRampToValueAtTime(.001, now + .13);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + .14);
  } catch { /* Sound is optional. */ }
}
