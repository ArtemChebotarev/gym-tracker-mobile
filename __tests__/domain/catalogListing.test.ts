import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import { buildExerciseListGroups } from '@domain/catalogListing';
import type { RoundLog, SetLog } from '@domain/execution';
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
  test('file the exercises of no one group last, one section per type, rather than dropping them', () => {
    const chest = makeExercise({ id: toExerciseId('e-chest'), name: 'Bench Press' });
    const slam = makeExercise({
      id: toExerciseId('e-slam'),
      name: 'Medball Slam',
      muscleGroup: 'fullBody',
      type: 'power',
    });

    const groups = buildExerciseListGroups([slam, chest], new Map());

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest', 'fullBody']);
    expect(groups.map((group) => group.type)).toEqual([undefined, 'power']);
  });

  test('order the type sections Power, Intervals, Mobility, whatever order they come in', () => {
    const exercise = (id: string, type: 'power' | 'interval' | 'mobility') =>
      makeExercise({ id: toExerciseId(id), name: id, muscleGroup: 'fullBody', type });

    const groups = buildExerciseListGroups(
      [exercise('cooldown', 'mobility'), exercise('bag', 'interval'), exercise('slam', 'power')],
      new Map(),
    );

    expect(groups.map((group) => group.type)).toEqual(['power', 'interval', 'mobility']);
  });

  test('keep a hybrid exercise that has a muscle group in that muscle section', () => {
    const jump = makeExercise({
      id: toExerciseId('e-jump'),
      name: 'Box Jump',
      muscleGroup: 'quads',
      type: 'power',
    });

    const groups = buildExerciseListGroups([jump], new Map());

    expect(groups).toEqual([
      { muscleGroup: 'quads', entries: [{ exercise: jump, lastSetLog: null, lastRoundLog: null }] },
    ]);
  });

  test('keep only the types asked for, and every type when none is', () => {
    const bench = makeExercise({ id: toExerciseId('e-bench'), name: 'Bench Press' });
    const slam = makeExercise({
      id: toExerciseId('e-slam'),
      name: 'Medball Slam',
      muscleGroup: 'fullBody',
      type: 'power',
    });
    const bag = makeExercise({
      id: toExerciseId('e-bag'),
      name: 'Heavy Bag',
      muscleGroup: 'fullBody',
      type: 'interval',
    });
    const all = [bench, slam, bag];

    const names = (types?: Parameters<typeof buildExerciseListGroups>[2]) =>
      buildExerciseListGroups(all, new Map(), types)
        .flatMap((group) => group.entries)
        .map((entry) => entry.exercise.name);

    expect(names({ types: ['power'] })).toEqual(['Medball Slam']);
    expect(names({ types: ['strength', 'interval'] })).toEqual(['Bench Press', 'Heavy Bag']);
    expect(names({ types: [] })).toEqual(['Bench Press', 'Medball Slam', 'Heavy Bag']);
  });

  test('groups exercises by muscle group, ordered by the fixed catalog order', () => {
    const quads = makeExercise({
      id: toExerciseId('e-quads'),
      name: 'Squat',
      muscleGroup: 'quads',
    });
    const chest = makeExercise({
      id: toExerciseId('e-chest'),
      name: 'Bench Press',
      muscleGroup: 'chest',
    });
    const back = makeExercise({ id: toExerciseId('e-back'), name: 'Row', muscleGroup: 'back' });

    const groups = buildExerciseListGroups([quads, chest, back], new Map());

    expect(groups.map((group) => group.muscleGroup)).toEqual(['chest', 'back', 'quads']);
  });

  test('sorts exercises within a group alphabetically by name', () => {
    const zeus = makeExercise({
      id: toExerciseId('e-1'),
      name: 'Zottman Curl',
      muscleGroup: 'biceps',
    });
    const alpha = makeExercise({
      id: toExerciseId('e-2'),
      name: 'Alternating Curl',
      muscleGroup: 'biceps',
    });

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
    expect(buildExerciseListGroups([hidden], new Map(), { muscleGroups: ['chest'] })).toEqual([]);
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

  test('performedOnly counts a logged round as performed', () => {
    const bag = makeExercise({ id: toExerciseId('e-bag'), name: 'Heavy Bag' });
    const neverPerformed = makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' });
    const round: RoundLog = {
      ...STAMPS,
      id: 'round-1',
      sessionExerciseId: 'se-1',
      exerciseId: 'e-bag',
      roundNumber: 1,
      workSec: 120,
      restSec: 60,
      restSkipped: false,
      completed: true,
      completedAt: '2026-09-10T12:00:00.000Z',
    };

    const groups = buildExerciseListGroups(
      [bag, neverPerformed],
      new Map(),
      { performedOnly: true },
      new Map([['e-bag', round]]),
    );

    expect(groups[0]?.entries).toEqual([{ exercise: bag, lastSetLog: null, lastRoundLog: round }]);
  });

  test('performedOnly false or omitted keeps exercises regardless of history', () => {
    const performed = makeExercise({ id: toExerciseId('e-performed') });
    const neverPerformed = makeExercise({ id: toExerciseId('e-never'), name: 'Never Done' });
    const lastSetLogByExerciseId = new Map([
      ['e-performed', makeSetLog({ exerciseId: 'e-performed' })],
    ]);

    const groups = buildExerciseListGroups([performed, neverPerformed], lastSetLogByExerciseId);

    expect(groups[0]?.entries).toHaveLength(2);
  });

  test("each entry carries its exercise's last set log for the row caption", () => {
    const exercise = makeExercise();
    const lastSetLog = makeSetLog();
    const lastSetLogByExerciseId = new Map([['exercise-bench-press', lastSetLog]]);

    const groups = buildExerciseListGroups([exercise], lastSetLogByExerciseId);

    expect(groups[0]?.entries[0]?.lastSetLog).toEqual(lastSetLog);
  });
});
