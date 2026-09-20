import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import { buildExerciseListGroups } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';
import { STAMPS } from '../fixtures/stamps';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId('exercise-bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

function makeSetLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'set-log-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    setNumber: 1,
    weight: 60,
    reps: 8,
    completedAt: '2026-08-26T08:00:00.000Z',
    ...overrides,
  };
}

describe('buildExerciseListGroups', () => {
  test('groups exercises by muscle group, ordered by the fixed catalog order', () => {
    const quads = makeExercise({ id: toExerciseId('e-quads'), name: 'Squat', muscleGroup: 'quads' });
    const chest = makeExercise({ id: toExerciseId('e-chest'), name: 'Bench Press', muscleGroup: 'chest' });
    const back = makeExercise({ id: toExerciseId('e-back'), name: 'Row', muscleGroup: 'back' });

    const groups = buildExerciseListGroups([quads, chest, back], new Map());

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest', 'back', 'quads']);
  });

  test('sorts exercises within a group alphabetically by name', () => {
    const zeus = makeExercise({ id: toExerciseId('e-1'), name: 'Zottman Curl', muscleGroup: 'biceps' });
    const alpha = makeExercise({ id: toExerciseId('e-2'), name: 'Alternating Curl', muscleGroup: 'biceps' });

    const groups = buildExerciseListGroups([zeus, alpha], new Map());

    expect(groups[0]?.entries.map((entry) => entry.exercise.name)).toEqual([
      'Alternating Curl',
      'Zottman Curl',
    ]);
  });

  test('never returns a hidden exercise, under any filter combination', () => {
    const hidden = makeExercise({ id: toExerciseId('e-hidden'), isHidden: true });

    expect(buildExerciseListGroups([hidden], new Map())).toEqual([]);
    expect(buildExerciseListGroups([hidden], new Map(), { search: 'bench' })).toEqual([]);
    expect(
      buildExerciseListGroups([hidden], new Map(), { muscleGroups: ['chest'] }),
    ).toEqual([]);
    expect(buildExerciseListGroups([hidden], new Map(), { sources: ['catalog'] })).toEqual([]);
    expect(buildExerciseListGroups([hidden], new Map(), { performedOnly: false })).toEqual([]);
  });

  test('omits groups that end up with no matching exercises', () => {
    const chest = makeExercise({ id: toExerciseId('e-chest'), muscleGroup: 'chest' });
    const hiddenBack = makeExercise({
      id: toExerciseId('e-back'),
      muscleGroup: 'back',
      isHidden: true,
    });

    const groups = buildExerciseListGroups([chest, hiddenBack], new Map());

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest']);
  });

  test('search matches the name case-insensitively', () => {
    const exercise = makeExercise({ name: 'Incline Dumbbell Press' });

    expect(
      buildExerciseListGroups([exercise], new Map(), { search: 'dumbbell' })[0]?.entries,
    ).toHaveLength(1);
    expect(
      buildExerciseListGroups([exercise], new Map(), { search: 'DUMBBELL' })[0]?.entries,
    ).toHaveLength(1);
    expect(buildExerciseListGroups([exercise], new Map(), { search: 'squat' })).toEqual([]);
  });

  test('an empty or omitted muscleGroups filter keeps every group', () => {
    const chest = makeExercise({ id: toExerciseId('e-chest'), muscleGroup: 'chest' });
    const back = makeExercise({ id: toExerciseId('e-back'), muscleGroup: 'back' });

    expect(
      buildExerciseListGroups([chest, back], new Map(), { muscleGroups: [] }).map(
        (group) => group.muscleGroup,
      ),
    ).toEqual(['chest', 'back']);
  });

  test('a non-empty muscleGroups filter keeps only the selected groups', () => {
    const chest = makeExercise({ id: toExerciseId('e-chest'), muscleGroup: 'chest' });
    const back = makeExercise({ id: toExerciseId('e-back'), muscleGroup: 'back' });

    const groups = buildExerciseListGroups([chest, back], new Map(), { muscleGroups: ['back'] });

    expect(groups.map((group) => group.muscleGroup)).toEqual(['back']);
  });

  test('an empty or omitted sources filter keeps both sources', () => {
    const catalog = makeExercise({ id: toExerciseId('e-catalog'), source: 'catalog' });
    const custom = makeExercise({ id: toExerciseId('e-custom'), source: 'custom' });

    const groups = buildExerciseListGroups([catalog, custom], new Map(), { sources: [] });

    expect(groups[0]?.entries).toHaveLength(2);
  });

  test('a non-empty sources filter keeps only the selected sources', () => {
    const catalog = makeExercise({ id: toExerciseId('e-catalog'), source: 'catalog' });
    const custom = makeExercise({ id: toExerciseId('e-custom'), source: 'custom' });

    const groups = buildExerciseListGroups([catalog, custom], new Map(), { sources: ['custom'] });

    expect(groups[0]?.entries.map((entry) => entry.exercise.id)).toEqual(['e-custom']);
  });

  test('performedOnly keeps only exercises with a last set log', () => {
    const performed = makeExercise({ id: toExerciseId('e-performed') });
    const neverPerformed = makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' });
    const lastSetLogByExerciseId = new Map([
      ['e-performed', makeSetLog({ exerciseId: 'e-performed' })],
      ['e-never', null],
    ]);

    const groups = buildExerciseListGroups([performed, neverPerformed], lastSetLogByExerciseId, {
      performedOnly: true,
    });

    expect(groups[0]?.entries.map((entry) => entry.exercise.id)).toEqual(['e-performed']);
  });

  test('performedOnly false or omitted keeps exercises regardless of history', () => {
    const performed = makeExercise({ id: toExerciseId('e-performed') });
    const neverPerformed = makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' });
    const lastSetLogByExerciseId = new Map([['e-performed', makeSetLog({ exerciseId: 'e-performed' })]]);

    const groups = buildExerciseListGroups([performed, neverPerformed], lastSetLogByExerciseId);

    expect(groups[0]?.entries).toHaveLength(2);
  });

  test('each entry carries its exercise\'s last set log for the row caption', () => {
    const exercise = makeExercise();
    const lastSetLog = makeSetLog();
    const lastSetLogByExerciseId = new Map([['exercise-bench-press', lastSetLog]]);

    const groups = buildExerciseListGroups([exercise], lastSetLogByExerciseId);

    expect(groups[0]?.entries[0]?.lastSetLog).toEqual(lastSetLog);
  });
});
