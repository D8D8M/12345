export type GhostFrame = { t: number; x: number; y: number; facing: number; location: string };
export type BestRunGhost = { seconds: number; frames: GhostFrame[] };

const KEY = 'false-knight-best-timed-ghost';

export function loadBestRunGhost(): BestRunGhost | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null') as BestRunGhost | null;
    return value && Number.isFinite(value.seconds) && Array.isArray(value.frames) ? value : null;
  } catch { return null; }
}

export function saveBestRunGhost(seconds: number, frames: GhostFrame[]): boolean {
  const previous = loadBestRunGhost();
  if (previous && previous.seconds <= seconds) return false;
  localStorage.setItem(KEY, JSON.stringify({ seconds, frames } satisfies BestRunGhost));
  return true;
}
