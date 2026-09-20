import type { Exercise, ExerciseId, MuscleGroup } from '@domain/catalog';
import type { Incoming } from '@domain/timestamps';
import type { ExerciseRepository } from '@repositories/catalog';
import { eq, inArray } from 'drizzle-orm';

import { ConflictError, NotFoundError } from '../errors';
import { stampCreated, stampUpdated } from '../timestamps';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { exerciseToRow, rowToExercise } from './mappers';
import { exercises } from './schema';

export class SqliteExerciseRepository implements ExerciseRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async getAll(): Promise<Exercise[]> {
    const rows = await runQuery(() => this.db.select().from(exercises).all());
    return rows.map(rowToExercise);
  }

  async getById(id: ExerciseId): Promise<Exercise | null> {
    const row = await runQuery(() =>
      this.db.select().from(exercises).where(eq(exercises.id, id)).get(),
    );
    return row ? rowToExercise(row) : null;
  }

  async listByIds(ids: readonly ExerciseId[]): Promise<Exercise[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await runQuery(() =>
      this.db
        .select()
        .from(exercises)
        .where(inArray(exercises.id, [...ids]))
        .all(),
    );
    return rows.map(rowToExercise);
  }

  async filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    const rows = await runQuery(() =>
      this.db.select().from(exercises).where(eq(exercises.muscleGroup, muscleGroup)).all(),
    );
    return rows.map(rowToExercise);
  }

  async createCustom(exercise: Incoming<Exercise>): Promise<Exercise> {
    const stored = stampCreated(exercise);
    // A duplicate id surfaces as SQLite's own UNIQUE violation rather than a read-then-write
    // check: the constraint is the store's to enforce, and asking first would only widen the
    // window between the question and the answer.
    await runQuery(() => this.db.insert(exercises).values(exerciseToRow(stored)).run());
    return stored;
  }

  async updateCustom(exercise: Exercise): Promise<Exercise> {
    const current = await this.getById(exercise.id);
    if (!current) {
      throw new NotFoundError(`Exercise with id "${exercise.id}" was not found.`);
    }
    if (current.source !== 'custom') {
      throw new ConflictError(
        `Exercise "${exercise.id}" is a catalog exercise and cannot be edited through the repository.`,
      );
    }
    return this.replace(stampUpdated(current, exercise));
  }

  async toggleHidden(id: ExerciseId): Promise<Exercise> {
    const current = await this.getById(id);
    if (!current) {
      throw new NotFoundError(`Exercise with id "${id}" was not found.`);
    }
    return this.replace(stampUpdated(current, { ...current, isHidden: !current.isHidden }));
  }

  // catalogVersion is not persisted here — it is tracked in Settings (02 · Domain Model,
  // "catalogVersion хранится в настройках"). Ids the store already holds are left exactly as they
  // are, catalog or custom: a re-seed must not undo an exercise the user hid, so the insert is
  // the one that yields rather than the row that is already there.
  async seedCatalog(
    _catalogVersion: number,
    catalog: readonly Incoming<Exercise>[],
  ): Promise<void> {
    for (const exercise of catalog) {
      await runQuery(() =>
        this.db
          .insert(exercises)
          .values(exerciseToRow(stampCreated(exercise)))
          .onConflictDoNothing()
          .run(),
      );
    }
  }

  private async replace(exercise: Exercise): Promise<Exercise> {
    await runQuery(() =>
      this.db
        .update(exercises)
        .set(exerciseToRow(exercise))
        .where(eq(exercises.id, exercise.id))
        .run(),
    );
    return exercise;
  }
}
