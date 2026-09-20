import { toExerciseId, type Exercise } from '@domain/catalog';
import type { Session, SessionExercise, SetLog } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesoTemplate } from '@domain/plan';

import type {
  exercises,
  mesocycles,
  sessionExercises,
  sessions,
  setLogs,
  templates,
} from './schema';

// Entity ↔ row. The domain marks an absent value with `undefined` and leaves the key out; SQLite
// has `NULL` and always has the column. These functions are the one place that difference lives,
// so no repository ever hands a `null` to the domain or a stray key to a `toEqual`.
//
// The way out matters as much as the way in: Drizzle skips an `undefined` field in `.set()`, so
// an update built straight from an entity would silently *keep* the value the domain just
// dropped. Writing every column explicitly — `null` included — makes an update replace the whole
// record, which is what the repository contract says it does.

type Row<T extends { $inferSelect: unknown }> = T['$inferSelect'];
type Insert<T extends { $inferInsert: unknown }> = T['$inferInsert'];

/** Adds `key` only when the column holds a value, so an absent field stays absent. */
function optional<K extends string, V>(key: K, value: V | null): { [P in K]?: V } {
  return (value === null ? {} : { [key]: value }) as { [P in K]?: V };
}

/** An absent domain field is a `NULL` column — never a skipped one. See the note above. */
function nullable<V>(value: V | undefined): V | null {
  return value ?? null;
}

export function rowToExercise(row: Row<typeof exercises>): Exercise {
  return {
    id: toExerciseId(row.id),
    name: row.name,
    muscleGroup: row.muscleGroup,
    source: row.source,
    ...optional('equipment', row.equipment),
    isHidden: row.isHidden,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToTemplate(row: Row<typeof templates>): MesoTemplate {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    defaultLengthWeeks: row.defaultLengthWeeks,
    weekPlan: row.weekPlan,
    isHidden: row.isHidden,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToMesocycle(row: Row<typeof mesocycles>): Mesocycle {
  return {
    id: row.id,
    name: row.name,
    lengthWeeks: row.lengthWeeks,
    daysPerWeek: row.daysPerWeek,
    ...optional('startDate', row.startDate),
    status: row.status,
    origin: row.origin,
    progressionSettings: row.progressionSettings,
    ...optional('bodyWeight', row.bodyWeight),
    ...optional('weekPlan', row.weekPlan),
    ...optional('completedAt', row.completedAt),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToSession(row: Row<typeof sessions>): Session {
  return {
    id: row.id,
    mesoId: row.mesoId,
    weekNumber: row.weekNumber,
    dayNumber: row.dayNumber,
    ...optional('name', row.name),
    isDeload: row.isDeload,
    prescriptionStatus: row.prescriptionStatus,
    status: row.status,
    ...optional('sourceSessionId', row.sourceSessionId),
    ...optional('plannedDate', row.plannedDate),
    ...optional('startedAt', row.startedAt),
    ...optional('completedAt', row.completedAt),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToSessionExercise(row: Row<typeof sessionExercises>): SessionExercise {
  return {
    id: row.id,
    sessionId: row.sessionId,
    exerciseId: row.exerciseId,
    order: row.order,
    setTargets: row.setTargets,
    targetRir: row.targetRir,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function rowToSetLog(row: Row<typeof setLogs>): SetLog {
  return {
    id: row.id,
    sessionExerciseId: row.sessionExerciseId,
    exerciseId: row.exerciseId,
    setNumber: row.setNumber,
    weight: row.weight,
    ...optional('bodyWeight', row.bodyWeight),
    reps: row.reps,
    ...optional('rir', row.rir),
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function exerciseToRow(exercise: Exercise): Insert<typeof exercises> {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    source: exercise.source,
    equipment: nullable(exercise.equipment),
    isHidden: exercise.isHidden,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

export function templateToRow(template: MesoTemplate): Insert<typeof templates> {
  return {
    id: template.id,
    name: template.name,
    source: template.source,
    defaultLengthWeeks: template.defaultLengthWeeks,
    weekPlan: template.weekPlan,
    isHidden: template.isHidden,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export function mesocycleToRow(mesocycle: Mesocycle): Insert<typeof mesocycles> {
  return {
    id: mesocycle.id,
    name: mesocycle.name,
    lengthWeeks: mesocycle.lengthWeeks,
    daysPerWeek: mesocycle.daysPerWeek,
    startDate: nullable(mesocycle.startDate),
    status: mesocycle.status,
    origin: mesocycle.origin,
    progressionSettings: mesocycle.progressionSettings,
    bodyWeight: nullable(mesocycle.bodyWeight),
    weekPlan: nullable(mesocycle.weekPlan),
    completedAt: nullable(mesocycle.completedAt),
    createdAt: mesocycle.createdAt,
    updatedAt: mesocycle.updatedAt,
  };
}

export function sessionToRow(session: Session): Insert<typeof sessions> {
  return {
    id: session.id,
    mesoId: session.mesoId,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    name: nullable(session.name),
    isDeload: session.isDeload,
    prescriptionStatus: session.prescriptionStatus,
    status: session.status,
    sourceSessionId: nullable(session.sourceSessionId),
    plannedDate: nullable(session.plannedDate),
    startedAt: nullable(session.startedAt),
    completedAt: nullable(session.completedAt),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

export function sessionExerciseToRow(
  sessionExercise: SessionExercise,
): Insert<typeof sessionExercises> {
  return {
    id: sessionExercise.id,
    sessionId: sessionExercise.sessionId,
    exerciseId: sessionExercise.exerciseId,
    order: sessionExercise.order,
    setTargets: sessionExercise.setTargets,
    targetRir: sessionExercise.targetRir,
    status: sessionExercise.status,
    createdAt: sessionExercise.createdAt,
    updatedAt: sessionExercise.updatedAt,
  };
}

export function setLogToRow(setLog: SetLog): Insert<typeof setLogs> {
  return {
    id: setLog.id,
    sessionExerciseId: setLog.sessionExerciseId,
    exerciseId: setLog.exerciseId,
    setNumber: setLog.setNumber,
    weight: setLog.weight,
    bodyWeight: nullable(setLog.bodyWeight),
    reps: setLog.reps,
    rir: nullable(setLog.rir),
    completedAt: setLog.completedAt,
    createdAt: setLog.createdAt,
    updatedAt: setLog.updatedAt,
  };
}
