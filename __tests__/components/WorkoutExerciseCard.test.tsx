import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  WorkoutExerciseCard,
  type WorkoutExerciseCardProps,
} from '@components/WorkoutExerciseCard';
import type { WorkoutExercise, WorkoutSetRow } from '@usecases/workoutSession';

const NO_ACTIONS: WorkoutExercise['actions'] = {
  canReplace: false,
  canAddSet: false,
  canRemoveLastSet: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};

function loggedRow(setNumber: number, weight: number, reps: number): WorkoutSetRow {
  return {
    setNumber,
    targetReps: 10,
    suggestedWeight: weight,
    log: { weight, reps },
    indicator: reps === 10 ? { kind: 'hit' } : { kind: reps > 10 ? 'over' : 'under', diff: 1 },
    isFirstUnlogged: false,
  };
}

function unloggedRow(setNumber: number, isFirstUnlogged = false): WorkoutSetRow {
  return { setNumber, targetReps: 10, suggestedWeight: 62.5, isFirstUnlogged };
}

function makeExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'exercise-bench-press',
    name: 'Bench press',
    muscleGroup: 'chest',
    equipment: 'barbell',
    targetRir: 2,
    status: 'planned',
    rows: [loggedRow(1, 62.5, 10), unloggedRow(2, true), unloggedRow(3)],
    hasSkippedRows: false,
    plannedSetCount: 3,
    loggedSetCount: 1,
    hasLoggedSets: true,
    actions: NO_ACTIONS,
    ...overrides,
  };
}

const LIVE_EXERCISE = makeExercise();

const COMPLETED_EXERCISE = makeExercise({
  status: 'completed',
  rows: [loggedRow(1, 62.5, 10), loggedRow(2, 62.5, 11), loggedRow(3, 62.5, 9)],
  loggedSetCount: 3,
});

const SKIPPED_NOTHING_LOGGED = makeExercise({
  status: 'skipped',
  rows: [],
  hasSkippedRows: true,
  loggedSetCount: 0,
  hasLoggedSets: false,
});

const SKIPPED_PARTLY_LOGGED = makeExercise({
  status: 'skipped',
  rows: [loggedRow(1, 62.5, 10)],
  hasSkippedRows: true,
});

const PREVIEW_EXERCISE = makeExercise({
  targetRir: undefined,
  rows: [],
  plannedSetCount: 0,
  loggedSetCount: 0,
  hasLoggedSets: false,
});

function makeProps(overrides: Partial<WorkoutExerciseCardProps> = {}): WorkoutExerciseCardProps {
  return {
    exercise: LIVE_EXERCISE,
    mode: 'live',
    showGroupChip: true,
    onOpenHistory: jest.fn(),
    onOpenMenu: jest.fn(),
    ...overrides,
  };
}

describe('WorkoutExerciseCard variants', () => {
  test.each<[string, Partial<WorkoutExerciseCardProps>]>([
    ['live', { mode: 'live', exercise: LIVE_EXERCISE }],
    ['read-only', { mode: 'readonly', exercise: COMPLETED_EXERCISE }],
    ['skipped', { mode: 'readonly', exercise: SKIPPED_NOTHING_LOGGED }],
    ['skipped with some sets logged', { mode: 'live', exercise: SKIPPED_PARTLY_LOGGED }],
    ['preview', { mode: 'preview', exercise: PREVIEW_EXERCISE }],
  ])('matches the %s snapshot', (_variant, overrides) => {
    render(<WorkoutExerciseCard {...makeProps(overrides)} />);

    expect(screen.toJSON()).toMatchSnapshot();
  });
});

describe('WorkoutExerciseCard', () => {
  test('shows the name, equipment, RIR badge, and column header', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(screen.getByText('Bench press')).toBeTruthy();
    expect(screen.getByText('Barbell')).toBeTruthy();
    expect(screen.getByText('2 RIR')).toBeTruthy();
    expect(screen.getByText('Weight, kg')).toBeTruthy();
    expect(screen.getByText('Reps')).toBeTruthy();
    expect(screen.getByText('Log')).toBeTruthy();
  });

  test('shows one row per set', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(screen.getByTestId('set-row-1')).toBeTruthy();
    expect(screen.getByTestId('set-row-2')).toBeTruthy();
    expect(screen.getByTestId('set-row-3')).toBeTruthy();
  });

  test('the history button is there in every mode', () => {
    for (const mode of ['live', 'readonly', 'preview'] as const) {
      const onOpenHistory = jest.fn();
      const { unmount } = render(<WorkoutExerciseCard {...makeProps({ mode, onOpenHistory })} />);

      fireEvent.press(screen.getByRole('button', { name: 'Bench press history' }));

      expect(onOpenHistory).toHaveBeenCalledTimes(1);
      unmount();
    }
  });

  test('the ⋯ button is there in live mode only', () => {
    const onOpenMenu = jest.fn();
    render(<WorkoutExerciseCard {...makeProps({ onOpenMenu })} />);
    fireEvent.press(screen.getByRole('button', { name: 'Bench press menu' }));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);

    screen.rerender(<WorkoutExerciseCard {...makeProps({ mode: 'readonly' })} />);
    expect(screen.queryByRole('button', { name: 'Bench press menu' })).toBeNull();

    screen.rerender(<WorkoutExerciseCard {...makeProps({ mode: 'preview' })} />);
    expect(screen.queryByRole('button', { name: 'Bench press menu' })).toBeNull();
  });

  test('the group chip shows only when asked for', () => {
    render(<WorkoutExerciseCard {...makeProps({ showGroupChip: true })} />);
    expect(screen.getByTestId('exercise-group-chip')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();

    screen.rerender(<WorkoutExerciseCard {...makeProps({ showGroupChip: false })} />);
    expect(screen.queryByTestId('exercise-group-chip')).toBeNull();
  });

  test('a skipped card is dimmed and keeps its logged rows, with one Skipped row for the rest', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: SKIPPED_PARTLY_LOGGED })} />);

    const card = screen.getByTestId('exercise-card-session-exercise-1');
    const flatStyle = Object.assign({}, ...card.props.style.filter(Boolean));
    expect(flatStyle.opacity).toBe(0.5);
    expect(screen.getByTestId('set-row-1')).toBeTruthy();
    expect(screen.queryByTestId('set-row-2')).toBeNull();
    expect(screen.getByText('Skipped')).toBeTruthy();
  });

  test('a card that is not skipped is not dimmed and has no Skipped row', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    const card = screen.getByTestId('exercise-card-session-exercise-1');
    const flatStyle = Object.assign({}, ...card.props.style.filter(Boolean));
    expect(flatStyle.opacity).toBeUndefined();
    expect(screen.queryByText('Skipped')).toBeNull();
  });

  test('a preview shows the Not programmed yet plate, with no RIR badge and no sets', () => {
    render(<WorkoutExerciseCard {...makeProps({ mode: 'preview', exercise: makeExercise() })} />);

    expect(screen.getByText('Not programmed yet')).toBeTruthy();
    expect(screen.queryByText('2 RIR')).toBeNull();
    expect(screen.queryByText('Weight, kg')).toBeNull();
    expect(screen.queryByTestId('set-row-1')).toBeNull();
  });

  test('a logged row shows its values and target indicator', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: makeExercise({ rows: [loggedRow(1, 60, 11)] }) })}
      />,
    );

    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
    expect(screen.getByText('+1')).toBeTruthy();
  });

  test('an unlogged row shows the suggested weight and the target reps as a placeholder', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: makeExercise({ rows: [unloggedRow(1)] }) })}
      />,
    );

    expect(screen.getByText('62.5')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });
});
