// The rows a workout fixture points at, written so that its own rows can be written at all.
//
// Foreign keys are on (`PRAGMA foreign_keys = ON`, task 111): a session needs its mesocycle, a
// session exercise needs its session's exercise, a set log needs the exercise it was logged
// against. The in-memory engine these tests were written over checked none of that, so their
// fixtures name mesocycles and exercises nobody ever created — which read as harmless until the
// same fixture met the database the app actually runs on (task 118).
//
// What a test is about, it creates itself; this only fills in what its fixtures refer to, and
// only where nothing is there already. A mesocycle or an exercise the test created before
// calling this is left exactly as the test made it.
//
// Not a test file itself — see `testPathIgnorePatterns` in jest.config.js.

import { type Exercise, toExerciseId } from '@domain/catalog';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { SqliteDatabase } from '@storage/sqlite/db';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';

/** The fixtures whose references are to be filled in — whichever of them a test has. */
export type Referring = {
  sessions?: readonly Session[];
  sessionExercises?: readonly SessionExercise[];
  setLogs?: readonly SetLog[];
  /**
   * Exercise ids nothing above refers to yet, because the use case under test is what writes the
   * row that will — the ones a test picks in `addExercises`, swaps to, or starts a block with.
   */
  exerciseIds?: readonly string[];
};

function distinct<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * The block a fixture's sessions belong to, for the tests that only need it to exist. `active`
 * because that is the state a block with sessions in it is in; a test about any other state
 * creates the mesocycle itself and this leaves it alone.
 */
async function seedMesocycles(db: SqliteDatabase, sessions: readonly Session[]): Promise<void> {
  const repo = new SqliteMesocycleRepository(db);
  for (const id of distinct(sessions.map((session) => session.mesoId))) {
    if (await repo.getById(id)) {
      continue;
    }
    await repo.create({
      id,
      name: id,
      lengthWeeks: 5,
      daysPerWeek: 1,
      startDate: '2026-01-01T00:00:00.000Z',
      status: 'active',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
    });
  }
}

/**
 * The exercises a fixture's session exercises and set logs were written against. They go in as
 * catalog entries through `seedCatalog` — the one operation the contract has for filling a store
 * with catalog exercises, and the one that leaves an id the test already created untouched.
 */
async function seedExercises(db: SqliteDatabase, ids: readonly string[]): Promise<void> {
  const repo = new SqliteExerciseRepository(db);
  await repo.seedCatalog(
    distinct(ids).map((id): Incoming<Exercise> => ({
      id: toExerciseId(id),
      name: id,
      muscleGroup: 'chest',
      source: 'catalog',
      isHidden: false,
    })),
  );
}

/** Writes whatever `fixtures` refer to and is not there yet, so that `fixtures` can be written. */
export async function seedReferences(db: SqliteDatabase, fixtures: Referring): Promise<void> {
  await seedMesocycles(db, fixtures.sessions ?? []);
  await seedExercises(db, [
    ...(fixtures.sessionExercises ?? []).map((exercise) => exercise.exerciseId),
    ...(fixtures.setLogs ?? []).map((log) => log.exerciseId),
    ...(fixtures.exerciseIds ?? []),
  ]);
}
