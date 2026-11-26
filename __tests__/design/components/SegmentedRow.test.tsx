import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedRow } from '@design/components/SegmentedRow';

const OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

// GT-269: a card row with a compact choice at its end.
describe('SegmentedRow', () => {
  test('shows its label and the options, the current one selected', () => {
    render(<SegmentedRow label="Weight unit" options={OPTIONS} value="lb" onChange={() => {}} />);

    expect(screen.getByText('Weight unit')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'lb', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'kg', selected: false })).toBeTruthy();
  });

  test('a tap on another option reports it', () => {
    const onChange = jest.fn();
    render(<SegmentedRow label="Weight unit" options={OPTIONS} value="kg" onChange={onChange} />);

    fireEvent.press(screen.getByRole('button', { name: 'lb' }));

    expect(onChange).toHaveBeenCalledWith('lb');
  });
});
