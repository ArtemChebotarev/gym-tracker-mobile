import { assertWeightUnit } from '@domain/weightUnitValidators';

// GT-269.
describe('assertWeightUnit', () => {
  test('passes kilograms and pounds', () => {
    expect(() => assertWeightUnit('kg')).not.toThrow();
    expect(() => assertWeightUnit('lb')).not.toThrow();
  });

  test('refuses anything else', () => {
    expect(() => assertWeightUnit('KG')).toThrow('Weight unit must be one of kg, lb, got KG.');
    expect(() => assertWeightUnit(undefined)).toThrow();
  });
});
