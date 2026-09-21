import type { BackupStore } from '@repositories/backup';
import type { ExerciseRepository, MuscleGroupRepository } from '@repositories/catalog';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import type { MesocycleClosingStore } from '@repositories/mesocycleClosing';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { MesocycleStartStore } from '@repositories/mesocycleStart';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
import type { SessionTreeRepository } from '@repositories/sessionTree';
import type { SetLogRepository } from '@repositories/setLogRepository';
import type { SettingsRepository } from '@repositories/settings';
import type { TemplateRepository } from '@repositories/template';
import type { WorkoutStore } from '@repositories/workout';

/**
 * Every repository of 07 · Persistence Layer Contract in one bundle, all of them over the same
 * underlying storage: mesocycles, sessions, session exercises and set logs reference each other
 * by id, and a cascade or a join only sees the other's rows if they share it.
 *
 * This is what an engine produces and what the app consumes: `createSqliteRepositories`
 * (storage/sqlite/repositories.ts) builds the one the app runs on, and the app holds it through
 * context (state/repositories.tsx, task 115) — which is why another engine would be an edit in
 * one place rather than a change to anything that reads data. The repository contract (task 109)
 * is stated against this same type, so whatever passes it can be the one the app holds.
 */
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
  mesocycleClosingStore: MesocycleClosingStore;
  backupStore: BackupStore;
};
