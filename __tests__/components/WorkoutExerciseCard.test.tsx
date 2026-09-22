import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  WorkoutExerciseCard,
  type WorkoutExerciseCardProps,
} from '@components/WorkoutExerciseCard';
import { TrashIcon } from '@design/icons/TrashIcon';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { buildWeightSwap } from '@domain/weightSwapRules';
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

function skippedRow(setNumber: number): WorkoutSetRow {
  return { ...unloggedRow(setNumber), isSkipped: true };
}

const SKIPPED_NOTHING_LOGGED = makeExercise({
  status: 'skipped',
  rows: [skippedRow(1), skippedRow(2), skippedRow(3)],
  loggedSetCount: 0,
  hasLoggedSets: false,
});

const SKIPPED_PARTLY_LOGGED = makeExercise({
  status: 'skipped',
  rows: [loggedRow(1, 62.5, 10), loggedRow(2, 62.5, 10), skippedRow(3)],
  loggedSetCount: 2,
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
    menuItems: [],
    isSaving: false,
    onLogSet: jest.fn(),
    onUnlogSet: jest.fn(),
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

  test('the ⋯ menu is there in live mode only, and lists what it was given', () => {
    const onPress = jest.fn();
    const menuItems = [
      { key: 'delete', label: 'Delete exercise', icon: TrashIcon, systemImage: 'trash' as const, onPress },
    ];
    render(<WorkoutExerciseCard {...makeProps({ menuItems })} />);
    fireEvent(screen.getByTestId('exercise-menu-session-exercise-1-delete'), 'buttonPress');
    expect(onPress).toHaveBeenCalledTimes(1);

    screen.rerender(<WorkoutExerciseCard {...makeProps({ mode: 'readonly' })} />);
    expect(screen.queryByTestId('exercise-menu-session-exercise-1')).toBeNull();

    screen.rerender(<WorkoutExerciseCard {...makeProps({ mode: 'preview' })} />);
    expect(screen.queryByTestId('exercise-menu-session-exercise-1')).toBeNull();
  });

  test('the group chip shows only when asked for', () => {
    render(<WorkoutExerciseCard {...makeProps({ showGroupChip: true })} />);
    expect(screen.getByTestId('exercise-group-chip')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();

    screen.rerender(<WorkoutExerciseCard {...makeProps({ showGroupChip: false })} />);
    expect(screen.queryByTestId('exercise-group-chip')).toBeNull();
  });

  test('a skipped card with sets logged is dimmed and shows every row, the unlogged one Skipped', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: SKIPPED_PARTLY_LOGGED })} />);

    const card = screen.getByTestId('exercise-card-session-exercise-1');
    const flatStyle = Object.assign({}, ...card.props.style.filter(Boolean));
    expect(flatStyle.opacity).toBe(0.5);
    expect(screen.getByText('Weight, kg')).toBeTruthy();
    expect(screen.getByTestId('set-row-1')).toBeTruthy();
    expect(screen.getByTestId('set-row-2')).toBeTruthy();
    expect(screen.getByTestId('set-row-3')).toHaveTextContent('Skipped');
    expect(screen.getAllByText('Skipped')).toHaveLength(1);
  });

  test('a skipped exercise with nothing logged shows only the Skipped note, no column header', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: SKIPPED_NOTHING_LOGGED })} />);

    expect(screen.getAllByText('Skipped')).toHaveLength(1);
    expect(screen.queryByText('Weight, kg')).toBeNull();
    expect(screen.queryByTestId('set-row-1')).toBeNull();
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

  test('live rows are editable and hand the set number to the log and un-log handlers', () => {
    const onLogSet = jest.fn();
    const onUnlogSet = jest.fn();
    render(<WorkoutExerciseCard {...makeProps({ onLogSet, onUnlogSet })} />);

    fireEvent.changeText(screen.getByLabelText('Set 2 reps'), '9');
    fireEvent.press(screen.getByRole('checkbox', { name: 'Log set 2' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Set 1 logged' }));

    expect(onLogSet).toHaveBeenCalledWith(2, { weight: 62.5, reps: 9 });
    expect(onUnlogSet).toHaveBeenCalledWith(1);
  });

  test('read-only rows have nothing to type or press', () => {
    render(<WorkoutExerciseCard {...makeProps({ mode: 'readonly' })} />);

    expect(screen.queryByLabelText('Set 2 reps')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  test("a skipped exercise's rows stay read-only in live mode — unskip first", () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: SKIPPED_PARTLY_LOGGED })} />);

    expect(screen.getByTestId('set-row-1')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  test('shows one line per weight hint, and none without hints', () => {
    const { rerender } = render(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeExercise({
            weightHints: [
              { direction: 'increase', reps: 30 },
              { direction: 'decrease', reps: 5 },
            ],
          }),
        })}
      />,
    );

    expect(screen.getAllByTestId('exercise-weight-hint')).toHaveLength(2);
    expect(screen.getByText('Go heavier — 30+ reps last week')).toBeTruthy();
    expect(screen.getByText('Go lighter — under 5 reps last week')).toBeTruthy();

    rerender(<WorkoutExerciseCard {...makeProps()} />);
    expect(screen.queryByTestId('exercise-weight-hint')).toBeNull();
  });
});

