import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  RenameMesocycleSheet,
  type RenameMesocycleSheetProps,
} from '@components/RenameMesocycleSheet';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

function makeProps(overrides: Partial<RenameMesocycleSheetProps> = {}): RenameMesocycleSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    value: 'Upper/Lower',
    onChangeValue: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
    ...overrides,
  };
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save' });
}

describe('RenameMesocycleSheet', () => {
  test('shows the name it was given, ready to be edited', () => {
    renderWithSafeArea(<RenameMesocycleSheet {...makeProps()} />);

    expect(screen.getByText('Rename mesocycle')).toBeTruthy();
    expect(screen.getByLabelText('Mesocycle name').props.value).toBe('Upper/Lower');
  });

  test.each(['', '   ', '\t'])(
    'DoD: Save waits while the field holds %p — an empty name is no name',
    (value) => {
      const onSave = jest.fn();
      renderWithSafeArea(<RenameMesocycleSheet {...makeProps({ value, onSave })} />);

      expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(saveButton());
      expect(onSave).not.toHaveBeenCalled();
    },
  );

  test('hands the typed name over on Save — untrimmed, the domain trims it', () => {
    const onSave = jest.fn();
    renderWithSafeArea(<RenameMesocycleSheet {...makeProps({ value: '  Autumn  ', onSave })} />);

    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(saveButton());

    expect(onSave).toHaveBeenCalledWith('  Autumn  ');
  });

  test('waits while the rename is in flight, so a double tap cannot repeat it', () => {
    const onSave = jest.fn();
    renderWithSafeArea(<RenameMesocycleSheet {...makeProps({ isSaving: true, onSave })} />);

    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  test('typing reaches the caller — the sheet holds no state of its own', () => {
    const onChangeValue = jest.fn();
    renderWithSafeArea(<RenameMesocycleSheet {...makeProps({ onChangeValue })} />);

    fireEvent.changeText(screen.getByLabelText('Mesocycle name'), 'Autumn block');

    expect(onChangeValue).toHaveBeenCalledWith('Autumn block');
  });
});
