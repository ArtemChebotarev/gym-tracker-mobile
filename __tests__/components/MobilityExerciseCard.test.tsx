import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  WorkoutExerciseCard,
  type WorkoutExerciseCardProps,
} from '@components/WorkoutExerciseCard';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import type { MobilityWorkoutExercise, WorkoutRoundRow } from '@usecases/workoutSession';

const NO_ACTIONS: MobilityWorkoutExercise['actions'] = {
  canReplace: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};

const BLOCK: WorkoutRoundRow = { roundNumber: 1, workSec: 600, isFirstUnlogged: true };

function makeMobility(overrides: Partial<MobilityWorkoutExercise> = {}): MobilityWorkoutExercise {
  return {
    sessionExerciseId: 'session-exercise-cooldown',
    exerciseId: 'cooldown',
    name: 'Cooldown',
    muscleGroup: 'fullBody',
    type: 'mobility',
    status: 'planned',
    rounds: [BLOCK],
    plannedRoundCount: 1,
    loggedRoundCount: 0,
    hasLoggedSets: false,
    getReadySec: 5,
    actions: NO_ACTIONS,
    ...overrides,
  };
}

function renderCard(exercise = makeMobility(), mode: WorkoutExerciseCardProps['mode'] = 'live') {
  const rounds = {
    onLogRound: jest.fn(),
    onUnlogRound: jest.fn(),
    onStartTimer: jest.fn(),
    onSetRoundTime: jest.fn(),
    onOpenTimer: jest.fn(),
  };
  render(
    <WorkoutExerciseCard
      exercise={exercise}
      mode={mode}
      chip={{ kind: 'type', type: 'mobility' }}
      onOpenHistory={jest.fn()}
      onOpenOverview={jest.fn()}
      menuItems={[]}
      isSaving={false}
      sets={{ onLogSet: jest.fn(), onUnlogSet: jest.fn() }}
      rounds={rounds}
    />,
  );
  return rounds;
}

afterEach(() => {
  act(() => useIntervalTimerStore.getState().close());
  useIntervalTimerStore.getState().clearFinished();
});

describe('Mobility card (GT-107)', () => {
  test('matches the live snapshot', () => {
    renderCard();

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('Length · Log over one row, the timer action under it — no set rows', () => {
    renderCard();

    expect(screen.getByLabelText('Duration, 10:00')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start timer' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Mark done' })).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
    expect(screen.getByText('Log')).toBeTruthy();
    expect(screen.getByText('Start timer')).toBeTruthy();
    expect(screen.queryByText('Reps')).toBeNull();
  });

  test('Done logs the block with its length and no rest; a second tap un-logs it', () => {
    const rounds = renderCard();

    fireEvent.press(screen.getByRole('checkbox', { name: 'Mark done' }));
    expect(rounds.onLogRound).toHaveBeenCalledWith(1, { workSec: 600 });

    screen.unmount();
    const logged = renderCard(
      makeMobility({
        rounds: [
          { ...BLOCK, log: { workSec: 540, restSkipped: false, completed: true } },
        ],
        loggedRoundCount: 1,
        hasLoggedSets: true,
        status: 'completed',
      }),
    );
    // What was done, with no play button left.
    expect(screen.getByLabelText('Duration, 9:00')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Done' }));
    expect(logged.onUnlogRound).toHaveBeenCalledWith(1);
  });

  test('play starts the interval timer over the block: one round of its length, no rest', () => {
    const rounds = renderCard();

    fireEvent.press(screen.getByRole('button', { name: 'Start timer' }));
    expect(rounds.onStartTimer).toHaveBeenCalledWith([{ roundNumber: 1, workSec: 600, restSec: 0 }]);
  });

  describe('with no history (FR-9)', () => {
    const empty = () => makeMobility({ rounds: [{ roundNumber: 1, isFirstUnlogged: true }] });

    test('the field is empty, a line says why, and Done and play wait', () => {
      const rounds = renderCard(empty());

      expect(screen.getByLabelText('Duration, not set')).toBeTruthy();
      expect(screen.getByText('Pick a duration to mark it done or start the timer.')).toBeTruthy();
      expect(screen.getByRole('checkbox', { name: 'Mark done' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Start timer' })).toBeDisabled();
      fireEvent.press(screen.getByRole('button', { name: 'Start timer' }));
      expect(rounds.onStartTimer).not.toHaveBeenCalled();
    });

    test('a picked length is saved as the plan, and then Done and play work', () => {
      const rounds = renderCard(empty());

      fireEvent.press(screen.getByLabelText('Duration, not set'));
      act(() => {
        screen.UNSAFE_getByType(TimePickerSheet).props.onChange(480);
      });
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));
      expect(rounds.onSetRoundTime).toHaveBeenCalledWith('work', [1], 480);

      expect(screen.queryByText(/Pick a duration/)).toBeNull();
      fireEvent.press(screen.getByRole('checkbox', { name: 'Mark done' }));
      expect(rounds.onLogRound).toHaveBeenCalledWith(1, { workSec: 480 });
    });

    test('closing the wheels unmoved keeps the time they showed', () => {
      const rounds = renderCard(empty());

      fireEvent.press(screen.getByLabelText('Duration, not set'));
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));
      expect(rounds.onSetRoundTime).toHaveBeenCalledWith('work', [1], 5);
    });
  });

  test('an unchanged length is not saved again', () => {
    const rounds = renderCard();

    fireEvent.press(screen.getByLabelText('Duration, 10:00'));
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(rounds.onSetRoundTime).not.toHaveBeenCalled();
  });

  describe('while its timer is out', () => {
    function startTimer(sessionExerciseId = 'session-exercise-cooldown') {
      act(() =>
        useIntervalTimerStore.getState().start({
          exercise: {
            type: 'mobility',
            sessionId: 'session',
            sessionExerciseId,
            name: 'Cooldown',
            totalRounds: 1,
            loggedRoundNumbers: [],
          },
          rounds: [{ roundNumber: 1, workSec: 600, restSec: 0 }],
          getReadySec: 0,
        }),
      );
    }

    test('the button pauses and resumes it, the field opens it, and Done waits', () => {
      const rounds = renderCard();
      startTimer();

      expect(screen.getByLabelText('10:00 left, open timer')).toBeTruthy();
      expect(screen.getByRole('checkbox', { name: 'Mark done' })).toBeDisabled();

      expect(screen.getByText('Pause timer')).toBeTruthy();
      fireEvent.press(screen.getByRole('button', { name: 'Pause timer' }));
      expect(useIntervalTimerStore.getState().active?.timer.endsAt).toBeUndefined();
      expect(screen.getByText('Resume timer')).toBeTruthy();
      fireEvent.press(screen.getByRole('button', { name: 'Resume timer' }));
      expect(useIntervalTimerStore.getState().active?.timer.endsAt).toBeDefined();

      fireEvent.press(screen.getByLabelText('10:00 left, open timer'));
      expect(rounds.onOpenTimer).toHaveBeenCalled();
      expect(rounds.onStartTimer).not.toHaveBeenCalled();
    });

    test('another exercise’s timer leaves the card alone', () => {
      renderCard();
      startTimer('session-exercise-other');

      expect(screen.getByLabelText('Duration, 10:00')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Start timer' })).toBeTruthy();
    });
  });

  test('a preview shows the card with nothing to act on', () => {
    renderCard(makeMobility({ rounds: [] }), 'preview');

    expect(screen.getByText('Cooldown')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull();
  });
});