describe('WorkoutExerciseCard — the weight carries into the later sets (task 106)', () => {
  /** Artem's example: biceps curls, three sets, nothing suggested and nothing logged yet. */
  const THREE_EMPTY_SETS = makeExercise({
    name: 'Biceps curl',
    rows: [1, 2, 3].map((setNumber) => ({
      setNumber,
      targetReps: 10,
      isFirstUnlogged: setNumber === 1,
    })),
    loggedSetCount: 0,
    hasLoggedSets: false,
  });

  function weightFields() {
    return [1, 2, 3].map((n) => screen.getByLabelText(`Set ${n} weight`).props.value);
  }

  function enterWeight(setNumber: number, text: string) {
    const field = screen.getByLabelText(`Set ${setNumber} weight`);
    fireEvent.changeText(field, text);
    fireEvent(field, 'blur');
  }

  test('DoD: 20 kg in set 1 fills all three sets once the cursor leaves the field', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: THREE_EMPTY_SETS })} />);

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '20');
    expect(weightFields()).toEqual(['20', '', '']);

    fireEvent(screen.getByLabelText('Set 1 weight'), 'blur');
    expect(weightFields()).toEqual(['20', '20', '20']);
  });

  test('DoD: with set 1 logged, 25 kg in set 2 moves set 3 only', () => {
    const exercise = makeExercise({
      ...THREE_EMPTY_SETS,
      rows: [
        { setNumber: 1, targetReps: 10, log: { weight: 20, reps: 10 }, isFirstUnlogged: false },
        { setNumber: 2, targetReps: 10, isFirstUnlogged: true },
        { setNumber: 3, targetReps: 10, isFirstUnlogged: false },
      ],
      loggedSetCount: 1,
      hasLoggedSets: true,
    });
    render(<WorkoutExerciseCard {...makeProps({ exercise })} />);

    enterWeight(2, '25');

    expect(screen.getByLabelText('Set 2 weight').props.value).toBe('25');
    expect(screen.getByLabelText('Set 3 weight').props.value).toBe('25');
    // Set 1 is logged — it has no field at all, and still reads what was logged.
    expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
    expect(screen.getByText('20')).toBeTruthy();
  });

  test('DoD: a set the user set by hand is not overwritten by a later correction', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: THREE_EMPTY_SETS })} />);

    enterWeight(3, '30');
    enterWeight(1, '20');

    expect(weightFields()).toEqual(['20', '20', '30']);
  });

  test('un-logging a set brings its logged weight back into the field', () => {
    const exercise = makeExercise({
      ...THREE_EMPTY_SETS,
      rows: [
        { setNumber: 1, targetReps: 10, log: { weight: 65, reps: 11 }, isFirstUnlogged: false },
        { setNumber: 2, targetReps: 10, isFirstUnlogged: true },
        { setNumber: 3, targetReps: 10, isFirstUnlogged: false },
      ],
      loggedSetCount: 1,
      hasLoggedSets: true,
    });
    const onUnlogSet = jest.fn();
    const { rerender } = render(
      <WorkoutExerciseCard {...makeProps({ exercise, onUnlogSet })} />,
    );

    fireEvent.press(screen.getByRole('checkbox', { name: 'Set 1 logged' }));
    expect(onUnlogSet).toHaveBeenCalledWith(1);

    // Storage answers: the set is no longer logged.
    rerender(
      <WorkoutExerciseCard {...makeProps({ exercise: THREE_EMPTY_SETS, onUnlogSet })} />,
    );

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('65');
  });

  test('reps do not carry — only the weight does', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: THREE_EMPTY_SETS })} />);

    const reps = screen.getByLabelText('Set 1 reps');
    fireEvent.changeText(reps, '12');
    fireEvent(reps, 'blur');

    expect([2, 3].map((n) => screen.getByLabelText(`Set ${n} reps`).props.value)).toEqual(['', '']);
  });

  test('replacing the exercise starts the fields over from the new suggestions', () => {
    const { rerender } = render(
      <WorkoutExerciseCard {...makeProps({ exercise: THREE_EMPTY_SETS })} />,
    );
    enterWeight(1, '20');
    expect(weightFields()).toEqual(['20', '20', '20']);

    // Same slot in the session, a different exercise in it (08.7, "Replace exercise").
    rerender(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeExercise({
            ...THREE_EMPTY_SETS,
            exerciseId: 'exercise-hammer-curl',
            name: 'Hammer curl',
          }),
        })}
      />,
    );

    expect(weightFields()).toEqual(['', '', '']);
  });
});

