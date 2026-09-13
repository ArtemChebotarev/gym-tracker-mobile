import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  ExerciseFiltersSheet,
  type ExerciseFiltersSheetProps,
} from '@components/ExerciseFiltersSheet';
import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';

const BASE_PROPS: ExerciseFiltersSheetProps = {
  visible: true,
  filters: {},
  onChangeFilters: jest.fn(),
  resultCount: 42,
  onReset: jest.fn(),
  onApply: jest.fn(),
  onClose: jest.fn(),
};

function renderSheet(overrides: Partial<ExerciseFiltersSheetProps> = {}) {
  const props: ExerciseFiltersSheetProps = { ...BASE_PROPS, ...overrides };
  render(<ExerciseFiltersSheet {...props} />);
  return props;
}

describe('ExerciseFiltersSheet', () => {
  test('renders nothing when not visible', () => {
    renderSheet({ visible: false });

    expect(screen.queryByText('Filters')).toBeNull();
  });

  test('renders the three sections: muscle group, source, performed only', () => {
    renderSheet();

    expect(screen.getByText('Muscle group')).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Traps')).toBeTruthy();

    expect(screen.getByText('Source')).toBeTruthy();
    expect(screen.getByText('Catalog')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();

    expect(screen.getByText('Performed only')).toBeTruthy();
  });

  test('with an empty selection, no muscle group or source chip reads as selected — empty means every value', () => {
    renderSheet({ filters: {} });

    expect(screen.getByRole('button', { name: 'Chest' }).props.accessibilityState).toEqual({
      selected: false,
    });
    expect(screen.getByRole('button', { name: 'Catalog' }).props.accessibilityState).toEqual({
      selected: false,
    });
  });

  test('reflects the given filters as selected chips and toggle value', () => {
    renderSheet({
      filters: { muscleGroups: ['chest'], sources: ['custom'], performedOnly: true },
    });

    expect(screen.getByRole('button', { name: 'Chest' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Custom' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByLabelText('Performed only').props.value).toBe(true);
  });

  test('pressing an unselected muscle group chip adds it', () => {
    const onChangeFilters = jest.fn();
    renderSheet({ filters: { muscleGroups: ['back'] }, onChangeFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onChangeFilters).toHaveBeenCalledWith({ muscleGroups: ['back', 'chest'] });
  });

  test('pressing a selected muscle group chip removes it, clearing the field once it is the last one', () => {
    const onChangeFilters = jest.fn();
    renderSheet({ filters: { muscleGroups: ['chest'] }, onChangeFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Chest' }));

    expect(onChangeFilters).toHaveBeenCalledWith({ muscleGroups: undefined });
  });

  test('pressing a source chip toggles it', () => {
    const onChangeFilters = jest.fn();
    renderSheet({ filters: {}, onChangeFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Custom' }));

    expect(onChangeFilters).toHaveBeenCalledWith({ sources: ['custom'] });
  });

  test('flipping the Performed only toggle updates that field only', () => {
    const onChangeFilters = jest.fn();
    const filters: ExerciseLibraryFilters = { muscleGroups: ['chest'] };
    renderSheet({ filters, onChangeFilters });

    fireEvent(screen.getByLabelText('Performed only'), 'valueChange', true);

    expect(onChangeFilters).toHaveBeenCalledWith({ muscleGroups: ['chest'], performedOnly: true });
  });

  test('the header Reset action calls onReset without closing the sheet', () => {
    const onReset = jest.fn();
    const onClose = jest.fn();
    renderSheet({ onReset, onClose });

    fireEvent.press(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('the confirm button shows the live result count and applies on press', () => {
    const onApply = jest.fn();
    renderSheet({ resultCount: 12, onApply });

    const confirmButton = screen.getByRole('button', { name: 'Show 12 exercises' });
    fireEvent.press(confirmButton);

    expect(onApply).toHaveBeenCalledTimes(1);
  });

  test('singular phrasing for exactly one result', () => {
    renderSheet({ resultCount: 1 });

    expect(screen.getByRole('button', { name: 'Show 1 exercise' })).toBeTruthy();
  });

  test('the confirm button recalculates before applying, as the draft (not yet applied) selection changes', () => {
    const { rerender } = render(<ExerciseFiltersSheet {...BASE_PROPS} resultCount={5} />);
    expect(screen.getByRole('button', { name: 'Show 5 exercises' })).toBeTruthy();

    rerender(<ExerciseFiltersSheet {...BASE_PROPS} resultCount={2} />);
    expect(screen.getByRole('button', { name: 'Show 2 exercises' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show 5 exercises' })).toBeNull();
  });

  test('the confirm button is disabled and reads "No matches" at zero results', () => {
    const onApply = jest.fn();
    renderSheet({ resultCount: 0, onApply });

    const confirmButton = screen.getByRole('button', { name: 'No matches' });
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(confirmButton);
    expect(onApply).not.toHaveBeenCalled();
  });

  test('dismissing the sheet (backdrop) calls onClose', () => {
    const onClose = jest.fn();
    renderSheet({ onClose });

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
