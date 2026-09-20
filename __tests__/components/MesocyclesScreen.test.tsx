import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { MesocyclesScreen, type MesocyclesScreenProps } from '@components/MesocyclesScreen';
import { STAMPS } from '../fixtures/stamps';

// SafeAreaView (used by RootScreen and BottomSheet) throws without a SafeAreaProvider ancestor —
// same fixture RootScreen.test.tsx uses.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>);
}

const ACTIVE: Mesocycle = {
  ...STAMPS,
  id: 'active',
  name: 'Upper/Lower',
  lengthWeeks: 5,
  daysPerWeek: 4,
  startDate: '2026-09-06T12:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-09-04T12:00:00.000Z',
};

const PLANNED: Mesocycle = {
  ...STAMPS,
  id: 'planned',
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 3,
  status: 'planned',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weekPlan: { days: [] },
  createdAt: '2026-09-14T12:00:00.000Z',
};

const COMPLETED: Mesocycle = {
  ...STAMPS,
  id: 'completed',
  name: 'Strength Base',
  lengthWeeks: 4,
  daysPerWeek: 3,
  startDate: '2026-07-18T12:00:00.000Z',
  status: 'completed',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-07-16T12:00:00.000Z',
  completedAt: '2026-08-15T12:00:00.000Z',
};

function makeProps(overrides: Partial<MesocyclesScreenProps> = {}): MesocyclesScreenProps {
  return {
    mesocycles: [ACTIVE, PLANNED, COMPLETED],
    isPending: false,
    activeWeekNumber: 2,
    onRequestCreate: jest.fn(),
    onOpenActive: jest.fn(),
    onStart: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCopy: jest.fn(),
    onOpenHistory: jest.fn(),
    ...overrides,
  };
}

/** Presses the named button of the most recent Alert.alert call. */
function pressAlertButton(alertSpy: jest.SpyInstance, text: string) {
  const buttons = alertSpy.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
  const button = buttons?.find((candidate) => candidate.text === text);
  if (!button) {
    throw new Error(`No "${text}" button in the last alert`);
  }
  // A plain Cancel button carries no onPress — the system alert just dismisses itself.
  act(() => button.onPress?.());
}

