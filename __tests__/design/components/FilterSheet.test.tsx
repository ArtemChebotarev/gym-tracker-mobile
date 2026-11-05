import { FilterOption } from '@design/components/FilterOption';
import { FilterSection, FilterSheet } from '@design/components/FilterSheet';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

function renderSheet(overrides: Partial<Parameters<typeof FilterSheet>[0]> = {}) {
  const props = {
    visible: true,
    onClose: jest.fn(),
    onReset: jest.fn(),
    applyLabel: 'Show 3 templates',
    applyDisabled: false,
    onApply: jest.fn(),
    ...overrides,
  };
  render(
    <FilterSheet {...props}>
      <FilterSection title="Focus">
        <Text>options</Text>
      </FilterSection>
    </FilterSheet>,
  );
  return props;
}

describe('FilterSheet', () => {
  test('is titled Filters, resets from its header and applies from its footer', () => {
    const props = renderSheet();

    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Focus')).toBeTruthy();
    fireEvent.press(screen.getByText('Reset'));
    expect(props.onReset).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('button', { name: 'Show 3 templates' }));
    expect(props.onApply).toHaveBeenCalledTimes(1);
  });

  test('its confirm button does nothing when the selection leaves nothing', () => {
    const props = renderSheet({ applyLabel: 'No matches', applyDisabled: true });

    fireEvent.press(screen.getByRole('button', { name: 'No matches' }));
    expect(props.onApply).not.toHaveBeenCalled();
  });
});

describe('FilterOption', () => {
  test('says whether it is selected, and presses', () => {
    const onPress = jest.fn();
    render(<FilterOption label="Upper body" selected onPress={onPress} />);

    const option = screen.getByRole('button', { name: 'Upper body' });
    expect(option.props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(option);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
