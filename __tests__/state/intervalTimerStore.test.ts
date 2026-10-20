import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useRestTimerStore } from '@state/restTimerStore';

const T0 = 1_000_000;
const EXERCISE = {
  sessionId: 'session',
  sessionExerciseId: 'bag',
  name: 'Heavy bag',
  totalRounds: 2,
  loggedRoundNumbers: [],
};
const ROUNDS = [1, 2].map((roundNumber) => ({ roundNumber, workSec: 60, restSec: 30 }));

function phase() {
  const timer = useIntervalTimerStore.getState().active?.timer;
  return timer?.phase === undefined ? 'over' : `${timer.phase.kind} ${timer.phase.round + 1}`;
}

beforeEach(() => {
  jest.useFakeTimers({ now: T0 });
  useIntervalTimerStore.getState().close();
  useIntervalTimerStore.getState().clearFinished();
  useRestTimerStore.getState().clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('intervalTimerStore', () => {
  test('starts with Get ready, and drops a rest that was running — one timer at a time', () => {
    useRestTimerStore.getState().start({
      sessionExerciseId: 'press',
      next: { kind: 'set', setNumber: 2 },
      durationSec: 90,
    });

    useIntervalTimerStore.getState().start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });

    expect(phase()).toBe('getReady 1');
    expect(useRestTimerStore.getState().timer).toBeNull();
  });

  test('catches up with the clock, and acts at the time of each tap', () => {
    const store = useIntervalTimerStore.getState();
    store.start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });

    jest.advanceTimersByTime(70_000);
    store.catchUp();
    expect(phase()).toBe('rest 1');

    // 5 s of Get ready and 60 s of work: the rest began at 65 s, so it has run 15 s by 80 s.
    jest.advanceTimersByTime(10_000);
    store.skipRest();
    expect(phase()).toBe('getReady 2');
    expect(useIntervalTimerStore.getState().active?.timer.results[0]).toMatchObject({
      restSec: 15,
      restSkipped: true,
    });

    store.pause();
    jest.advanceTimersByTime(600_000);
    store.catchUp();
    expect(phase()).toBe('getReady 2');
    store.resume();

    jest.advanceTimersByTime(5_000 + 20_000);
    store.endEarly();
    expect(useIntervalTimerStore.getState().active?.timer).toMatchObject({
      outcome: 'endedEarly',
    });
    expect(useIntervalTimerStore.getState().active?.timer.results[1]).toMatchObject({
      roundNumber: 2,
      workSec: 20,
      completed: false,
    });

    store.close();
    expect(useIntervalTimerStore.getState().active).toBeNull();
  });

  test('closing a block that ran to its end leaves its last round and rest for the workout', () => {
    const store = useIntervalTimerStore.getState();
    store.start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });
    jest.advanceTimersByTime(10_000_000);
    store.catchUp();
    store.close();
    expect(useIntervalTimerStore.getState().finished).toEqual({
      sessionExerciseId: 'bag',
      roundNumber: 2,
      restSec: 30,
    });
    store.clearFinished();
    expect(useIntervalTimerStore.getState().finished).toBeNull();
  });

  test('End early leaves nothing — no rest follows a block cut short', () => {
    const store = useIntervalTimerStore.getState();
    store.start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });
    jest.advanceTimersByTime(20_000);
    store.endEarly();
    store.close();
    expect(useIntervalTimerStore.getState().finished).toBeNull();
  });

  test('minimised while its screen is away; closing or a new start brings it back (GT-97)', () => {
    const store = useIntervalTimerStore.getState();
    store.minimize();
    // Nothing to minimise without a timer.
    expect(useIntervalTimerStore.getState().minimized).toBe(false);

    store.start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });
    store.minimize();
    expect(useIntervalTimerStore.getState().minimized).toBe(true);
    // Minimising never stops the clock.
    jest.advanceTimersByTime(70_000);
    store.catchUp();
    expect(phase()).toBe('rest 1');

    store.expand();
    expect(useIntervalTimerStore.getState().minimized).toBe(false);
    store.minimize();
    store.close();
    expect(useIntervalTimerStore.getState().minimized).toBe(false);
  });

  test('a tick that changes nothing leaves the state as it was', () => {
    const store = useIntervalTimerStore.getState();
    store.start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 });
    const before = useIntervalTimerStore.getState().active;
    jest.advanceTimersByTime(1_000);
    store.catchUp();
    expect(useIntervalTimerStore.getState().active).toBe(before);
  });
});
