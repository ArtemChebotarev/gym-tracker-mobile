import { carryForward } from '@components/RowCarryLogic';

type Field = { value: number; isManual: boolean };
const asCarried = (field: Field): Field => ({ value: field.value, isManual: false });
const rows = [1, 2, 3, 4].map((number) => ({ number, logged: number === 3 }));

describe('carryForward', () => {
  test('a value set by hand fills every later unlogged row, logged ones stay', () => {
    const edits = carryForward({ 1: { value: 30, isManual: true } }, rows, 1, asCarried);

    expect(edits).toEqual({
      1: { value: 30, isManual: true },
      2: { value: 30, isManual: false },
      4: { value: 30, isManual: false },
    });
  });

  test('a row set by hand below is left alone', () => {
    const edits = carryForward(
      { 1: { value: 30, isManual: true }, 2: { value: 45, isManual: true } },
      rows,
      1,
      asCarried,
    );

    expect(edits[2]).toEqual({ value: 45, isManual: true });
    expect(edits[4]).toEqual({ value: 30, isManual: false });
  });

  test('a row nobody set, or one carried into, carries nothing', () => {
    const untouched = {};
    expect(carryForward(untouched, rows, 1, asCarried)).toBe(untouched);
    const carried = { 2: { value: 30, isManual: false } };
    expect(carryForward(carried, rows, 2, asCarried)).toBe(carried);
  });
});
