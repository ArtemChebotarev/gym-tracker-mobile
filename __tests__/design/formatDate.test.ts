import { formatRelativeDate } from '@design/formatDate';

const NOW = new Date(2026, 7, 25);

function daysAgo(days: number): Date {
  return new Date(2026, 7, 25 - days);
}

describe('formatRelativeDate', () => {
  test('today renders as "today", not "0 days ago"', () => {
    expect(formatRelativeDate(NOW, NOW)).toBe('today');
  });

  test('7 days ago is still relative (upper edge of the relative window)', () => {
    expect(formatRelativeDate(daysAgo(7), NOW)).toBe('7 days ago');
  });

  test('8 days ago switches to the absolute short date', () => {
    expect(formatRelativeDate(daysAgo(8), NOW)).toBe('17 Aug');
  });

  test('a future date renders as an absolute short date, not "-1 days ago"', () => {
    const tomorrow = new Date(2026, 7, 26);
    expect(formatRelativeDate(tomorrow, NOW)).toBe('26 Aug');
  });

  test('1 day ago uses singular wording', () => {
    expect(formatRelativeDate(daysAgo(1), NOW)).toBe('1 day ago');
  });
});
