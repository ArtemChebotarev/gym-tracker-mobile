const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function formatShortDuration(date: Date, now: Date = new Date()): string {
  const daysAgo = Math.max(0, daysBetween(date, now));

  if (daysAgo < DAYS_PER_WEEK) {
    return `${daysAgo} d`;
  }

  return `${Math.floor(daysAgo / DAYS_PER_WEEK)} w`;
}
