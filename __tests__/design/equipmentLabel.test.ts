import { EQUIPMENT_OPTIONS } from '@domain/catalog';
import { getEquipmentLabel } from '@design/equipmentLabel';

describe('getEquipmentLabel', () => {
  test('capitalizes each equipment id into a display label', () => {
    expect(getEquipmentLabel('barbell')).toBe('Barbell');
    expect(getEquipmentLabel('bodyweight')).toBe('Bodyweight');
    expect(getEquipmentLabel('plyo-box')).toBe('Plyo box');
    // The ", bodyweight" of a band belongs to the workout card, not to the name of the equipment.
    expect(getEquipmentLabel('resistance-band')).toBe('Resistance band');
  });

  test('covers every equipment option with no gaps', () => {
    for (const equipment of EQUIPMENT_OPTIONS) {
      expect(getEquipmentLabel(equipment)).toBeTruthy();
    }
  });
});
