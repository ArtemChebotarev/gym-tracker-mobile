import { Toggle } from '@design/components/Toggle';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('Toggle', () => {
  test('renders the label and description', () => {
    render(
      <Toggle
        label="Deload week"
        description="Halves the load and widens RIR"
        value={false}
        onValueChange={() => {}}
      />,
    );

    expect(screen.getByText('Deload week')).toBeTruthy();
    expect(screen.getByText('Halves the load and widens RIR')).toBeTruthy();
  });

  test('calls onValueChange when toggled', () => {
    const onValueChange = jest.fn();
    render(
      <Toggle
        label="Deload week"
        description="Halves the load and widens RIR"
        value={false}
        onValueChange={onValueChange}
      />,
    );

    fireEvent(screen.getByLabelText('Deload week'), 'valueChange', true);

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
