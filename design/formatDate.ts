const DAY_MS = 24 * 60 * 60 * 1000;
const RELATIVE_WINDOW_DAYS = 7;

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** Short absolute date, e.g. `3 Sep` — no year, same as the relative formatter's fallback. */
export function formatAbsoluteDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

/** Short absolute date with its weekday, e.g. `Tue, 15 Sep` — the workout header's date (08.7). */
export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]}, ${formatAbsoluteDate(date)}`;
}

export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const daysAgo = daysBetween(date, now);

  if (daysAgo === 0) {
    return 'today';
  }

  if (daysAgo > 0 && daysAgo <= RELATIVE_WINDOW_DAYS) {
    return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
  }

  return formatAbsoluteDate(date);
}
