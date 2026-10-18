import { restCapsule } from '@components/RestTimerDriverLogic';
import { pauseRestTimer, startRestTimer } from '@domain/restTimerRules';

const T0 = 1_000_000;
const ACTIONS = { skip: jest.fn(), pause: jest.fn(), resume: jest.fn(), dismiss: jest.fn() };
const timer = startRestTimer({ sessionExerciseId: 'se', nextSetNumber: 3, durationSec: 120 }, T0);

describe('restCapsule', () => {
  test('running: the time left over the set that comes next, with Skip and Pause', () => {
    const capsule = restCapsule({ timer, finished: null }, T0 + 14_000, ACTIONS);

    expect(capsule).toMatchObject({
      state: 'running',
      title: '1:46',
      caption: 'Rest · set 3 next',
      onSkip: ACTIONS.skip,
      onPause: ACTIONS.pause,
    });
    expect(capsule?.progress).toBeCloseTo(106 / 120);
  });

  test('paused: says so, and the time stays where it stopped', () => {
    const paused = pauseRestTimer(timer, T0 + 78_000);

    expect(restCapsule({ timer: paused, finished: null }, T0 + 999_000, ACTIONS)).toMatchObject({
      state: 'paused',
      title: '0:42',
      caption: 'Paused · set 3 next',
      onResume: ACTIONS.resume,
    });
  });

  test('run out: Rest is over, and a cross to put it away', () => {
    expect(
      restCapsule(
        { timer: null, finished: { sessionExerciseId: 'se', nextSetNumber: 3 } },
        T0,
        ACTIONS,
      ),
    ).toMatchObject({
      state: 'finished',
      title: 'Rest is over',
      caption: 'Set 3 next',
      onDismiss: ACTIONS.dismiss,
    });
  });

  test('nothing to show without a rest', () => {
    expect(restCapsule({ timer: null, finished: null }, T0, ACTIONS)).toBeNull();
  });
});
