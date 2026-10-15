import { fireEvent, render, screen } from '@testing-library/react-native';

import { TimePickerSheet, type TimePickerSheetProps } from '@design/components/TimePickerSheet';

function renderPicker(overrides: Partial<TimePickerSheetProps> = {}) {
  const props: TimePickerSheetProps = {
    visible: true,
    onClose: jest.fn(),
    title: 'Rest · round 1',
    subtitle: 'Rounds below follow until you log them',
    value: 90,
    onChange: jest.fn(),
    maxSec: 600,
    ...overrides,
  };
  render(<TimePickerSheet {...props} />);
  return props;
}

describe('TimePickerSheet', () => {
  test('shows what is being set, and Done', () => {
    renderPicker();

    expect(screen.getByText('Rest · round 1')).toBeTruthy();
    expect(screen.getByText('Rounds below follow until you log them')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
  });

  test('Done closes it and does not change the value', () => {
    const props = renderPicker();

    fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });

  test('renders nothing while not visible', () => {
    renderPicker({ visible: false });

    expect(screen.queryByText('Rest · round 1')).toBeNull();
  });
});
