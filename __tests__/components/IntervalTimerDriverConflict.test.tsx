import { act } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { IntervalTimerDriver } from '@components/IntervalTimerDriver';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import type { LogRoundResult } from '@usecases/roundLogging';

import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

// GT-259, the safety net: Start timer is refused while another workout is in progress, but that
// workout can still be started elsewhere while the timer runs. Then its rounds can't be saved, and
// the timer stops — once — instead of running on with nothing it can save or end. The writes are
// stood in for here: what the driver does with an outcome is the question, not how it is written.
type Outcome = LogRoundResult | { kind: 'failed'; error: unknown };
let reportOutcome: ((outcome: Outcome) => void) | undefined;

jest.mock('@state/useTimerRoundLogging', () => ({
  useTimerRoundLogging: (onOutcome: (outcome: Outcome) => void) => {
    reportOutcome = onOutcome;
    return () => undefined;
  },
}));
jest.mock('@state/intervalSignal', () => ({
  scheduleCountdown: jest.fn(),
  cancelCountdown: jest.fn(),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

withRepositories();

const CONFLICT: Outcome = {
  kind: 'conflict',
  inProgressSessionId: 'w3d1',
  weekNumber: 3,
  dayNumber: 1,
};

afterEach(() => {
  act(() => {
    useIntervalTimerStore.getState().close();
    useIntervalTimerStore.getState().clearFinished();
  });
});

test('DoD: a round that meets another workout in progress stops the timer, with one alert', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  renderWithRepositories(<IntervalTimerDriver />);
  act(() =>
    useIntervalTimerStore.getState().start({
      exercise: {
        sessionId: 'w3d2',
        sessionExerciseId: 'bag',
        name: 'Heavy bag',
        totalRounds: 2,
        loggedRoundNumbers: [],
      },
      rounds: [
        { roundNumber: 1, workSec: 60, restSec: 30 },
        { roundNumber: 2, workSec: 60, restSec: 30 },
      ],
      getReadySec: 5,
    }),
  );

  // The round's work and its rest each come back refused.
  act(() => reportOutcome?.(CONFLICT));
  act(() => reportOutcome?.(CONFLICT));

  const timers = useIntervalTimerStore.getState();
  expect(timers.active).toBeNull();
  // Ended early, so no rest follows it.
  expect(timers.finished).toBeNull();
  expect(alert).toHaveBeenCalledTimes(1);
  expect(alert.mock.calls[0]?.[0]).toBe('Finish Week 3 Day 1 first');
  alert.mockRestore();
});
