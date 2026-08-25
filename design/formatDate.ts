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

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

function formatAbsoluteDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
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
