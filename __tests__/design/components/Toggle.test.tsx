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

  test('is enabled by default', () => {
    render(
      <Toggle label="Deload week" description="Halves the load and widens RIR" value={false} onValueChange={() => {}} />,
    );

    expect(screen.getByLabelText('Deload week').props.disabled).toBeFalsy();
  });

  test('disables the switch when disabled', () => {
    render(
      <Toggle
        label="Deload week"
        description="Halves the load and widens RIR"
        value={false}
        onValueChange={() => {}}
        disabled
      />,
    );

    expect(screen.getByLabelText('Deload week').props.disabled).toBe(true);
  });
});
