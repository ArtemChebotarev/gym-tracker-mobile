import { getWeightUnitLabel, WEIGHT_UNIT_OPTIONS } from '@design/weightUnitLabel';

// GT-269: a picker names the unit; a weight prints it bare.
describe('weight unit labels', () => {
  test('name each unit', () => {
    expect(getWeightUnitLabel('kg')).toBe('Kilograms (kg)');
    expect(getWeightUnitLabel('lb')).toBe('Pounds (lb)');
  });

  test('offer kilograms first, then pounds', () => {
    expect(WEIGHT_UNIT_OPTIONS.map((option) => option.value)).toEqual(['kg', 'lb']);
  });
});
