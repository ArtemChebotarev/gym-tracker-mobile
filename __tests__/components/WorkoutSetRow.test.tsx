import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { WorkoutSetRow, type WorkoutSetRowProps } from '@components/WorkoutSetRow';
import { COLORS } from '@design/tokens';
import { initialWeightText } from '@components/WorkoutSetRowLogic';
import type { WorkoutSetRow as WorkoutSetRowModel } from '@usecases/workoutSession';

const UNLOGGED: WorkoutSetRowModel = {
  setNumber: 1,
  targetReps: 10,
  suggestedWeight: 62.5,
  isFirstUnlogged: true,
};

function logged(reps: number, overrides: Partial<WorkoutSetRowModel> = {}): WorkoutSetRowModel {
  return {
    setNumber: 1,
    targetReps: 10,
    suggestedWeight: 62.5,
    log: { weight: 62.5, reps },
    indicator:
      reps === 10
        ? { kind: 'hit' }
        : reps > 10
          ? { kind: 'over', diff: reps - 10 }
          : { kind: 'under', diff: 10 - reps },
    isFirstUnlogged: false,
    ...overrides,
  };
}

function makeProps(overrides: Partial<WorkoutSetRowProps> = {}): WorkoutSetRowProps {
  return {
    row: UNLOGGED,
    targetRir: 2,
    weightText: '',
    onChangeWeight: jest.fn(),
    onBlurWeight: jest.fn(),
    editable: true,
    isSaving: false,
    onLog: jest.fn(),
    onUnlog: jest.fn(),
    ...overrides,
  };
}

/**
 * The row's Weight field is controlled by the exercise card (task 106), so these tests supply the
 * smallest stand-in for it: the text starts at the row's suggested weight and follows what's typed.
 * Carrying a weight into the later sets is the card's own logic, tested in WorkoutExerciseCard.
 */
function ControlledRow(props: WorkoutSetRowProps) {
  const [weightText, setWeightText] = useState(() => initialWeightText(props.row));

  return (
    <WorkoutSetRow
      {...props}
      weightText={weightText}
      onChangeWeight={(text) => {
        setWeightText(text);
        props.onChangeWeight(text);
      }}
    />
  );
}

function renderRow(overrides: Partial<WorkoutSetRowProps> = {}) {
  return render(<ControlledRow {...makeProps(overrides)} />);
}

function logButton() {
  return screen.getByRole('checkbox', { name: 'Log set 1' });
}

