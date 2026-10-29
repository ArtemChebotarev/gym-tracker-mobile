import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExerciseTypeSheet, type ExerciseTypeSheetProps } from '@components/ExerciseTypeSheet';

function renderSheet(overrides: Partial<ExerciseTypeSheetProps> = {}) {
  const props: ExerciseTypeSheetProps = {
    visible: true,
    type: 'strength',
    onChangeType: jest.fn(),
    onNext: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<ExerciseTypeSheet {...props} />);
  return props;
}

describe('ExerciseTypeSheet', () => {
  test('offers the four types, the current one selected', () => {
    renderSheet({ type: 'interval' });

    for (const name of ['Strength', 'Power', 'Timed work', 'Mobility']) {
      expect(screen.getByRole('radio', { name })).toBeTruthy();
    }
    expect(screen.getByRole('radio', { name: 'Timed work' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Power' }).props.accessibilityState.checked).toBe(false);
  });

  test('tapping a type reports it, and moving on is a separate Next', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('radio', { name: 'Mobility' }));
    expect(props.onChangeType).toHaveBeenCalledWith('mobility');
    expect(props.onNext).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(props.onNext).toHaveBeenCalledTimes(1);
  });

  test('Cancel closes without moving on', () => {
    const props = renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onNext).not.toHaveBeenCalled();
  });
});
