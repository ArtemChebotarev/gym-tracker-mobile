import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import {
  WorkoutExerciseCard,
  type WorkoutExerciseCardProps,
} from '@components/WorkoutExerciseCard';
import { TimePickerSheet } from '@design/components/TimePickerSheet';
import type { IntervalWorkoutExercise, WorkoutRoundRow } from '@usecases/workoutSession';

const NO_ACTIONS: IntervalWorkoutExercise['actions'] = {
  canReplace: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
  canAddRound: false,
  canRemoveLastRound: false,
};

const ROUNDS: WorkoutRoundRow[] = [
  { roundNumber: 1, workSec: 120, restSec: 45, isFirstUnlogged: true },
  { roundNumber: 2, workSec: 120, restSec: 45, isFirstUnlogged: false },
  { roundNumber: 3, workSec: 120, restSec: 45, isFirstUnlogged: false },
];

function makeInterval(overrides: Partial<IntervalWorkoutExercise> = {}): IntervalWorkoutExercise {
  return {
    sessionExerciseId: 'session-exercise-bag',
    exerciseId: 'heavy-bag',
    name: 'Heavy bag',
    muscleGroup: 'fullBody',
    type: 'interval',
    status: 'planned',
    rounds: ROUNDS,
    plannedRoundCount: 3,
    loggedRoundCount: 0,
    hasLoggedSets: false,
    progression: { column: 'rest', stepSec: 15 },
    getReadySec: 5,
    actions: NO_ACTIONS,
    ...overrides,
  };
}

function makeProps(overrides: Partial<WorkoutExerciseCardProps> = {}): WorkoutExerciseCardProps {
  return {
    exercise: makeInterval(),
    mode: 'live',
    chip: { kind: 'type', type: 'interval' },
    onOpenHistory: jest.fn(),
    menuItems: [],
    isSaving: false,
    sets: { onLogSet: jest.fn(), onUnlogSet: jest.fn() },
    ...overrides,
  };
}