function flatStyle(element: ReturnType<typeof screen.getByRole>) {
  const { style } = element.props;
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

describe('WorkoutSetRow — unlogged', () => {
  test('Weight holds the suggested weight as a value; Reps is empty with the target as placeholder', () => {
    renderRow();

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('62.5');
    expect(screen.getByLabelText('Set 1 reps').props.value).toBe('');
    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('10');
  });

  test('Weight is empty with a `–` placeholder when there is no suggested weight', () => {
    renderRow({ row: { setNumber: 1, isFirstUnlogged: false } });

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('');
    expect(screen.getByLabelText('Set 1 weight').props.placeholder).toBe('–');
    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('2 RIR');
  });

  test('a deload row shows last week’s actual reps as the placeholder', () => {
    renderRow({ row: { setNumber: 1, referenceReps: 9, isFirstUnlogged: true } });

    expect(screen.getByLabelText('Set 1 reps').props.placeholder).toBe('9');
  });

  test('decimal keyboard for Weight, whole-number keyboard for Reps', () => {
    renderRow();

    expect(screen.getByLabelText('Set 1 weight').props.keyboardType).toBe('decimal-pad');
    expect(screen.getByLabelText('Set 1 reps').props.keyboardType).toBe('number-pad');
  });

  test('a row left as recommended logs with one tap — the target reps fill the empty field', () => {
    const onLog = jest.fn();
    renderRow({ onLog });

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(logButton());

    expect(onLog).toHaveBeenCalledWith({ weight: 62.5, reps: 10 });
    expect(screen.getByLabelText('Set 1 reps').props.value).toBe('10');
  });

  test('with no target reps, Log stays inactive until reps are typed', () => {
    const onLog = jest.fn();
    renderRow({ row: { setNumber: 1, suggestedWeight: 60, isFirstUnlogged: true }, onLog });

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(logButton());
    expect(onLog).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '9');

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: false });
  });

  test('DoD 104: in a deload, an empty Reps logs the reference reps with one tap', () => {
    const onLog = jest.fn();
    renderRow({
      row: { setNumber: 1, suggestedWeight: 30, referenceReps: 9, isFirstUnlogged: true },
      onLog,
    });

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(logButton());

    expect(onLog).toHaveBeenCalledWith({ weight: 30, reps: 9 });
    expect(screen.getByLabelText('Set 1 reps').props.value).toBe('9');
  });

  test('DoD 104: with only the `N RIR` placeholder, Log still waits for typed reps', () => {
    const onLog = jest.fn();
    renderRow({ row: { setNumber: 1, suggestedWeight: 30, isFirstUnlogged: true }, onLog });

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(logButton());
    expect(onLog).not.toHaveBeenCalled();
  });

  test('Log stays inactive with reps but no weight', () => {
    renderRow();

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '');
    fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '10');

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: true });
  });

  test('Log records what was typed', () => {
    const onLog = jest.fn();
    renderRow({ onLog });

    fireEvent.changeText(screen.getByLabelText('Set 1 weight'), '65');
    fireEvent.changeText(screen.getByLabelText('Set 1 reps'), '8');
    fireEvent.press(logButton());

    expect(onLog).toHaveBeenCalledWith({ weight: 65, reps: 8 });
  });

  test('Log waits while a set is being saved', () => {
    renderRow({ isSaving: true });

    expect(logButton().props.accessibilityState).toMatchObject({ disabled: true });
  });

  test('the first unlogged row of the exercise gets the accent outline, the others do not', () => {
    renderRow();
    expect(flatStyle(logButton()).borderColor).toBe(COLORS.accent);

    screen.rerender(<ControlledRow {...makeProps({ row: { ...UNLOGGED, isFirstUnlogged: false } })} />);
    expect(flatStyle(logButton()).borderColor).toBe(COLORS['border/default']);
  });
});

describe('WorkoutSetRow — logged', () => {
  test('shows the logged numbers, not fields, and a filled Log box', () => {
    renderRow({ row: logged(10) });

    expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
    expect(screen.getByText('62.5')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    const box = screen.getByRole('checkbox', { name: 'Set 1 logged' });
    expect(box.props.accessibilityState).toMatchObject({ checked: true });
    expect(flatStyle(box).backgroundColor).toBe(COLORS.accent);
  });

  test.each([
    ['hit', 10, '✓'],
    ['over', 12, '+2'],
    ['miss', 9, '−1'],
  ])('DoD: the indicator for a %s', (_case, reps, text) => {
    renderRow({ row: logged(reps) });

    expect(screen.getByText(text)).toBeTruthy();
  });

  test('DoD: no indicator for a set without target reps', () => {
    const { targetReps: _targetReps, indicator: _indicator, ...row } = logged(10);
    renderRow({ row });

    expect(screen.queryByText('✓')).toBeNull();
    expect(screen.queryByText(/^[+−]\d/)).toBeNull();
  });

  test('DoD: un-logging brings the fields back, holding the logged values', () => {
    // Weight is the card's state since task 106, so it comes back in as a prop here; the card's
    // own test covers it putting the logged weight back.
    const onUnlog = jest.fn();
    const props = makeProps({ row: logged(11, { log: { weight: 65, reps: 11 } }), onUnlog });
    render(<WorkoutSetRow {...props} />);

    fireEvent.press(screen.getByRole('checkbox', { name: 'Set 1 logged' }));
    expect(onUnlog).toHaveBeenCalledTimes(1);

    // Storage answers: the set is no longer logged.
    screen.rerender(<WorkoutSetRow {...props} row={UNLOGGED} weightText="65" />);

    expect(screen.getByLabelText('Set 1 weight').props.value).toBe('65');
    expect(screen.getByLabelText('Set 1 reps').props.value).toBe('11');
    expect(logButton().props.accessibilityState).toMatchObject({ disabled: false });
  });
});

describe('WorkoutSetRow — not editable', () => {
  test('a logged row shows its values with nothing to press', () => {
    renderRow({ row: logged(10), editable: false });

    expect(screen.getByText('62.5')).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  test('an unlogged row shows the suggested weight and placeholder, with no fields', () => {
    renderRow({ editable: false });

    expect(screen.getByText('62.5')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.queryByLabelText('Set 1 weight')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
