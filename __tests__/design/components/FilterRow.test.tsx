import { FilterRow, filterRowLabel } from '@design/components/FilterRow';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('filterRowLabel', () => {
  test('is a bare Filters while nothing is filtered', () => {
    expect(filterRowLabel(false, 99)).toBe('Filters');
  });

  test('counts what is left once a filter is on (GT-150)', () => {
    expect(filterRowLabel(true, 9)).toBe('Filters (9)');
  });
});

describe('FilterRow', () => {
  test('without active values: the Filters chip alone, no Reset', () => {
    render(
      <FilterRow chips={[]} resultCount={6} onRequestFilters={jest.fn()} onReset={jest.fn()} />,
    );

    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.queryByText('Reset')).toBeNull();
  });

  test('with active values: a chip for each, the count, and a Reset that resets', () => {
    const onReset = jest.fn();
    const onRequestFilters = jest.fn();
    render(
      <FilterRow
        chips={[
          { key: 'a', label: 'Upper body' },
          { key: 'b', label: 'Hybrid' },
        ]}
        resultCount={2}
        onRequestFilters={onRequestFilters}
        onReset={onReset}
      />,
    );

    expect(screen.getByText('Upper body')).toBeTruthy();
    expect(screen.getByText('Hybrid')).toBeTruthy();
    fireEvent.press(screen.getByText('Filters (2)'));
    expect(onRequestFilters).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
