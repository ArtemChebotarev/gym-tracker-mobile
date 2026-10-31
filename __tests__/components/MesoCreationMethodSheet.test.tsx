import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Modal } from 'react-native';
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

function withSafeArea(ui: ReactElement) {
  return <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>;
}

function renderWithSafeArea(ui: ReactElement) {
  return render(withSafeArea(ui));
}

function makeProps(
  overrides: Partial<MesoCreationMethodSheetProps> = {},
): MesoCreationMethodSheetProps {
  return {
    visible: true,
    onClose: jest.fn(),
    canCopy: true,
    onCreateFromTemplate: jest.fn(),
    onCreateFromScratch: jest.fn(),
    onCopyMesocycle: jest.fn(),
    ...overrides,
  };
}

function card(name: string) {
  return screen.getByRole('radio', { name });
}

function pressNext() {
  fireEvent.press(screen.getByRole('button', { name: 'Next' }));
}

describe('MesoCreationMethodSheet', () => {
  test('is headed like New exercise: a title and one line under it', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    expect(screen.getByText('New cycle')).toBeTruthy();
    expect(screen.getByText('How do you want to start?')).toBeTruthy();
  });

  test('offers the three ways to build a block, each with its own line', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    expect(card('From template')).toBeTruthy();
    expect(screen.getByText('Start from a ready-made split')).toBeTruthy();
    expect(card('From scratch')).toBeTruthy();
    expect(screen.getByText('Build the week yourself')).toBeTruthy();
    expect(card('Copy a cycle')).toBeTruthy();
    expect(screen.getByText(copyMethodCaption(true))).toBeTruthy();
  });

  // 08.10: From template is first — it's the way in for a new user — and carries no `New` label.
  test('lists From template first, with no New label', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    const labels = screen.getAllByRole('radio').map((radio) => radio.props.accessibilityLabel);
    expect(labels).toEqual(['From template', 'From scratch', 'Copy a cycle']);
    expect(screen.queryByText('New')).toBeNull();
  });

  test('DoD: From template is selected by default, so Next always works', () => {
    const onCreateFromTemplate = jest.fn();
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ onCreateFromTemplate })} />);

    expect(card('From template').props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();

    pressNext();

    expect(onCreateFromTemplate).toHaveBeenCalledTimes(1);
  });

  test('DoD: tapping a card selects it and goes nowhere', () => {
    const props = makeProps();
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(card('From scratch'));

    expect(card('From scratch').props.accessibilityState.checked).toBe(true);
    expect(card('From template').props.accessibilityState.checked).toBe(false);
    expect(props.onCreateFromTemplate).not.toHaveBeenCalled();
    expect(props.onCreateFromScratch).not.toHaveBeenCalled();
    expect(props.onCopyMesocycle).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  test('DoD: Next on From scratch leads to Flow A, and only there', () => {
    const props = makeProps();
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(card('From scratch'));
    pressNext();

    expect(props.onCreateFromScratch).toHaveBeenCalledTimes(1);
    expect(props.onCreateFromTemplate).not.toHaveBeenCalled();
    expect(props.onCopyMesocycle).not.toHaveBeenCalled();
  });

  test('DoD: Next on Copy a cycle leads to Flow C, and only there', () => {
    const props = makeProps();
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(card('Copy a cycle'));
    pressNext();

    expect(props.onCopyMesocycle).toHaveBeenCalledTimes(1);
    expect(props.onCreateFromTemplate).not.toHaveBeenCalled();
    expect(props.onCreateFromScratch).not.toHaveBeenCalled();
  });

  // DoD: with nothing to copy the card is off, and its own line says why rather than leaving a
  // greyed-out card unexplained.
  test('DoD: without anything to copy the card is off, unselectable, and explains itself', () => {
    const props = makeProps({ canCopy: false });
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    expect(card('Copy a cycle')).toBeDisabled();
    expect(card('From template').props.accessibilityState.checked).toBe(true);
    expect(screen.getByText(copyMethodCaption(false))).toBeTruthy();
    expect(screen.queryByText(copyMethodCaption(true))).toBeNull();

    fireEvent.press(card('Copy a cycle'));
    expect(card('Copy a cycle').props.accessibilityState.checked).toBe(false);

    pressNext();
    expect(props.onCopyMesocycle).not.toHaveBeenCalled();
    expect(props.onCreateFromTemplate).toHaveBeenCalledTimes(1);
  });

  test('From scratch stays available with nothing to copy', () => {
    const onCreateFromScratch = jest.fn();
    renderWithSafeArea(
      <MesoCreationMethodSheet {...makeProps({ canCopy: false, onCreateFromScratch })} />,
    );

    fireEvent.press(card('From scratch'));
    pressNext();

    expect(onCreateFromScratch).toHaveBeenCalledTimes(1);
  });

  test('every opening starts from the default, whatever was selected last time', () => {
    const props = makeProps();
    const view = renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(card('Copy a cycle'));
    view.rerender(withSafeArea(<MesoCreationMethodSheet {...props} visible={false} />));
    view.rerender(withSafeArea(<MesoCreationMethodSheet {...props} canCopy={false} />));

    expect(card('From template').props.accessibilityState.checked).toBe(true);
    expect(card('Copy a cycle').props.accessibilityState.checked).toBe(false);
  });

  test('DoD: Cancel closes the sheet and goes nowhere', () => {
    const props = makeProps();
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onCreateFromTemplate).not.toHaveBeenCalled();
  });

  // DoD: the sheet closes from outside too — the backdrop is BottomSheet's own dismiss.
  test('DoD: dismissing from outside closes the sheet and goes nowhere', () => {
    const props = makeProps();
    renderWithSafeArea(<MesoCreationMethodSheet {...props} />);

    fireEvent.press(screen.getByLabelText('Close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onCreateFromTemplate).not.toHaveBeenCalled();
  });

  // Next hands off to a screen, so the caller closes the sheet without its slide.
  test('passes the close animation through to the sheet', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ animated: false })} />);

    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
  });

  test('slides by default', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps()} />);

    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');
  });

  test('renders nothing while closed', () => {
    renderWithSafeArea(<MesoCreationMethodSheet {...makeProps({ visible: false })} />);

    expect(screen.queryByRole('radio', { name: 'From scratch' })).toBeNull();
  });
});
