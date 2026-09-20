import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { Exercise } from '@domain/catalog';
import type { Session, SessionExercise, SetTarget } from '@domain/execution';
import type { Mesocycle, MesocycleOrigin, ProgressionSettings } from '@domain/mesocycle';
import type { MesoTemplate, WeekPlan } from '@domain/plan';
import type { Settings } from '@repositories/settings';

// The relational shape of 02 · Domain Model, one table per stored entity. What the domain calls a
// value object — `WeekPlan`, `origin`, `progressionSettings`, `setTargets` — stays inside its
// owner as JSON: 02 says WeekPlan is deliberately not a table, and the others are snapshots read
// and written whole, never queried into.
//
// Conventions:
// - ids are the domain's (rule 3 of 07 · Persistence Layer Contract), so every primary key is a
//   text column and nothing auto-increments;
// - timestamps are UTC ISO strings, written by the adapter (domain/timestamps.ts);
// - booleans are integers, SQLite having no boolean of its own;
// - a column is nullable exactly where the domain field is optional;
// - an enum column takes its type from the domain's own union rather than re-listing the values,
//   so adding a status in `domain/` fails here until the schema agrees.
//
// Indexes cover the two queries 07 calls performance-critical — a set log by exercise, and the
// last completed session of a mesocycle's day — plus the foreign keys every join walks. Task 068
// measures them; they are declared here because a schema is cheaper to get right at birth.

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const exercises = sqliteTable(
  'exercise',
  {
    id: text('id').primaryKey().$type<Exercise['id']>(),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group').notNull().$type<Exercise['muscleGroup']>(),
    source: text('source').notNull().$type<Exercise['source']>(),
    equipment: text('equipment').$type<NonNullable<Exercise['equipment']>>(),
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull(),
    ...timestamps,
  },
  (table) => [index('exercise_muscle_group').on(table.muscleGroup)],
);

export const templates = sqliteTable('meso_template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  source: text('source').notNull().$type<MesoTemplate['source']>(),
  defaultLengthWeeks: integer('default_length_weeks').notNull(),
  weekPlan: text('week_plan', { mode: 'json' }).notNull().$type<WeekPlan>(),
  isHidden: integer('is_hidden', { mode: 'boolean' }).notNull(),
  ...timestamps,
});

export const mesocycles = sqliteTable(
  'mesocycle',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    lengthWeeks: integer('length_weeks').notNull(),
    daysPerWeek: integer('days_per_week').notNull(),
    startDate: text('start_date'),
    status: text('status').notNull().$type<Mesocycle['status']>(),
    origin: text('origin', { mode: 'json' }).notNull().$type<MesocycleOrigin>(),
    progressionSettings: text('progression_settings', { mode: 'json' })
      .notNull()
      .$type<ProgressionSettings>(),
    bodyWeight: real('body_weight'),
    // Draft week 1, present only while the mesocycle is `planned` (02 · Domain Model).
    weekPlan: text('week_plan', { mode: 'json' }).$type<WeekPlan>(),
    completedAt: text('completed_at'),
    ...timestamps,
  },
  (table) => [index('mesocycle_status').on(table.status)],
);

export const sessions = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    mesoId: text('meso_id')
      .notNull()
      .references(() => mesocycles.id),
    weekNumber: integer('week_number').notNull(),
    dayNumber: integer('day_number').notNull(),
    name: text('name'),
    isDeload: integer('is_deload', { mode: 'boolean' }).notNull(),
    prescriptionStatus: text('prescription_status')
      .notNull()
      .$type<Session['prescriptionStatus']>(),
    status: text('status').notNull().$type<Session['status']>(),
    sourceSessionId: text('source_session_id'),
    plannedDate: text('planned_date'),
    startedAt: text('started_at'),
    completedAt: text('completed_at'),
    ...timestamps,
  },
  (table) => [
    // The source-session lookup of every generation: last completed session of a day.
    index('session_meso_day_status').on(table.mesoId, table.dayNumber, table.status),
    index('session_status').on(table.status),
    // "Пара (mesoId, weekNumber, dayNumber) уникальна" — 02 · Domain Model, Session invariants.
    // Enforced here rather than left to the callers: the two places that write sessions are Start
    // and next-week generation, and the second one guards the slot with a read-then-write check
    // that only this index makes airtight. The in-memory adapter enforces the same rule through
    // `validateUniqueSessionSlots`, so the two implementations agree and the shared contract
    // states it once for both.
    uniqueIndex('session_meso_week_day').on(table.mesoId, table.weekNumber, table.dayNumber),
  ],
);

export const sessionExercises = sqliteTable(
  'session_exercise',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    order: integer('order').notNull(),
    setTargets: text('set_targets', { mode: 'json' }).notNull().$type<SetTarget[]>(),
    targetRir: integer('target_rir').notNull(),
    status: text('status').notNull().$type<SessionExercise['status']>(),
    ...timestamps,
  },
  (table) => [index('session_exercise_session').on(table.sessionId, table.order)],
);

export const setLogs = sqliteTable(
  'set_log',
  {
    id: text('id').primaryKey(),
    sessionExerciseId: text('session_exercise_id')
      .notNull()
      .references(() => sessionExercises.id),
    // Denormalized on purpose (02 · Domain Model): the whole history of an exercise is one scan,
    // and a swap mid-session leaves logged sets pointing at what was actually done.
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    bodyWeight: real('body_weight'),
    reps: integer('reps').notNull(),
    rir: integer('rir'),
    completedAt: text('completed_at').notNull(),
    ...timestamps,
  },
  (table) => [
    // 07 · "Критичные по производительности запросы": set logs of one exercise, newest first.
    index('set_log_exercise_completed').on(table.exerciseId, table.completedAt),
    index('set_log_session_exercise').on(table.sessionExerciseId, table.setNumber),
  ],
);

/**
 * Settings is one document, not a table of records (07 · Persistence Layer Contract), so this
 * table holds a single row, always at {@link SETTINGS_ROW_ID}, and carries no timestamps — the
 * repository is the only writer and never inserts a second one.
 */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(1),
  defaultProgressionSettings: text('default_progression_settings', { mode: 'json' })
    .notNull()
    .$type<ProgressionSettings>(),
  weightUnit: text('weight_unit').notNull().$type<Settings['weightUnit']>(),
  schemaVersion: integer('schema_version').notNull(),
  catalogVersion: integer('catalog_version').notNull(),
});

/** The single settings row's id — see `settings`. */
export const SETTINGS_ROW_ID = 1;