describe('Interval card (GT-88)', () => {
  test('matches the live snapshot', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });

  test('DoD: Round · Work · Rest · Log, one row per round, the last with its rest too', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    for (const label of ['Round', 'Work', 'Rest', 'Log']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    const first = within(screen.getByTestId('round-row-1'));
    expect(first.getByText('1')).toBeTruthy();
    expect(first.getByText('2:00')).toBeTruthy();
    expect(first.getByText('0:45')).toBeTruthy();
    const last = within(screen.getByTestId('round-row-3'));
    expect(last.getByText('2:00')).toBeTruthy();
    // The rest before the next exercise (19.10.2026).
    expect(last.getByText('0:45')).toBeTruthy();
    // No set rows, no RIR.
    expect(screen.queryByText('Weight, kg')).toBeNull();
    expect(screen.queryByTestId('exercise-rir')).toBeNull();
  });

  test('the type chip says Timed work', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(within(screen.getByTestId('exercise-type-chip')).getByText('Timed work')).toBeTruthy();
  });

  test('Start timer sits under the rounds with how many there are', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(screen.getByText('Start timer · 3 rounds')).toBeTruthy();
  });

  test('a logged round shows the work done, and a skipped rest as Skipped (GT-102)', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeInterval({
            rounds: [
              {
                ...ROUNDS[0]!,
                isFirstUnlogged: false,
                log: { workSec: 110, restSkipped: true, completed: true },
              },
              { ...ROUNDS[1]!, isFirstUnlogged: true },
              ROUNDS[2]!,
            ],
            loggedRoundCount: 1,
            hasLoggedSets: true,
          }),
        })}
      />,
    );

    const first = within(screen.getByTestId('round-row-1'));
    expect(first.getByText('1:50')).toBeTruthy();
    expect(first.getByText('Skipped')).toBeTruthy();
    expect(first.queryByText('0:45')).toBeNull();
    expect(first.getByLabelText('Rest, round 1, skipped')).toBeTruthy();
    expect(screen.getByText('Start timer · 2 rounds left')).toBeTruthy();
  });

  test('the ⓘ sits beside the column the lever moves and explains it', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    fireEvent.press(screen.getByLabelText('How rest progresses'));

    expect(screen.getByText('Less rest each week')).toBeTruthy();
    expect(screen.queryByLabelText('How work progresses')).toBeNull();
  });

  test('no lever that moves a column, no ⓘ', () => {
    const { progression: _progression, ...steady } = makeInterval();
    render(<WorkoutExerciseCard {...makeProps({ exercise: steady })} />);

    expect(screen.queryByLabelText('How rest progresses')).toBeNull();
    expect(screen.queryByLabelText('How work progresses')).toBeNull();
  });

  test('read-only: the rounds, no Start timer and no menu', () => {
    render(<WorkoutExerciseCard {...makeProps({ mode: 'readonly' })} />);

    expect(screen.getByTestId('round-row-1')).toBeTruthy();
    expect(screen.queryByText(/Start timer/)).toBeNull();
    expect(screen.queryByLabelText('Heavy bag menu')).toBeNull();
  });

  test('a skipped interval with nothing logged collapses into one Skipped note', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeInterval({
            status: 'skipped',
            rounds: ROUNDS.map((round) => ({
              ...round,
              isFirstUnlogged: false,
              notDone: 'skipped' as const,
            })),
          }),
        })}
      />,
    );

    expect(screen.queryByTestId('round-row-1')).toBeNull();
    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.queryByText(/Start timer/)).toBeNull();
  });

  describe('rounds with no time yet (GT-187)', () => {
    const EMPTY: WorkoutRoundRow[] = [
      { roundNumber: 1, isFirstUnlogged: true },
      { roundNumber: 2, isFirstUnlogged: false },
    ];

    function renderEmpty(rounds: WorkoutRoundRow[] = EMPTY) {
      const actions = { onLogRound: jest.fn(), onStartTimer: jest.fn(), onSetRoundTime: jest.fn() };
      render(
        <WorkoutExerciseCard
          {...makeProps({
            exercise: makeInterval({ rounds, plannedRoundCount: rounds.length }),
            rounds: actions,
          })}
        />,
      );
      return actions;
    }

    test('the fields are empty, and Log and Start timer wait with a line on why', () => {
      const actions = renderEmpty();

      expect(screen.getByLabelText('Work, round 1, not set')).toBeTruthy();
      expect(screen.getByLabelText('Rest, round 2, not set')).toBeTruthy();
      expect(within(screen.getByTestId('round-row-1')).getAllByText('–')).toHaveLength(2);
      expect(
        screen.getByText('Pick work and rest to log a round or start the timer.'),
      ).toBeTruthy();
      fireEvent.press(screen.getByLabelText('Log round 1'));
      fireEvent.press(screen.getByTestId('start-timer-session-exercise-bag'));
      expect(actions.onLogRound).not.toHaveBeenCalled();
      expect(actions.onStartTimer).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Log round 1')).toBeDisabled();
    });

    test('DoD: a picked time fills the rounds below and is saved; with both, Log and the timer work', () => {
      const actions = renderEmpty();

      fireEvent.press(screen.getByLabelText('Work, round 1, not set'));
      act(() => {
        screen.UNSAFE_getByType(TimePickerSheet).props.onChange(30);
      });
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));
      expect(actions.onSetRoundTime).toHaveBeenCalledWith('work', [1, 2], 30);

      // An empty field keeps the wheels' time even when they aren't moved: Rest starts at 0:10.
      fireEvent.press(screen.getByLabelText('Rest, round 1, not set'));
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));
      expect(actions.onSetRoundTime).toHaveBeenLastCalledWith('rest', [1, 2], 10);

      expect(screen.queryByText(/Pick work and rest/)).toBeNull();
      fireEvent.press(screen.getByLabelText('Log round 1'));
      expect(actions.onLogRound).toHaveBeenCalledWith(1, { workSec: 30, restSec: 10 });
      fireEvent.press(screen.getByTestId('start-timer-session-exercise-bag'));
      expect(actions.onStartTimer).toHaveBeenCalledWith([
        { roundNumber: 1, workSec: 30, restSec: 10 },
        { roundNumber: 2, workSec: 30, restSec: 10 },
      ]);
    });

    test('opening a field that has a time and closing it saves nothing', () => {
      const actions = renderEmpty(ROUNDS);

      fireEvent.press(screen.getByLabelText('Rest, round 1, 0:45'));
      fireEvent.press(screen.getByRole('button', { name: 'Done' }));

      expect(actions.onSetRoundTime).not.toHaveBeenCalled();
    });
  });

  test('DoD: one tap on Log logs the round with its fields; a tap on a filled one un-logs it', () => {
    const onLogRound = jest.fn();
    const onUnlogRound = jest.fn();
    const exercise = makeInterval({
      rounds: [
        {
          ...ROUNDS[0]!,
          isFirstUnlogged: false,
          log: { workSec: 120, restSec: 45, restSkipped: false, completed: true },
        },
        { ...ROUNDS[1]!, isFirstUnlogged: true },
        ROUNDS[2]!,
      ],
      loggedRoundCount: 1,
      hasLoggedSets: true,
    });
    render(
      <WorkoutExerciseCard {...makeProps({ exercise, rounds: { onLogRound, onUnlogRound } })} />,
    );

    fireEvent.press(screen.getByLabelText('Log round 2'));
    fireEvent.press(screen.getByLabelText('Round 1 logged'));

    expect(onLogRound).toHaveBeenCalledWith(2, { workSec: 120, restSec: 45 });
    expect(onUnlogRound).toHaveBeenCalledWith(1);
  });

  test('DoD: a time is picked on the wheels and the rounds below follow; Log takes it', () => {
    const onLogRound = jest.fn();
    render(<WorkoutExerciseCard {...makeProps({ rounds: { onLogRound } })} />);

    fireEvent.press(screen.getByLabelText('Rest, round 1, 0:45'));
    expect(screen.getByText('Rest · round 1')).toBeTruthy();
    expect(screen.getByText('Rounds below follow until you log them')).toBeTruthy();
    act(() => {
      screen.UNSAFE_getByType(TimePickerSheet).props.onChange(30);
    });
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(within(screen.getByTestId('round-row-2')).getByText('0:30')).toBeTruthy();
    expect(within(screen.getByTestId('round-row-3')).getByText('0:30')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Log round 1'));
    expect(onLogRound).toHaveBeenCalledWith(1, { workSec: 120, restSec: 30 });
  });

  test('a round added from the menu follows the time picked above it (GT-91)', () => {
    const { rerender } = render(<WorkoutExerciseCard {...makeProps()} />);

    fireEvent.press(screen.getByLabelText('Work, round 1, 2:00'));
    act(() => {
      screen.UNSAFE_getByType(TimePickerSheet).props.onChange(135);
    });
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    // The stored round 4 is planned like round 3: 2:00 of work.
    const added = [
      ...ROUNDS,
      { roundNumber: 4, workSec: 120, restSec: 45, isFirstUnlogged: false },
    ];
    rerender(<WorkoutExerciseCard {...makeProps({ exercise: makeInterval({ rounds: added }) })} />);

    expect(within(screen.getByTestId('round-row-4')).getByText('2:15')).toBeTruthy();
  });

  test('a logged round and a read-only card have no picker to open', () => {
    const exercise = makeInterval({
      rounds: [
        {
          ...ROUNDS[0]!,
          isFirstUnlogged: false,
          log: { workSec: 120, restSec: 45, restSkipped: false, completed: true },
        },
        { ...ROUNDS[1]!, isFirstUnlogged: true },
        ROUNDS[2]!,
      ],
    });
    render(<WorkoutExerciseCard {...makeProps({ exercise })} />);
    fireEvent.press(screen.getByLabelText('Work, round 1, 2:00'));
    expect(screen.queryByText('Work · round 1')).toBeNull();

    render(<WorkoutExerciseCard {...makeProps({ mode: 'readonly' })} />);
    fireEvent.press(screen.getAllByLabelText('Work, round 2, 2:00').at(-1)!);
    expect(screen.queryByText('Work · round 2')).toBeNull();
  });

  test('read-only rounds have nothing to press, and a save in flight holds Log', () => {
    const onLogRound = jest.fn();
    const { rerender } = render(
      <WorkoutExerciseCard {...makeProps({ mode: 'readonly', rounds: { onLogRound } })} />,
    );
    fireEvent.press(screen.getByLabelText('Log round 1'));

    rerender(<WorkoutExerciseCard {...makeProps({ isSaving: true, rounds: { onLogRound } })} />);
    fireEvent.press(screen.getByLabelText('Log round 1'));

    expect(onLogRound).not.toHaveBeenCalled();
  });

  test('a preview shows the Not programmed yet plate and no rounds', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({ mode: 'preview', exercise: makeInterval({ rounds: [] }) })}
      />,
    );

    expect(screen.getByText('Not programmed yet')).toBeTruthy();
    expect(screen.queryByText('Round')).toBeNull();
  });
});
