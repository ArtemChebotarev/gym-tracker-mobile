import type { MuscleGroup } from '@domain/catalog';
import {
  cardChip,
  cardInfoTargets,
  exerciseCardView,
  firstUnloggedRow,
  targetRirOf,
} from '@components/WorkoutExerciseCardLogic';
import type {
  PowerWorkoutExercise,
  StrengthWorkoutExercise,
  WorkoutSetRow,
} from '@usecases/workoutSession';

const ROW: WorkoutSetRow = { setNumber: 1, isFirstUnlogged: false, log: { weight: 60, reps: 10 } };
const SKIPPED_ROW: WorkoutSetRow = { setNumber: 2, isFirstUnlogged: false, notDone: 'skipped' };

describe('exerciseCardView', () => {
  test('live: the menu and the RIR badge, set rows, no plate', () => {
    expect(exerciseCardView('live', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: true,
      rirLabel: '2 RIR',
      isNotDone: false,
      showSets: true,
      notDoneNote: undefined,
      showNotProgrammed: false,
    });
  });

  test('read-only: no menu, everything else like live', () => {
    expect(
      exerciseCardView('readonly', { status: 'completed', targetRir: 2, rows: [ROW] }),
    ).toEqual({
      showMenu: false,
      rirLabel: '2 RIR',
      isNotDone: false,
      showSets: true,
      notDoneNote: undefined,
      showNotProgrammed: false,
    });
  });

  test('a skipped exercise with sets logged is dimmed but keeps its rows, menu in live only', () => {
    expect(
      exerciseCardView('live', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: true,
      isNotDone: true,
      showSets: true,
    });
    expect(
      exerciseCardView('readonly', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: false,
      isNotDone: true,
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
    ).toMatchObject({ isNotDone: true, showSets: false, notDoneNote: 'Skipped' });
  });

  test('an abandoned exercise reads the same, under its own word (136)', () => {
    const abandonedRow: WorkoutSetRow = { ...SKIPPED_ROW, notDone: 'abandoned' };
    expect(
      exerciseCardView('history', {
        status: 'abandoned',
        targetRir: 2,
        rows: [{ ...abandonedRow, setNumber: 1 }, abandonedRow],
      }),
    ).toMatchObject({ isNotDone: true, showSets: false, notDoneNote: 'Abandoned' });
    expect(
      exerciseCardView('history', { status: 'abandoned', targetRir: 2, rows: [ROW, abandonedRow] }),
    ).toMatchObject({ isNotDone: true, showSets: true, notDoneNote: undefined });
  });

  test('preview: the plate only — no menu, no RIR badge, no set rows', () => {
    expect(exerciseCardView('preview', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: false,
      rirLabel: undefined,
      isNotDone: false,
      showSets: false,
      notDoneNote: undefined,
      showNotProgrammed: true,
    });
  });

  test('no RIR badge without a target RIR', () => {
    expect(exerciseCardView('live', { status: 'planned', rows: [ROW] }).rirLabel).toBeUndefined();
  });
});

describe('cardChip', () => {
  const exercises = [
    { muscleGroup: 'chest' },
    { muscleGroup: 'chest' },
    { muscleGroup: 'back' },
    { muscleGroup: 'chest' },
  ] as const;
  const group = (muscleGroup: MuscleGroup) => ({ kind: 'group', muscleGroup });

  test('the first card always gets the chip', () => {
    expect(cardChip(exercises, 0)).toEqual(group('chest'));
  });

  test('no chip when the group is the same as the previous card', () => {
    expect(cardChip(exercises, 1)).toBeUndefined();
  });

  test('a chip when the group changes from the previous card', () => {
    expect(cardChip(exercises, 2)).toEqual(group('back'));
  });

  test('a group coming back after another one gets the chip again', () => {
    expect(cardChip(exercises, 3)).toEqual(group('chest'));
  });

  test('groups sharing a color family still count as different (traps after back)', () => {
    expect(cardChip([{ muscleGroup: 'back' }, { muscleGroup: 'traps' }], 1)).toEqual(
      group('traps'),
    );
  });

  test('an index past the list gets no chip', () => {
    expect(cardChip(exercises, 4)).toBeUndefined();
  });

  // GT-81, 10.1 FR-14: a card that is not strength names its type, and the group is secondary.
  describe('a card of another type', () => {
    const mixed = [
      { muscleGroup: 'chest' },
      { muscleGroup: 'fullBody', type: 'power' },
      { muscleGroup: 'quads', type: 'power' },
      { muscleGroup: 'chest' },
      { muscleGroup: 'back', type: 'interval' },
    ] as const;

    test('names its type instead of its muscle group', () => {
      expect(cardChip(mixed, 1)).toEqual({ kind: 'type', type: 'power' });
    });

    test('says it once for a run of the same type', () => {
      expect(cardChip(mixed, 2)).toBeUndefined();
    });

    test('a strength card after it starts its own run, with its group', () => {
      expect(cardChip(mixed, 3)).toEqual(group('chest'));
    });

    test('a different type changes the chip; a type first in the list gets it too', () => {
      expect(cardChip(mixed, 4)).toEqual({ kind: 'type', type: 'interval' });
      expect(cardChip([{ muscleGroup: 'fullBody', type: 'mobility' }], 0)).toEqual({
        kind: 'type',
        type: 'mobility',
      });
    });
  });
});

describe('firstUnloggedRow', () => {
  test('the set whose Log box carries the accent', () => {
    const rows = [
      { setNumber: 1, isFirstUnlogged: false },
      { setNumber: 2, isFirstUnlogged: true },
    ] as WorkoutSetRow[];

    expect(firstUnloggedRow(rows)?.setNumber).toBe(2);
  });

  test('nothing once every set is logged', () => {
    expect(
      firstUnloggedRow([{ setNumber: 1, isFirstUnlogged: false }] as WorkoutSetRow[]),
    ).toBeUndefined();
  });
});

describe('cardInfoTargets', () => {
  const base = {
    status: 'planned' as const,
    targetRir: 3,
    equipment: 'barbell' as const,
    rows: [{ setNumber: 1, isFirstUnlogged: true }] as WorkoutSetRow[],
  };

  test('a live card has the RIR badge and the Weight ⓘ; the Reps ⓘ needs a weight swap', () => {
    expect(cardInfoTargets(base, 'live', false)).toEqual({
      rir: true,
      weight: true,
      reps: false,
    });
  });

  test('a weight swap on the next set adds the Reps ⓘ', () => {
    const withSwap = {
      ...base,
      rows: [
        { setNumber: 1, isFirstUnlogged: true, weightSwap: { unavailable: 'no_history' } },
      ] as WorkoutSetRow[],
    };

    expect(cardInfoTargets(withSwap, 'live', false).reps).toBe(true);
  });

  test('a deload card keeps only its badge — the Deload one, not the RIR one', () => {
    expect(cardInfoTargets(base, 'live', true)).toEqual({
      rir: false,
      weight: false,
      reps: false,
    });
  });

  test('a read-only card has the badge and no ⓘ at all', () => {
    expect(cardInfoTargets(base, 'readonly', false)).toEqual({
      rir: true,
      weight: false,
      reps: false,
    });
  });

  test('a card with no RIR has no badge', () => {
    expect(cardInfoTargets({ ...base, targetRir: undefined }, 'live', false).rir).toBe(false);
  });
});

// 10.1 FR-15, 10.2 P5: the RIR a card shows — none on a band or a power exercise.
describe('targetRirOf', () => {
  const base = {
    sessionExerciseId: 'se-1',
    exerciseId: 'exercise-1',
    name: 'Exercise',
    muscleGroup: 'chest' as const,
    status: 'planned' as const,
    rows: [],
    plannedSetCount: 0,
    loggedSetCount: 0,
    hasLoggedSets: false,
    actions: {
      canReplace: false,
      canAddSet: false,
      canRemoveLastSet: false,
      canMoveUp: false,
      canMoveDown: false,
      canSkip: false,
      canUnskip: false,
      canDelete: false,
    },
  };

  test('a strength exercise shows its week’s RIR', () => {
    const bench: StrengthWorkoutExercise = { ...base, equipment: 'barbell', targetRir: 2 };
    expect(targetRirOf(bench)).toBe(2);
  });

  test('a band shows none, though the RIR is in its data', () => {
    const band: StrengthWorkoutExercise = { ...base, equipment: 'resistance-band', targetRir: 2 };
    expect(targetRirOf(band)).toBeUndefined();
  });

  test('a power exercise shows none', () => {
    const power: PowerWorkoutExercise = { ...base, type: 'power', powerLoad: 'weight' };
    expect(targetRirOf(power)).toBeUndefined();
  });
});

describe('exerciseCardView on a deload week', () => {
  const exercise: Pick<StrengthWorkoutExercise, 'status' | 'targetRir' | 'rows'> = {
    status: 'planned',
    targetRir: 8,
    rows: [],
  };

  test('the Deload badge takes the RIR badge’s place', () => {
    expect(exerciseCardView('live', exercise, true)).toMatchObject({
      rirLabel: undefined,
      deloadLabel: 'Deload',
    });
    expect(exerciseCardView('live', exercise)).toMatchObject({
      rirLabel: '8 RIR',
      deloadLabel: undefined,
    });
  });

  test('a power card has the badge although it has no RIR to show', () => {
    expect(
      exerciseCardView('live', { status: 'planned', targetRir: undefined, rows: [] }, true)
        .deloadLabel,
    ).toBe('Deload');
  });

  test('a preview shows neither', () => {
    expect(exerciseCardView('preview', exercise, true)).toMatchObject({
      rirLabel: undefined,
      deloadLabel: undefined,
    });
  });
});
