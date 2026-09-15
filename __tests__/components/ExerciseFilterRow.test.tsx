import { fireEvent, render, screen } from '@testing-library/react-native';

import { ExerciseFilterRow, type ExerciseFilterRowProps } from '@components/ExerciseFilterRow';

const BASE_PROPS: ExerciseFilterRowProps = {
  filters: {},
  resultCount: 0,
  onRequestFilters: jest.fn(),
  onResetFilters: jest.fn(),
};

function renderRow(overrides: Partial<ExerciseFilterRowProps> = {}) {
  const props: ExerciseFilterRowProps = { ...BASE_PROPS, ...overrides };
  render(<ExerciseFilterRow {...props} />);
  return props;
}

describe('ExerciseFilterRow', () => {
  test('pressing the Filters chip calls onRequestFilters', () => {
    const onRequestFilters = jest.fn();
    renderRow({ onRequestFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

    expect(onRequestFilters).toHaveBeenCalledTimes(1);
  });

  test('renders a chip for each active filter plus the result counter', () => {
    renderRow({
      filters: { muscleGroups: ['chest'], sources: ['custom'], performedOnly: true },
      resultCount: 3,
    });

    expect(screen.getByText('Chest')).toBeTruthy();
    expect(screen.getByText('Custom')).toBeTruthy();
    expect(screen.getByText('Performed only')).toBeTruthy();
    expect(screen.getByText('Exercises 3')).toBeTruthy();
  });

  test('a Reset chip at the end resets filters, shown only while a filter is active', () => {
    const onResetFilters = jest.fn();
    renderRow({ filters: { muscleGroups: ['chest'] }, onResetFilters });

    fireEvent.press(screen.getByRole('button', { name: 'Reset' }));

    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  test('no Reset chip when no filter is active', () => {
    renderRow({ filters: {} });

    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });
});
