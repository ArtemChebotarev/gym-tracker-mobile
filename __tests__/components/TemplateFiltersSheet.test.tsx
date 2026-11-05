import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  TemplateFiltersSheet,
  type TemplateFiltersSheetProps,
} from '@components/TemplateFiltersSheet';

function renderSheet(overrides: Partial<TemplateFiltersSheetProps> = {}) {
  const props: TemplateFiltersSheetProps = {
    visible: true,
    filters: {},
    onChangeFilters: jest.fn(),
    dayCountOptions: [2, 4, 5],
    resultCount: 6,
    onReset: jest.fn(),
    onApply: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  render(<TemplateFiltersSheet {...props} />);
  return props;
}

describe('TemplateFiltersSheet (GT-217)', () => {
  test('offers days, focus and hybrid, and explains the word Hybrid', () => {
    renderSheet();

    for (const label of ['2 days', '4 days', '5 days', 'Full body', 'Upper body', 'Lower body']) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    }
    expect(screen.getByText('Hybrid only')).toBeTruthy();
    expect(
      screen.getByText(/Hybrid mixes strength with power, boxing or movement work/),
    ).toBeTruthy();
  });

  test('a tap changes the draft, it does not apply it', () => {
    const props = renderSheet({ filters: { tags: ['upper'] } });

    fireEvent.press(screen.getByRole('button', { name: '4 days' }));
    expect(props.onChangeFilters).toHaveBeenLastCalledWith({ tags: ['upper'], dayCounts: [4] });
    fireEvent.press(screen.getByRole('button', { name: 'Lower body' }));
    expect(props.onChangeFilters).toHaveBeenLastCalledWith({ tags: ['upper', 'lower'] });
    expect(props.onApply).not.toHaveBeenCalled();
  });

  test('shows the selection as selected', () => {
    renderSheet({ filters: { dayCounts: [2], tags: ['lower'] } });

    expect(screen.getByRole('button', { name: '2 days' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByRole('button', { name: 'Upper body' }).props.accessibilityState).toEqual({
      selected: false,
    });
  });

  test('the footer counts the draft and applies it; at zero it cannot', () => {
    const props = renderSheet({ resultCount: 2 });
    fireEvent.press(screen.getByRole('button', { name: 'Show 2 templates' }));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  test('at zero the button says No matches and does nothing', () => {
    const props = renderSheet({ resultCount: 0 });
    fireEvent.press(screen.getByRole('button', { name: 'No matches' }));
    expect(props.onApply).not.toHaveBeenCalled();
  });
});
