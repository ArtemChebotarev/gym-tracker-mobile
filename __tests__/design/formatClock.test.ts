import { formatClock } from '@design/formatClock';

describe('formatClock', () => {
  test('formats seconds as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(135)).toBe('2:15');
  });
});
