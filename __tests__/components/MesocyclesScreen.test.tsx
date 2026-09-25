import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert, Modal, type AlertButton } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { MesocyclesScreen, type MesocyclesScreenProps } from '@components/MesocyclesScreen';
import { copyMethodCaption } from '@components/MesoCreationMethodSheetLogic';
import {
  formatArchiveConfirmMessage,
  PLAN_MESOCYCLE_LABEL,
} from '@components/MesocyclesScreenLogic';
import { STAMPS } from '../fixtures/stamps';

// SafeAreaView (used by RootScreen) throws without a SafeAreaProvider ancestor — same fixture
// RootScreen.test.tsx uses.
const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

function renderWithSafeArea(ui: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{ui}</SafeAreaProvider>,
  );
}

/** Picks an item of a row's `⋯` — a native menu button, which RNTL presses as `buttonPress`. */
function pickMenuItem(mesocycleId: string, key: string) {
  fireEvent(screen.getByTestId(`mesocycle-menu-${mesocycleId}-${key}`), 'buttonPress');
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
    onCreateFromScratch: jest.fn(),
    onCopyMesocycle: jest.fn(),
    onOpenActive: jest.fn(),
    onStart: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCopy: jest.fn(),
    onOpenHistory: jest.fn(),
    onArchive: jest.fn(),
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

  test('DoD: a stopped block is listed under Completed, marked Stopped (052)', () => {
    const stopped: Mesocycle = { ...COMPLETED, id: 'stopped', name: 'Cut', status: 'abandoned' };
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [stopped] })} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Cut')).toBeTruthy();
    expect(screen.getByText('Stopped')).toBeTruthy();
    // Its history is reachable again: the row taps through to it and keeps the `⋯` of any
    // finished block.
    expect(screen.getByRole('button', { name: 'Cut' })).toBeTruthy();
    expect(screen.getByTestId('mesocycle-menu-stopped-copy')).toBeTruthy();
  });

  test('a block that ran its course carries no badge — that is what the section means', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [COMPLETED] })} />);

    expect(screen.queryByText('Stopped')).toBeNull();
  });

  test('empty groups are not rendered', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [PLANNED] })} />);

    expect(screen.getAllByText('Planned')).toHaveLength(1); // group label only, no row badge
    expect(screen.queryByText('Active')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText('Plan your first mesocycle')).toBeNull();
  });

  // The empty state raises the same sheet as `+` (Artem's call): the gesture that starts a block
  // is the same one everywhere, even here, where `Copy a mesocycle` is provably off.
  test('an entirely empty list shows the EmptyState, whose action opens the creation-method sheet', () => {
    const onCreateFromScratch = jest.fn();
    renderWithSafeArea(
      <MesocyclesScreen {...makeProps({ mesocycles: [], onCreateFromScratch })} />,
    );

    fireEvent.press(screen.getByText(PLAN_MESOCYCLE_LABEL));
    expect(onCreateFromScratch).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    expect(onCreateFromScratch).toHaveBeenCalled();
  });

  test('the empty state’s sheet has nothing to copy, and the row says so', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [] })} />);

    fireEvent.press(screen.getByText(PLAN_MESOCYCLE_LABEL));

    expect(screen.getByRole('button', { name: 'Copy a mesocycle' })).toBeDisabled();
    expect(screen.getByText(copyMethodCaption(false))).toBeTruthy();
  });

  // DoD (task 123): each row of the sheet leads where it should.
  test('pressing "+" opens the creation-method sheet, and From scratch goes to Flow A', () => {
    const onCreateFromScratch = jest.fn();
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ onCreateFromScratch })} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    expect(screen.getByText('New mesocycle')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    expect(onCreateFromScratch).toHaveBeenCalledTimes(1);
  });

  test('Copy a mesocycle leads to Flow C when there is something to copy', () => {
    const onCopyMesocycle = jest.fn();
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ onCopyMesocycle })} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'Copy a mesocycle' }));

    expect(onCopyMesocycle).toHaveBeenCalledTimes(1);
  });

  // DoD (task 123): with nothing finished, the second row is off and says why.
  test('Copy a mesocycle is off with no finished or stopped block, and explains itself', () => {
    const onCopyMesocycle = jest.fn();
    renderWithSafeArea(
      <MesocyclesScreen {...makeProps({ mesocycles: [ACTIVE, PLANNED], onCopyMesocycle })} />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    const row = screen.getByRole('button', { name: 'Copy a mesocycle' });

    expect(row).toBeDisabled();
    expect(screen.getByText(copyMethodCaption(false))).toBeTruthy();
    fireEvent.press(row);
    expect(onCopyMesocycle).not.toHaveBeenCalled();
  });

  // A stopped block is still a block that happened — it can be copied like a finished one.
  test('a stopped block counts as something to copy', () => {
    const stopped: Mesocycle = { ...COMPLETED, id: 'stopped', status: 'abandoned' };
    renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [stopped] })} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));

    expect(screen.getByRole('button', { name: 'Copy a mesocycle' })).not.toBeDisabled();
  });

  // DoD (task 123): the sheet closes on a choice, so coming back doesn't land on it still open.
  test('choosing a method closes the sheet', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps()} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));

    expect(screen.queryByRole('button', { name: 'From scratch' })).toBeNull();
  });

  // The chosen screen is pushing in at the same moment, so the sheet goes without its slide.
  test('a choice closes the sheet instantly, a dismissal still slides', () => {
    renderWithSafeArea(<MesocyclesScreen {...makeProps()} />);

    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');

    fireEvent.press(screen.getByRole('button', { name: 'From scratch' }));
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');

    // Reopening slides again — the instant close was for that one hand-off only.
    fireEvent.press(screen.getByRole('button', { name: 'New mesocycle' }));
    expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');
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

  describe('Planned row actions', () => {
    test('Delete, the row\u2019s one `\u22ef` action, is not performed without accepting the confirmation', () => {
      const onDelete = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onDelete })} />);

      pickMenuItem('planned', 'delete');

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

    test('tapping the row opens the editor on that mesocycle', () => {
      const onEdit = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onEdit })} />);

      fireEvent.press(screen.getByRole('button', { name: 'Push/Pull/Legs' }));

      expect(onEdit).toHaveBeenCalledWith(PLANNED);
    });

    test('the row shows what it can do: Start as a button, the rest behind `\u22ef`', () => {
      const onStart = jest.fn();
      const onEdit = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onStart, onEdit })} />);

      // Named per row, so two rows' buttons stay apart to a screen reader.
      expect(screen.getByRole('button', { name: 'Start Push/Pull/Legs' })).toBeTruthy();
      expect(screen.getByTestId('mesocycle-menu-planned').props.accessibilityLabel).toBe(
        'More actions for Push/Pull/Legs',
      );
      // Edit is the tap, not a menu item — the menu holds Delete alone.
      expect(screen.queryByTestId('mesocycle-menu-planned-edit')).toBeNull();
      expect(screen.getByTestId('mesocycle-menu-planned-delete')).toBeTruthy();
      // Starting is the pill's job alone: the tap opens the editor instead.
      fireEvent.press(screen.getByRole('button', { name: 'Push/Pull/Legs' }));
      expect(onStart).not.toHaveBeenCalled();
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Completed', () => {
    test('the row taps through to its history, and the `\u22ef` holds Copy and Archive', () => {
      const onCopy = jest.fn();
      const onOpenHistory = jest.fn();
      const onArchive = jest.fn();
      renderWithSafeArea(
        <MesocyclesScreen {...makeProps({ onCopy, onOpenHistory, onArchive })} />,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Strength Base' }));
      expect(onOpenHistory).toHaveBeenCalledWith(COMPLETED);

      pickMenuItem('completed', 'copy');
      expect(onCopy).toHaveBeenCalledWith(COMPLETED);

      pickMenuItem('completed', 'archive');
      pressAlertButton(alertSpy, 'Archive');
      expect(onArchive).toHaveBeenCalledWith(COMPLETED);
    });

    test('Archive is not performed without accepting the confirmation', () => {
      const onArchive = jest.fn();
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ onArchive })} />);

      pickMenuItem('completed', 'archive');

      expect(alertSpy).toHaveBeenCalledWith(
        'Archive mesocycle?',
        formatArchiveConfirmMessage(COMPLETED),
        expect.any(Array),
      );
      expect(onArchive).not.toHaveBeenCalled();

      pressAlertButton(alertSpy, 'Cancel');
      expect(onArchive).not.toHaveBeenCalled();

      pressAlertButton(alertSpy, 'Archive');
      expect(onArchive).toHaveBeenCalledWith(COMPLETED);
    });

    test('a finished block is neither edited nor deleted, and carries no pill', () => {
      renderWithSafeArea(<MesocyclesScreen {...makeProps({ mesocycles: [COMPLETED] })} />);

      expect(screen.queryByTestId('mesocycle-menu-completed-delete')).toBeNull();
      expect(screen.queryByTestId('mesocycle-menu-completed-edit')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Copy Strength Base' })).toBeNull();
    });
  });
});
