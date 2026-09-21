import { waitFor } from '@testing-library/react-native';

import { seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { useMesoGrid } from '@state/useMesoGrid';

const repositories = withRepositories();

beforeEach(async () => {
  await seedMockMesocycles(repositories());
});

describe('useMesoGrid', () => {
  test('reads the grid of a mesocycle in storage', async () => {
    const { result } = renderHookWithRepositories(() => useMesoGrid(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const grid = result.current.data!;
    expect(grid.mesoId).toBe(MOCK_MESOCYCLE_IDS.planned);
    expect(grid.weeks).toHaveLength(grid.lengthWeeks);
    expect(grid.weeks.at(-1)?.isDeload).toBe(true);
    expect(
      grid.weeks.flatMap((week) => week.cells).every((cell) => cell.status === 'awaiting'),
    ).toBe(true);
  });

  test('stays idle without a mesocycle id', () => {
    const { result } = renderHookWithRepositories(() => useMesoGrid(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