describe('MesocyclesScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('snapshots', () => {
    test('Active group', () => {
      const tree = renderWithSafeArea(
        <MesocyclesScreen {...makeProps({ mesocycles: [ACTIVE] })} />,
      );
      expect(tree.toJSON()).toMatchSnapshot();
    });

    test('Planned group', () => {
      const tree = renderWithSafeArea(
        <MesocyclesScreen {...makeProps({ mesocycles: [PLANNED] })} />,
      );
      expect(tree.toJSON()).toMatchSnapshot();
    });

    test('Completed group', () => {
      const tree = renderWithSafeArea(
        <MesocyclesScreen {...makeProps({ mesocycles: [COMPLETED] })} />,
      );
      expect(tree.toJSON()).toMatchSnapshot();
    });

    test('all three groups', () => {
      const tree = renderWithSafeArea(<MesocyclesScreen {...makeProps()} />);
      expect(tree.toJSON()).toMatchSnapshot();
    });

    test('empty state', () => {
      const tree = renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [] })} />);
      expect(tree.toJSON()).toMatchSnapshot();
    });
  });

  test('renders the groups in Active → Planned → Completed order with their captions', () => {
    renderWithSafeArea(
      <MesocyclesScreen {...makeProps({ mesocycles: [COMPLETED, PLANNED, ACTIVE] })} />,
    );

    const labels = screen
      .getAllByText(/^(Active|Planned|Completed)$/)
      .map((node) => node.props.children);
    // The Active card's badge follows its group label; Planned rows carry no badge of their own.
    expect(labels).toEqual(['Active', 'Active', 'Planned', 'Completed']);
    expect(screen.getByText('Week 2 of 5 · started 6 Sep')).toBeTruthy();
    expect(screen.getByText('6 weeks · 3 days/week')).toBeTruthy();
    expect(screen.getByText('4 weeks · 18 Jul – 15 Aug')).toBeTruthy();
    expect(screen.getAllByTestId('week-dot-done')).toHaveLength(1);
    expect(screen.getAllByTestId('week-dot-current')).toHaveLength(1);
    expect(screen.getAllByTestId('week-dot-upcoming')).toHaveLength(3);
  });

  test('empty groups are not rendered', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [PLANNED] })} />);

    expect(screen.getAllByText('Planned')).toHaveLength(1); // group label only, no row badge
    expect(screen.queryByText('Active')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText('Plan your first mesocycle')).toBeNull();
  });

  test('an entirely empty list shows the EmptyState, whose action starts creation', () => {
    const onRequestCreate = jest.fn();
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [], onRequestCreate })} />);

    fireEvent.press(screen.getByText('Create mesocycle'));

    expect(onRequestCreate).toHaveBeenCalled();
  });

  test('pressing "+" calls onRequestCreate', () => {
    const onRequestCreate = jest.fn();
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ onRequestCreate })} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));

    expect(onRequestCreate).toHaveBeenCalled();
  });

  test('tapping the Active card calls onOpenActive', () => {
    const onOpenActive = jest.fn();
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ onOpenActive })} />);

    fireEvent.press(screen.getByRole('button', { name: 'Upper/Lower' }));

    expect(onOpenActive).toHaveBeenCalled();
  });

  describe('Start', () => {
    test('with no active mesocycle, asks for confirmation and starts only once accepted', () => {
      const onStart = jest.fn();
      renderWithSafeArea(
        <MesocyclesScreen {...makeProps({ mesocycles: [PLANNED, COMPLETED], onStart })} />,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Start Push/Pull/Legs' }));

      expect(alertSpy).toHaveBeenCalledWith(
        'Start this mesocycle?',
        'Push/Pull/Legs · 6 weeks · 3 days/week. Week 1 starts today.',
        expect.any(Array),
      );
      expect(onStart).not.toHaveBeenCalled();

      pressAlertButton(alertSpy, 'Start');

      expect(onStart).toHaveBeenCalledWith(PLANNED);
    });

    test('with an active mesocycle, shows an explanation instead of the start confirmation', () => {
      const onStart = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onStart })} />);

      fireEvent.press(screen.getByRole('button', { name: 'Start Push/Pull/Legs' }));

      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message, buttons] = alertSpy.mock.calls[0];
      expect(title).toBe("Can't start yet");
      expect(message).toMatch(/"Upper\/Lower" is still active/);
      expect(buttons).toBeUndefined();
      expect(onStart).not.toHaveBeenCalled();
    });
  });

  describe('Planned ⋯ menu', () => {
    test('Delete is not performed without accepting the confirmation popup', () => {
      const onDelete = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onDelete })} />);

      fireEvent.press(screen.getByRole('button', { name: 'More actions for Push/Pull/Legs' }));
      fireEvent.press(screen.getByText('Delete mesocycle'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Delete mesocycle?',
        "This can't be undone.",
        expect.any(Array),
      );
      expect(onDelete).not.toHaveBeenCalled();

      pressAlertButton(alertSpy, 'Cancel');
      expect(onDelete).not.toHaveBeenCalled();

      pressAlertButton(alertSpy, 'Delete');
      expect(onDelete).toHaveBeenCalledWith(PLANNED);
    });

    test('Edit calls onEdit with that mesocycle', () => {
      const onEdit = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onEdit })} />);

      fireEvent.press(screen.getByRole('button', { name: 'More actions for Push/Pull/Legs' }));
      fireEvent.press(screen.getByText('Edit'));

      expect(onEdit).toHaveBeenCalledWith(PLANNED);
    });
  });

  describe('Completed', () => {
    test('Copy calls onCopy and ⋯ opens History directly, without a menu', () => {
      const onCopy = jest.fn();
      const onOpenHistory = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onCopy, onOpenHistory })} />);

      fireEvent.press(screen.getByRole('button', { name: 'Copy Strength Base' }));
      expect(onCopy).toHaveBeenCalledWith(COMPLETED);

      fireEvent.press(screen.getByRole('button', { name: 'More actions for Strength Base' }));
      expect(onOpenHistory).toHaveBeenCalledWith(COMPLETED);
      expect(screen.queryByText('Delete mesocycle')).toBeNull();
    });
  });
});
