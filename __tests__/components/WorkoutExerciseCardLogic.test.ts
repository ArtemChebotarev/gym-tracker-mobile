import { exerciseCardView, formatRir, showsGroupChip } from '@components/WorkoutExerciseCardLogic';

describe('exerciseCardView', () => {
  test('live: the menu and the RIR badge, set rows, no plate', () => {
    expect(exerciseCardView('live', { status: 'planned', targetRir: 2 })).toEqual({
      showMenu: true,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showNotProgrammed: false,
    });
  });

  test('read-only: no menu, everything else like live', () => {
    expect(exerciseCardView('readonly', { status: 'completed', targetRir: 2 })).toEqual({
      showMenu: false,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showNotProgrammed: false,
    });
  });

  test('a skipped exercise is dimmed in live and read-only alike, keeping its menu in live', () => {
    expect(exerciseCardView('live', { status: 'skipped', targetRir: 2 })).toMatchObject({
      showMenu: true,
      isSkipped: true,
      showSets: true,
    });
    expect(exerciseCardView('readonly', { status: 'skipped', targetRir: 2 })).toMatchObject({
      showMenu: false,
      isSkipped: true,
      showSets: true,
    });
  });

  test('preview: the plate only — no menu, no RIR badge, no set rows', () => {
    expect(exerciseCardView('preview', { status: 'planned', targetRir: 2 })).toEqual({
      showMenu: false,
      rirLabel: undefined,
      isSkipped: false,
      showSets: false,
      showNotProgrammed: true,
    });
  });

  test('no RIR badge without a target RIR', () => {
    expect(exerciseCardView('live', { status: 'planned' }).rirLabel).toBeUndefined();
  });
});

describe('showsGroupChip', () => {
  const exercises = [
    { muscleGroup: 'chest' },
    { muscleGroup: 'chest' },
    { muscleGroup: 'back' },
    { muscleGroup: 'chest' },
  ] as const;

  test('the first card always gets the chip', () => {
    expect(showsGroupChip(exercises, 0)).toBe(true);
  });

  test('no chip when the group is the same as the previous card', () => {
    expect(showsGroupChip(exercises, 1)).toBe(false);
  });

  test('a chip when the group changes from the previous card', () => {
    expect(showsGroupChip(exercises, 2)).toBe(true);
  });

  test('a group coming back after another one gets the chip again', () => {
    expect(showsGroupChip(exercises, 3)).toBe(true);
  });

  test('groups sharing a color family still count as different (traps after back)', () => {
    expect(showsGroupChip([{ muscleGroup: 'back' }, { muscleGroup: 'traps' }], 1)).toBe(true);
  });

  test('an index past the list gets no chip', () => {
    expect(showsGroupChip(exercises, 4)).toBe(false);
  });
});

describe('formatRir', () => {
  test('reads `N RIR`', () => {
    expect(formatRir(2)).toBe('2 RIR');
    expect(formatRir(0)).toBe('0 RIR');
  });
});
