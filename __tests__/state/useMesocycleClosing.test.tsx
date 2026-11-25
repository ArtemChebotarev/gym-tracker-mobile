import { act, waitFor } from '@testing-library/react-native';

import { seedExerciseCatalog, seedMockMesocycles } from '../fixtures/appStorage';
import { MOCK_MESOCYCLE_IDS } from '../fixtures/mesocycleMocks';
import { renderHookWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';
import { setTelemetryClient } from '@state/telemetry';
import { useFinishMesocycle, useStopMesocycle } from '@state/useMesocycleClosing';
import { useStartMesocycle } from '@state/useStartMesocycle';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const repositories = withRepositories();

beforeEach(async () => {
  await seedExerciseCatalog(repositories());
  await seedMockMesocycles(repositories());
});

afterEach(() => setTelemetryClient(undefined));

describe('useMesocycleClosing telemetry (GT-248)', () => {
  test('Stop reports the cycle as abandoned, with its planned length', async () => {
    const { result } = renderHookWithRepositories(() => ({
      start: useStartMesocycle(),
      stop: useStopMesocycle(),
    }));
    act(() => result.current.start.mutate(MOCK_MESOCYCLE_IDS.planned));
    await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
    const capture = jest.fn();
    setTelemetryClient({ capture });

    act(() => result.current.stop.mutate(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.stop.isSuccess).toBe(true));
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('cycle_completed', { outcome: 'abandoned', weeks: 3 });
  });

  test('a refused Finish (the block still has sessions to train) sends nothing', async () => {
    const { result } = renderHookWithRepositories(() => ({
      start: useStartMesocycle(),
      finish: useFinishMesocycle(),
    }));
    act(() => result.current.start.mutate(MOCK_MESOCYCLE_IDS.planned));
    await waitFor(() => expect(result.current.start.isSuccess).toBe(true));
    const capture = jest.fn();
    setTelemetryClient({ capture });

    act(() => result.current.finish.mutate(MOCK_MESOCYCLE_IDS.planned));

    await waitFor(() => expect(result.current.finish.isError).toBe(true));
    expect(capture).not.toHaveBeenCalled();
  });
});
