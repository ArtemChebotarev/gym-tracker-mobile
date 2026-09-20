import { parseBodyWeight } from '@components/BodyWeightSheetLogic';

describe('parseBodyWeight', () => {
  test('a positive number, with a point or a comma', () => {
    expect(parseBodyWeight('80')).toBe(80);
    expect(parseBodyWeight('82.5')).toBe(82.5);
    expect(parseBodyWeight('82,5')).toBe(82.5);
    expect(parseBodyWeight(' 80 ')).toBe(80);
  });

  test('null for anything that is not one — 0 is not a body weight', () => {
    expect(parseBodyWeight('')).toBeNull();
    expect(parseBodyWeight('0')).toBeNull();
    expect(parseBodyWeight('-80')).toBeNull();
    expect(parseBodyWeight('eighty')).toBeNull();
    expect(parseBodyWeight('.')).toBeNull();
  });
});