describe('WorkoutExerciseCard — bodyweight exercises (task 105)', () => {
  const PULL_UP = makeExercise({
    name: 'Pull Up',
    equipment: 'bodyweight',
    rows: [1, 2].map((setNumber) => ({
      setNumber,
      targetReps: 10,
      isFirstUnlogged: setNumber === 1,
    })),
    loggedSetCount: 0,
    hasLoggedSets: false,
  });

  const WEIGHTED = makeExercise({
    name: 'Pull Up Weighted',
    equipment: 'bodyweight-weighted',
    rows: [{ setNumber: 1, targetReps: 8, suggestedWeight: 10, isFirstUnlogged: true }],
    loggedSetCount: 0,
    hasLoggedSets: false,
  });

  test("DoD: a pure bodyweight row starts at the block's body weight", () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: PULL_UP, bodyWeight: 80 })} />);

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('80');
    expect(screen.getByLabelText('Set 2 weight').props.value).toBe('80');
  });

  test('DoD: with no body weight yet, the Weight cell asks for one instead of taking a number', () => {
    const onRequestBodyWeight = jest.fn();
    render(
      <WorkoutExerciseCard {...makeProps({ exercise: PULL_UP, onRequestBodyWeight })} />,
    );

    // No field to type into — the load is your body weight, and the block doesn't know it yet.
    expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
    fireEvent.press(screen.getAllByRole('button', { name: 'Set your body weight' })[0]!);

    expect(onRequestBodyWeight).toHaveBeenCalledTimes(1);
  });

  test('DoD: a weighted exercise asks too — its total needs the body weight', () => {
    const onRequestBodyWeight = jest.fn();
    render(<WorkoutExerciseCard {...makeProps({ exercise: WEIGHTED, onRequestBodyWeight })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Set your body weight' }));

    expect(onRequestBodyWeight).toHaveBeenCalledTimes(1);
  });

  test('DoD: once the block has a body weight the cell is an ordinary field again', () => {
    const onRequestBodyWeight = jest.fn();
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: PULL_UP, bodyWeight: 80, onRequestBodyWeight })}
      />,
    );

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('80');
    expect(screen.queryByRole('button', { name: 'Set your body weight' })).toBeNull();
  });

  test('a read-only card never asks — there is nothing to log there', () => {
    const onRequestBodyWeight = jest.fn();
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: PULL_UP, mode: 'readonly', onRequestBodyWeight })}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Set your body weight' })).toBeNull();
  });

  test("DoD: editing a pure bodyweight row sets the block's body weight", () => {
    const onBodyWeightChange = jest.fn();
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: PULL_UP, bodyWeight: 80, onBodyWeightChange })}
      />,
    );

    const field = screen.getByLabelText('Set 1 weight');
    fireEvent.changeText(field, '82.5');
    fireEvent(field, 'blur');

    expect(onBodyWeightChange).toHaveBeenCalledWith(82.5);
  });

  test('leaving the field at the same weight changes nothing', () => {
    const onBodyWeightChange = jest.fn();
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: PULL_UP, bodyWeight: 80, onBodyWeightChange })}
      />,
    );

    fireEvent(screen.getByLabelText('Set 1 weight'), 'blur');

    expect(onBodyWeightChange).not.toHaveBeenCalled();
  });

  test('DoD: a weighted row holds the added weight, and the column says so', () => {
    const onBodyWeightChange = jest.fn();
    render(
      <WorkoutExerciseCard
        {...makeProps({ exercise: WEIGHTED, bodyWeight: 80, onBodyWeightChange })}
      />,
    );

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('10');
    expect(screen.getByText('Added, kg')).toBeTruthy();
    expect(screen.queryByText('Weight, kg')).toBeNull();

    // Editing it is an ordinary weight edit — it isn't the body weight.
    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '12');
    fireEvent(screen.getByLabelText('Set 1 weight'), 'blur');
    expect(onBodyWeightChange).not.toHaveBeenCalled();
  });

  test('DoD: logging a weighted set carries the body weight of the moment', () => {
    const onLogSet = jest.fn();
    render(
      <WorkoutExerciseCard {...makeProps({ exercise: WEIGHTED, bodyWeight: 80, onLogSet })} />,
    );

    fireEvent.press(screen.getByRole('checkbox', { name: 'Log set 1' }));

    expect(onLogSet).toHaveBeenCalledWith(1, { weight: 10, reps: 8, bodyWeight: 80 });
  });

  test('DoD: a logged weighted set reads as the body weight it was logged with, plus what was added', () => {
    const logged = makeExercise({
      ...WEIGHTED,
      rows: [
        {
          setNumber: 1,
          targetReps: 8,
          log: { weight: 10, reps: 8, bodyWeight: 80 },
          isFirstUnlogged: false,
        },
      ],
      loggedSetCount: 1,
      hasLoggedSets: true,
    });
    render(<WorkoutExerciseCard {...makeProps({ exercise: logged, bodyWeight: 82 })} />);

    // 80, the body weight it was logged with — not 82, today's (05, "История неизменяема").
    expect(screen.getByText('80 (+10)')).toBeTruthy();
  });

  test('an ordinary exercise keeps the plain Weight column', () => {
    render(<WorkoutExerciseCard {...makeProps({ bodyWeight: 80 })} />);

    expect(screen.getByText('Weight, kg')).toBeTruthy();
  });
});

