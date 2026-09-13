import { EQUIPMENT_OPTIONS } from '@domain/catalog';
import { getEquipmentLabel } from '@design/equipmentLabel';

describe('getEquipmentLabel', () => {
  test('capitalizes each equipment id into a display label', () => {
    expect(getEquipmentLabel('barbell')).toBe('Barbell');
    expect(getEquipmentLabel('bodyweight')).toBe('Bodyweight');
  });

  test('covers every equipment option with no gaps', () => {
    for (const equipment of EQUIPMENT_OPTIONS) {
      expect(getEquipmentLabel(equipment)).toBeTruthy();
    }
  });
});
