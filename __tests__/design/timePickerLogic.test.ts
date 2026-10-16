import {
  clampSeconds,
  joinSeconds,
  minuteOptions,
  secondOptions,
  splitSeconds,
} from '@design/timePickerLogic';

describe('splitSeconds', () => {
  test('splits into whole minutes and the seconds past them', () => {
    expect(splitSeconds(0)).toEqual({ minutes: 0, seconds: 0 });
    expect(splitSeconds(135)).toEqual({ minutes: 2, seconds: 15 });
    expect(splitSeconds(600)).toEqual({ minutes: 10, seconds: 0 });
  });
});

describe('options', () => {
  test('minutes run from 0 to the whole minutes the maximum holds', () => {
    expect(minuteOptions(30)).toEqual([0]);
    expect(minuteOptions(600)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  test('seconds step by the given step below a minute', () => {
    expect(secondOptions(15)).toEqual([0, 15, 30, 45]);
    expect(secondOptions(5)).toHaveLength(12);
    expect(secondOptions(5).at(-1)).toBe(55);
  });
});

describe('joinSeconds / clampSeconds', () => {
  test('joins the wheels into seconds', () => {
    expect(joinSeconds(1, 30, 0, 600)).toBe(90);
  });

  test('holds the result within the bounds', () => {
    expect(joinSeconds(0, 0, 5, 600)).toBe(5);
    expect(joinSeconds(10, 30, 0, 600)).toBe(600);
    expect(clampSeconds(-3, 0, 10)).toBe(0);
  });
});