// Weight swap on the card — 08.7.1 · Другой вес (task 121). The numbers are the swap's (task 120);
// these are about what the card puts on screen around them.
describe('WorkoutExerciseCard — another weight (task 121)', () => {
  const swap = buildWeightSwap({
    target: { targetReps: 10, suggestedWeight: 15 },
    settings: defaultProgressionSettings,
    isDeload: false,
    equipment: 'dumbbell',
  });

  function swapRow(setNumber: number, isFirstUnlogged = false): WorkoutSetRow {
    return { setNumber, targetReps: 10, suggestedWeight: 15, weightSwap: swap, isFirstUnlogged };
  }

  const CURL = makeExercise({
    name: 'Dumbbell curl',
    equipment: 'dumbbell',
    rows: [swapRow(1, true), swapRow(2), swapRow(3)],
    loggedSetCount: 0,
    hasLoggedSets: false,
  });

  const info = () => screen.queryByRole('button', { name: 'Weight recommendations' });

  test('the ⓘ sits beside Reps when the next set has a swap', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    expect(info()).toBeTruthy();
  });

  test('no swap, no ⓘ — a deload set or a pure bodyweight one', () => {
    render(<WorkoutExerciseCard {...makeProps()} />);

    expect(info()).toBeNull();
  });

  test('a set with no history still gets the ⓘ, to say why there are no numbers', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeExercise({
            rows: [
              { setNumber: 1, weightSwap: { unavailable: 'no_history' }, isFirstUnlogged: true },
            ],
          }),
        })}
      />,
    );

    expect(info()).toBeTruthy();
  });

  test('read-only has nothing to swap a weight for', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL, mode: 'readonly' })} />);

    expect(info()).toBeNull();
  });

  test('typing a far weight explains the estimate under the sets', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    expect(screen.queryByTestId('inline-note')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '10');

    expect(screen.getByTestId('inline-note')).toHaveTextContent(
      '~ Estimated from 15 kg × 10. Stop at 2 RIR, not at the number.',
    );
    // Every row is recomputed from its own target — all three target 10 here.
    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('~19');
  });

  test('a weight past the rep corridor drops the target and says how far it reaches', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '20');

    expect(screen.getByTestId('inline-note')).toHaveTextContent(
      '20 kg is too heavy for 5+ reps. Up to 17.5 kg keeps a rep target.',
    );
    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('2 RIR');
  });

  test('a close weight needs no explaining — it reads as an ordinary target', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '14');

    expect(screen.queryByTestId('inline-note')).toBeNull();
    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('12');
  });
});

