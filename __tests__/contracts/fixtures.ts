import { type Exercise, toExerciseId } from '@domain/catalog';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { MesoTemplate } from '@domain/plan';

import type { Unsaved } from '@domain/timestamps';

import type { RepositorySet } from './harness';

// Entity builders shared by every suite of the repository contract (task 109). They produce
// plain domain entities with ids already generated — hard rule 3 of 07 · Persistence Layer
// Contract: "Идентификаторы генерирует домен, не хранилище" — so a contract suite can hand the
// same record to any implementation without knowing how it stores it.

export function makeMesocycle(overrides: Partial<Unsaved<Mesocycle>> = {}): Unsaved<Mesocycle> {
  return {
    id: 'meso-a',
    name: 'Push Pull Legs',
    lengthWeeks: 6,
    daysPerWeek: 3,
    startDate: '2026-01-05',
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    ...overrides,
  };
}

export function makeSession(overrides: Partial<Unsaved<Session>> = {}): Unsaved<Session> {
  return {
    id: 'session-1',
    mesoId: 'meso-a',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

export function makeSessionExercise(overrides: Partial<Unsaved<SessionExercise>> = {}): Unsaved<SessionExercise> {
  return {
    id: 'session-exercise-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-bench-press',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 8 }],
    targetRir: 2,
    status: 'planned',
    ...overrides,
  };
}

export function makeSetLog(overrides: Partial<Unsaved<SetLog>> = {}): Unsaved<SetLog> {
  return {
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

/**
 * A `source: 'catalog'` exercise — shipped with the app and written through `seedCatalog` rather
 * than `createCustom` (02 · Domain Model, "Exercise").
 */
export function makeCatalogExercise(id: string, overrides: Partial<Unsaved<Exercise>> = {}): Unsaved<Exercise> {
  return {
    id: toExerciseId(id),
    name: id,
    muscleGroup: 'chest',
    source: 'catalog',
    equipment: 'barbell',
    isHidden: false,
    ...overrides,
  };
}

/** A `source: 'custom'` exercise — the user's own, freely editable. */
export function makeCustomExercise(id: string, overrides: Partial<Unsaved<Exercise>> = {}): Unsaved<Exercise> {
  return makeCatalogExercise(id, { source: 'custom', equipment: 'cable', ...overrides });
}

export function makeTemplate(overrides: Partial<Unsaved<MesoTemplate>> = {}): Unsaved<MesoTemplate> {
  return {
    id: 'template-ppl',
    name: 'Push Pull Legs',
    source: 'custom',
    defaultLengthWeeks: 6,
    weekPlan: { days: [] },
    isHidden: false,
    ...overrides,
  };
}

/**
 * Creates the parent rows the entities below hang off: the mesocycles sessions belong to, and
 * the catalog exercises session exercises and set logs refer to.
 *
 * Contract tests seed them even where the behaviour under test never reads them, so that no
 * test ever writes a row pointing at a parent that does not exist. An implementation that
 * enforces referential integrity — foreign keys on a relational adapter — has to be able to run
 * this suite unchanged, and a dangling reference would make it fail on the setup rather than on
 * what it set out to check.
 */
export async function seedParents(
  repositories: RepositorySet,
  options: { mesoIds?: string[]; exerciseIds?: string[] } = {},
): Promise<void> {
  for (const id of options.mesoIds ?? []) {
    await repositories.mesocycleRepo.create(makeMesocycle({ id }));
  }
  const exercises = (options.exerciseIds ?? []).map((id) => makeCatalogExercise(id));
  if (exercises.length > 0) {
    await repositories.exerciseRepo.seedCatalog(exercises);
  }
}
