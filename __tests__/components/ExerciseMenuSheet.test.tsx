import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  ExerciseMenuSheet,
  type ExerciseMenuSheetProps,
} from '@components/ExerciseMenuSheet';

function renderSheet(overrides: Partial<ExerciseMenuSheetProps> = {}) {
  const props: ExerciseMenuSheetProps = {
    visible: true,
    onClose: jest.fn(),
    exerciseName: 'Bench Press',
    actions: ['hide'],
    onEdit: jest.fn(),
    onHide: jest.fn(),
    ...overrides,
  };
  render(<ExerciseMenuSheet {...props} />);
  return props;
}

/** Presses the confirming button of the Alert the sheet raised. */
function confirmAlert(spy: jest.SpyInstance, label: string) {
  const buttons = spy.mock.calls.at(-1)?.[2] as
    | { text?: string; onPress?: () => void }[]
    | undefined;
  buttons?.find((button) => button.text === label)?.onPress?.();
}

describe('ExerciseMenuSheet', () => {
  test('a catalog exercise offers Hide and nothing else', () => {
    renderSheet({ actions: ['hide'] });

    expect(screen.getByRole('button', { name: 'Hide' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });

  test('a custom exercise offers Edit as well', () => {
    renderSheet({ actions: ['edit', 'hide'] });

    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hide' })).toBeTruthy();
  });

  test('there is never a Delete action', () => {
    renderSheet({ actions: ['edit', 'hide'] });

    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  test('Edit closes the sheet and opens the form', () => {
    const props = renderSheet({ actions: ['edit', 'hide'] });

    fireEvent.press(screen.getByRole('button', { name: 'Edit' }));

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onEdit).toHaveBeenCalled();
  });

  test('Hide asks first and only hides once confirmed', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const props = renderSheet();

    fireEvent.press(screen.getByRole('button', { name: 'Hide' }));

    expect(props.onClose).toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();
    expect(props.onHide).not.toHaveBeenCalled();

    confirmAlert(alert, 'Hide');
    expect(props.onHide).toHaveBeenCalled();

    alert.mockRestore();
  });
});
