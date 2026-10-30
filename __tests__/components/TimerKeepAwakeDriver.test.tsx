import { act, render } from '@testing-library/react-native';

import { TimerKeepAwakeDriver } from '@components/TimerKeepAwakeDriver';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useRestTimerStore } from '@state/restTimerStore';

// The hook's own job is one native call and its undoing; what counts here is when it is held.
let mockHeld = 0;

jest.mock('expo-keep-awake', () => ({
  useKeepAwake: () => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      mockHeld += 1;
      return () => {
        mockHeld -= 1;
      };
    }, []);
  },
}));

const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};
const BLOCK = {
  exercise: {
    sessionId: 'session',
    sessionExerciseId: 'bag',
    name: 'Heavy bag',
    totalRounds: 1,
    loggedRoundNumbers: [],
  },
  rounds: [{ roundNumber: 1, workSec: 60, restSec: 30 }],
  getReadySec: 5,
};

const rest = () => useRestTimerStore.getState();
const interval = () => useIntervalTimerStore.getState();

beforeEach(() => {
  mockHeld = 0;
  interval().close();
  interval().clearFinished();
  rest().clear();
  render(<TimerKeepAwakeDriver />);
});

describe('TimerKeepAwakeDriver', () => {
  test('leaves the screen to the system while no timer runs', () => {
    expect(mockHeld).toBe(0);
  });

  test('holds the screen through a rest, its pause included', () => {
    act(() => rest().start(REST));
    expect(mockHeld).toBe(1);

    act(() => rest().pause());
    expect(mockHeld).toBe(1);

    act(() => rest().resume());
    expect(mockHeld).toBe(1);
  });

  test.each([
    ['skipped', () => rest().skip()],
    ['run out', () => rest().finish()],
    ['stopped', () => rest().stop()],
    ['dropped with the workout', () => rest().clear()],
  ])('lets go of the screen when a rest is %s', (_name, end) => {
    act(() => rest().start(REST));

    act(end);

    expect(mockHeld).toBe(0);
  });

  test('holds the screen through a block, with the timer in the capsule and paused too', () => {
    act(() => interval().start(BLOCK));
    expect(mockHeld).toBe(1);

    act(() => interval().minimize());
    expect(mockHeld).toBe(1);

    act(() => interval().pause());
    expect(mockHeld).toBe(1);
  });

  test('lets go of the screen on the summary after End early, and does not take it again', () => {
    act(() => interval().start(BLOCK));

    act(() => interval().endEarly());
    expect(interval().active).not.toBeNull();
    expect(mockHeld).toBe(0);

    act(() => interval().close());
    expect(mockHeld).toBe(0);
  });

  test('holds the screen once as a block takes over from a rest', () => {
    act(() => rest().start(REST));

    act(() => interval().start(BLOCK));

    expect(mockHeld).toBe(1);
  });
});
