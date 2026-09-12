import { MUSCLE_GROUPS } from '@domain/catalog';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

describe('getMuscleGroupLabel', () => {
  test('capitalizes each muscle group id into a display label', () => {
    expect(getMuscleGroupLabel('chest')).toBe('Chest');
    expect(getMuscleGroupLabel('traps')).toBe('Traps');
    expect(getMuscleGroupLabel('abs')).toBe('Abs');
  });

  test('covers all twelve muscle groups with no gaps', () => {
    for (const group of MUSCLE_GROUPS) {
      expect(getMuscleGroupLabel(group)).toBeTruthy();
    }
  });
});
