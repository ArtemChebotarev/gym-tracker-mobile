import type { ExerciseRepository, MuscleGroupRepository } from '@repositories/catalog';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { MesocycleStartStore } from '@repositories/mesocycleStart';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { SessionTreeRepository } from '@repositories/sessionTree';
import type { SetLogRepository } from '@repositories/setLogRepository';
import type { SettingsRepository } from '@repositories/settings';
import type { TemplateRepository } from '@repositories/template';
import type { WorkoutStore } from '@repositories/workout';

// Task 109 · the seam between the repository contract suite and the implementation under test.
//
// Every repository of 07 · Persistence Layer Contract in one bundle, all of them over the same
// underlying storage: mesocycles, sessions, session exercises and set logs reference each other
// by id, and a cascade or a join only sees the other's rows if they share it.

export type RepositorySet = {
  muscleGroupRepo: MuscleGroupRepository;
  exerciseRepo: ExerciseRepository;
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
  setLogRepo: SetLogRepository;
  settingsRepo: SettingsRepository;
  templateRepo: TemplateRepository;
  exerciseHistoryRepo: ExerciseHistoryRepository;
  sessionTreeRepo: SessionTreeRepository;
  workoutStore: WorkoutStore;
  mesocycleStartStore: MesocycleStartStore;
};

/**
 * How a runner plugs its implementation into the contract: one call that produces empty
 * storage, and an optional counterpart that releases whatever it opened.
 *
 * `create` is called before *every* test rather than once per suite, because a contract test
 * states what an implementation does from a known starting point — sharing storage between
 * tests would let one test's rows decide another's outcome. An implementation with real
 * resources (an open database file, a connection) releases them in `destroy`.
 */
export type RepositoryHarness = {
  create(): Promise<RepositorySet>;
  destroy?(repositories: RepositorySet): Promise<void>;
};

/**
 * Binds `harness` to Jest's per-test lifecycle and returns a getter for the current set.
 * Call it inside the `describe` of a contract suite, then read the repositories through the
 * getter from within each test — never at describe-evaluation time, when no set exists yet.
 */
export function useRepositories(harness: RepositoryHarness): () => RepositorySet {
  let current: RepositorySet | null = null;

  beforeEach(async () => {
    current = await harness.create();
  });

  afterEach(async () => {
    if (current && harness.destroy) {
      await harness.destroy(current);
    }
    current = null;
  });

  return () => {
    if (!current) {
      throw new Error('Repositories are only available inside a test — call the getter in one.');
    }
    return current;
  };
}
