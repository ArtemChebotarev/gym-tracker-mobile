import { WEIGHT_UNIT_OPTIONS } from '@design/weightUnitLabel';

// GT-269: the picker shows the bare unit, kilograms first.
describe('WEIGHT_UNIT_OPTIONS', () => {
  test('are kg, then lb', () => {
    expect(WEIGHT_UNIT_OPTIONS).toEqual([
      { value: 'kg', label: 'kg' },
      { value: 'lb', label: 'lb' },
    ]);
  });
});
