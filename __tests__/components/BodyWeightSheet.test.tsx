import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { BodyWeightSheet, type BodyWeightSheetProps } from '@components/BodyWeightSheet';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

function makeProps(overrides: Partial<BodyWeightSheetProps> = {}): BodyWeightSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    value: '',
    onChangeValue: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
    ...overrides,
  };
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save' });
}

describe('BodyWeightSheet', () => {
  test('asks for the body weight, and says what it is for', () => {
    renderWithSafeArea(<BodyWeightSheet {...makeProps()} />);

    expect(screen.getByText('Your body weight')).toBeTruthy();
    expect(screen.getByText("Used for this mesocycle's bodyweight exercises")).toBeTruthy();
    expect(screen.getByLabelText('Body weight, kg')).toBeTruthy();
  });

  test.each(['', '0', '-80', 'eighty'])(
    'DoD: Save waits while the field holds %p — that is no body weight',
    (value) => {
      const onSave = jest.fn();
      renderWithSafeArea(<BodyWeightSheet {...makeProps({ value, onSave })} />);

      expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(saveButton());
      expect(onSave).not.toHaveBeenCalled();
    },
  );

  test('DoD: saves the parsed weight', () => {
    const onSave = jest.fn();
    renderWithSafeArea(<BodyWeightSheet {...makeProps({ value: '82,5', onSave })} />);

    fireEvent.press(saveButton());

    expect(onSave).toHaveBeenCalledWith(82.5);
  });

  test('Save waits while the save is in flight, so a double tap cannot repeat it', () => {
    const onSave = jest.fn();
    renderWithSafeArea(
      <BodyWeightSheet {...makeProps({ value: '80', isSaving: true, onSave })} />,
    );

    expect(saveButton().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(saveButton());
    expect(onSave).not.toHaveBeenCalled();
  });

  test('typing reaches the caller — the sheet holds no state of its own', () => {
    const onChangeValue = jest.fn();
    renderWithSafeArea(<BodyWeightSheet {...makeProps({ onChangeValue })} />);

    fireEvent.changeText(screen.getByLabelText('Body weight, kg'), '80');

    expect(onChangeValue).toHaveBeenCalledWith('80');
  });
});