describe('WorkoutExerciseCard — the ⓘ popover (task 121)', () => {
  const swap = buildWeightSwap({
    target: { targetReps: 10, suggestedWeight: 15 },
    settings: defaultProgressionSettings,
    isDeload: false,
    equipment: 'dumbbell',
  });

  const CURL = makeExercise({
    name: 'Dumbbell curl',
    equipment: 'dumbbell',
    rows: [
      { setNumber: 1, targetReps: 10, suggestedWeight: 15, weightSwap: swap, isFirstUnlogged: true },
      { setNumber: 2, targetReps: 9, suggestedWeight: 15, weightSwap: swap, isFirstUnlogged: false },
    ],
    loggedSetCount: 0,
    hasLoggedSets: false,
  });

  function openInfo() {
    fireEvent.press(screen.getByRole('button', { name: 'Weight recommendations' }));
  }

  test('it opens on the ⓘ and shows the ranges of the set that is next to do', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    expect(screen.queryByTestId('popover')).toBeNull();

    openInfo();

    expect(screen.getByTestId('popover')).toBeTruthy();
    expect(screen.getByText('Current set target: 15 kg × 10')).toBeTruthy();
    expect(screen.getByText('Recommended weight')).toBeTruthy();
    expect(screen.getByText('12–17.5 kg')).toBeTruthy();
    expect(screen.getByText('Not ideal, but acceptable')).toBeTruthy();
  });

  test('a tap beside it closes it again', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);
    openInfo();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByTestId('popover')).toBeNull();
  });

  test('it always speaks for the original target, whatever is in the field', () => {
    render(<WorkoutExerciseCard {...makeProps({ exercise: CURL })} />);

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '10');
    openInfo();

    expect(screen.getByText('Current set target: 15 kg × 10')).toBeTruthy();
  });

  test('with no history it says why there are no numbers', () => {
    render(
      <WorkoutExerciseCard
        {...makeProps({
          exercise: makeExercise({
            targetRir: 3,
            rows: [
              { setNumber: 1, weightSwap: { unavailable: 'no_history' }, isFirstUnlogged: true },
            ],
          }),
        })}
      />,
    );

    openInfo();

    expect(screen.getByText('Not enough history yet')).toBeTruthy();
    expect(
      screen.getByText(/Pick a weight you can lift for about 3 reps short of failure/),
    ).toBeTruthy();
  });
});
