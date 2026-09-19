import type { Session } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { createInMemoryMesocycleStartStore } from '@storage/mesocycleStartStore';
import { InMemoryStore } from '@storage/store';

const mesocycle: Mesocycle = {
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 3,
  daysPerWeek: 1,
  status: 'planned',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weekPlan: { days: [{ dayNumber: 1, name: '', exercises: [] }] },
  createdAt: '2026-09-17T09:00:00.000Z',
};

const session: Session = {
  id: 'session-1',
  mesoId: 'meso',
  weekNumber: 1,
  dayNumber: 1,
  isDeload: false,
  prescriptionStatus: 'ready',
  status: 'planned',
};

describe('createInMemoryMesocycleStartStore', () => {
  test('writes made inside a transaction are visible through repos once it resolves', async () => {
    const start = createInMemoryMesocycleStartStore(new InMemoryStore());
    await start.repos.mesocycleRepo.create(mesocycle);

    await start.transaction(async (repos) => {
      await repos.sessionRepo.create(session);
      await repos.mesocycleRepo.update({ ...mesocycle, status: 'active' });
    });

    await expect(start.repos.sessionRepo.getById('session-1')).resolves.toEqual(session);
    await expect(start.repos.mesocycleRepo.getActive()).resolves.toMatchObject({ id: 'meso' });
  });

  test('a failure partway through rolls back writes across the mesocycle and its sessions', async () => {
    const start = createInMemoryMesocycleStartStore(new InMemoryStore());
    await start.repos.mesocycleRepo.create(mesocycle);

    await expect(
      start.transaction(async (repos) => {
        await repos.sessionRepo.create(session);
        await repos.mesocycleRepo.update({ ...mesocycle, status: 'active' });
        throw new Error('failure partway through');
      }),
    ).rejects.toThrow('failure partway through');

    await expect(start.repos.mesocycleRepo.getById('meso')).resolves.toEqual(mesocycle);
    await expect(start.repos.sessionRepo.listByMesoId('meso')).resolves.toEqual([]);
  });
});
