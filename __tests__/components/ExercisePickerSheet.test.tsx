import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import {
  ExercisePickerSheet,
  type ExercisePickerSheetProps,
} from '@components/ExercisePickerSheet';

const BENCH_PRESS: Exercise = {
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  equipment: 'dumbbell',
  isHidden: false,
};

const SQUAT: Exercise = {
  id: toExerciseId('squat'),
  name: 'Squat',
  muscleGroup: 'quads',
  source: 'catalog',
  isHidden: false,
};

const GROUPS: ExerciseListGroup[] = [
  { muscleGroup: 'chest', entries: [{ exercise: BENCH_PRESS, lastSetLog: null }] },
  { muscleGroup: 'quads', entries: [{ exercise: SQUAT, lastSetLog: null }] },
];

const BASE_MULTI_PROPS: ExercisePickerSheetProps = {
  mode: 'multi',
  visible: true,
  title: 'Add exercise',
  caption: 'Day 1',
  groups: GROUPS,
  isPending: false,
  search: '',
  onSearchChange: jest.fn(),
  filters: {},
  onRequestFilters: jest.fn(),
  onResetFilters: jest.fn(),
  selectedIds: [],
  onChangeSelectedIds: jest.fn(),
  onConfirm: jest.fn(),
  onClose: jest.fn(),
};

const BASE_SINGLE_PROPS: ExercisePickerSheetProps = {
  mode: 'single',
  visible: true,
  title: 'Replace exercise',
  groups: GROUPS,
  isPending: false,
  search: '',
  onSearchChange: jest.fn(),
  filters: {},
  onRequestFilters: jest.fn(),
  onResetFilters: jest.fn(),
  onSelect: jest.fn(),
  onClose: jest.fn(),
};

function renderSheet(props: ExercisePickerSheetProps) {
  render(<ExercisePickerSheet {...props} />);
  return props;
}

