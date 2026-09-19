import { exerciseCardView, formatRir, showsGroupChip } from '@components/WorkoutExerciseCardLogic';
import type { WorkoutSetRow } from '@usecases/workoutSession';

const ROW: WorkoutSetRow = { setNumber: 1, isFirstUnlogged: false, log: { weight: 60, reps: 10 } };
const SKIPPED_ROW: WorkoutSetRow = { setNumber: 2, isFirstUnlogged: false, isSkipped: true };

describe('exerciseCardView', () => {
  test('live: the menu and the RIR badge, set rows, no plate', () => {
    expect(exerciseCardView('live', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: true,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showSkippedNote: false,
      showNotProgrammed: false,
    });
  });

  test('read-only: no menu, everything else like live', () => {
    expect(
      exerciseCardView('readonly', { status: 'completed', targetRir: 2, rows: [ROW] }),
    ).toEqual({
      showMenu: false,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showSkippedNote: false,
      showNotProgrammed: false,
    });
  });

  test('a skipped exercise with sets logged is dimmed but keeps its rows, menu in live only', () => {
    expect(
      exerciseCardView('live', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: true,
      isSkipped: true,
      showSets: true,
    });
    expect(
      exerciseCardView('readonly', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: false,
      isSkipped: true,
      showSets: true,
    });
  });

  test('a skipped exercise with nothing logged collapses its rows into one Skipped note', () => {
    expect(
      exerciseCardView('readonly', {
        status: 'skipped',
        targetRir: 2,
        rows: [{ ...SKIPPED_ROW, setNumber: 1 }, SKIPPED_ROW],
      }),
    ).toMatchObject({ isSkipped: true, showSets: false, showSkippedNote: true });
  });

  test('preview: the plate only — no menu, no RIR badge, no set rows', () => {
    expect(exerciseCardView('preview', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: false,
      rirLabel: undefined,
      isSkipped: false,
      showSets: false,
      showSkippedNote: false,
      showNotProgrammed: true,
    });
  });

  test('no RIR badge without a target RIR', () => {
    expect(exerciseCardView('live', { status: 'planned', rows: [ROW] }).rirLabel).toBeUndefined();
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
