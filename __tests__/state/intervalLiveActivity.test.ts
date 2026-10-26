import { intervalActivityPropsOf } from '@components/IntervalTimerActivityLogic';
import { startIntervalTimer } from '@domain/intervalTimerRules';
import {
  endIntervalActivities,
  onIntervalActivityAction,
  startIntervalActivity,
  updateIntervalActivity,
} from '@state/intervalLiveActivity';

type FakeActivity = { getId: () => string; end: jest.Mock };
type Interaction = { source: string; target?: string };

// expo-widgets talks to ActivityKit, which a test doesn't have: a factory that keeps the activities
// it started, and a listener the test can tap through.
const mockWidgets = {
  instances: [] as FakeActivity[],
  listener: null as ((event: Interaction) => void) | null,
  nextId: 1,
};

jest.mock('expo-widgets', () => ({
  createLiveActivity: () => ({
    start: jest.fn(() => {
      const activity: FakeActivity = {
        getId: () => `activity-${mockWidgets.nextId}`,
        end: jest.fn(() => {
          mockWidgets.instances = mockWidgets.instances.filter((a) => a !== activity);
          return Promise.resolve();
        }),
      };
      mockWidgets.nextId += 1;
      mockWidgets.instances.push(activity);
      return activity;
    }),
    getInstances: () => [...mockWidgets.instances],
  }),
  addUserInteractionListener: (listener: (event: Interaction) => void) => {
    mockWidgets.listener = listener;
    return { remove: () => (mockWidgets.listener = null) };
  },
}));

const PROPS = intervalActivityPropsOf(
  {
    exercise: {
      sessionId: 'session',
      sessionExerciseId: 'bag',
      name: 'Heavy bag',
      totalRounds: 1,
      loggedRoundNumbers: [],
    },
    timer: startIntervalTimer([{ roundNumber: 1, workSec: 60, restSec: 0 }], 5, 0),
  },
  0,
)!;

function tap(event: Interaction) {
  mockWidgets.listener?.(event);
}

beforeEach(async () => {
  await endIntervalActivities();
  mockWidgets.nextId = 1;
});

describe('intervalLiveActivity', () => {
  it('a start ends the activity already there, so the lock screen never shows two', async () => {
    const first = await startIntervalActivity(PROPS);
    const second = await startIntervalActivity(PROPS);

    expect((first as unknown as FakeActivity).end).toHaveBeenCalledWith('immediate');
    expect(mockWidgets.instances).toEqual([second]);
  });

  it('hears Pause and Skip rest on its own activity, matched by its id', async () => {
    const activity = await startIntervalActivity(PROPS);
    const onAction = jest.fn();
    const unsubscribe = onIntervalActivityAction(onAction);

    tap({ source: activity.getId(), target: 'pause' });
    tap({ source: activity.getId(), target: 'skipRest' });
    tap({ source: activity.getId(), target: 'endEarly' });
    // SPIKE (GT-180): Skip rest is back on the activity, shown in a rest only.
    expect(onAction.mock.calls).toEqual([['pause'], ['skipRest']]);

    unsubscribe();
  });

  it('ignores taps from elsewhere, on an ended activity, or with an unknown target', async () => {
    const ended = await startIntervalActivity(PROPS);
    const endedId = ended.getId();
    const current = await startIntervalActivity(PROPS);
    const onAction = jest.fn();
    const unsubscribe = onIntervalActivityAction(onAction);

    tap({ source: 'SomeHomeScreenWidget', target: 'pause' });
    tap({ source: endedId, target: 'pause' });
    tap({ source: current.getId(), target: 'endEarly' });
    expect(onAction).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('a turned-down update is tried once more, and never stops the ones after it', async () => {
    jest.useFakeTimers();
    const update = jest
      .fn<Promise<void>, [unknown]>()
      .mockRejectedValueOnce(new Error('throttled'))
      .mockResolvedValue(undefined);
    const activity = { update } as unknown as Parameters<typeof updateIntervalActivity>[0];

    const first = updateIntervalActivity(activity, PROPS);
    await jest.advanceTimersByTimeAsync(1_000);
    await expect(first).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledTimes(2);

    update.mockRejectedValue(new Error('still throttled'));
    const second = updateIntervalActivity(activity, PROPS);
    await jest.advanceTimersByTimeAsync(1_000);
    await expect(second).resolves.toBeUndefined();
    jest.useRealTimers();
  });
});
