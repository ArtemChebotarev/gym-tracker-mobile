import { MUSCLE_GROUPS } from '@domain/catalog';
import type { MuscleGroup } from '@domain/catalog';
import type { MuscleGroupRepository } from '@repositories/catalog';

import { runAsync } from './async';

// The muscle group catalog is a fixed enum, not a stored table (02 · Domain Model:
// "Группа мышц — фиксированный enum прямо на упражнении, не отдельная сущность") — there is
// nothing to seed or persist, so this repository just reads the domain's own MUSCLE_GROUPS
// constant instead of a table (or a second, hand-written copy of the list).
//
// Which is also why it carries no engine in its name: with nothing stored, there is nothing for
// an engine to differ about, and every adapter uses this one class rather than a copy of it.
export class MuscleGroupCatalogRepository implements MuscleGroupRepository {
  async getAll(): Promise<MuscleGroup[]> {
    return runAsync(() => [...MUSCLE_GROUPS]);
  }

  async getById(id: MuscleGroup): Promise<MuscleGroup | null> {
    return runAsync(() => (MUSCLE_GROUPS.includes(id) ? id : null));
  }
}
