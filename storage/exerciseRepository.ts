import type { Exercise, ExerciseId, MuscleGroup } from '@domain/catalog';
import type { Incoming } from '@domain/timestamps';
import type { ExerciseRepository } from '@repositories/catalog';

import { EXERCISE_COLLECTION } from './collectionNames';
import { ConflictError } from './errors';
import { stampCreated, stampUpdated } from './timestamps';
import type { InMemoryStore } from './store';

export class InMemoryExerciseRepository implements ExerciseRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get exercises() {
    return this.store.collection<Exercise>(EXERCISE_COLLECTION);
  }

  async getAll(): Promise<Exercise[]> {
    return this.exercises.list();
  }

  async getById(id: ExerciseId): Promise<Exercise | null> {
    return (await this.exercises.findById(id)) ?? null;
  }

  async listByIds(ids: readonly ExerciseId[]): Promise<Exercise[]> {
    return this.exercises.listByIds([...ids]);
  }

  async filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    return this.exercises.find((exercise) => exercise.muscleGroup === muscleGroup);
  }

  async createCustom(exercise: Incoming<Exercise>): Promise<Exercise> {
    return this.exercises.insert(stampCreated(exercise));
  }

  async updateCustom(exercise: Exercise): Promise<Exercise> {
    return this.exercises.update(exercise.id, (current) => {
      if (current.source !== 'custom') {
        throw new ConflictError(
          `Exercise "${exercise.id}" is a catalog exercise and cannot be edited through the repository.`,
        );
      }
      return stampUpdated(current, exercise);
    });
  }

  async toggleHidden(id: ExerciseId): Promise<Exercise> {
    return this.exercises.update(id, (current) =>
      stampUpdated(current, { ...current, isHidden: !current.isHidden }),
    );
  }

  // catalogVersion is not persisted here — it is tracked in Settings (02 · Domain Model,
  // "catalogVersion хранится в настройках"). This method only inserts catalog exercises
  // whose (pre-baked) id isn't already present, leaving every existing record — catalog or
  // custom — untouched.
  async seedCatalog(
    _catalogVersion: number,
    exercises: readonly Incoming<Exercise>[],
  ): Promise<void> {
    for (const exercise of exercises) {
      const existing = await this.exercises.findById(exercise.id);
      if (!existing) {
        await this.exercises.insert(stampCreated(exercise));
      }
    }
  }
}
