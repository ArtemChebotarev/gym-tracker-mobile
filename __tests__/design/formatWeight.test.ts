import { convertWeight, formatWeight } from '@design/formatWeight';

describe('convertWeight', () => {
  test('kg stays unchanged', () => {
    expect(convertWeight(100, 'kg')).toBe(100);
  });

  test('kg converts to lb', () => {
    expect(convertWeight(100, 'lb')).toBeCloseTo(220.46, 1);
  });
});

describe('formatWeight', () => {
  test('formats kg with unit suffix', () => {
    expect(formatWeight(100, 'kg')).toBe('100 kg');
  });

  test('formats lb with unit suffix, rounded to one decimal', () => {
    expect(formatWeight(100, 'lb')).toBe('220.5 lb');
  });
});
