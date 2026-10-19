import { act } from '@testing-library/react-native';

import { restRemainingSec } from '@domain/restTimerRules';
import { useRestTimerStore } from '@state/restTimerStore';

const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};

function left(): number | undefined {
  const { timer } = useRestTimerStore.getState();
  return timer === null ? undefined : restRemainingSec(timer, Date.now());
}

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
});

afterEach(() => {
  act(() => useRestTimerStore.getState().clear());
  jest.useRealTimers();
});

describe('restTimerStore', () => {
  test('a started rest counts down with the clock', () => {
    useRestTimerStore.getState().start(REST);
    jest.advanceTimersByTime(25_000);

    expect(left()).toBe(35);
  });

  test('pause holds the time left; resume runs it on', () => {
    const store = useRestTimerStore.getState();
    store.start(REST);
    jest.advanceTimersByTime(10_000);
    store.pause();
    jest.advanceTimersByTime(120_000);
    expect(left()).toBe(50);

    store.resume();
    jest.advanceTimersByTime(20_000);
    expect(left()).toBe(30);
  });

  test('finish turns the rest into a finished one; dismiss puts it away', () => {
    const store = useRestTimerStore.getState();
    store.start(REST);
    store.finish();

    expect(useRestTimerStore.getState()).toMatchObject({
      timer: null,
      finished: { sessionExerciseId: 'se', next: { kind: 'set', setNumber: 2 } },
    });
    store.dismiss();
    expect(useRestTimerStore.getState().finished).toBeNull();
  });

  test('skip drops the rest and leaves nothing on screen', () => {
    const store = useRestTimerStore.getState();
    store.start(REST);
    store.skip();

    expect(useRestTimerStore.getState()).toMatchObject({ timer: null, finished: null });
  });

  test('one timer at a time: a new rest replaces the one running and a finished one', () => {
    const store = useRestTimerStore.getState();
    store.start(REST);
    store.finish();
    store.start({ ...REST, next: { kind: 'set', setNumber: 3 }, durationSec: 90 });

    expect(useRestTimerStore.getState().finished).toBeNull();
    expect(useRestTimerStore.getState().timer?.next).toEqual({ kind: 'set', setNumber: 3 });
    expect(left()).toBe(90);
  });

  test('stop ends a running rest and a finished one, and keeps the logged sets', () => {
    const store = useRestTimerStore.getState();
    store.noteLogged('se:1');
    store.start(REST);
    store.stop();

    expect(useRestTimerStore.getState()).toMatchObject({ timer: null, finished: null });
    expect(useRestTimerStore.getState().loggedSets.has('se:1')).toBe(true);
  });

  test('the logged sets are forgotten when the workout is over', () => {
    const store = useRestTimerStore.getState();
    store.noteLogged('se:1');
    store.clear();

    expect(useRestTimerStore.getState().loggedSets.size).toBe(0);
  });
});
