import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  MesoCreationMethodSheet,
  type MesoCreationMethodSheetProps,
} from '@components/MesoCreationMethodSheet';
import { copyMethodCaption } from '@components/MesoCreationMethodSheetLogic';

// BottomSheet's SafeAreaView throws without a SafeAreaProvider ancestor.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

function makeProps(
  overrides: Partial<MesoCreationMethodSheetProps> = {},
): MesoCreationMethodSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    canCopy: true,
    onCreateFromScratch: jest.fn(),
    onCopyMesocycle: jest.fn(),
    ...overrides,
  };
}

describe('MesoCreationMethodSheet', () => {
  test('offers the two ways to build a block, each with its own line', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    expect(screen.getByRole('button', { name: 'From scratch' })).toBeTruthy();
    expect(screen.getByText('Build the week yourself')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy a mesocycle' })).toBeTruthy();
    expect(screen.getByText(copyMethodCaption(true))).toBeTruthy();
  });

  // Templates don't exist in this version, so the sheet has no row for them at all — a disabled
  // one would promise a feature that isn't there (08.8, "Лист «Способ создания»").
  test('has no third row for templates, not even a disabled one', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    expect(screen.queryByText(/template/i)).toBeNull();
  });

  test('DoD: From scratch leads to Flow A', () => {
    const onCreateFromScratch = jest.fn();
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ onCreateFromScratch })} />);

    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    expect(onCreateFromScratch).toHaveBeenCalledTimes(1);
  });

  test('DoD: Copy a mesocycle leads to Flow C', () => {
    const onCopyMesocycle = jest.fn();
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ onCopyMesocycle })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Copy a mesocycle' }));

    expect(onCopyMesocycle).toHaveBeenCalledTimes(1);
  });

  // DoD: with nothing to copy the row is off, and its own line says why rather than leaving a
  // greyed-out row unexplained.
  test('DoD: without anything to copy the second row is off and explains itself', () => {
    const onCopyMesocycle = jest.fn();
    renderWithSafeArea(
      <MesoCreationMethodSheet {...makeProps({ canCopy: false, onCopyMesocycle })} />,
    );

    const row = screen.getByRole('button', { name: 'Copy a mesocycle' });
    expect(row).toBeDisabled();
    expect(screen.getByText(copyMethodCaption(false))).toBeTruthy();
    expect(screen.queryByText(copyMethodCaption(true))).toBeNull();

    fireEvent.press(row);
    expect(onCopyMesocycle).not.toHaveBeenCalled();
  });

  test('From scratch stays available with nothing to copy', () => {
    const onCreateFromScratch = jest.fn();
    renderWithSafeArea(
      <MesoCreationMethodSheet {...makeProps({ canCopy: false, onCreateFromScratch })} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    expect(onCreateFromScratch).toHaveBeenCalledTimes(1);
  });

  // DoD: the sheet closes from outside too — the backdrop is BottomSheet's own dismiss.
  test('DoD: dismissing from outside calls onClose', () => {
    const onClose = jest.fn();
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ onClose })} />);

    fireEvent.press(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders nothing while closed', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ visible: false })} />);

    expect(screen.queryByRole('button', { name: 'From scratch' })).toBeNull();
  });
});
