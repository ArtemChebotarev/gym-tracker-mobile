import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { StopMesocycleSheet, type StopMesocycleSheetProps } from '@components/StopMesocycleSheet';
import {
  STOP_MESOCYCLE_PHRASE,
  STOP_MESOCYCLE_WARNING,
} from '@components/StopMesocycleSheetLogic';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

function makeProps(overrides: Partial<StopMesocycleSheetProps> = {}): StopMesocycleSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    mesocycleName: 'Upper/Lower',
    value: '',
    onChangeValue: jest.fn(),
    onConfirm: jest.fn(),
    isStopping: false,
    ...overrides,
  };
}

function stopButton() {
  return screen.getByRole('button', { name: 'Stop mesocycle' });
}

describe('StopMesocycleSheet', () => {
  test('names the block and says what stopping does', () => {
    renderWithSafeArea(<StopMesocycleSheet {...makeProps()} />);

    // Title and button both read `Stop mesocycle` — the sheet says once more what was tapped.
    expect(screen.getAllByText('Stop mesocycle')).toHaveLength(2);
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
    expect(screen.getByText(STOP_MESOCYCLE_WARNING)).toBeTruthy();
    expect(screen.getByLabelText(`Type ${STOP_MESOCYCLE_PHRASE} to confirm`)).toBeTruthy();
  });

  test.each(['', 'END', 'yes'])(
    'DoD: the button waits while the field holds %p — a tap is not enough here',
    (value) => {
      const onConfirm = jest.fn();
      renderWithSafeArea(<StopMesocycleSheet {...makeProps({ value, onConfirm })} />);

      expect(stopButton().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(stopButton());
      expect(onConfirm).not.toHaveBeenCalled();
    },
  );

  test('DoD: the typed phrase releases it', () => {
    const onConfirm = jest.fn();
    renderWithSafeArea(
      <StopMesocycleSheet {...makeProps({ value: STOP_MESOCYCLE_PHRASE, onConfirm })} />,
    );

    expect(stopButton().props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(stopButton());

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('waits while the stop is in flight, so a double tap cannot repeat it', () => {
    const onConfirm = jest.fn();
    renderWithSafeArea(
      <StopMesocycleSheet
        {...makeProps({ value: STOP_MESOCYCLE_PHRASE, isStopping: true, onConfirm })}
      />,
    );

    expect(stopButton().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(stopButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('typing reaches the caller — the sheet holds no state of its own', () => {
    const onChangeValue = jest.fn();
    renderWithSafeArea(<StopMesocycleSheet {...makeProps({ onChangeValue })} />);

    fireEvent.changeText(
      screen.getByLabelText(`Type ${STOP_MESOCYCLE_PHRASE} to confirm`),
      'END ME',
    );

    expect(onChangeValue).toHaveBeenCalledWith('END ME');
  });
});
