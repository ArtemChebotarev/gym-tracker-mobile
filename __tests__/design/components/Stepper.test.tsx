import { Stepper } from '@design/components/Stepper';
import { fireEvent, render, screen } from '@testing-library/react-native';

describe('Stepper', () => {
  test('renders the label and the current value', () => {
    render(<Stepper label="Mesocycle length" value={4} onChange={() => {}} min={3} max={8} />);

    expect(screen.getByText('Mesocycle length')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  test('increment calls onChange with value + step', () => {
    const onChange = jest.fn();
    render(<Stepper label="Days per week" value={3} onChange={onChange} min={1} max={7} />);

    fireEvent.press(screen.getByRole('button', { name: 'Increase Days per week' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('decrement calls onChange with value - step', () => {
    const onChange = jest.fn();
    render(<Stepper label="Days per week" value={3} onChange={onChange} min={1} max={7} />);

    fireEvent.press(screen.getByRole('button', { name: 'Decrease Days per week' }));

    expect(onChange).toHaveBeenCalledWith(2);
  });

  test('respects a custom step', () => {
    const onChange = jest.fn();
    render(<Stepper label="Sets" value={2} onChange={onChange} min={0} max={10} step={2} />);

    fireEvent.press(screen.getByRole('button', { name: 'Increase Sets' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('decrement is disabled at min and does not call onChange', () => {
    const onChange = jest.fn();
    render(<Stepper label="Mesocycle length" value={3} onChange={onChange} min={3} max={8} />);

    const decrement = screen.getByRole('button', { name: 'Decrease Mesocycle length' });
    fireEvent.press(decrement);

    expect(onChange).not.toHaveBeenCalled();
    expect(decrement.props.accessibilityState.disabled).toBe(true);
  });

  test('increment is disabled at max and does not call onChange', () => {
    const onChange = jest.fn();
    render(<Stepper label="Mesocycle length" value={8} onChange={onChange} min={3} max={8} />);

    const increment = screen.getByRole('button', { name: 'Increase Mesocycle length' });
    fireEvent.press(increment);

    expect(onChange).not.toHaveBeenCalled();
    expect(increment.props.accessibilityState.disabled).toBe(true);
  });

  test('increment stays enabled below max and decrement below the top boundary', () => {
    render(<Stepper label="Days per week" value={4} onChange={() => {}} min={1} max={7} />);

    expect(
      screen.getByRole('button', { name: 'Increase Days per week' }).props.accessibilityState
        .disabled,
    ).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Decrease Days per week' }).props.accessibilityState
        .disabled,
    ).toBe(false);
  });

  test('formatValue overrides the displayed value', () => {
    render(
      <Stepper
        label="Mesocycle length"
        value={6}
        onChange={() => {}}
        min={3}
        max={8}
        formatValue={(value) => `${value} weeks`}
      />,
    );

    expect(screen.getByText('6 weeks')).toBeTruthy();
    expect(screen.queryByText('6')).toBeNull();
  });

  test('renders an optional caption under the value', () => {
    render(
      <Stepper
        label="Mesocycle length"
        value={6}
        onChange={() => {}}
        min={3}
        max={8}
        caption="Includes a deload week"
      />,
    );

    expect(screen.getByText('Includes a deload week')).toBeTruthy();
  });

  describe('inline variant', () => {
    test('omits the label line but still renders the value and caption, and keeps the label in accessibility labels', () => {
      render(
        <Stepper
          label="Sets"
          value={2}
          onChange={() => {}}
          min={1}
          max={10}
          caption="sets"
          variant="inline"
        />,
      );

      expect(screen.queryByText('Sets')).toBeNull();
      expect(screen.getByText('sets')).toBeTruthy();
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Increase Sets' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Decrease Sets' })).toBeTruthy();
    });

    test('increment/decrement behave the same as the field variant', () => {
      const onChange = jest.fn();
      render(
        <Stepper label="Sets" value={2} onChange={onChange} min={1} max={10} variant="inline" />,
      );

      fireEvent.press(screen.getByRole('button', { name: 'Increase Sets' }));
      expect(onChange).toHaveBeenCalledWith(3);

      fireEvent.press(screen.getByRole('button', { name: 'Decrease Sets' }));
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });
});
