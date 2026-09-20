import type { SessionExercise } from '@domain/execution';
import type { Incoming } from '@domain/timestamps';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';

import { SESSION_EXERCISE_COLLECTION } from './collectionNames';
import { stampCreated, stampUpdated } from './timestamps';
import type { InMemoryStore } from './store';

export class InMemorySessionExerciseRepository implements SessionExerciseRepository {
  constructor(private readonly store: InMemoryStore) {}

  private get sessionExercises() {
    return this.store.collection<SessionExercise>(SESSION_EXERCISE_COLLECTION);
  }

  async listBySessionId(sessionId: string): Promise<SessionExercise[]> {
    return this.sessionExercises.find((exercise) => exercise.sessionId === sessionId);
  }

  async create(sessionExercise: Incoming<SessionExercise>): Promise<SessionExercise> {
    return this.sessionExercises.insert(stampCreated(sessionExercise));
  }

  async createMany(
    sessionExercises: readonly Incoming<SessionExercise>[],
  ): Promise<SessionExercise[]> {
    return Promise.all(
      sessionExercises.map((exercise) => this.sessionExercises.insert(stampCreated(exercise))),
    );
  }

  async update(sessionExercise: SessionExercise): Promise<SessionExercise> {
    return this.sessionExercises.update(sessionExercise.id, (stored) =>
      stampUpdated(stored, sessionExercise),
    );
  }

  async updateMany(sessionExercises: readonly SessionExercise[]): Promise<SessionExercise[]> {
    return Promise.all(
      sessionExercises.map((exercise) =>
        this.sessionExercises.update(exercise.id, (stored) => stampUpdated(stored, exercise)),
      ),
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.sessionExercises.delete(id);
  }
}
