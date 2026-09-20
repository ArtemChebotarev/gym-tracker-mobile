import type { Exercise } from '../domain/catalog';
import type { Unsaved } from '../domain/timestamps';

// Task 067(2) · turning the shipped exercise catalog into a migration.
//
// The catalog is reference data, not user data: it arrives with the app and every install holds
// the same rows under the same baked-in ids (02 · Domain Model, "Идентификаторы каталога прошиты
// в приложение"). Shipping it as a migration means one mechanism instead of two — the journal
// that decides whether a schema change has been applied decides the same for catalog content,
// and there is no second version number to keep in step by hand.
//
// Drizzle cannot generate this itself: its snapshot models tables, columns and indexes, and has
// no notion of rows, so `drizzle-kit generate` has nothing to diff. (Entity Framework's
// `HasData` does exactly this; Drizzle has no equivalent.) `drizzle-kit generate --custom` is
// its supported hook for hand-written data migrations, and this is what fills one in.
//
// The statement is one upsert carrying the whole catalog rather than a computed difference from
// the previous release. Nothing has to remember what the last one contained, the result is the
// same whether it runs once or three times, and a generator this simple has nowhere to hide a
// bug. The cost is a few kilobytes of repeated SQL per release that touches the catalog.

const COLUMNS = [
  'id',
  'name',
  'muscle_group',
  'source',
  'equipment',
  'is_hidden',
  'created_at',
  'updated_at',
] as const;

/**
 * What a re-seed is allowed to overwrite on a row that already exists.
 *
 * `is_hidden` is the user's — hiding an exercise must survive every future release, and that is
 * the whole reason this is an upsert rather than a delete-and-insert. `created_at` is when the
 * row first arrived and does not move. `id` and `source` identify the row. Everything else is
 * the catalog's to correct: a renamed exercise, a fixed muscle group, equipment that was wrong.
 */
const OVERWRITTEN = ['name', 'muscle_group', 'equipment', 'updated_at'] as const;

function quote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function valuesOf(exercise: Unsaved<Exercise>, stampedAt: string): string {
  return [
    quote(exercise.id),
    quote(exercise.name),
    quote(exercise.muscleGroup),
    quote(exercise.source),
    exercise.equipment === undefined ? 'NULL' : quote(exercise.equipment),
    exercise.isHidden ? '1' : '0',
    quote(stampedAt),
    quote(stampedAt),
  ].join(', ');
}

/**
 * The migration body that brings a database's catalog up to `exercises`.
 *
 * `stampedAt` is written into `created_at` / `updated_at`: the moment the migration was
 * generated, baked in as a literal. Not `CURRENT_TIMESTAMP` — stamps are one format from one
 * clock everywhere in this project (domain/timestamps.ts), and a database function would produce
 * neither.
 */
export function catalogUpsertSql(
  exercises: readonly Unsaved<Exercise>[],
  stampedAt: string,
): string {
  const columns = COLUMNS.map((column) => `\`${column}\``).join(', ');
  const rows = exercises.map((exercise) => `\t(${valuesOf(exercise, stampedAt)})`).join(',\n');
  const updates = OVERWRITTEN.map((column) => `\t\`${column}\` = excluded.\`${column}\``).join(
    ',\n',
  );

  return [
    '-- Generated from domain/exerciseCatalog.ts by `npm run catalog:migration`.',
    '-- Do not edit by hand: change the catalog and generate a new migration instead — this one',
    '-- may already have been applied on someone’s phone.',
    `INSERT INTO \`exercise\` (${columns}) VALUES`,
    rows,
    'ON CONFLICT(`id`) DO UPDATE SET',
    `${updates};`,
    '',
  ].join('\n');
}
