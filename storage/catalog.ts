import { MUSCLE_GROUPS } from '@domain/catalog';
import type { Exercise, MuscleGroup } from '@domain/catalog';
import type { ExerciseRepository, MuscleGroupRepository } from '@repositories/catalog';

import { runAsync } from './async';
import { ConflictError } from './errors';
import type { InMemoryStore } from './store';

// The muscle group catalog is a fixed enum, not a stored table (02 · Domain Model:
// "Группа мышц — фиксированный enum прямо на упражнении, не отдельная сущность") — there is
// nothing to seed or persist, so this repository just reads the domain's own MUSCLE_GROUPS
// constant instead of an InMemoryCollection (or a second, hand-written copy of the list).
export class InMemoryMuscleGroupRepository implements MuscleGroupRepository {
  async getAll(): Promise<MuscleGroup[]> {
    return runAsync(() => [...MUSCLE_GROUPS]);
  }

  async getById(id: MuscleGroup): Promise<MuscleGroup | null> {
    return runAsync(() => (MUSCLE_GROUPS.includes(id) ? id : null));
  }
}

const EXERCISES_COLLECTION = 'Exercise';

export class InMemoryExerciseRepository implements ExerciseRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get exercises() {
    return this.store.collection<Exercise>(EXERCISES_COLLECTION);
  }

  async getAll(): Promise<Exercise[]> {
    return this.exercises.list();
  }

  async getById(id: string): Promise<Exercise | null> {
    return (await this.exercises.findById(id)) ?? null;
  }

  async listByIds(ids: readonly string[]): Promise<Exercise[]> {
    return this.exercises.listByIds([...ids]);
  }

  async filterByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    return this.exercises.find((exercise) => exercise.muscleGroup === muscleGroup);
  }

  async createCustom(exercise: Exercise): Promise<Exercise> {
    return this.exercises.insert(exercise);
  }

  async updateCustom(exercise: Exercise): Promise<Exercise> {
    return this.exercises.update(exercise.id, (current) => {
      if (current.source !== 'custom') {
        throw new ConflictError(
          `Exercise "${exercise.id}" is a catalog exercise and cannot be edited through the repository.`,
        );
      }
      return exercise;
    });
  }

  async toggleHidden(id: string): Promise<Exercise> {
    return this.exercises.update(id, (current) => ({ ...current, isHidden: !current.isHidden }));
  }

  // catalogVersion is not persisted here — it is tracked in Settings (02 · Domain Model,
  // "catalogVersion хранится в настройках"). This method only inserts catalog exercises
  // whose (pre-baked) id isn't already present, leaving every existing record — catalog or
  // custom — untouched.
  async seedCatalog(_catalogVersion: number, exercises: readonly Exercise[]): Promise<void> {
    for (const exercise of exercises) {
      const existing = await this.exercises.findById(exercise.id);
      if (!existing) {
        await this.exercises.insert(exercise);
      }
    }
  }
}