describe('ExercisePickerSheet', () => {
  test('renders nothing when not visible', () => {
    renderSheet({ ...BASE_MULTI_PROPS, visible: false });

    expect(screen.queryByText('Add exercise')).toBeNull();
  });

  test('shows the title, caption, and both muscle-group sections', () => {
    renderSheet(BASE_MULTI_PROPS);

    expect(screen.getByText('Add exercise')).toBeTruthy();
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Quads')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
  });

  // Task 081: same-named exercises are told apart by equipment; one without equipment gets no
  // suffix at all. Both modes render the same row, so check each.
  test.each([
    ['multi', BASE_MULTI_PROPS],
    ['single', BASE_SINGLE_PROPS],
  ])('%s mode shows the equipment suffix only for exercises that have one', (_mode, props) => {
    renderSheet(props);

    expect(screen.getByText(' · Dumbbell')).toBeTruthy();
    expect(screen.getAllByText(/^· /)).toHaveLength(1);
  });

  test('shows a loading status and no rows while pending', () => {
    renderSheet({ ...BASE_MULTI_PROPS, isPending: true, groups: undefined });

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  test('typing in the search field calls onSearchChange', () => {
    const onSearchChange = jest.fn();
    renderSheet({ ...BASE_MULTI_PROPS, onSearchChange });

    fireEvent.changeText(screen.getByLabelText('Search'), 'row');

    expect(onSearchChange).toHaveBeenCalledWith('row');
  });

  test('dismissing the sheet (backdrop) calls onClose', () => {
    const onClose = jest.fn();
    renderSheet({ ...BASE_MULTI_PROPS, onClose });

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Task 079's DoD: "Filters (08.6) opens and applies from the Add exercise sheet the same way
  // as from the library screen" — this component is what makes that shared, so both modes get
  // the same Filters chip row (ExerciseFilterRow.tsx) for free.
  describe('Filters access (08.6)', () => {
    test('pressing the Filters chip calls onRequestFilters', () => {
      const onRequestFilters = jest.fn();
      renderSheet({ ...BASE_MULTI_PROPS, onRequestFilters });

      fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

      expect(onRequestFilters).toHaveBeenCalledTimes(1);
    });

    test('renders a chip per active filter plus the result counter', () => {
      renderSheet({
        ...BASE_MULTI_PROPS,
        filters: { muscleGroups: ['back'], sources: ['custom'], performedOnly: true },
      });

      expect(screen.getByText('Back')).toBeTruthy();
      expect(screen.getByText('Custom')).toBeTruthy();
      expect(screen.getByText('Performed only')).toBeTruthy();
      expect(screen.getByText('Exercises 2')).toBeTruthy();
    });

    test('a Reset chip resets filters without opening the Filters sheet', () => {
      const onResetFilters = jest.fn();
      renderSheet({ ...BASE_MULTI_PROPS, filters: { muscleGroups: ['back'] }, onResetFilters });

      fireEvent.press(screen.getByRole('button', { name: 'Reset' }));

      expect(onResetFilters).toHaveBeenCalledTimes(1);
    });
  });

  // Task 082: search narrows the list as the user types; the sheet must keep its height rather
  // than shrink to the results, including when nothing matches.
  test.each([
    ['multi', BASE_MULTI_PROPS],
    ['single', BASE_SINGLE_PROPS],
  ])('%s mode keeps a fixed sheet height even with no results', (_mode, props) => {
    renderSheet({ ...props, search: 'zzz', groups: [] });

    const style = StyleSheet.flatten(screen.getByTestId('bottom-sheet').props.style);
    expect(style.height).toBe('80%');
  });

  describe('multi mode (task 077 — Add exercise)', () => {
    test('rows show checkboxes reflecting the selection', () => {
      renderSheet({ ...BASE_MULTI_PROPS, selectedIds: [BENCH_PRESS.id] });

      expect(
        screen.getByRole('checkbox', { name: 'Bench Press' }).props.accessibilityState,
      ).toEqual({
        checked: true,
      });
      expect(screen.getByRole('checkbox', { name: 'Squat' }).props.accessibilityState).toEqual({
        checked: false,
      });
    });

    test('pressing an unselected row adds it to the selection instead of closing the sheet', () => {
      const onChangeSelectedIds = jest.fn();
      const onClose = jest.fn();
      renderSheet({ ...BASE_MULTI_PROPS, selectedIds: [SQUAT.id], onChangeSelectedIds, onClose });

      fireEvent.press(screen.getByRole('checkbox', { name: 'Bench Press' }));

      expect(onChangeSelectedIds).toHaveBeenCalledWith([SQUAT.id, BENCH_PRESS.id]);
      expect(onClose).not.toHaveBeenCalled();
    });

    test('pressing a selected row removes it from the selection', () => {
      const onChangeSelectedIds = jest.fn();
      renderSheet({
        ...BASE_MULTI_PROPS,
        selectedIds: [SQUAT.id, BENCH_PRESS.id],
        onChangeSelectedIds,
      });

      fireEvent.press(screen.getByRole('checkbox', { name: 'Bench Press' }));

      expect(onChangeSelectedIds).toHaveBeenCalledWith([SQUAT.id]);
    });

    test('the footer button accumulates the selection count and confirms on press', () => {
      const onConfirm = jest.fn();
      renderSheet({ ...BASE_MULTI_PROPS, selectedIds: [SQUAT.id, BENCH_PRESS.id], onConfirm });

      const confirmButton = screen.getByRole('button', { name: 'Add 2 exercises' });
      fireEvent.press(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('the footer button is disabled at zero selected', () => {
      const onConfirm = jest.fn();
      renderSheet({ ...BASE_MULTI_PROPS, selectedIds: [], onConfirm });

      const confirmButton = screen.getByRole('button', { name: 'Add 0 exercises' });
      expect(confirmButton.props.accessibilityState.disabled).toBe(true);

      fireEvent.press(confirmButton);
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('single mode (the future Replace exercise sheet)', () => {
    test('rows show no checkboxes', () => {
      renderSheet(BASE_SINGLE_PROPS);

      expect(screen.queryByRole('checkbox', { name: 'Bench Press' })).toBeNull();
      expect(screen.queryByRole('checkbox', { name: 'Squat' })).toBeNull();
    });

    test('has no footer — there is nothing to confirm when picking exactly one exercise', () => {
      renderSheet(BASE_SINGLE_PROPS);

      expect(screen.queryByRole('button', { name: /^Add \d/ })).toBeNull();
    });

    test('tapping a row applies the selection and closes the sheet immediately', () => {
      const onSelect = jest.fn();
      const onClose = jest.fn();
      renderSheet({ ...BASE_SINGLE_PROPS, onSelect, onClose });

      fireEvent.press(screen.getByRole('button', { name: 'Bench Press' }));

      expect(onSelect).toHaveBeenCalledWith(BENCH_PRESS.id);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
