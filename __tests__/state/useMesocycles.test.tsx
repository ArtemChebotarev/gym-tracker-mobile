import { act, waitFor } from '@testing-library/react-native';

import { seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useDeletePlannedMesocycle } from '@state/useDeletePlannedMesocycle';
import { useMesocycles } from '@state/useMesocycles';

const repositories = withRepositories();

beforeEach(async () => {
  await seedMockMesocycles(repositories());
});

describe('useMesocycles / useDeletePlannedMesocycle', () => {
  test('lists what storage holds', async () => {
    const { result } = renderHookWithRepositories(() => useMesocycles());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.map((mesocycle) => mesocycle.id).sort()).toEqual(
      Object.values(MOCK_MESOCYCLE_IDS).sort(),
    );
  });

  test('deleting the planned mesocycle removes it and refreshes the list', async () => {
    const { result } = renderHookWithRepositories(() => ({
      list: useMesocycles(),
      remove: useDeletePlannedMesocycle(),
    }));
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    act(() => result.current.remove.mutate(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.list.data!.map((mesocycle) => mesocycle.id)).not.toContain(
        MOCK_MESOCYCLE_IDS.planned,
      ),
    );
    await expect(
      repositories().mesocycleRepo.getById(MOCK_MESOCYCLE_IDS.planned),
    ).resolves.toBeNull();
  });
});
