import { EQUIPMENT_OPTIONS, EXERCISE_TYPES } from '@domain/catalog';
import { equipmentOptionsFor } from '@domain/exerciseEquipment';

describe('equipmentOptionsFor', () => {
  test('every option of every type is a known equipment value, listed once', () => {
    for (const type of EXERCISE_TYPES) {
      const options = equipmentOptionsFor(type);
      expect(new Set(options).size).toBe(options.length);
      for (const equipment of options) {
        expect(EQUIPMENT_OPTIONS).toContain(equipment);
      }
    }
  });

  test('every equipment value belongs to at least one type', () => {
    const offered = new Set(EXERCISE_TYPES.flatMap((type) => equipmentOptionsFor(type)));
    expect([...EQUIPMENT_OPTIONS].filter((equipment) => !offered.has(equipment))).toEqual([]);
  });

  test('the hybrid types share bodyweight, resistance band and other', () => {
    for (const type of ['power', 'interval', 'mobility'] as const) {
      expect(equipmentOptionsFor(type)).toEqual(
        expect.arrayContaining(['bodyweight', 'resistance-band', 'other']),
      );
    }
  });

  test('power offers its own kit, and no gym machines', () => {
    expect(equipmentOptionsFor('power')).toEqual(
      expect.arrayContaining(['medicine-ball', 'slam-ball', 'sandbag', 'kettlebell', 'plyo-box']),
    );
    expect(equipmentOptionsFor('power')).not.toContain('barbell');
    expect(equipmentOptionsFor('power')).not.toContain('machine');
  });

  test('interval offers bag, rope and rower; mobility a roller and a mat', () => {
    expect(equipmentOptionsFor('interval')).toEqual(
      expect.arrayContaining(['heavy-bag', 'jump-rope', 'rowing-machine', 'battle-rope']),
    );
    expect(equipmentOptionsFor('mobility')).toEqual(
      expect.arrayContaining(['foam-roller', 'yoga-mat']),
    );
  });

  test('strength keeps its gym list with a kettlebell, and offers no bag or medicine ball', () => {
    expect(equipmentOptionsFor('strength')).toEqual(
      expect.arrayContaining(['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell']),
    );
    expect(equipmentOptionsFor('strength')).not.toContain('heavy-bag');
    expect(equipmentOptionsFor('strength')).not.toContain('medicine-ball');
  });
});
