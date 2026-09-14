import {
  canContinueFromBasics,
  formatDaysPerWeekValue,
  formatMesocycleLengthValue,
} from '@components/MesoEditorBasicsStepLogic';

describe('canContinueFromBasics', () => {
  test('rejects an empty or whitespace-only name', () => {
    expect(canContinueFromBasics('', 6, 4)).toBe(false);
    expect(canContinueFromBasics('   ', 6, 4)).toBe(false);
  });

  test.each([3, 8])('accepts the lengthWeeks boundary %i', (lengthWeeks) => {
    expect(canContinueFromBasics('Block 6', lengthWeeks, 4)).toBe(true);
  });

  test.each([2, 9])('rejects lengthWeeks out of range (%i)', (lengthWeeks) => {
    expect(canContinueFromBasics('Block 6', lengthWeeks, 4)).toBe(false);
  });

  test.each([1, 7])('accepts the daysPerWeek boundary %i', (daysPerWeek) => {
    expect(canContinueFromBasics('Block 6', 6, daysPerWeek)).toBe(true);
  });

  test.each([0, 8])('rejects daysPerWeek out of range (%i)', (daysPerWeek) => {
    expect(canContinueFromBasics('Block 6', 6, daysPerWeek)).toBe(false);
  });
});

describe('formatMesocycleLengthValue', () => {
  test('pluralizes for anything other than exactly 1', () => {
    expect(formatMesocycleLengthValue(1)).toBe('1 week');
    expect(formatMesocycleLengthValue(6)).toBe('6 weeks');
  });
});

describe('formatDaysPerWeekValue', () => {
  test('pluralizes for anything other than exactly 1', () => {
    expect(formatDaysPerWeekValue(1)).toBe('1 day');
    expect(formatDaysPerWeekValue(4)).toBe('4 days');
  });
});
