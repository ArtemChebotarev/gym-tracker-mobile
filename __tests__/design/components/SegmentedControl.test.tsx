import { SegmentedControl } from '@design/components/SegmentedControl';
import { fireEvent, render, screen } from '@testing-library/react-native';

const OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'meso', label: 'Meso' },
];

describe('SegmentedControl', () => {
  test('renders every segment label', () => {
    render(<SegmentedControl options={OPTIONS} value="week" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Week' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Meso' })).toBeTruthy();
  });

  test('marks the current value as selected', () => {
    render(<SegmentedControl options={OPTIONS} value="meso" onChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Meso' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    expect(screen.getByRole('button', { name: 'Week' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  test('calls onChange with the pressed segment value', () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={OPTIONS} value="week" onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'Meso' }));

    expect(onChange).toHaveBeenCalledWith('meso');
  });
});
