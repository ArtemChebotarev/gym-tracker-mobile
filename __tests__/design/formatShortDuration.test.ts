import { formatShortDuration } from '@design/formatShortDuration';

const NOW = new Date(2026, 7, 25);

function daysAgo(days: number): Date {
  return new Date(2026, 7, 25 - days);
}

describe('formatShortDuration', () => {
  test('a few days ago renders as "N d"', () => {
    expect(formatShortDuration(daysAgo(3), NOW)).toBe('3 d');
  });

  test('two full weeks ago renders as "N w"', () => {
    expect(formatShortDuration(daysAgo(14), NOW)).toBe('2 w');
  });

  test('today renders as "0 d", not "NaN d"', () => {
    expect(formatShortDuration(NOW, NOW)).toBe('0 d');
  });
});
