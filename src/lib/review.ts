// Spaced-repetition ladder: 1 -> 3 -> 7 -> 16 -> 35 -> 70 days.
export const REVIEW_LADDER = [1, 3, 7, 16, 35, 70];

export function nextInterval(current: number): number {
  const idx = REVIEW_LADDER.indexOf(current);
  if (idx === -1) {
    // Not exactly on the ladder: pick the next higher step, else the max.
    const greater = REVIEW_LADDER.find((v) => v > current);
    return greater ?? REVIEW_LADDER[REVIEW_LADDER.length - 1];
  }
  return REVIEW_LADDER[Math.min(idx + 1, REVIEW_LADDER.length - 1)];
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
