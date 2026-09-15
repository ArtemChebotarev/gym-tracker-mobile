import { fireEvent, render, screen } from '@testing-library/react-native';

import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import {
  MesoEditorAddExerciseSheet,
  type MesoEditorAddExerciseSheetProps,
} from '@components/MesoEditorAddExerciseSheet';

const BENCH_PRESS: Exercise = {
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
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

const BASE_PROPS: MesoEditorAddExerciseSheetProps = {
  visible: true,
  dayNumber: 1,
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

function renderSheet(overrides: Partial<MesoEditorAddExerciseSheetProps> = {}) {
  const props: MesoEditorAddExerciseSheetProps = { ...BASE_PROPS, ...overrides };
  render(<MesoEditorAddExerciseSheet {...props} />);
  return props;
}

describe('MesoEditorAddExerciseSheet', () => {
  test('matches the sheet snapshot', () => {
    const tree = render(<MesoEditorAddExerciseSheet {...BASE_PROPS} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  test('renders nothing when not visible', () => {
    renderSheet({ visible: false });

    expect(screen.queryByText('Add exercise')).toBeNull();
  });

  test('shows the day number and both muscle-group sections', () => {
    renderSheet({ dayNumber: 2 });

    expect(screen.getByText('Day 2')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Bench Press')).toBeTruthy();
    expect(screen.getByText('Quads')).toBeTruthy();
    expect(screen.getByText('Squat')).toBeTruthy();
  });

  test('rows read as unchecked when their id is not in the selection', () => {
    renderSheet({ selectedIds: [] });

    expect(screen.getByRole('checkbox', { name: 'Bench Press' }).props.accessibilityState).toEqual({
      checked: false,
    });
  });

  test('rows read as checked when their id is in the selection', () => {
    renderSheet({ selectedIds: [BENCH_PRESS.id] });

    expect(screen.getByRole('checkbox', { name: 'Bench Press' }).props.accessibilityState).toEqual({
      checked: true,
    });
  });

  test('pressing an unselected row adds it to the selection', () => {
    const onChangeSelectedIds = jest.fn();
    renderSheet({ selectedIds: [SQUAT.id], onChangeSelectedIds });

    fireEvent.press(screen.getByRole('checkbox', { name: 'Bench Press' }));

    expect(onChangeSelectedIds).toHaveBeenCalledWith([SQUAT.id, BENCH_PRESS.id]);
  });

  test('pressing a selected row removes it from the selection', () => {
    const onChangeSelectedIds = jest.fn();
    renderSheet({ selectedIds: [SQUAT.id, BENCH_PRESS.id], onChangeSelectedIds });

    fireEvent.press(screen.getByRole('checkbox', { name: 'Bench Press' }));

    expect(onChangeSelectedIds).toHaveBeenCalledWith([SQUAT.id]);
  });

  test('the footer button accumulates the selection count and confirms on press', () => {
    const onConfirm = jest.fn();
    renderSheet({ selectedIds: [SQUAT.id, BENCH_PRESS.id], onConfirm });

    const confirmButton = screen.getByRole('button', { name: 'Add 2 exercises' });
    fireEvent.press(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('the footer button is disabled at zero selected', () => {
    const onConfirm = jest.fn();
    renderSheet({ selectedIds: [], onConfirm });

    const confirmButton = screen.getByRole('button', { name: 'Add 0 exercises' });
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('groups passed to it already exclude isHidden exercises — this component trusts its input, the domain rule is enforced upstream', () => {
    // 08.6, "Правила": "Упражнения с isHidden = true не показываются никогда". This sheet reuses
    // the same ExerciseListGroup shape the Exercises tab does, built by the same
    // buildExerciseListGroups (domain/catalogListing.ts, covered by its own tests) — a hidden
    // exercise never reaches this component's `groups` prop in the first place.
    renderSheet({ groups: [{ muscleGroup: 'chest', entries: [] }] });

    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  test('shows a loading status and no rows while pending', () => {
    renderSheet({ isPending: true, groups: undefined });

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText('Bench Press')).toBeNull();
  });

  test('typing in the search field calls onSearchChange', () => {
    const onSearchChange = jest.fn();
    renderSheet({ onSearchChange });

    fireEvent.changeText(screen.getByLabelText('Search'), 'row');

    expect(onSearchChange).toHaveBeenCalledWith('row');
  });

  test('dismissing the sheet (backdrop) calls onClose', () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Task 079: this sheet is the same list/search/Filters component the Exercises tab uses (see
  // ExercisePickerSheet.tsx), so it gets Filters access through composing that component —
  // task 077's original scope didn't include this row at all.
  test('pressing the Filters chip calls onRequestFilters', () => {
    const onRequestFilters = jest.fn();
    renderSheet({ onRequestFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

    expect(onRequestFilters).toHaveBeenCalledTimes(1);
  });

  test('renders a chip for an active filter and a Reset chip that calls onResetFilters', () => {
    // 'back' rather than one of GROUPS's own muscle groups (chest/quads), so the filter chip's
    // label doesn't collide with a section header rendering the same text.
    const onResetFilters = jest.fn();
    renderSheet({ filters: { muscleGroups: ['back'] }, onResetFilters });

    expect(screen.getByText('Back')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Reset' }));

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });
});
